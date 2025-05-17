/**
 * ambilight-core.js
 * Script principal para implementação do efeito Ambilight
 * Corrige os problemas de cores congeladas e posicionamento das zonas
 */

(function() {
    // Esperar até que o DOM esteja completamente carregado
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Inicializando efeito Ambilight...");
        
        // Elementos principais
        const videoContainer = document.getElementById('video-container');
        const ambilightEffect = document.getElementById('ambilight-effect');
        const videoPlayer = document.getElementById('video-player');
        const settingsPanel = document.getElementById('ambilight-panel');
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings');
        const testEffectBtn = document.getElementById('test-effect-btn');
        const applySettingsBtn = document.getElementById('apply-settings');
        const toggleAmbilightBtn = document.getElementById('toggle-ambilight');
        
        // Configurações
        let config = {
            isAmbilightActive: true,
            zonesPerSide: 10,
            intensity: 1.0,
            blurAmount: 30,
            isFullscreenMode: false,
        };
        
        // Elementos para as zonas
        let zones = {
            top: [],
            right: [],
            bottom: [],
            left: []
        };
        
        // Cores atuais
        let currentColors = null;
        
        // Inicialização
        function init() {
            console.log("Inicializando efeito Ambilight...");
            
            // Garantir que o container tem overflow visível para o efeito funcionar
            if (videoContainer) {
                videoContainer.style.overflow = 'visible';
                videoContainer.classList.add('ambilight-active');
            }
            
            // Limpar qualquer zona existente
            if (ambilightEffect) {
                ambilightEffect.innerHTML = '';
            }
            
            // Carregar configurações
            loadConfig();
            
            // Criar zonas Ambilight
            createAmbilightZones();
            
            // Configurar painel de configurações
            setupSettingsPanel();
            
            // Configurar eventos
            setupEventListeners();
            
            // Definir a função global para atualizar cores
            window.updateAmbilightColors = handleColorsUpdate;
            
            // Criar API global do Ambilight
            window.ambilightAPI = createAmbilightAPI();
            
            console.log("Inicialização do Ambilight concluída");
        }
        
        // Cria API pública para controlar o efeito Ambilight
        function createAmbilightAPI() {
            return {
                toggle: () => {
                    config.isAmbilightActive = !config.isAmbilightActive;
                    if (ambilightEffect) {
                        ambilightEffect.style.display = config.isAmbilightActive ? 'block' : 'none';
                    }
                    if (videoContainer) {
                        if (config.isAmbilightActive) {
                            videoContainer.classList.add('ambilight-active');
                        } else {
                            videoContainer.classList.remove('ambilight-active');
                        }
                    }
                    return config.isAmbilightActive;
                },
                isActive: () => config.isAmbilightActive,
                setIntensity: (value) => {
                    config.intensity = parseFloat(value);
                    if (currentColors) {
                        handleColorsUpdate(currentColors);
                    }
                },
                setZones: (value) => {
                    config.zonesPerSide = parseInt(value);
                    createAmbilightZones();
                    if (currentColors) {
                        handleColorsUpdate(currentColors);
                    }
                },
                setBlur: (value) => {
                    config.blurAmount = parseInt(value);
                    if (currentColors) {
                        handleColorsUpdate(currentColors);
                    }
                },
                refreshEffect: () => {
                    createAmbilightZones();
                    if (currentColors) {
                        handleColorsUpdate(currentColors);
                    } else {
                        testAmbilightEffect();
                    }
                },
                test: testAmbilightEffect
            };
        }
        
        // Carrega configurações
        function loadConfig() {
            // Tentar carregar do localStorage
            try {
                const savedConfig = localStorage.getItem('ambilightConfig');
                if (savedConfig) {
                    const parsedConfig = JSON.parse(savedConfig);
                    config = { ...config, ...parsedConfig };
                    console.log("Configurações carregadas do localStorage:", config);
                }
            } catch (e) {
                console.warn("Erro ao carregar configurações do localStorage:", e);
            }
            
            // Também carrega do servidor para garantir sincronização
            fetch('/api/settings')
                .then(response => response.json())
                .then(settings => {
                    config.intensity = settings.intensity;
                    config.zonesPerSide = settings.zones_per_side;
                    config.blurAmount = settings.blur_amount;
                    
                    console.log("Configurações carregadas do servidor:", config);
                    
                    // Atualizar a UI com os valores carregados
                    updateSettingsUI();
                    
                    // Recriar zonas com as novas configurações
                    createAmbilightZones();
                })
                .catch(error => {
                    console.warn("Erro ao carregar configurações do servidor:", error);
                });
        }
        
        // Atualiza a UI de configurações com os valores atuais
        function updateSettingsUI() {
            const intensitySlider = document.getElementById('intensity-slider');
            const intensityValue = document.getElementById('intensity-value');
            const zonesSelect = document.getElementById('zones-select');
            const blurSlider = document.getElementById('blur-slider');
            const blurValue = document.getElementById('blur-value');
            
            if (intensitySlider) intensitySlider.value = config.intensity * 100;
            if (intensityValue) intensityValue.textContent = Math.round(config.intensity * 100);
            if (zonesSelect) zonesSelect.value = config.zonesPerSide;
            if (blurSlider) blurSlider.value = config.blurAmount;
            if (blurValue) blurValue.textContent = config.blurAmount;
        }
        
        // Configura o painel de configurações
        function setupSettingsPanel() {
            if (!settingsPanel || !settingsBtn || !closeSettingsBtn) return;
            
            // Configurar botão para abrir/fechar painel
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSettingsPanel();
            });
            
            // Botão para fechar o painel
            closeSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideSettingsPanel();
            });
            
            // Botão para testar o efeito
            if (testEffectBtn) {
                testEffectBtn.addEventListener('click', testAmbilightEffect);
            }
            
            // Botão para aplicar configurações
            if (applySettingsBtn) {
                applySettingsBtn.addEventListener('click', applySettings);
            }
            
            // Configurar sliders para atualização em tempo real
            const intensitySlider = document.getElementById('intensity-slider');
            const intensityValue = document.getElementById('intensity-value');
            if (intensitySlider && intensityValue) {
                intensitySlider.addEventListener('input', () => {
                    intensityValue.textContent = intensitySlider.value;
                });
            }
            
            const blurSlider = document.getElementById('blur-slider');
            const blurValue = document.getElementById('blur-value');
            if (blurSlider && blurValue) {
                blurSlider.addEventListener('input', () => {
                    blurValue.textContent = blurSlider.value;
                });
            }
        }
        
        // Mostra/oculta o painel de configurações
        function toggleSettingsPanel() {
            if (!settingsPanel) return;
            
            if (settingsPanel.style.display === 'none' || !settingsPanel.style.display) {
                settingsPanel.style.display = 'block';
                setTimeout(() => {
                    settingsPanel.style.transform = 'translateY(0)';
                }, 10);
            } else {
                hideSettingsPanel();
            }
        }
        
        // Oculta o painel de configurações
        function hideSettingsPanel() {
            if (!settingsPanel) return;
            
            settingsPanel.style.transform = 'translateY(105%)';
            setTimeout(() => {
                settingsPanel.style.display = 'none';
            }, 300);
        }
        
        // Aplica as configurações do painel
        function applySettings() {
            const intensitySlider = document.getElementById('intensity-slider');
            const zonesSelect = document.getElementById('zones-select');
            const blurSlider = document.getElementById('blur-slider');
            
            const settings = {
                intensity: intensitySlider ? parseFloat(intensitySlider.value) / 100 : config.intensity,
                zones_per_side: zonesSelect ? parseInt(zonesSelect.value) : config.zonesPerSide,
                blur_amount: blurSlider ? parseInt(blurSlider.value) : config.blurAmount
            };
            
            // Atualizar configurações locais
            config.intensity = settings.intensity;
            config.zonesPerSide = settings.zones_per_side;
            config.blurAmount = settings.blur_amount;
            
            // Salvar no localStorage
            try {
                localStorage.setItem('ambilightConfig', JSON.stringify(config));
            } catch (e) {
                console.warn("Erro ao salvar configurações no localStorage:", e);
            }
            
            // Recriar zonas com as novas configurações
            createAmbilightZones();
            
            // Aplicar cores atuais se disponíveis
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
            
            // Enviar configurações para o servidor
            fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Configurações aplicadas com sucesso', 'success');
                } else {
                    showNotification(`Erro ao salvar configurações: ${data.error || 'Erro desconhecido'}`, 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao salvar configurações:', error);
                showNotification('Erro ao salvar configurações', 'error');
            });
            
            // Ocultar painel após aplicar
            hideSettingsPanel();
        }
        
        // Configura event listeners
        function setupEventListeners() {
            // Toggle Ambilight
            if (toggleAmbilightBtn) {
                toggleAmbilightBtn.addEventListener('click', () => {
                    const isActive = window.ambilightAPI.toggle();
                    showNotification(isActive ? 'Efeito Ambilight ativado' : 'Efeito Ambilight desativado');
                });
            }
            
            // Evento para tela cheia
            document.addEventListener('fullscreenchange', () => {
                config.isFullscreenMode = !!document.fullscreenElement;
                if (config.isFullscreenMode) {
                    // Recriar zonas para se adaptarem à nova resolução
                    createAmbilightZones();
                }
            });
            
            // Evento de pausar/reproduzir vídeo para animação de pulso
            if (videoPlayer) {
                videoPlayer.addEventListener('play', () => {
                    if (ambilightEffect) {
                        ambilightEffect.classList.remove('pulse-animation');
                    }
                });
                
                videoPlayer.addEventListener('pause', () => {
                    if (ambilightEffect) {
                        ambilightEffect.classList.add('pulse-animation');
                    }
                });
            }
            
            // Evento para redimensionamento da janela
            window.addEventListener('resize', () => {
                // Recriar zonas quando a janela for redimensionada
                createAmbilightZones();
                
                // Reaplicar cores atuais se existirem
                if (currentColors) {
                    handleColorsUpdate(currentColors);
                }
            });
            
            // Atalho de teclado Alt+A para configurações
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.key.toLowerCase() === 'a') {
                    toggleSettingsPanel();
                }
            });
            
            // Atalho de teclado Shift+T para testar
            document.addEventListener('keydown', (e) => {
                if (e.shiftKey && e.key.toLowerCase() === 't') {
                    testAmbilightEffect();
                }
            });
        }
        
        // Cria os elementos DOM para as zonas do Ambilight
        function createAmbilightZones() {
            if (!ambilightEffect) {
                console.error("Elemento ambilightEffect não encontrado");
                return;
            }
            
            // Limpar zonas existentes
            ambilightEffect.innerHTML = '';
            zones = { top: [], right: [], bottom: [], left: [] };
            
            // Criar contêineres para cada lado
            const containers = {
                top: document.createElement('div'),
                right: document.createElement('div'),
                bottom: document.createElement('div'),
                left: document.createElement('div')
            };
            
            // Configurar classes e estilos para os contêineres
            for (const side in containers) {
                containers[side].className = `ambilight-container ${side}`;
            }
            
            // Criar zonas para cada lado
            const numZones = config.zonesPerSide;
            for (let i = 0; i < numZones; i++) {
                // Para cada lado, criar e adicionar zona
                for (const side in containers) {
                    const zone = createZone(i, numZones, side);
                    containers[side].appendChild(zone);
                    zones[side].push(zone);
                }
            }
            
            // Adicionar contêineres ao efeito Ambilight
            for (const side in containers) {
                ambilightEffect.appendChild(containers[side]);
            }
            
            console.log(`Zonas Ambilight criadas: ${numZones} por lado`);
        }
        
        // Cria um elemento de zona individual
        function createZone(index, total, side) {
            const zone = document.createElement('div');
            zone.className = `ambilight-zone ${side}`;
            
            const percentage = (index / total) * 100;
            const size = 100 / total;
            
            if (side === 'top' || side === 'bottom') {
                zone.style.left = `${percentage}%`;
                zone.style.width = `${size}%`;
                zone.style.height = '100%';
                zone.style[side] = '0';
            } else { // left ou right
                zone.style.top = `${percentage}%`;
                zone.style.height = `${size}%`;
                zone.style.width = '100%';
                zone.style[side] = '0';
            }
            
            return zone;
        }
        
        // Manipula atualizações de cores do servidor
        function handleColorsUpdate(colors) {
            if (!config.isAmbilightActive || !colors) {
                return;
            }
            
            // Armazenar cores atuais para reutilização
            currentColors = colors;
            
            // Verificar se os dados de cores são válidos
            if (!colors.top || !colors.right || !colors.bottom || !colors.left) {
                console.warn("Dados de cores inválidos:", colors);
                return;
            }
            
            // Adicionar classe ao container para ativar efeito
            if (videoContainer) {
                videoContainer.classList.add('ambilight-active');
            }
            
            // Aplicar cores a cada lado
            for (const side in zones) {
                applyColorsToZones(zones[side], colors[side], side);
            }
            
            // Adicionar animação de pulsação quando o vídeo estiver pausado
            if (videoPlayer && videoPlayer.paused && ambilightEffect) {
                ambilightEffect.classList.add('pulse-animation');
            } else if (ambilightEffect) {
                ambilightEffect.classList.remove('pulse-animation');
            }
        }
        
        // Aplica cores às zonas
        function applyColorsToZones(zonesArray, colorsArray, side) {
            if (!zonesArray || !colorsArray || zonesArray.length === 0) {
                return;
            }
            
            // Ajustar para número diferente de zonas/cores
            const zoneCount = zonesArray.length;
            const colorCount = colorsArray.length;
            
            // Para cada zona, aplicar a cor correspondente
            for (let i = 0; i < zoneCount; i++) {
                const zone = zonesArray[i];
                
                // Se o número de cores for diferente do número de zonas, fazer mapeamento
                const colorIndex = colorCount === zoneCount 
                    ? i 
                    : Math.floor(i * colorCount / zoneCount);
                
                // Obter a cor correspondente
                const color = colorsArray[colorIndex];
                
                // Verificar se cor é válida
                if (!color || color.length !== 3) {
                    continue;
                }
                
                // Aplicar intensidade às cores
                const r = Math.floor(color[0] * config.intensity);
                const g = Math.floor(color[1] * config.intensity);
                const b = Math.floor(color[2] * config.intensity);
                
                const colorString = `rgb(${r}, ${g}, ${b})`;
                
                // Quanto mais intensa a cor, maior o desfoque
                const colorIntensity = Math.max(0.2, (r + g + b) / 765); // Normalizado para 0-1
                const dynamicBlur = Math.max(config.blurAmount * colorIntensity, 10);
                const spreadFactor = Math.max(dynamicBlur / 3, 5);
                
                // Definir a sombra com base no lado
                let shadowString = '';
                
                if (side === 'top') {
                    shadowString = `0 -${dynamicBlur}px ${dynamicBlur * 2}px ${spreadFactor}px ${colorString}`;
                } else if (side === 'right') {
                    shadowString = `${dynamicBlur}px 0 ${dynamicBlur * 2}px ${spreadFactor}px ${colorString}`;
                } else if (side === 'bottom') {
                    shadowString = `0 ${dynamicBlur}px ${dynamicBlur * 2}px ${spreadFactor}px ${colorString}`;
                } else if (side === 'left') {
                    shadowString = `-${dynamicBlur}px 0 ${dynamicBlur * 2}px ${spreadFactor}px ${colorString}`;
                }
                
                // Aplicar a sombra à zona
                zone.style.boxShadow = shadowString;
            }
        }
        
        // Testa o efeito Ambilight com cores aleatórias
        function testAmbilightEffect() {
            console.log("Testando efeito Ambilight...");
            
            // Gerar cores aleatórias para teste
            const generateRandomColors = (count) => {
                const colors = [];
                for (let i = 0; i < count; i++) {
                    // Cores mais vibrantes para teste
                    colors.push([
                        Math.floor(Math.random() * 200) + 55, // R (55-255)
                        Math.floor(Math.random() * 200) + 55, // G (55-255)
                        Math.floor(Math.random() * 200) + 55  // B (55-255)
                    ]);
                }
                return colors;
            };
            
            // Criar cores para cada lado
            const testColors = {
                top: generateRandomColors(config.zonesPerSide),
                right: generateRandomColors(config.zonesPerSide),
                bottom: generateRandomColors(config.zonesPerSide),
                left: generateRandomColors(config.zonesPerSide)
            };
            
            // Aplicar cores de teste
            handleColorsUpdate(testColors);
            
            // Adicionar classe para indicar modo de teste
            if (ambilightEffect) {
                const allZones = ambilightEffect.querySelectorAll('.ambilight-zone');
                allZones.forEach(zone => zone.classList.add('test-mode'));
                
                // Remover classe após 5 segundos
                setTimeout(() => {
                    allZones.forEach(zone => zone.classList.remove('test-mode'));
                    
                    // Se temos cores reais, reaplica-las
                    if (currentColors && currentColors !== testColors) {
                        handleColorsUpdate(currentColors);
                    }
                }, 5000);
            }
            
            showNotification('Teste do efeito Ambilight ativado', 'info');
        }
        
        // Função para mostrar notificações
        function showNotification(message, type = 'info') {
            // Verificar se existe função global primeiro
            if (window.showNotification && typeof window.showNotification === 'function') {
                window.showNotification(message, type);
                return;
            }
            
            // Implementação própria
            const notifications = document.getElementById('notifications');
            if (!notifications) return;
            
            const notification = document.createElement('div');
            notification.className = 'notification p-3 rounded-lg shadow-lg flex items-center mb-2 text-white transition-opacity duration-300';
            
            // Define a cor baseada no tipo
            switch (type) {
                case 'success':
                    notification.classList.add('bg-green-500');
                    break;
                case 'error':
                    notification.classList.add('bg-red-500');
                    break;
                case 'warning':
                    notification.classList.add('bg-yellow-500');
                    break;
                default:
                    notification.classList.add('bg-blue-500');
            }
            
            // Ícone para o tipo
            let icon;
            switch (type) {
                case 'success':
                    icon = 'fa-check-circle';
                    break;
                case 'error':
                    icon = 'fa-exclamation-circle';
                    break;
                case 'warning':
                    icon = 'fa-exclamation-triangle';
                    break;
                default:
                    icon = 'fa-info-circle';
            }
            
            notification.innerHTML = `
                <i class="fas ${icon} mr-2"></i>
                <span>${message}</span>
                <button class="ml-auto text-white">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Adiciona ao container
            notifications.appendChild(notification);
            
            // Remove depois de 5 segundos
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 5000);
            
            // Fecha ao clicar no X
            notification.querySelector('button').addEventListener('click', () => {
                notification.classList.add('opacity-0');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Iniciar o sistema
        init();
        
        // Fazer teste inicial para verificar se tudo está funcionando
        setTimeout(() => {
            testAmbilightEffect();
        }, 1000);
    });
})();