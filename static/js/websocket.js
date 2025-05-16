/**
 * websocket.js - Versão corrigida
 * Gerencia a conexão WebSocket entre cliente e servidor para os dados do Ambilight
 */

document.addEventListener('DOMContentLoaded', () => {
    // Variável global para a conexão WebSocket
    let socketConnection;
    let connectionAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectTimeout;
    
    // Inicialização
    initWebSocket();
    
    /**
     * Inicializa a conexão WebSocket com segurança
     */
    function initWebSocket() {
        console.log("Inicializando conexão WebSocket...");
        
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
                };
                
                document.head.appendChild(script);
                return;
            }
            
            // Se o Socket.io já está disponível, conectar diretamente
            connectWebSocket();
            
        } catch (e) {
            console.error("Erro na inicialização do WebSocket:", e);
            showNotification("Erro na conexão com o servidor", "error");
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
                transports: ['websocket', 'polling']  // Preferir WebSocket, mas permitir fallback
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
                showNotification('Conexão com o servidor perdida: ' + reason, 'error');
                
                // Tentar reconectar após um segundo se for um erro inesperado
                if (reason === 'io server disconnect') {
                    setTimeout(() => {
                        if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                            socketConnection.connect();
                        }
                    }, 1000);
                }
            });
            
            // Evento: Erro na conexão
            socketConnection.on('connect_error', (error) => {
                console.error('Erro na conexão WebSocket:', error);
                connectionAttempts++;
                
                if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
                    const delay = Math.min(1000 * Math.pow(1.5, connectionAttempts), 10000);
                    console.log(`Tentativa ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} falhou. Tentando novamente em ${delay}ms`);
                    
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = setTimeout(() => {
                        socketConnection.connect();
                    }, delay);
                } else {
                    showNotification(`Erro na conexão com o servidor após ${MAX_RECONNECT_ATTEMPTS} tentativas`, 'error');
                    
                    // Após falhas de conexão, testar efeito Ambilight localmente
                    console.log("Tentando ativar efeito Ambilight local após falhas de conexão...");
                    if (window.ambilightAPI && typeof window.ambilightAPI.test === 'function') {
                        window.ambilightAPI.test();
                    }
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
            });
            
            // Evento: Recebe dados de cores do servidor
            socketConnection.on('colors', (colors) => {
                console.log('Cores recebidas:', Object.keys(colors).length > 0 ? 'Dados válidos' : 'Dados vazios');
                
                // Chama a função que atualiza o efeito Ambilight com as cores recebidas
                if (typeof window.updateAmbilightColors === 'function') {
                    window.updateAmbilightColors(colors);
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
                
                // Se não conseguir iniciar via WebSocket, ativa modo de demonstração local
                if (window.ambilightAPI && typeof window.ambilightAPI.test === 'function') {
                    console.log("Usando efeito de demonstração local");
                    window.ambilightAPI.test();
                }
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
     * Mostra notificações com fallback
     */
    function showNotification(message, type = 'info') {
        // Tentar usar a função global se disponível
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback simples
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Criar notificação visual se possível
        const notifications = document.getElementById('notifications');
        if (notifications) {
            const notification = document.createElement('div');
            notification.className = `p-3 rounded-lg shadow-lg text-white mb-2 bg-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}-500`;
            notification.textContent = message;
            notifications.appendChild(notification);
            
            setTimeout(() => notification.remove(), 5000);
        }
    }
    
    // Expõe algumas funções úteis para debug
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
        testColors: () => {
            if (window.ambilightAPI && typeof window.ambilightAPI.test === 'function') {
                window.ambilightAPI.test();
                return 'Teste de cores iniciado';
            }
            return 'Função de teste não disponível';
        }
    };
});