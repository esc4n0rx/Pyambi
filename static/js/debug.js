/**
 * Debug.js
 * Funções para ajudar a diagnosticar problemas no Ambilight Player
 */

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona console de debug
    createDebugConsole();
    
    // Adiciona logs personalizados
    setupCustomLogging();
    
    // Adiciona botão de teste do efeito Ambilight
    addTestAmbilightButton();
    
    // Log de inicialização
    console.debug('Debug mode inicializado');
});

/**
 * Cria um console de debug na tela
 */
function createDebugConsole() {
    const debugConsole = document.createElement('div');
    debugConsole.id = 'debug-console';
    debugConsole.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 300px;
        height: 200px;
        background-color: rgba(0, 0, 0, 0.8);
        color: #00ff00;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-y: auto;
        z-index: 9999;
        border-radius: 5px;
        display: none;
    `;
    
    const logContainer = document.createElement('div');
    logContainer.id = 'debug-log';
    debugConsole.appendChild(logContainer);
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Debug';
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 9999;
    `;
    
    document.body.appendChild(debugConsole);
    document.body.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', () => {
        if (debugConsole.style.display === 'none') {
            debugConsole.style.display = 'block';
            toggleButton.textContent = 'Fechar';
        } else {
            debugConsole.style.display = 'none';
            toggleButton.textContent = 'Debug';
        }
    });
}

/**
 * Configura logs personalizados para capturar e exibir no console de debug
 */
function setupCustomLogging() {
    const logContainer = document.getElementById('debug-log');
    
    if (!logContainer) return;
    
    // Salva referências aos métodos originais
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };
    
    // Sobrescreve os métodos de console
    console.log = function() {
        addLogToContainer('LOG', arguments, 'white');
        originalConsole.log.apply(console, arguments);
    };
    
    console.error = function() {
        addLogToContainer('ERROR', arguments, 'red');
        originalConsole.error.apply(console, arguments);
    };
    
    console.warn = function() {
        addLogToContainer('WARN', arguments, 'yellow');
        originalConsole.warn.apply(console, arguments);
    };
    
    console.info = function() {
        addLogToContainer('INFO', arguments, 'cyan');
        originalConsole.info.apply(console, arguments);
    };
    
    console.debug = function() {
        addLogToContainer('DEBUG', arguments, 'green');
        originalConsole.debug.apply(console, arguments);
    };
    
    function addLogToContainer(type, args, color) {
        const logEntry = document.createElement('div');
        const timestamp = new Date().toLocaleTimeString();
        let message = '';
        
        // Concatena os argumentos
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'object') {
                try {
                    message += JSON.stringify(args[i]) + ' ';
                } catch (e) {
                    message += '[Objeto] ';
                }
            } else {
                message += args[i] + ' ';
            }
        }
        
        logEntry.innerHTML = `<span style="color:gray">[${timestamp}]</span> <span style="color:${color}">[${type}]</span> ${message}`;
        logContainer.appendChild(logEntry);
        
        // Rolagem automática para o último log
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Limita a 100 entradas
        while (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }
}

/**
 * Adiciona um botão para testar o efeito Ambilight manualmente
 */
function addTestAmbilightButton() {
    const testButton = document.createElement('button');
    testButton.textContent = 'Testar Ambilight';
    testButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 80px;
        background-color: rgba(99, 102, 241, 0.8);
        color: white;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 9999;
    `;
    
    document.body.appendChild(testButton);
    
    testButton.addEventListener('click', () => {
        testAmbilightEffect();
    });
}

/**
 * Testa o efeito Ambilight manualmente com cores aleatórias
 */
function testAmbilightEffect() {
    console.debug('Testando efeito Ambilight...');
    
    const videoContainer = document.getElementById('video-container');
    const ambilightEffect = document.getElementById('ambilight-effect');
    
    // Verifica se os elementos existem
    if (!videoContainer || !ambilightEffect) {
        console.error('Elementos necessários para o Ambilight não encontrados!');
        return;
    }
    
    // Exibe o contêiner do efeito
    videoContainer.classList.add('ambilight-active');
    ambilightEffect.style.display = 'block';
    
    // Cria dados de cores para teste
    const testColors = {
        top: generateRandomColors(10),
        right: generateRandomColors(10),
        bottom: generateRandomColors(10),
        left: generateRandomColors(10)
    };
    
    console.debug('Cores de teste:', testColors);
    
    // Aplica as cores de teste
    if (typeof window.updateAmbilightColors === 'function') {
        window.updateAmbilightColors(testColors);
        console.debug('Efeito Ambilight de teste aplicado!');
    } else {
        console.error('Função updateAmbilightColors não encontrada');
    }
    
    // Gera cores aleatórias
    function generateRandomColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push([
                Math.floor(Math.random() * 256), // R
                Math.floor(Math.random() * 256), // G
                Math.floor(Math.random() * 256)  // B
            ]);
        }
        return colors;
    }
}

// Expõe funções de debug globalmente
window.debugAmbilight = {
    test: testAmbilightEffect,
    inspectElements: () => {
        const videoContainer = document.getElementById('video-container');
        const ambilightEffect = document.getElementById('ambilight-effect');
        const videoPlayer = document.getElementById('video-player');
        
        console.debug('Inspeção de elementos:');
        console.debug('- videoContainer:', videoContainer);
        console.debug('- ambilightEffect:', ambilightEffect);
        console.debug('- videoPlayer:', videoPlayer);
        
        if (ambilightEffect) {
            console.debug('- ambilightEffect.children:', ambilightEffect.children);
        }
    },
    testWebSocket: () => {
        if (typeof socketConnection !== 'undefined') {
            console.debug('Conexão WebSocket:', socketConnection.connected ? 'Conectado' : 'Desconectado');
            console.debug('ID da conexão:', socketConnection.id);
        } else {
            console.error('Objeto socketConnection não encontrado');
        }
    }
};