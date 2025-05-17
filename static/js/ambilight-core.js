/**
 * ambilight.js - Versão Melhorada
 * Script para criar efeito Ambilight mais intenso e com melhor sincronismo
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos principais
    const videoContainer = document.getElementById('video-container');
    const ambilightEffect = document.getElementById('ambilight-effect');
    const videoPlayer = document.getElementById('video-player');
    
    // Verificar se os elementos existem
    if (!videoContainer || !ambilightEffect || !videoPlayer) {
        console.error("Elementos necessários para o Ambilight não encontrados");
        return;
    }
    
    // Configurações otimizadas
    const config = {
        // Aumentar zonas para maior precisão
        zonesPerSide: 15,
        // Intensidade aumentada para mais brilho
        intensity: 1.5,
        // Desfoque maior para efeito mais expansivo
        blurAmount: 50,
        // Taxa de atualização mais rápida (menos ms = mais rápido)
        updateInterval: 30,
        // Aumento da área do efeito
        expansionFactor: 1.8,
        // Debug mode
        debugMode: false
    };
    
    // Elementos para as zonas
    let zones = {
        top: [],
        right: [],
        bottom: [],
        left: []
    };
    
    // Cores atuais para cada zona
    let currentColors = null;
    
    // Canvas para análise de cores
    let canvas, ctx, canvasWidth, canvasHeight;

    // Preparação inicial
    function init() {
        console.log("Inicializando efeito Ambilight melhorado...");
        
        // Preparar o container
        prepareContainer();
        
        // Preparar o canvas para análise de vídeo
        setupCanvas();
        
        // Criar zonas Ambilight
        createAmbilightZones();
        
        // Iniciar loop de análise de cores
        startColorAnalysis();
        
        // Configurar eventos
        setupEvents();
        
        console.log("Ambilight melhorado inicializado com sucesso");
    }
    
    // Prepara o container para o efeito expandido
    function prepareContainer() {
        // Garantir que o container tem overflow visível para o efeito funcionar
        videoContainer.style.overflow = 'visible';
        videoContainer.classList.add('ambilight-active');
        
        // Preparar o efeito para ocupar mais espaço
        ambilightEffect.style.position = 'absolute';
        ambilightEffect.style.top = `-${config.expansionFactor * 10}px`;
        ambilightEffect.style.left = `-${config.expansionFactor * 10}px`;
        ambilightEffect.style.width = `calc(100% + ${config.expansionFactor * 20}px)`;
        ambilightEffect.style.height = `calc(100% + ${config.expansionFactor * 20}px)`;
        ambilightEffect.style.zIndex = '0';
        ambilightEffect.style.pointerEvents = 'none';
        ambilightEffect.style.overflow = 'visible';
        
        // Adicionar classe para animação de pulsação quando pausado
        if (videoPlayer.paused) {
            ambilightEffect.classList.add('pulse-animation');
        }
    }
    
    // Configura o canvas para análise do vídeo
    function setupCanvas() {
        // Criar canvas oculto para análise
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Definir tamanho do canvas (valores baixos melhoram performance)
        canvasWidth = 64;  // Aumentado para melhor precisão
        canvasHeight = 36;  // Manter proporção 16:9
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Adicionar ao DOM se em modo debug
        if (config.debugMode) {
            canvas.style.position = 'fixed';
            canvas.style.bottom = '10px';
            canvas.style.left = '10px';
            canvas.style.zIndex = '9999';
            canvas.style.border = '1px solid white';
            canvas.style.width = '192px';  // 3x tamanho para visualização
            canvas.style.height = '108px';
            document.body.appendChild(canvas);
        }
    }
    
    // Cria os elementos DOM para as zonas do Ambilight
    function createAmbilightZones() {
        // Limpar zonas existentes
        ambilightEffect.innerHTML = '';
        
        // Resetar arrays de zonas
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
            containers[side].style.position = 'absolute';
            containers[side].style.overflow = 'visible';
        }
        
        // Configurar posições específicas de cada contêiner
        containers.top.style.top = '0';
        containers.top.style.left = '0';
        containers.top.style.right = '0';
        containers.top.style.height = '1px';
        
        containers.right.style.top = '0';
        containers.right.style.right = '0';
        containers.right.style.bottom = '0';
        containers.right.style.width = '1px';
        
        containers.bottom.style.bottom = '0';
        containers.bottom.style.left = '0';
        containers.bottom.style.right = '0';
        containers.bottom.style.height = '1px';
        
        containers.left.style.top = '0';
        containers.left.style.left = '0';
        containers.left.style.bottom = '0';
        containers.left.style.width = '1px';
        
        // Criar zonas para cada lado
        for (let i = 0; i < config.zonesPerSide; i++) {
            for (const side in containers) {
                const zone = createZoneElement(i, config.zonesPerSide, side);
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
    function createZoneElement(index, total, side) {
        const zone = document.createElement('div');
        zone.className = `ambilight-zone ${side}`;
        
        // Estilos essenciais para cada zona
        zone.style.position = 'absolute';
        zone.style.backgroundColor = 'transparent';
        zone.style.overflow = 'visible';
        
        // Calcular posição baseada no índice
        const percentage = (index / total) * 100;
        const size = 100 / total;
        
        if (side === 'top' || side === 'bottom') {
            // Zonas horizontais (superior e inferior)
            zone.style.left = `${percentage}%`;
            zone.style.width = `${size}%`;
            zone.style.height = '100%';
            zone.style[side] = '0';
        } else {
            // Zonas verticais (esquerda e direita)
            zone.style.top = `${percentage}%`;
            zone.style.height = `${size}%`;
            zone.style.width = '100%';
            zone.style[side] = '0';
        }
        
        return zone;
    }
    
    // Inicia loop de análise de cores
    function startColorAnalysis() {
        let animationFrameId;
        let lastFrameTime = 0;
        
        function analyze(currentTime) {
            // Limitar taxa de atualização para melhorar performance
            if (currentTime - lastFrameTime < config.updateInterval) {
                animationFrameId = requestAnimationFrame(analyze);
                return;
            }
            
            lastFrameTime = currentTime;
            
            // Verificar se o vídeo está em reprodução e tem dados
            if (videoPlayer.readyState >= 2) {
                // Extrair cores do frame atual
                const colors = extractColors();
                
                // Aplicar cores às zonas
                updateAmbilightZones(colors);
            }
            
            // Continuar o loop
            animationFrameId = requestAnimationFrame(analyze);
        }
        
        // Iniciar o loop
        animationFrameId = requestAnimationFrame(analyze);
        
        // Limpeza quando necessário
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }
    
    // Extrai cores do frame atual do vídeo
    function extractColors() {
        // Desenhar frame atual no canvas
        ctx.drawImage(videoPlayer, 0, 0, canvasWidth, canvasHeight);
        
        // Estrutura para guardar as cores
        const colors = {
            top: [],
            right: [],
            bottom: [],
            left: []
        };
        
        // Analisar bordas do vídeo
        const zoneWidth = Math.floor(canvasWidth / config.zonesPerSide);
        const zoneHeight = Math.floor(canvasHeight / config.zonesPerSide);
        
        // Extrai cores para cada zona em cada lado
        for (let i = 0; i < config.zonesPerSide; i++) {
            // Índices de zonas para cada lado
            const topX = i * zoneWidth;
            const bottomX = i * zoneWidth;
            const leftY = i * zoneHeight;
            const rightY = i * zoneHeight;
            
            // Largura e altura para cada extração
            const extractWidth = zoneWidth;
            const extractHeight = zoneHeight;
            
            // Borda superior - 1 pixel de altura
            const topData = ctx.getImageData(topX, 0, extractWidth, 2).data;
            colors.top.push(getAverageColor(topData));
            
            // Borda inferior - 1 pixel de altura
            const bottomData = ctx.getImageData(bottomX, canvasHeight - 2, extractWidth, 2).data;
            colors.bottom.push(getAverageColor(bottomData));
            
            // Borda esquerda - 1 pixel de largura
            const leftData = ctx.getImageData(0, leftY, 2, extractHeight).data;
            colors.left.push(getAverageColor(leftData));
            
            // Borda direita - 1 pixel de largura
            const rightData = ctx.getImageData(canvasWidth - 2, rightY, 2, extractHeight).data;
            colors.right.push(getAverageColor(rightData));
        }
        
        return colors;
    }
    
    // Calcula a cor média de um array de pixels
    function getAverageColor(data) {
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;
        
        // Somar todos os valores RGB
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        
        // Calcular média
        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);
        
        // Aplicar intensidade
        r = Math.min(255, Math.floor(r * config.intensity));
        g = Math.min(255, Math.floor(g * config.intensity));
        b = Math.min(255, Math.floor(b * config.intensity));
        
        return [r, g, b];
    }
    
    // Atualiza as zonas Ambilight com as cores extraídas
    function updateAmbilightZones(colors) {
        // Salvar cores atuais
        currentColors = colors;
        
        // Verificar se temos zonas criadas
        for (const side in zones) {
            if (!zones[side] || zones[side].length === 0) {
                console.warn(`Zonas para o lado ${side} não estão definidas`);
                continue;
            }
            
            // Verificar se temos cores para este lado
            if (!colors[side] || colors[side].length === 0) {
                console.warn(`Cores para o lado ${side} não estão disponíveis`);
                continue;
            }
            
            // Aplicar cores às zonas
            updateZonesForSide(zones[side], colors[side], side);
        }
    }
    
    // Atualiza as zonas de um lado específico
    function updateZonesForSide(zoneElements, zoneColors, side) {
        if (zoneElements.length !== zoneColors.length) {
            // Ajustar se o número de zonas e cores for diferente
            console.warn(`Quantidade de zonas (${zoneElements.length}) e cores (${zoneColors.length}) incompatíveis para ${side}`);
        }
        
        // Aplicar para cada zona
        for (let i = 0; i < zoneElements.length; i++) {
            const zone = zoneElements[i];
            // Garantir que estamos usando um índice válido para as cores
            const colorIdx = i < zoneColors.length ? i : i % zoneColors.length;
            const color = zoneColors[colorIdx];
            
            if (!color || color.length !== 3) continue;
            
            const [r, g, b] = color;
            const colorString = `rgb(${r}, ${g}, ${b})`;
            
            // Cor mais intensa = desfoque maior
            const colorIntensity = (r + g + b) / 765; // Normalizado para 0-1
            const dynamicBlur = Math.max(config.blurAmount * colorIntensity, config.blurAmount * 0.5);
            const spreadAmount = dynamicBlur * 1.5;
            
            // Aplicar box-shadow com direção adequada
            let shadowString;
            switch (side) {
                case 'top':
                    shadowString = `0 -${dynamicBlur}px ${dynamicBlur * 2}px ${spreadAmount}px ${colorString}`;
                    break;
                case 'right':
                    shadowString = `${dynamicBlur}px 0 ${dynamicBlur * 2}px ${spreadAmount}px ${colorString}`;
                    break;
                case 'bottom':
                    shadowString = `0 ${dynamicBlur}px ${dynamicBlur * 2}px ${spreadAmount}px ${colorString}`;
                    break;
                case 'left':
                    shadowString = `-${dynamicBlur}px 0 ${dynamicBlur * 2}px ${spreadAmount}px ${colorString}`;
                    break;
            }
            
            // Aplicar as cores com desfoque
            zone.style.boxShadow = shadowString;
        }
    }
    
    // Configurar eventos
    function setupEvents() {
        // Evento para pausar/reproduzir
        videoPlayer.addEventListener('play', () => {
            ambilightEffect.classList.remove('pulse-animation');
        });
        
        videoPlayer.addEventListener('pause', () => {
            ambilightEffect.classList.add('pulse-animation');
        });
        
        // Evento para redimensionamento
        window.addEventListener('resize', () => {
            // Recriar zonas quando a janela for redimensionada
            createAmbilightZones();
        });
    }
    
    // Teste do efeito Ambilight
    function testAmbilightEffect() {
        // Gerar cores aleatórias
        const generateRandomColors = (count) => {
            const colors = [];
            for (let i = 0; i < count; i++) {
                colors.push([
                    Math.floor(Math.random() * 255), // R
                    Math.floor(Math.random() * 255), // G
                    Math.floor(Math.random() * 255)  // B
                ]);
            }
            return colors;
        };
        
        // Gerar cores para cada lado
        const testColors = {
            top: generateRandomColors(config.zonesPerSide),
            right: generateRandomColors(config.zonesPerSide),
            bottom: generateRandomColors(config.zonesPerSide),
            left: generateRandomColors(config.zonesPerSide)
        };
        
        // Aplicar cores de teste
        updateAmbilightZones(testColors);
        
        console.log("Efeito Ambilight testado com cores aleatórias");
    }
    
    // Inicialização
    init();
    
    // Expor API global para controle
    window.ambilightAPI = {
        updateConfig: (newConfig) => {
            Object.assign(config, newConfig);
            console.log("Configuração atualizada:", config);
            createAmbilightZones();
        },
        test: testAmbilightEffect,
        reinit: init
    };
});