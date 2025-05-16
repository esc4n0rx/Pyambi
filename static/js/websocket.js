/**
 * Websocket.js
 * Gerencia a conexão WebSocket entre o cliente e o servidor
 * para receber dados de cores em tempo real para o efeito Ambilight
 */

// Variável global para a conexão WebSocket
let socketConnection;

document.addEventListener('DOMContentLoaded', () => {
    // Inicia a conexão WebSocket
    initWebSocket();
    
    /**
     * Inicializa a conexão WebSocket
     */
    function initWebSocket() {
        // Conecta ao servidor Socket.IO (usa o mesmo host e porta que a aplicação Flask)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsURL = `${protocol}//${window.location.host}`;
        
        socketConnection = io(wsURL, {
            reconnectionAttempts: 5,
            timeout: 10000
        });
        
        // Evento: Conexão estabelecida
        socketConnection.on('connect', () => {
            console.log('WebSocket conectado', socketConnection.id);
            showNotification('Conexão estabelecida com o servidor', 'success');
        });
        
        // Evento: Conexão fechada
        socketConnection.on('disconnect', (reason) => {
            console.log(`WebSocket desconectado: ${reason}`);
            showNotification('Conexão com o servidor perdida: ' + reason, 'error');
            
            // Tentar reconectar após um segundo se for um erro inesperado
            if (reason === 'io server disconnect') {
                setTimeout(() => {
                    socketConnection.connect();
                }, 1000);
            }
        });
        
        // Evento: Erro na conexão
        socketConnection.on('connect_error', (error) => {
            console.error('Erro na conexão WebSocket:', error);
            showNotification('Erro na conexão com o servidor', 'error');
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
            console.log('Cores recebidas:', Object.keys(colors));
            
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
    }
    
    /**
     * Inicia o processamento de vídeo no servidor
     * @param {string} videoPath - Caminho para o vídeo a ser processado
     */
    window.startVideoProcessing = function(videoPath) {
        if (socketConnection && socketConnection.connected) {
            socketConnection.emit('start_video_processing', { video_path: videoPath });
        } else {
            console.error('Socket não conectado. Não é possível iniciar o processamento.');
            showNotification('Erro de conexão com o servidor', 'error');
        }
    };
    
    /**
     * Para o processamento de vídeo no servidor
     */
    window.stopVideoProcessing = function() {
        if (socketConnection && socketConnection.connected) {
            socketConnection.emit('stop_video_processing');
        }
    };
    
    /**
     * Atualiza as configurações do Ambilight no servidor
     * @param {Object} settings - Configurações do Ambilight
     */
    window.updateServerSettings = function(settings) {
        if (socketConnection && socketConnection.connected) {
            socketConnection.emit('update_settings', settings);
        } else {
            console.error('Socket não conectado. Não é possível atualizar configurações.');
            showNotification('Erro de conexão com o servidor', 'error');
        }
    };
});