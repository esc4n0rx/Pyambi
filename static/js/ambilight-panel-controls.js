/**
 * Modificações para o painel de configurações Ambilight
 * Adicione este script no final da página
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando controles do painel Ambilight...");
    
    // Elementos
    const ambilightPanel = document.getElementById('ambilight-panel');
    const videoContainer = document.getElementById('video-container');
    
    // Verificar se os elementos existem
    if (!ambilightPanel || !videoContainer) {
        console.error("Elementos necessários não encontrados para o painel Ambilight");
        return;
    }
    
    // Ocultar o painel por padrão
    ambilightPanel.style.display = 'none';
    
    // Função para mostrar/ocultar o painel de configurações
    function toggleAmbilightPanel() {
        if (ambilightPanel.style.display === 'none') {
            ambilightPanel.style.display = 'block';
        } else {
            ambilightPanel.style.display = 'none';
        }
    }
    
    // Adicionar classe para centralizar o player
    document.body.classList.add('fullscreen-player');
    
    // Garantir que o container ocupe toda a tela
    videoContainer.classList.add('fullscreen-container');
    
    // Adicionar atalho de teclado: Alt+A para exibir/ocultar o painel
    document.addEventListener('keydown', function(e) {
        // Alt + A
        if (e.altKey && e.key === 'a') {
            toggleAmbilightPanel();
        }
    });
    
    // Adicionar botão ao player para mostrar/ocultar painel
    const controlBar = document.querySelector('.control-bar');
    if (controlBar) {
        // Verificar se o botão de configurações já existe
        let settingsBtn = document.getElementById('settings-btn');
        
        // Se o botão existe, reconfigurar para mostrar/ocultar o painel
        if (settingsBtn) {
            settingsBtn.addEventListener('click', toggleAmbilightPanel);
        } else {
            // Criar um novo botão se não existir
            const controlsRight = controlBar.querySelector('.flex.items-center.justify-between').lastElementChild;
            
            if (controlsRight) {
                // Criar botão de configurações
                settingsBtn = document.createElement('button');
                settingsBtn.id = 'settings-btn';
                settingsBtn.className = 'video-control';
                settingsBtn.title = 'Configurações Ambilight (Alt+A)';
                settingsBtn.innerHTML = '<i class="fas fa-sliders-h"></i>';
                
                // Adicionar evento para mostrar/ocultar o painel
                settingsBtn.addEventListener('click', toggleAmbilightPanel);
                
                // Adicionar botão aos controles
                controlsRight.appendChild(settingsBtn);
            }
        }
    }
    
    // Adicionar estilos CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Estilos para centralizar o player e configurar o painel */
        body.fullscreen-player {
            overflow: hidden;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #000;
        }
        
        .fullscreen-container {
            width: 85vw !important;
            height: auto !important;
            aspect-ratio: 16 / 9;
            position: relative;
        }
        
        #ambilight-panel {
            position: fixed;
            bottom: 0;
            left: 10%;
            right: 10%;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px 10px 0 0;
            padding: 20px;
            z-index: 100;
            box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.5);
            transition: transform 0.3s ease;
        }
        
        #ambilight-panel.hidden {
            transform: translateY(100%);
        }
        
        /* Aumentar tamanho do efeito Ambilight */
        #ambilight-effect {
            position: absolute !important;
            top: -5% !important;
            left: -5% !important;
            width: 110% !important;
            height: 110% !important;
            z-index: 0 !important;
        }
        
        /* Cores mais intensas */
        .ambilight-zone.top {
            box-shadow: 0 -30px 80px 15px rgba(255, 0, 0, 0.8) !important;
        }
        
        .ambilight-zone.right {
            box-shadow: 30px 0 80px 15px rgba(0, 255, 0, 0.8) !important;
        }
        
        .ambilight-zone.bottom {
            box-shadow: 0 30px 80px 15px rgba(0, 0, 255, 0.8) !important;
        }
        
        .ambilight-zone.left {
            box-shadow: -30px 0 80px 15px rgba(255, 255, 0, 0.8) !important;
        }
    `;
    
    document.head.appendChild(styleElement);
    
    // Atualizar funções para aplicar configurações
    const intensitySlider = document.getElementById('intensity-slider');
    const zonesSelect = document.getElementById('zones-select');
    const blurSlider = document.getElementById('blur-slider');
    const applyBtn = document.getElementById('apply-settings');
    const testBtn = document.getElementById('test-effect-btn');
    
    // Função para atualizar a interface quando as configurações mudarem
    function updateConfigDisplay() {
        if (intensitySlider) {
            document.getElementById('intensity-value').textContent = intensitySlider.value;
        }
        
        if (blurSlider) {
            document.getElementById('blur-value').textContent = blurSlider.value + "px";
        }
    }
    
    // Configurar sliders para atualizar o display em tempo real
    if (intensitySlider) {
        intensitySlider.addEventListener('input', updateConfigDisplay);
    }
    
    if (blurSlider) {
        blurSlider.addEventListener('input', updateConfigDisplay);
    }
    
    // Configurar botão de teste
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            if (window.ambilightAPI && typeof window.ambilightAPI.test === 'function') {
                window.ambilightAPI.test();
            }
        });
    }
    
    // Configurar botão de aplicar
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            // Coletar valores dos controles
            const intensity = intensitySlider ? parseFloat(intensitySlider.value) / 100 : 1.0;
            const zonesPerSide = zonesSelect ? parseInt(zonesSelect.value) : 10;
            const blurAmount = blurSlider ? parseInt(blurSlider.value) : 30;
            
            // Aplicar configurações
            if (window.ambilightAPI) {
                if (typeof window.ambilightAPI.setIntensity === 'function') {
                    window.ambilightAPI.setIntensity(intensity);
                }
                
                if (typeof window.ambilightAPI.setZones === 'function') {
                    window.ambilightAPI.setZones(zonesPerSide);
                }
                
                if (typeof window.ambilightAPI.setBlur === 'function') {
                    window.ambilightAPI.setBlur(blurAmount);
                }
                
                if (typeof window.ambilightAPI.refreshEffect === 'function') {
                    window.ambilightAPI.refreshEffect();
                }
            }
            
            // Enviar configurações para o servidor
            try {
                fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        intensity: intensity,
                        zones_per_side: zonesPerSide,
                        blur_amount: blurAmount
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification('Configurações aplicadas com sucesso', 'success');
                    } else {
                        showNotification('Erro ao salvar configurações: ' + (data.error || 'Erro desconhecido'), 'error');
                    }
                });
            } catch (e) {
                console.error('Erro ao enviar configurações:', e);
            }
            
            // Ocultar painel após aplicar
            ambilightPanel.style.display = 'none';
        });
    }
    
    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification p-3 rounded-lg shadow-lg flex items-center mb-2 text-white transition-opacity duration-300`;
        
        // Define a cor baseada no tipo
        if (type === 'success') {
            notification.classList.add('bg-green-500');
        } else if (type === 'error') {
            notification.classList.add('bg-red-500');
        } else if (type === 'warning') {
            notification.classList.add('bg-yellow-500');
        } else {
            notification.classList.add('bg-blue-500');
        }
        
        // Ícone para o tipo
        let iconClass = 'info-circle';
        if (type === 'success') iconClass = 'check-circle';
        if (type === 'error') iconClass = 'exclamation-circle';
        if (type === 'warning') iconClass = 'exclamation-triangle';
        
        notification.innerHTML = `
            <i class="fas fa-${iconClass} mr-2"></i>
            <span>${message}</span>
            <button class="ml-auto text-white">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Adiciona ao container
        notifications.appendChild(notification);
        
        // Remove depois de 3 segundos
        setTimeout(() => {
            notification.classList.add('opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        // Fecha ao clicar no X
        notification.querySelector('button').addEventListener('click', () => {
            notification.classList.add('opacity-0');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
});