/**
 * websocket.js
 * Gerencia comunicação WebSocket com o servidor para os dados de cor do Ambilight
 * Contém correções para garantir que as cores sejam aplicadas corretamente
 */

(function() {
    console.log("Inicializando WebSocket para o Ambilight...");
    
    // Variáveis globais
    let socketConnection;
    let connectionAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectTimeout;
    let autoReconnectEnabled = true;
    
    // Inicialização
    initWebSocket();
    
    /**
     * Inicializa a conexão WebSocket
     */
    function initWebSocket() {
        try {
            // Verificar se o socket.io está disponível
            if (typeof io === 'undefined') {
                console.error("Socket.io não encontrado! Carregando dinamicamente...");
                
                // Tentar carregar o Socket.io dinamicamente
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.min.js";
                script.async = true;
                script.onload = () => {
                    console.log("Socket.io carregado com sucesso, conectando...");
                    connectWebSocket();
                };
                script.onerror = (e) => {
                    console.error("Falha ao carregar Socket.io:", e);
                    showNotification("Falha ao carregar Socket.io. O efeito Ambilight pode não funcionar.", "error");
                    
                    // Ativar modo offline com efeito de demonstração
                    activateOfflineMode();
                };
                
                document.head.appendChild(script);
                return;
            }
            
            // Se o Socket.io já está disponível, conectar diretamente
            connectWebSocket();
            
        } catch (e) {
            console.error("Erro na inicialização do WebSocket:", e);
            showNotification("Erro na conexão com o servidor", "error");
            activateOfflineMode();
        }
    }
    
    /**
     * Estabelece a conexão com o WebSocket
     */
    function connectWebSocket() {
        try {
            // Conectar ao servidor Socket.IO (usa o mesmo host e porta que a aplicação Flask)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsURL = `${protocol}//${window.location.host}`;
            
            console.log("Tentando conectar ao WebSocket:", wsURL);
            
            socketConnection = io(wsURL, {
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
                timeout: 10000,
                transports: ['websocket', 'polling']
            });
            
            // Evento: Conexão estabelecida
            socketConnection.on('connect', () => {
                console.log('WebSocket conectado', socketConnection.id);
                connectionAttempts = 0;
                showNotification('Conexão estabelecida com o servidor', 'success');
                
                // Expor funções globalmente após conexão bem-sucedida
                exposeWebSocketFunctions();
                
                // Verificar se há vídeo e iniciar processamento
                const videoPlayer = document.getElementById('video-player');
                if (videoPlayer && videoPlayer.getAttribute('data-path')) {
                    const videoPath = videoPlayer.getAttribute('data-path');
                    console.log("Vídeo detectado, iniciando processamento:", videoPath);
                    window.startVideoProcessing(videoPath);
                }
            });
            
            // Evento: Conexão fechada
            socketConnection.on('disconnect', (reason) => {
                console.log(`WebSocket desconectado: ${reason}`);
                
                if (reason === 'io server disconnect' || reason === 'transport close') {
                    showNotification('Conexão com o servidor perdida: ' + reason, 'warning');
                    
                    // Tentar reconectar após um segundo se for um erro inesperado
                    if (autoReconnectEnabled) {
                        setTimeout(() => {
                            if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                                console.log("Tentando reconectar automaticamente...");
                                socketConnection.connect();
                            }
                        }, 1000);
                    }
                }
            });
            
            // Evento: Erro na conexão
            socketConnection.on('connect_error', (error) => {
                console.error('Erro na conexão WebSocket:', error);
                connectionAttempts++;
                
                if (connectionAttempts === 1) {
                    showNotification(`Problema ao conectar com o servidor. Tentando novamente...`, 'warning');
                }
                
                if (autoReconnectEnabled && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                    const delay = Math.min(1000 * Math.pow(1.5, connectionAttempts), 10000);
                    console.log(`Tentativa ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} falhou. Tentando novamente em ${delay}ms`);
                    
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(() => {
                        socketConnection.connect();
                    }, delay);
                } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    showNotification(`Não foi possível conectar ao servidor após ${MAX_RECONNECT_ATTEMPTS} tentativas`, 'error');
                    autoReconnectEnabled = false; // Desabilitar reconexão automática
                    
                    // Ativar modo offline
                    activateOfflineMode();
                }
            });
            
            // Evento: Tentativa de reconexão
            socketConnection.on('reconnect_attempt', (attemptNumber) => {
                console.log(`Tentativa de reconexão #${attemptNumber}`);
            });
            
            // Evento: Reconexão falhou
            socketConnection.on('reconnect_failed', () => {
                console.error('Falha ao reconectar WebSocket');
                showNotification('Não foi possível reconectar ao servidor', 'error');
                
                // Ativar modo offline
                activateOfflineMode();
            });
            
            // Evento: Reconexão bem-sucedida
            socketConnection.on('reconnect', (attemptNumber) => {
                console.log(`Reconectado ao WebSocket após ${attemptNumber} tentativas`);
                showNotification('Conexão restabelecida com o servidor', 'success');
                
                // Reiniciar processamento
                const videoPlayer = document.getElementById('video-player');
                if (videoPlayer && videoPlayer.getAttribute('data-path')) {
                    const videoPath = videoPlayer.getAttribute('data-path');
                    window.startVideoProcessing(videoPath);
                }
            });
            
            // Evento: Recebe dados de cores do servidor
            socketConnection.on('colors', (colors) => {
                // Verificar se temos dados válidos
                const hasValidData = colors && colors.top && colors.top.length > 0;
                console.log('Cores recebidas:', hasValidData ? 'Dados válidos' : 'Dados vazios');
                
                // Importante: Aplicar cores diretamente
                if (window.updateAmbilightColors && hasValidData) {
                    window.updateAmbilightColors(colors);
                } else if (!hasValidData) {
                    console.warn('Recebidos dados de cores inválidos do servidor:', colors);
                } else {
                    console.error('Função updateAmbilightColors não encontrada');
                }
            });
            
            // Evento: Processamento de vídeo iniciado
            socketConnection.on('processing_started', (data) => {
                if (data.success) {
                    console.log('Processamento de vídeo iniciado');
                    showNotification('Efeito Ambilight ativado', 'success');
                }
            });
            
            // Evento: Processamento de vídeo parado
            socketConnection.on('processing_stopped', (data) => {
                if (data.success) {
                    console.log('Processamento de vídeo parado');
                }
            });
            
            // Evento: Configurações atualizadas
            socketConnection.on('settings_updated', (data) => {
                if (data.success) {
                    console.log('Configurações do Ambilight atualizadas');
                }
            });
            
            // Evento: Erro no servidor
            socketConnection.on('error', (data) => {
                console.error('Erro no servidor:', data.message);
                showNotification(`Erro: ${data.message}`, 'error');
            });
            
        } catch (e) {
            console.error("Erro ao conectar WebSocket:", e);
            showNotification("Falha na conexão com o servidor", "error");
            activateOfflineMode();
        }
    }
    
    /**
     * Ativa o modo offline com efeito de demonstração
     */
    function activateOfflineMode() {
        console.log("Ativando modo offline com efeito de demonstração local");
        
        if (window.ambilightAPI && typeof window.ambilightAPI.test === 'function') {
            // Mostrar notificação
            showNotification('Modo offline ativado. Usando efeito Ambilight local.', 'info');
            
            // Testar efeito inicialmente
            window.ambilightAPI.test();
            
            // Configurar simulação de cores
            simulateColorUpdates();
        } else {
            console.error("API Ambilight não disponível para modo offline");
        }
    }
    
    /**
     * Simula atualizações de cor periódicas no modo offline
     */
    function simulateColorUpdates() {
        // Gerar cores aleatórias
        const generateRandomColors = (count) => {
            const colors = [];
            for (let i = 0; i < count; i++) {
                colors.push([
                    Math.floor(Math.random() * 256),
                    Math.floor(Math.random() * 256),
                    Math.floor(Math.random() * 256)
                ]);
            }
            return colors;
        };
        
        // Obter número de zonas atual
        const getZonesCount = () => {
            const container = document.querySelector('.ambilight-container');
            if (container) {
                return container.children.length;
            }
            return 10; // Padrão
        };
        
        // Função para gerar novas cores
        const generateAndApplyColors = () => {
            const zonesCount = getZonesCount();
            const colors = {
                top: generateRandomColors(zonesCount),
                right: generateRandomColors(zonesCount),
                bottom: generateRandomColors(zonesCount),
                left: generateRandomColors(zonesCount)
            };
            
            // Aplicar as cores se a função estiver disponível
            if (window.updateAmbilightColors) {
                window.updateAmbilightColors(colors);
            }
        };
        
        // Verificar se o vídeo está em reprodução
        const videoPlayer = document.getElementById('video-player');
        if (videoPlayer) {
            // Aplicar cores iniciais
            generateAndApplyColors();
            
            // Adicionar event listener para atualizar cores quando o vídeo estiver em reprodução
            videoPlayer.addEventListener('timeupdate', () => {
                // Atualizar cores a cada 1 segundo aproximadamente
                if (Math.floor(videoPlayer.currentTime) % 1 === 0) {
                    generateAndApplyColors();
                }
            });
        } else {
            // Se não tiver vídeo, apenas fazer uma simulação periódica
            setInterval(generateAndApplyColors, 2000);
        }
    }
    
    /**
     * Expõe funções de WebSocket globalmente
     */
    function exposeWebSocketFunctions() {
        /**
         * Inicia o processamento de vídeo no servidor
         * @param {string} videoPath - Caminho para o vídeo a ser processado
         */
        window.startVideoProcessing = function(videoPath) {
            if (!videoPath) {
                console.error("Caminho de vídeo não fornecido para startVideoProcessing");
                return;
            }
            
            if (socketConnection && socketConnection.connected) {
                console.log("Iniciando processamento do vídeo:", videoPath);
                socketConnection.emit('start_video_processing', { video_path: videoPath });
            } else {
                console.error('Socket não conectado. Não é possível iniciar o processamento.');
                showNotification('Erro de conexão com o servidor', 'error');
                
                // Ativar modo offline
                activateOfflineMode();
            }
        };
        
        /**
         * Para o processamento de vídeo no servidor
         */
        window.stopVideoProcessing = function() {
            if (socketConnection && socketConnection.connected) {
                socketConnection.emit('stop_video_processing');
            } else {
                console.warn('Socket não conectado. Não é possível parar o processamento.');
            }
        };
        
        /**
         * Atualiza as configurações do Ambilight no servidor
         * @param {Object} settings - Configurações do Ambilight
         */
        window.updateServerSettings = function(settings) {
            if (socketConnection && socketConnection.connected) {
                console.log("Enviando configurações para o servidor:", settings);
                socketConnection.emit('update_settings', settings);
            } else {
                console.warn('Socket não conectado. Não é possível atualizar configurações.');
                showNotification('Erro de conexão com o servidor. Configurações aplicadas apenas localmente.', 'warning');
                
                // Aplicar configurações localmente
                if (window.ambilightAPI) {
                    if (settings.intensity !== undefined) {
                        window.ambilightAPI.setIntensity(settings.intensity);
                    }
                    if (settings.zones_per_side !== undefined) {
                        window.ambilightAPI.setZones(settings.zones_per_side);
                    }
                    if (settings.blur_amount !== undefined) {
                        window.ambilightAPI.setBlur(settings.blur_amount);
                    }
                }
            }
        };
    }
    
    /**
     * Mostra notificações
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo da notificação (success, warning, error, info)
     */
    function showNotification(message, type = 'info') {
        // Tentar usar a função global se disponível
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Logging como fallback
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Implementar uma versão básica se necessário
        const notifications = document.getElementById('notifications');
        if (notifications) {
            const notification = document.createElement('div');
            notification.className = `notification p-3 rounded-lg shadow-lg text-white mb-2`;
            
            // Definir cor com base no tipo
            if (type === 'success') notification.classList.add('bg-green-500');
            else if (type === 'error') notification.classList.add('bg-red-500');
            else if (type === 'warning') notification.classList.add('bg-yellow-500');
            else notification.classList.add('bg-blue-500');
            
            notification.textContent = message;
            notifications.appendChild(notification);
            
            setTimeout(() => notification.remove(), 5000);
        }
    }
    
    // Expor utilitários para debug
    window.websocketDebug = {
        status: () => socketConnection ? 
            `Conectado: ${socketConnection.connected}, ID: ${socketConnection.id}, Tentativas: ${connectionAttempts}` : 
            'Socket não inicializado',
        reconnect: () => {
            if (socketConnection) {
                socketConnection.connect();
                return 'Tentando reconectar...';
            }
            return 'Socket não inicializado';
        },
        forceOffline: () => {
            activateOfflineMode();
            return 'Modo offline forçado ativado';
        },
        resetConnection: () => {
            if (socketConnection) {
                socketConnection.disconnect();
                connectionAttempts = 0;
                autoReconnectEnabled = true;
                setTimeout(() => {
                    connectWebSocket();
                }, 1000);
                return 'Conexão reiniciada';
            }
            return 'Socket não inicializado';
        }
    };
})();