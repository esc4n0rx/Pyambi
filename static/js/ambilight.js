/**
 * ambilight.js - Versão corrigida
 * Implementação otimizada do efeito Ambilight com melhor integração
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos principais
    const videoContainer = document.getElementById('video-container');
    const ambilightEffect = document.getElementById('ambilight-effect');
    const videoPlayer = document.getElementById('video-player');
    
    // Verificar se os elementos existem
    if (!videoContainer || !ambilightEffect || !videoPlayer) {
        console.error("Elementos necessários para o Ambilight não encontrados:", {
            videoContainer: !!videoContainer,
            ambilightEffect: !!ambilightEffect,
            videoPlayer: !!videoPlayer
        });
        return; // Sai da função se os elementos não existirem
    }
    
    // Configurações
    let config = {
        isAmbilightActive: true,
        zonesPerSide: 10,
        intensity: 1.0,
        blurAmount: 15,
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
        videoContainer.style.overflow = 'visible';
        
        // Garantir que o efeito Ambilight está visível
        ambilightEffect.style.display = 'block';
        ambilightEffect.style.zIndex = '0';
        ambilightEffect.style.pointerEvents = 'none';
        
        // Carregar configurações
        loadConfig();
        
        // Criar zonas
        createAmbilightZones();
        
        // Adicionar event listeners
        setupEventListeners();
        
        // Iniciar o processamento se houver um vídeo carregado
        if (videoPlayer.getAttribute('data-path')) {
            // O WebSocket já deve estar conectado em websocket.js
            // Verificamos com um pequeno delay
            setTimeout(() => {
                if (typeof window.startVideoProcessing === 'function') {
                    window.startVideoProcessing(videoPlayer.getAttribute('data-path'));
                    console.log("Iniciando processamento com startVideoProcessing:", videoPlayer.getAttribute('data-path'));
                } else {
                    console.error("Função startVideoProcessing não disponível!");
                }
            }, 1500); // Um pouco mais de delay para garantir que WebSocket esteja pronto
        }
        
        // Sobrescrever a função updateAmbilightColors para usar nossa implementação otimizada
        window.updateAmbilightColors = handleColorsUpdate;
        
        console.log("Inicialização do Ambilight concluída");
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
                
                // Atualizar UI com as configurações carregadas
                updateConfigUI();
                
                // Recriar zonas se necessário
                createAmbilightZones();
            })
            .catch(error => {
                console.warn("Erro ao carregar configurações do servidor:", error);
            });
    }
    
    // Salva configurações
    function saveConfig() {
        try {
            localStorage.setItem('ambilightConfig', JSON.stringify(config));
        } catch (e) {
            console.warn("Erro ao salvar configurações no localStorage:", e);
        }
    }
    
    // Atualiza a UI com base nas configurações
    function updateConfigUI() {
        // Intensidade
        const intensitySlider = document.getElementById('intensity-slider');
        const intensityValue = document.getElementById('intensity-value');
        if (intensitySlider) {
            intensitySlider.value = config.intensity * 100;
        }
        if (intensityValue) {
            intensityValue.textContent = Math.round(config.intensity * 100);
        }
        
        // Zonas por lado
        const zonesSelect = document.getElementById('zones-select');
        if (zonesSelect) {
            zonesSelect.value = config.zonesPerSide;
        }
        
        // Desfoque
        const blurSlider = document.getElementById('blur-slider');
        const blurValue = document.getElementById('blur-value');
        if (blurSlider) {
            blurSlider.value = config.blurAmount;
        }
        if (blurValue) {
            blurValue.textContent = config.blurAmount;
        }
    }
    
    // Configura event listeners
    function setupEventListeners() {
        // Evento para tela cheia
        document.addEventListener('fullscreenchange', () => {
            config.isFullscreenMode = !!document.fullscreenElement;
            if (config.isFullscreenMode) {
                // Recriar zonas para se adaptarem à nova resolução
                createAmbilightZones();
            }
        });
        
        // Evento de pausar/reproduzir vídeo para animação de pulso
        videoPlayer.addEventListener('play', () => {
            ambilightEffect.classList.remove('pulse-animation');
        });
        
        videoPlayer.addEventListener('pause', () => {
            ambilightEffect.classList.add('pulse-animation');
        });
        
        // Toggle Ambilight se o botão existir
        const toggleAmbilightBtn = document.getElementById('toggle-ambilight');
        if (toggleAmbilightBtn) {
            toggleAmbilightBtn.addEventListener('click', () => {
                config.isAmbilightActive = !config.isAmbilightActive;
                
                // Atualizar ícone
                const icon = toggleAmbilightBtn.querySelector('i');
                if (icon) {
                    icon.className = config.isAmbilightActive ? 'fas fa-lightbulb' : 'fas fa-lightbulb-slash';
                }
                
                // Mostrar/esconder efeito
                ambilightEffect.style.display = config.isAmbilightActive ? 'block' : 'none';
                
                // Iniciar/parar processamento
                if (config.isAmbilightActive) {
                    if (typeof window.startVideoProcessing === 'function') {
                        window.startVideoProcessing(videoPlayer.getAttribute('data-path'));
                    }
                } else {
                    if (typeof window.stopVideoProcessing === 'function') {
                        window.stopVideoProcessing();
                    }
                }
                
                // Salvar configuração
                saveConfig();
            });
        }
        
        // Aplicar configurações
        const applySettingsBtn = document.getElementById('apply-settings');
        if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', applyConfig);
        }
    }
    
    // Aplica configurações
    function applyConfig() {
        // Obter valores da UI
        const intensitySlider = document.getElementById('intensity-slider');
        const zonesSelect = document.getElementById('zones-select');
        const blurSlider = document.getElementById('blur-slider');
        
        if (intensitySlider) {
            config.intensity = parseInt(intensitySlider.value) / 100;
        }
        
        if (zonesSelect) {
            const newZonesPerSide = parseInt(zonesSelect.value);
            if (newZonesPerSide !== config.zonesPerSide) {
                config.zonesPerSide = newZonesPerSide;
                createAmbilightZones(); // Recriar zonas se o número mudou
            }
        }
        
        if (blurSlider) {
            config.blurAmount = parseInt(blurSlider.value);
        }
        
        // Salvar configurações
        saveConfig();
        
        // Atualizar efeito se houver cores atuais
        if (currentColors) {
            handleColorsUpdate(currentColors);
        }
        
        // Enviar configurações para o servidor
        updateServerSettings();
        
        // Mostrar notificação
        showNotification('Configurações aplicadas', 'success');
    }
    
    // Cria os elementos DOM para as zonas do Ambilight
    function createAmbilightZones() {
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
        
        containers.top.className = 'ambilight-container top';
        containers.right.className = 'ambilight-container right';
        containers.bottom.className = 'ambilight-container bottom';
        containers.left.className = 'ambilight-container left';
        
        // Criar zonas para cada lado
        for (let i = 0; i < config.zonesPerSide; i++) {
            // Para cada lado, criar e adicionar zona
            for (const side in containers) {
                const zone = createZone(i, config.zonesPerSide, side);
                containers[side].appendChild(zone);
                zones[side].push(zone);
            }
        }
        
        // Adicionar contêineres ao efeito Ambilight
        for (const side in containers) {
            ambilightEffect.appendChild(containers[side]);
        }
        
        console.log(`Zonas Ambilight criadas: ${config.zonesPerSide} por lado`);
    }
    
    // Cria um elemento de zona individual
    function createZone(index, total, side) {
        const zone = document.createElement('div');
        zone.className = `ambilight-zone ${side}`;
        zone.style.position = 'absolute';
        zone.style.backgroundColor = 'transparent';
        zone.style.overflow = 'visible';
        
        const percentage = (index / total) * 100;
        const size = 100 / total;
        
        if (side === 'top' || side === 'bottom') {
            zone.style.left = `${percentage}%`;
            zone.style[side] = '0';
            zone.style.width = `${size}%`;
            zone.style.height = '100%';
        } else { // left or right
            zone.style[side] = '0';
            zone.style.top = `${percentage}%`;
            zone.style.width = '100%';
            zone.style.height = `${size}%`;
        }
        
        return zone;
    }
    
    // Manipula atualizações de cores do servidor
    function handleColorsUpdate(colors) {
        if (!config.isAmbilightActive || !colors) return;
        
        // Registrar recebimento de cores para debug
        console.log("Recebendo atualização de cores");
        
        // Armazenar cores atuais para reutilização
        currentColors = colors;
        
        // Verificar se os dados de cores são válidos
        if (!colors.top || !colors.right || !colors.bottom || !colors.left) {
            console.warn("Dados de cores inválidos:", colors);
            return;
        }
        
        // Verificar se as zonas foram criadas
        const firstSide = Object.keys(zones)[0];
        if (zones[firstSide].length === 0 || zones[firstSide].length !== colors[firstSide].length) {
            console.log("Recriando zonas para corresponder aos dados recebidos...");
            config.zonesPerSide = colors[firstSide].length;
            createAmbilightZones();
        }
        
        // Aplicar cores a cada lado
        for (const side in zones) {
            updateZonesColors(zones[side], colors[side], side);
        }
        
        // Adicionar animação de pulsação quando o vídeo estiver pausado
        if (videoPlayer && videoPlayer.paused) {
            ambilightEffect.classList.add('pulse-animation');
        } else {
            ambilightEffect.classList.remove('pulse-animation');
        }
    }
    
    // Atualiza as cores de um conjunto de zonas
    function updateZonesColors(zonesArray, colorsArray, side) {
        if (!zonesArray || !colorsArray || zonesArray.length !== colorsArray.length) {
            console.warn(`Problema ao aplicar cores para ${side}: zonas=${zonesArray?.length}, cores=${colorsArray?.length}`);
            return;
        }
        
        // Aplicar as cores a cada zona
        for (let i = 0; i < zonesArray.length; i++) {
            const zone = zonesArray[i];
            const color = colorsArray[i];
            
            if (!color || color.length !== 3) continue;
            
            // Aplicar intensidade às cores
            const r = Math.round(color[0] * config.intensity);
            const g = Math.round(color[1] * config.intensity);
            const b = Math.round(color[2] * config.intensity);
            
            const colorString = `rgb(${r}, ${g}, ${b})`;
            
            // Determine o valor do desfoque com base na intensidade da cor
            // Cores mais intensas (brilhantes) receberão mais desfoque
            const colorIntensity = (r + g + b) / 765; // 765 = 255 * 3, normaliza entre 0 e 1
            const dynamicBlur = Math.max(config.blurAmount * colorIntensity, config.blurAmount * 0.5);
            
            // Definir a sombra baseada no lado
            let shadowString = '';
            
            if (side === 'top') {
                shadowString = `0 -${dynamicBlur}px ${dynamicBlur * 2}px ${colorString}`;
            } else if (side === 'right') {
                shadowString = `${dynamicBlur}px 0 ${dynamicBlur * 2}px ${colorString}`;
            } else if (side === 'bottom') {
                shadowString = `0 ${dynamicBlur}px ${dynamicBlur * 2}px ${colorString}`;
            } else if (side === 'left') {
                shadowString = `-${dynamicBlur}px 0 ${dynamicBlur * 2}px ${colorString}`;
            }
            
            // Aplicar a sombra com transição suave
            zone.style.transition = 'box-shadow 0.05s linear';
            zone.style.boxShadow = shadowString;
        }
    }
    
    // Envia configurações para o servidor
    function updateServerSettings() {
        if (typeof window.updateServerSettings === 'function') {
            window.updateServerSettings({
                intensity: config.intensity,
                zones_per_side: config.zonesPerSide,
                blur_amount: config.blurAmount
            });
        } else {
            console.warn("Função updateServerSettings não disponível");
            
            // Tentar alternativa via fetch
            fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    intensity: config.intensity,
                    zones_per_side: config.zonesPerSide,
                    blur_amount: config.blurAmount
                })
            }).catch(error => {
                console.error("Erro ao enviar configurações:", error);
            });
        }
    }
    
    // Função para exibir notificações
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Função de fallback se a global não existir
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification p-3 rounded-lg shadow-lg flex items-center mb-2 text-white';
        
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
    
    // Testa o efeito Ambilight com cores aleatórias
    function testAmbilightEffect() {
        // Gerar cores aleatórias para teste
        const generateRandomColors = count => {
            const colors = [];
            for (let i = 0; i < count; i++) {
                colors.push([
                    Math.floor(Math.random() * 256), // R
                    Math.floor(Math.random() * 256), // G
                    Math.floor(Math.random() * 256)  // B
                ]);
            }
            return colors;
        };
        
        const testColors = {
            top: generateRandomColors(config.zonesPerSide),
            right: generateRandomColors(config.zonesPerSide),
            bottom: generateRandomColors(config.zonesPerSide),
            left: generateRandomColors(config.zonesPerSide)
        };
        
        handleColorsUpdate(testColors);
    }
    
    // API pública para controlar o efeito Ambilight
    window.ambilightAPI = {
        toggle: () => {
            config.isAmbilightActive = !config.isAmbilightActive;
            if (ambilightEffect) {
                ambilightEffect.style.display = config.isAmbilightActive ? 'block' : 'none';
            }
            return config.isAmbilightActive;
        },
        isActive: () => config.isAmbilightActive,
        setIntensity: (value) => {
            config.intensity = parseFloat(value);
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
            saveConfig();
        },
        setZones: (value) => {
            config.zonesPerSide = parseInt(value);
            createAmbilightZones();
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
            saveConfig();
        },
        setBlur: (value) => {
            config.blurAmount = parseInt(value);
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
            saveConfig();
        },
        refreshEffect: () => {
            createAmbilightZones();
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
        },
        test: testAmbilightEffect
    };
    
    // Forçar um teste do efeito após um curto delay para debug
    setTimeout(() => {
        testAmbilightEffect();
        console.log("Efeito Ambilight testado com cores aleatórias");
    }, 2000);
    
    // Inicializar
    init();
});