/**
 * Correção para aplicação dinâmica das cores do Ambilight
 * Este script corrige o problema de cores não aplicadas do WebSocket
 */

(function() {
    console.log("Inicializando correção de cores do Ambilight");
    
    // Função para esperarmos até que elementos DOM estejam disponíveis
    function waitForElement(selector, callback, maxAttempts = 20) {
        let attempts = 0;
        
        const checkElement = () => {
            attempts++;
            const element = document.querySelector(selector);
            
            if (element) {
                callback(element);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error(`Elemento ${selector} não encontrado após ${maxAttempts} tentativas`);
                return;
            }
            
            setTimeout(checkElement, 250);
        };
        
        checkElement();
    }
    
    // Função que define o updateAmbilightColors diretamente no objeto window
    function setupDirectUpdateFunction() {
        console.log("Configurando função updateAmbilightColors diretamente");
        
        // Definir no objeto window para garantir acesso global
        window.updateAmbilightColors = function(colors) {
            console.log("Cores recebidas, aplicando diretamente");
            
            const videoContainer = document.getElementById('video-container');
            const ambilightEffect = document.getElementById('ambilight-effect');
            
            if (!videoContainer || !ambilightEffect) {
                console.error("Elementos necessários não encontrados para aplicar cores");
                return;
            }
            
            // Garantir que o efeito esteja ativo
            videoContainer.classList.add('ambilight-active');
            
            // Verificar se temos zonas
            if (ambilightEffect.children.length === 0) {
                console.warn("Nenhuma zona encontrada, criando zonas...");
                createAmbilightZones();
                return;
            }
            
            // Aplicar cores a cada lado
            applyColorsToZones(colors);
        };
        
        // Função para criar zonas Ambilight
        function createAmbilightZones() {
            const ambilightEffect = document.getElementById('ambilight-effect');
            if (!ambilightEffect) return;
            
            // Limpar zonas existentes
            ambilightEffect.innerHTML = '';
            
            // Criar containers para cada lado
            const sides = ['top', 'right', 'bottom', 'left'];
            const zonesPerSide = 20; // Usando 20 zonas para corresponder aos logs
            
            sides.forEach(side => {
                const container = document.createElement('div');
                container.className = `ambilight-container ${side}`;
                
                // Estilos essenciais
                container.style.position = 'absolute';
                container.style.overflow = 'visible';
                
                // Posicionamento específico
                if (side === 'top') {
                    container.style.top = '-5px';
                    container.style.left = '0';
                    container.style.right = '0';
                    container.style.height = '5px';
                } else if (side === 'right') {
                    container.style.top = '0';
                    container.style.right = '-5px';
                    container.style.bottom = '0';
                    container.style.width = '5px';
                } else if (side === 'bottom') {
                    container.style.bottom = '-5px';
                    container.style.left = '0';
                    container.style.right = '0';
                    container.style.height = '5px';
                } else if (side === 'left') {
                    container.style.top = '0';
                    container.style.left = '-5px';
                    container.style.bottom = '0';
                    container.style.width = '5px';
                }
                
                // Criar zonas para este lado
                for (let i = 0; i < zonesPerSide; i++) {
                    const zone = document.createElement('div');
                    zone.className = `ambilight-zone ${side}`;
                    
                    // Estilos essenciais
                    zone.style.position = 'absolute';
                    zone.style.overflow = 'visible';
                    zone.style.backgroundColor = 'transparent';
                    
                    // Posicionamento da zona
                    const percentage = (i / zonesPerSide) * 100;
                    const size = 100 / zonesPerSide;
                    
                    if (side === 'top' || side === 'bottom') {
                        zone.style.left = `${percentage}%`;
                        zone.style.width = `${size}%`;
                        zone.style.height = '100%';
                        zone.style[side] = '0';
                    } else {
                        zone.style.top = `${percentage}%`;
                        zone.style.height = `${size}%`;
                        zone.style.width = '100%';
                        zone.style[side] = '0';
                    }
                    
                    // Aplicar cor padrão para debug
                    if (side === 'top') {
                        zone.style.boxShadow = '0 -40px 80px 10px rgba(255, 0, 0, 0.7)';
                    } else if (side === 'right') {
                        zone.style.boxShadow = '40px 0 80px 10px rgba(0, 255, 0, 0.7)';
                    } else if (side === 'bottom') {
                        zone.style.boxShadow = '0 40px 80px 10px rgba(0, 0, 255, 0.7)';
                    } else if (side === 'left') {
                        zone.style.boxShadow = '-40px 0 80px 10px rgba(255, 255, 0, 0.7)';
                    }
                    
                    container.appendChild(zone);
                }
                
                ambilightEffect.appendChild(container);
            });
            
            console.log("Zonas Ambilight criadas com sucesso!");
        }
        
        // Função para aplicar cores às zonas
        function applyColorsToZones(colors) {
            // Garantir que temos dados de cores válidos
            if (!colors || !colors.top || !colors.right || !colors.bottom || !colors.left) {
                console.warn("Dados de cores inválidos:", colors);
                return;
            }
            
            const ambilightEffect = document.getElementById('ambilight-effect');
            if (!ambilightEffect) return;
            
            // Para cada lado (top, right, bottom, left)
            Object.keys(colors).forEach(side => {
                // Encontrar o container correspondente a este lado
                let container = null;
                for (let i = 0; i < ambilightEffect.children.length; i++) {
                    if (ambilightEffect.children[i].classList.contains(side)) {
                        container = ambilightEffect.children[i];
                        break;
                    }
                }
                
                if (!container) {
                    console.warn(`Container para o lado ${side} não encontrado`);
                    return;
                }
                
                // Obter as zonas e cores para este lado
                const zones = container.children;
                const colorData = colors[side];
                
                // Verificar se temos correspondência na quantidade
                if (zones.length !== colorData.length) {
                    console.warn(`Número de zonas (${zones.length}) diferente do número de cores (${colorData.length}) para o lado ${side}`);
                    // Tentar aplicar o máximo de cores possível
                }
                
                // Aplicar cores às zonas disponíveis
                const count = Math.min(zones.length, colorData.length);
                for (let i = 0; i < count; i++) {
                    const zone = zones[i];
                    const color = colorData[i];
                    
                    if (!color || color.length !== 3) continue;
                    
                    // Aplicar intensidade às cores (100% por padrão)
                    const intensity = 1.0;
                    const r = Math.round(color[0] * intensity);
                    const g = Math.round(color[1] * intensity);
                    const b = Math.round(color[2] * intensity);
                    
                    const colorString = `rgb(${r}, ${g}, ${b})`;
                    
                    // Valor de desfoque (aumentado para maior visibilidade)
                    const blurAmount = 40;
                    
                    // Aplicar sombra com base no lado
                    let shadowString = '';
                    if (side === 'top') {
                        shadowString = `0 -${blurAmount}px ${blurAmount * 2}px 10px ${colorString}`;
                    } else if (side === 'right') {
                        shadowString = `${blurAmount}px 0 ${blurAmount * 2}px 10px ${colorString}`;
                    } else if (side === 'bottom') {
                        shadowString = `0 ${blurAmount}px ${blurAmount * 2}px 10px ${colorString}`;
                    } else if (side === 'left') {
                        shadowString = `-${blurAmount}px 0 ${blurAmount * 2}px 10px ${colorString}`;
                    }
                    
                    // Aplicar a sombra à zona
                    zone.style.boxShadow = shadowString;
                }
            });
        }
    }
    
    // Função para ocultar o painel e configurar o atalho
    function setupPanelControls() {
        // Esperar pelo painel Ambilight
        waitForElement('#ambilight-panel', (panel) => {
            console.log("Painel Ambilight encontrado, configurando controles");
            
            // Ocultar o painel por padrão
            panel.style.display = 'none';
            
            // Adicionar atalho de teclado (Alt+A)
            document.addEventListener('keydown', function(e) {
                if (e.altKey && e.key.toLowerCase() === 'a') {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            });
            
            // Configurar botão de configurações, se existir
            waitForElement('#settings-btn', (settingsBtn) => {
                settingsBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                });
            });
        });
    }
    
    // Iniciar a correção
    setupDirectUpdateFunction();
    setupPanelControls();
    
    // Monitorar chamadas de conexão do socket.io para corrigir em tempo real
    const originalSocketIO = window.io;
    if (originalSocketIO) {
        window.io = function() {
            const socket = originalSocketIO.apply(this, arguments);
            
            // Interceptar o evento 'colors' para garantir que as cores sejam aplicadas
            const originalOn = socket.on;
            socket.on = function(event, callback) {
                if (event === 'colors') {
                    return originalOn.call(this, event, function(colors) {
                        console.log("Interceptando evento 'colors' do Socket.IO");
                        
                        // Aplicar cores diretamente
                        if (window.updateAmbilightColors) {
                            window.updateAmbilightColors(colors);
                        }
                        
                        // Chamar o callback original também
                        if (typeof callback === 'function') {
                            callback(colors);
                        }
                    });
                }
                return originalOn.apply(this, arguments);
            };
            
            return socket;
        };
    }
    
    // Verificar periodicamente se a função updateAmbilightColors está disponível
    const checkInterval = setInterval(() => {
        if (!window.updateAmbilightColors) {
            console.warn("Função updateAmbilightColors ainda não disponível, redefinindo...");
            setupDirectUpdateFunction();
        } else {
            clearInterval(checkInterval);
        }
    }, 1000);
})();