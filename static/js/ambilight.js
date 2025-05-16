// Correções para o efeito Ambilight

/**
 * Este script deve substituir ou complementar o arquivo static/js/ambilight.js
 * Ele corrige problemas relacionados à criação, posicionamento e animação das zonas Ambilight
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
        blurAmount: 20, // Aumentado para maior visibilidade
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
        console.log("Inicializando efeito Ambilight (versão corrigida)...");
        
        // Garantir que o container tem overflow visível para o efeito funcionar
        videoContainer.style.overflow = 'visible';
        
        // Garantir que o efeito Ambilight está visível e configurado corretamente
        ambilightEffect.style.display = 'block';
        ambilightEffect.style.position = 'absolute';
        ambilightEffect.style.top = '0';
        ambilightEffect.style.left = '0';
        ambilightEffect.style.width = '100%';
        ambilightEffect.style.height = '100%';
        ambilightEffect.style.zIndex = '0';
        ambilightEffect.style.pointerEvents = 'none';
        ambilightEffect.style.overflow = 'visible';
        
        // Adicionar uma classe para indicar que o Ambilight está ativo
        videoContainer.classList.add('ambilight-active');
        
        // Carregar configurações
        loadConfig();
        
        // Limpar qualquer zona existente
        ambilightEffect.innerHTML = '';
        
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
                    // Ativar modo de demonstração se o WebSocket não estiver disponível
                    testAmbilightEffect();
                }
            }, 1500);
        } else {
            // Se não houver vídeo, usar cores de teste para debug
            console.log("Nenhum vídeo detectado, utilizando cores de teste");
            testAmbilightEffect();
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
                
                // Recriar zonas com as novas configurações
                createAmbilightZones();
                
                // Testar o efeito com as novas configurações
                testAmbilightEffect();
            })
            .catch(error => {
                console.warn("Erro ao carregar configurações do servidor:", error);
            });
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
        
        // Evento para redimensionamento da janela
        window.addEventListener('resize', () => {
            // Recriar zonas quando a janela for redimensionada
            createAmbilightZones();
            
            // Reaplicar cores atuais se existirem
            if (currentColors) {
                handleColorsUpdate(currentColors);
            }
        });
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
        
        // Definir estilo para os contêineres
        containers.top.style.position = 'absolute';
        containers.top.style.left = '0';
        containers.top.style.right = '0';
        containers.top.style.top = '-2px';
        containers.top.style.height = '2px';
        containers.top.style.overflow = 'visible';
        
        containers.right.style.position = 'absolute';
        containers.right.style.top = '0';
        containers.right.style.bottom = '0';
        containers.right.style.right = '-2px';
        containers.right.style.width = '2px';
        containers.right.style.overflow = 'visible';
        
        containers.bottom.style.position = 'absolute';
        containers.bottom.style.left = '0';
        containers.bottom.style.right = '0';
        containers.bottom.style.bottom = '-2px';
        containers.bottom.style.height = '2px';
        containers.bottom.style.overflow = 'visible';
        
        containers.left.style.position = 'absolute';
        containers.left.style.top = '0';
        containers.left.style.bottom = '0';
        containers.left.style.left = '-2px';
        containers.left.style.width = '2px';
        containers.left.style.overflow = 'visible';
        
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
        
        // Estilos essenciais para cada zona
        zone.style.position = 'absolute';
        zone.style.backgroundColor = 'transparent';
        zone.style.overflow = 'visible';
        zone.style.zIndex = '0';
        
        const percentage = (index / total) * 100;
        const size = 100 / total;
        
        if (side === 'top' || side === 'bottom') {
            zone.style.left = `${percentage}%`;
            zone.style.width = `${size}%`;
            zone.style.height = '100%';
            zone.style[side] = '0';
        } else { // left or right
            zone.style.top = `${percentage}%`;
            zone.style.height = `${size}%`;
            zone.style.width = '100%';
            zone.style[side] = '0';
        }
        
        return zone;
    }
    
    // Manipula atualizações de cores do servidor
    function handleColorsUpdate(colors) {
        if (!config.isAmbilightActive || !colors) return;
        
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
        
        // Adicionar classe ao container para ativar efeito
        videoContainer.classList.add('ambilight-active');
        
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
            
            // Determinar o valor do desfoque com base na intensidade da cor
            const colorIntensity = (r + g + b) / 765; // 765 = 255 * 3, normaliza entre 0 e 1
            const dynamicBlur = Math.max(config.blurAmount * colorIntensity, config.blurAmount * 0.5);
            
            // Definir a sombra baseada no lado - VALORES MAIORES PARA MAIS VISIBILIDADE
            let shadowString = '';
            
            if (side === 'top') {
                shadowString = `0 -${dynamicBlur}px ${dynamicBlur * 2.5}px 5px ${colorString}`;
            } else if (side === 'right') {
                shadowString = `${dynamicBlur}px 0 ${dynamicBlur * 2.5}px 5px ${colorString}`;
            } else if (side === 'bottom') {
                shadowString = `0 ${dynamicBlur}px ${dynamicBlur * 2.5}px 5px ${colorString}`;
            } else if (side === 'left') {
                shadowString = `-${dynamicBlur}px 0 ${dynamicBlur * 2.5}px 5px ${colorString}`;
            }
            
            // Aplicar a sombra diretamente (sem transição para debug)
            zone.style.boxShadow = shadowString;
        }
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
        
        console.log("Testando efeito Ambilight com cores aleatórias");
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
    
    // Inicializar
    init();
});