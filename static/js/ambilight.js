/**
 * Correção do Efeito Ambilight e Implementação de Animação Centralizada
 * 
 * Este script corrige o bug do efeito Ambilight e implementa uma
 * animação que centraliza o player com fundo preto para melhorar
 * a visualização do efeito.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos principais
    const videoContainer = document.getElementById('video-container');
    const ambilightEffect = document.getElementById('ambilight-effect');
    const videoPlayer = document.getElementById('video-player');
    
    // Configurações
    let isFullscreenMode = false;
    let isAmbilightActive = true;
    
    // Elementos para as zonas (estas variáveis precisam ser globais para o escopo do módulo)
    let topZones = [];
    let rightZones = [];
    let bottomZones = [];
    let leftZones = [];
    
    /**
     * Inicialização do corretor Ambilight
     */
    function initAmbilightFix() {
        console.log("Inicializando correção do Ambilight...");
        
        // Garantir que o container tem overflow visível para o efeito funcionar
        if (videoContainer) {
            videoContainer.style.overflow = 'visible';
            videoContainer.classList.add('ambilight-active');
        }
        
        // Garantir que o efeito Ambilight está visível
        if (ambilightEffect) {
            ambilightEffect.style.display = 'block';
            ambilightEffect.style.zIndex = '0';
            ambilightEffect.style.pointerEvents = 'none';
            ambilightEffect.innerHTML = ''; // Limpar qualquer conteúdo antigo
        }
        
        // Criar ou recriar as zonas
        createAmbilightZones();
        
        // Adicionar evento de tela cheia
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        // Adicionar botão para modo imersivo
        addImmersiveButton();
        
        // Sobrescrever a função updateAmbilightColors para corrigir o bug
        window.updateAmbilightColors = fixedUpdateAmbilightColors;
    }
    
    /**
     * Cria os elementos DOM para as zonas do Ambilight
     */
    function createAmbilightZones() {
        // Limpar zonas existentes
        if (ambilightEffect) {
            ambilightEffect.innerHTML = '';
            topZones = [];
            rightZones = [];
            bottomZones = [];
            leftZones = [];
            
            // Obter o número de zonas das configurações
            const zonesSelect = document.getElementById('zones-select');
            const zonesPerSide = zonesSelect ? parseInt(zonesSelect.value) : 15;
            
            // Criar contêineres para cada lado
            const topContainer = document.createElement('div');
            topContainer.className = 'ambilight-container top';
            topContainer.style.cssText = 'position: absolute; top: -5px; left: 0; right: 0; height: 5px; overflow: visible;';
            
            const rightContainer = document.createElement('div');
            rightContainer.className = 'ambilight-container right';
            rightContainer.style.cssText = 'position: absolute; top: 0; right: -5px; bottom: 0; width: 5px; overflow: visible;';
            
            const bottomContainer = document.createElement('div');
            bottomContainer.className = 'ambilight-container bottom';
            bottomContainer.style.cssText = 'position: absolute; bottom: -5px; left: 0; right: 0; height: 5px; overflow: visible;';
            
            const leftContainer = document.createElement('div');
            leftContainer.className = 'ambilight-container left';
            leftContainer.style.cssText = 'position: absolute; top: 0; left: -5px; bottom: 0; width: 5px; overflow: visible;';
            
            // Criar zonas para cada lado
            for (let i = 0; i < zonesPerSide; i++) {
                // Zonas superiores
                const topZone = createZone(i, zonesPerSide, 'top');
                topContainer.appendChild(topZone);
                topZones.push(topZone);
                
                // Zonas à direita
                const rightZone = createZone(i, zonesPerSide, 'right');
                rightContainer.appendChild(rightZone);
                rightZones.push(rightZone);
                
                // Zonas inferiores
                const bottomZone = createZone(i, zonesPerSide, 'bottom');
                bottomContainer.appendChild(bottomZone);
                bottomZones.push(bottomZone);
                
                // Zonas à esquerda
                const leftZone = createZone(i, zonesPerSide, 'left');
                leftContainer.appendChild(leftZone);
                leftZones.push(leftZone);
            }
            
            // Adicionar contêineres ao efeito Ambilight
            ambilightEffect.appendChild(topContainer);
            ambilightEffect.appendChild(rightContainer);
            ambilightEffect.appendChild(bottomContainer);
            ambilightEffect.appendChild(leftContainer);
            
            console.log(`Zonas Ambilight recriadas: ${zonesPerSide} por lado`);
        }
    }
    
    /**
     * Cria um elemento de zona individual
     */
    function createZone(index, total, side) {
        const zone = document.createElement('div');
        zone.className = `ambilight-zone ${side}`;
        zone.style.cssText = 'position: absolute; background-color: transparent; overflow: visible;';
        
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
     * Versão corrigida da função updateAmbilightColors
     */
    function fixedUpdateAmbilightColors(colors) {
        if (!isAmbilightActive) return;
        
        // Obter valor do desfoque da UI
        const blurSlider = document.getElementById('blur-slider');
        const blurAmount = blurSlider ? parseInt(blurSlider.value) : 20;
        
        // Obter intensidade da UI
        const intensitySlider = document.getElementById('intensity-slider');
        const intensity = intensitySlider ? (parseInt(intensitySlider.value) / 100) : 1.0;
        
        // Verificar se os dados de cores são válidos
        if (!colors || !colors.top || !colors.right || !colors.bottom || !colors.left) {
            console.warn("Dados de cores inválidos:", colors);
            return;
        }
        
        // Verificar se as zonas foram criadas
        if (topZones.length === 0 || topZones.length !== colors.top.length) {
            console.log("Recriando zonas para corresponder aos dados recebidos...");
            createAmbilightZones();
        }
        
        // Atualizar cada zona com sua cor correspondente
        try {
            updateZonesColors(topZones, colors.top, 'top', blurAmount, intensity);
            updateZonesColors(rightZones, colors.right, 'right', blurAmount, intensity);
            updateZonesColors(bottomZones, colors.bottom, 'bottom', blurAmount, intensity);
            updateZonesColors(leftZones, colors.left, 'left', blurAmount, intensity);
            
            // Adicionar animação de pulsação quando o vídeo estiver pausado
            if (videoPlayer && videoPlayer.paused) {
                ambilightEffect.classList.add('pulse-animation');
            } else {
                ambilightEffect.classList.remove('pulse-animation');
            }
            
            console.log("Cores Ambilight aplicadas com sucesso");
        } catch (error) {
            console.error("Erro ao aplicar cores Ambilight:", error);
        }
    }
    
    /**
     * Atualiza as cores de um conjunto de zonas
     */
    function updateZonesColors(zones, colors, side, blurAmount, intensity) {
        if (!zones || !colors || zones.length !== colors.length) {
            console.warn(`Problema ao aplicar cores para ${side}:`, { 
                zonesCount: zones ? zones.length : 0, 
                colorsCount: colors ? colors.length : 0 
            });
            return;
        }
        
        for (let i = 0; i < zones.length; i++) {
            const zone = zones[i];
            const color = colors[i];
            
            if (!color || color.length !== 3) {
                continue;
            }
            
            // Aplicar intensidade às cores
            const r = Math.round(color[0] * intensity);
            const g = Math.round(color[1] * intensity);
            const b = Math.round(color[2] * intensity);
            
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
            
            // Aplicar a sombra
            zone.style.boxShadow = shadowString;
            zone.style.backgroundColor = 'transparent';
        }
    }
    
    /**
     * Adiciona um botão para o modo imersivo
     */
    function addImmersiveButton() {
        // Verificar se o botão já existe
        if (document.getElementById('immersive-mode-btn')) {
            return;
        }
        
        // Criar o botão de modo imersivo
        const immersiveBtn = document.createElement('button');
        immersiveBtn.id = 'immersive-mode-btn';
        immersiveBtn.className = 'video-control';
        immersiveBtn.title = 'Modo Imersivo';
        immersiveBtn.innerHTML = '<i class="fas fa-film"></i>';
        
        // Encontrar a barra de controles
        const controlBar = document.querySelector('.control-bar');
        if (!controlBar) return;
        
        // Encontrar o container de controles à direita
        const rightControls = controlBar.querySelector('div.flex.items-center.space-x-3:last-child');
        if (rightControls) {
            // Inserir antes do botão de tela cheia
            const fullscreenBtn = document.getElementById('fullscreen-btn');
            if (fullscreenBtn) {
                rightControls.insertBefore(immersiveBtn, fullscreenBtn);
            } else {
                rightControls.appendChild(immersiveBtn);
            }
            
            // Adicionar evento de clique
            immersiveBtn.addEventListener('click', toggleImmersiveMode);
        }
    }
    
    /**
     * Alterna o modo imersivo
     */
    function toggleImmersiveMode() {
        if (videoContainer) {
            // Toggle da classe
            document.body.classList.toggle('immersive-mode');
            
            // Estado atual
            const isImmersive = document.body.classList.contains('immersive-mode');
            
            if (isImmersive) {
                // Entrar no modo imersivo
                createImmersiveMode();
            } else {
                // Sair do modo imersivo
                exitImmersiveMode();
            }
        }
    }
    
    /**
     * Cria o modo imersivo
     */
    function createImmersiveMode() {
        // Adicionar estilos para o modo imersivo
        const style = document.createElement('style');
        style.id = 'immersive-mode-style';
        style.textContent = `
            body.immersive-mode {
                background-color: #000;
                overflow: hidden;
            }
            
            body.immersive-mode .container {
                max-width: 100% !important;
                padding: 0 !important;
            }
            
            body.immersive-mode header,
            body.immersive-mode #upload-area,
            body.immersive-mode .lg\\:col-span-1 {
                display: none !important;
            }
            
            body.immersive-mode .lg\\:col-span-3 {
                grid-column: span 4 / span 4 !important;
            }
            
            body.immersive-mode .lg\\:grid-cols-4 {
                grid-template-columns: 1fr !important;
            }
            
            body.immersive-mode #video-container {
                width: 100vw;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 9999;
                background-color: #000;
                overflow: visible;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: immersive-enter 0.5s ease-out forwards;
            }
            
            body.immersive-mode #video-player {
                max-width: 85vw;
                max-height: 85vh;
                width: auto;
                height: auto;
            }
            
            body.immersive-mode .control-bar {
                bottom: 20px;
                left: 5vw;
                right: 5vw;
                width: 90vw;
            }
            
            @keyframes immersive-enter {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes immersive-exit {
                from {
                    opacity: 1;
                    transform: scale(1);
                }
                to {
                    opacity: 0;
                    transform: scale(0.9);
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // Adicionar tecla ESC para sair
        document.addEventListener('keydown', handleImmersiveKeyPress);
        
        // Atualizar o ícone do botão
        const immersiveBtn = document.getElementById('immersive-mode-btn');
        if (immersiveBtn) {
            immersiveBtn.innerHTML = '<i class="fas fa-compress"></i>';
            immersiveBtn.title = 'Sair do Modo Imersivo';
        }
        
        // Notificar o usuário
        showNotification('Modo imersivo ativado. Pressione ESC para sair.', 'info');
    }
    
    /**
     * Sai do modo imersivo
     */
    function exitImmersiveMode() {
        // Adicionar classe de animação de saída
        if (videoContainer) {
            videoContainer.style.animation = 'immersive-exit 0.5s ease-in forwards';
            
            // Remover a classe após a animação
            setTimeout(() => {
                // Remover os estilos imersivos
                const style = document.getElementById('immersive-mode-style');
                if (style) {
                    style.remove();
                }
                
                // Redefinir a animação
                videoContainer.style.animation = '';
                
                // Remover o evento de tecla
                document.removeEventListener('keydown', handleImmersiveKeyPress);
                
                // Atualizar o ícone do botão
                const immersiveBtn = document.getElementById('immersive-mode-btn');
                if (immersiveBtn) {
                    immersiveBtn.innerHTML = '<i class="fas fa-film"></i>';
                    immersiveBtn.title = 'Modo Imersivo';
                }
            }, 500);
        }
    }
    
    /**
     * Manipula eventos de tecla no modo imersivo
     */
    function handleImmersiveKeyPress(e) {
        if (e.key === 'Escape' && document.body.classList.contains('immersive-mode')) {
            document.body.classList.remove('immersive-mode');
            exitImmersiveMode();
        }
    }
    
    /**
     * Manipula o evento de tela cheia
     */
    function handleFullscreenChange() {
        isFullscreenMode = !!document.fullscreenElement;
        
        // Garantir que o efeito Ambilight esteja visível em tela cheia
        if (isFullscreenMode && ambilightEffect) {
            ambilightEffect.style.display = 'block';
            createAmbilightZones(); // Recriar as zonas para se adaptarem à nova resolução
        }
    }
    
    /**
     * Mostra uma notificação
     */
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Função de fallback caso a função global não exista
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
    }
    
    // Adicionar um botão de teste do Ambilight para debug
    function addTestAmbilightButton() {
        const testBtn = document.createElement('button');
        testBtn.id = 'test-ambilight-btn';
        testBtn.innerText = 'Testar Ambilight';
        testBtn.className = 'btn btn-secondary';
        testBtn.style.position = 'fixed';
        testBtn.style.bottom = '10px';
        testBtn.style.right = '10px';
        testBtn.style.zIndex = '9999';
        
        testBtn.addEventListener('click', () => {
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
            
            const zonesPerSide = 15; // Ou qual for o valor atual no select
            
            const testColors = {
                top: generateRandomColors(zonesPerSide),
                right: generateRandomColors(zonesPerSide),
                bottom: generateRandomColors(zonesPerSide),
                left: generateRandomColors(zonesPerSide)
            };
            
            fixedUpdateAmbilightColors(testColors);
            showNotification('Cores de teste aplicadas', 'info');
        });
        
        document.body.appendChild(testBtn);
    }
    
    // Inicializar quando o documento estiver pronto
    initAmbilightFix();
    
    // Para debugging, adicione o botão de teste
    addTestAmbilightButton();
    
    // Expor funções e variáveis globalmente para debug
    window.ambilightFix = {
        toggleImmersiveMode,
        createAmbilightZones,
        updateAmbilightColors: fixedUpdateAmbilightColors,
        isAmbilightActive,
        topZones,
        rightZones,
        bottomZones,
        leftZones
    };
});