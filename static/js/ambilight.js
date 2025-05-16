/**
 * Ambilight.js
 * Gerencia a lógica do efeito Ambilight no frontend
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const ambilightEffect = document.getElementById('ambilight-effect');
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');
    
    // Configurações do Ambilight
    let ambilightSettings = {
        intensity: 1.0,
        zonesPerSide: 10,
        blurAmount: 15,
        isActive: true
    };
    
    // Elementos DOM para as zonas
    let topZones = [];
    let rightZones = [];
    let bottomZones = [];
    let leftZones = [];

    // Inicializa o efeito Ambilight
    initAmbilight();
    
    /**
     * Inicializa o efeito Ambilight
     */
    function initAmbilight() {
        // Adiciona a classe para ativar o efeito
        videoContainer.classList.add('ambilight-active');
        
        // Exibe o contêiner do efeito
        ambilightEffect.style.display = 'block';
        
        // Garante que o contêiner Ambilight tenha o tamanho correto
        ambilightEffect.style.width = '100%';
        ambilightEffect.style.height = '100%';
        ambilightEffect.style.position = 'absolute';
        ambilightEffect.style.top = '0';
        ambilightEffect.style.left = '0';
        ambilightEffect.style.pointerEvents = 'none';
        
        // Carrega as configurações
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                ambilightSettings.intensity = settings.intensity;
                ambilightSettings.zonesPerSide = settings.zones_per_side;
                ambilightSettings.blurAmount = settings.blur_amount;
                
                console.log("Configurações do Ambilight carregadas:", ambilightSettings);
                
                // Cria as zonas do Ambilight
                createAmbilightZones();
            })
            .catch(error => {
                console.error('Erro ao carregar configurações do Ambilight:', error);
                
                // Usa valores padrão em caso de erro
                createAmbilightZones();
            });
        
        // Evento para atualizar as zonas ao redimensionar a janela
        window.addEventListener('resize', debounce(createAmbilightZones, 200));
    }
    
    /**
     * Cria os elementos DOM para as zonas do Ambilight
     */
    function createAmbilightZones() {
        // Limpa as zonas existentes
        ambilightEffect.innerHTML = '';
        topZones = [];
        rightZones = [];
        bottomZones = [];
        leftZones = [];
        
        const zonesPerSide = ambilightSettings.zonesPerSide;
        
        // Cria os contêineres para cada lado
        const topContainer = document.createElement('div');
        topContainer.className = 'absolute top-0 left-0 right-0 overflow-hidden';
        topContainer.style.height = '5px';
        
        const rightContainer = document.createElement('div');
        rightContainer.className = 'absolute top-0 right-0 bottom-0 overflow-hidden';
        rightContainer.style.width = '5px';
        
        const bottomContainer = document.createElement('div');
        bottomContainer.className = 'absolute bottom-0 left-0 right-0 overflow-hidden';
        bottomContainer.style.height = '5px';
        
        const leftContainer = document.createElement('div');
        leftContainer.className = 'absolute top-0 left-0 bottom-0 overflow-hidden';
        leftContainer.style.width = '5px';
        
        // Cria as zonas para cada lado
        for (let i = 0; i < zonesPerSide; i++) {
            // Zonas superiores
            const topZone = createZone(i, zonesPerSide, 'top');
            topContainer.appendChild(topZone);
            topZones.push(topZone);
            
            // Zonas direitas
            const rightZone = createZone(i, zonesPerSide, 'right');
            rightContainer.appendChild(rightZone);
            rightZones.push(rightZone);
            
            // Zonas inferiores
            const bottomZone = createZone(i, zonesPerSide, 'bottom');
            bottomContainer.appendChild(bottomZone);
            bottomZones.push(bottomZone);
            
            // Zonas esquerdas
            const leftZone = createZone(i, zonesPerSide, 'left');
            leftContainer.appendChild(leftZone);
            leftZones.push(leftZone);
        }
        
        // Adiciona os contêineres ao efeito Ambilight
        ambilightEffect.appendChild(topContainer);
        ambilightEffect.appendChild(rightContainer);
        ambilightEffect.appendChild(bottomContainer);
        ambilightEffect.appendChild(leftContainer);
    }
    
    /**
     * Cria um elemento de zona individual
     */
    function createZone(index, total, side) {
        const zone = document.createElement('div');
        zone.className = 'absolute bg-transparent';
        
        const percentage = (index / total) * 100;
        const size = 100 / total;
        
        if (side === 'top') {
            zone.style.left = `${percentage}%`;
            zone.style.top = '0';
            zone.style.width = `${size}%`;
            zone.style.height = '100%';
        } else if (side === 'right') {
            zone.style.right = '0';
            zone.style.top = `${percentage}%`;
            zone.style.width = '100%';
            zone.style.height = `${size}%`;
        } else if (side === 'bottom') {
            zone.style.left = `${percentage}%`;
            zone.style.bottom = '0';
            zone.style.width = `${size}%`;
            zone.style.height = '100%';
        } else if (side === 'left') {
            zone.style.left = '0';
            zone.style.top = `${percentage}%`;
            zone.style.width = '100%';
            zone.style.height = `${size}%`;
        }
        
        return zone;
    }
    
    /**
     * Atualiza as cores das zonas Ambilight
     */
    window.updateAmbilightColors = function(colors) {
        if (!ambilightSettings.isActive) return;
        
        const blurAmount = ambilightSettings.blurAmount;
        
        // Verifica se os dados de cores são válidos
        if (!colors || !colors.top || !colors.right || !colors.bottom || !colors.left) {
            console.log("Dados de cores inválidos:", colors);
            return;
        }
        
        // Adiciona uma classe para ativar o efeito visualmente
        videoContainer.classList.add('ambilight-active');
        ambilightEffect.style.display = 'block';
        
        // Atualiza cada zona com sua cor correspondente
        updateZonesColors(topZones, colors.top, 'top', blurAmount);
        updateZonesColors(rightZones, colors.right, 'right', blurAmount);
        updateZonesColors(bottomZones, colors.bottom, 'bottom', blurAmount);
        updateZonesColors(leftZones, colors.left, 'left', blurAmount);
        
        // Adiciona uma suave pulsação quando o vídeo está pausado
        if (videoPlayer.paused) {
            ambilightEffect.classList.add('pulse-animation');
        } else {
            ambilightEffect.classList.remove('pulse-animation');
        }
        
        console.log("Cores atualizadas:", { topZonesCount: topZones.length, hasColors: colors !== null });
    };
    
    /**
     * Atualiza as cores de um conjunto de zonas
     */
    function updateZonesColors(zones, colors, side, blurAmount) {
        // Verifica se temos o número correto de zonas e cores
        if (!zones || !colors || zones.length !== colors.length) {
            console.log(`Problema ao aplicar cores para ${side}:`, { 
                zonesCount: zones ? zones.length : 0, 
                colorsCount: colors ? colors.length : 0 
            });
            return;
        }
        
        for (let i = 0; i < zones.length; i++) {
            const zone = zones[i];
            const color = colors[i];
            
            if (!color || color.length !== 3) {
                console.log(`Cor inválida para ${side} zona ${i}:`, color);
                continue;
            }
            
            const [r, g, b] = color;
            const colorString = `rgb(${r}, ${g}, ${b})`;
            
            // Define a sombra baseada no lado
            let shadowString = '';
            
            if (side === 'top') {
                shadowString = `0 -${blurAmount}px ${blurAmount * 2}px ${colorString}`;
            } else if (side === 'right') {
                shadowString = `${blurAmount}px 0 ${blurAmount * 2}px ${colorString}`;
            } else if (side === 'bottom') {
                shadowString = `0 ${blurAmount}px ${blurAmount * 2}px ${colorString}`;
            } else if (side === 'left') {
                shadowString = `-${blurAmount}px 0 ${blurAmount * 2}px ${colorString}`;
            }
            
            // Aplica a sombra
            zone.style.boxShadow = shadowString;
            
            // Garante que a zona seja visível
            zone.style.backgroundColor = 'transparent';
            zone.style.zIndex = '5';
            
            // Define um atributo de dados para fins de diagnóstico
            zone.setAttribute('data-color', colorString);
        }
    }
    
    /**
     * Atualiza as configurações do Ambilight
     */
    window.updateAmbilightSettings = function(settings) {
        // Atualiza somente as configurações que foram fornecidas
        if (settings.intensity !== undefined) {
            ambilightSettings.intensity = settings.intensity;
        }
        
        if (settings.zonesPerSide !== undefined) {
            const oldZones = ambilightSettings.zonesPerSide;
            ambilightSettings.zonesPerSide = settings.zonesPerSide;
            
            // Recria as zonas apenas se o número mudou
            if (oldZones !== settings.zonesPerSide) {
                createAmbilightZones();
            }
        }
        
        if (settings.blurAmount !== undefined) {
            ambilightSettings.blurAmount = settings.blurAmount;
        }
        
        if (settings.isActive !== undefined) {
            ambilightSettings.isActive = settings.isActive;
            
            if (settings.isActive) {
                videoContainer.classList.add('ambilight-active');
                ambilightEffect.style.display = 'block';
            } else {
                videoContainer.classList.remove('ambilight-active');
                ambilightEffect.style.display = 'none';
            }
        }
    };
    
    /**
     * Desativa o efeito Ambilight
     */
    window.disableAmbilight = function() {
        ambilightSettings.isActive = false;
        videoContainer.classList.remove('ambilight-active');
        ambilightEffect.style.display = 'none';
    };
    
    /**
     * Ativa o efeito Ambilight
     */
    window.enableAmbilight = function() {
        ambilightSettings.isActive = true;
        videoContainer.classList.add('ambilight-active');
        ambilightEffect.style.display = 'block';
    };
    
    /**
     * Função debounce para limitar a frequência de execução de funções
     */
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});