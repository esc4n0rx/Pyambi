
/**
 * Settings.js
 * Gerencia as configurações do Ambilight Player
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM para página de configurações
    const settingsForm = document.getElementById('settings-form');
    const resetSettingsBtn = document.getElementById('reset-settings');
    
    // Elementos DOM para sliders e valores exibidos
    const intensitySlider = document.getElementById('intensity');
    const intensityDisplay = document.getElementById('intensity-display');
    const blurSlider = document.getElementById('blur');
    const blurDisplay = document.getElementById('blur-display');
    
    // Configurações padrão
    const defaultSettings = {
        intensity: 1.0,
        zones_per_side: 10,
        blur_amount: 15,
        autoplay: false
    };
    
    // Inicializa a página de configurações se estivermos na página de configurações
    if (settingsForm) {
        initSettingsPage();
    }
    
    /**
     * Inicializa a página de configurações
     */
    function initSettingsPage() {
        // Adiciona event listeners para sliders em tempo real
        if (intensitySlider) {
            intensitySlider.addEventListener('input', () => {
                intensityDisplay.textContent = `${intensitySlider.value}%`;
            });
        }
        
        if (blurSlider) {
            blurSlider.addEventListener('input', () => {
                blurDisplay.textContent = `${blurSlider.value}px`;
            });
        }
        
        // Event listener para envio do formulário
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveSettings();
            });
        }
        
        // Event listener para resetar configurações
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', resetSettings);
        }
    }
    
    /**
     * Salva as configurações
     */
    function saveSettings() {
        // Coleta os valores do formulário
        const settings = {
            intensity: intensitySlider ? parseFloat(intensitySlider.value) / 100 : defaultSettings.intensity,
            zones_per_side: document.getElementById('zones') ? parseInt(document.getElementById('zones').value) : defaultSettings.zones_per_side,
            blur_amount: blurSlider ? parseInt(blurSlider.value) : defaultSettings.blur_amount,
            autoplay: document.getElementById('autoplay') ? document.getElementById('autoplay').checked : defaultSettings.autoplay
        };
        
        // Envia as configurações para o servidor
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
                showNotification('Configurações salvas com sucesso', 'success');
            } else {
                showNotification(`Erro ao salvar configurações: ${data.error}`, 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao salvar configurações:', error);
            showNotification('Erro ao salvar configurações', 'error');
        });
    }
    
    /**
     * Reseta as configurações para os valores padrão
     */
    function resetSettings() {
        if (confirm('Tem certeza de que deseja restaurar as configurações padrão?')) {
            // Define os valores do formulário para os padrões
            if (intensitySlider) {
                intensitySlider.value = defaultSettings.intensity * 100;
                intensityDisplay.textContent = `${defaultSettings.intensity * 100}%`;
            }
            
            if (document.getElementById('zones')) {
                document.getElementById('zones').value = defaultSettings.zones_per_side;
            }
            
            if (blurSlider) {
                blurSlider.value = defaultSettings.blur_amount;
                blurDisplay.textContent = `${defaultSettings.blur_amount}px`;
            }
            
            if (document.getElementById('autoplay')) {
                document.getElementById('autoplay').checked = defaultSettings.autoplay;
            }
            
            // Salva as configurações padrão
            fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(defaultSettings)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Configurações restauradas para valores padrão', 'success');
                } else {
                    showNotification(`Erro ao restaurar configurações: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Erro ao restaurar configurações:', error);
                showNotification('Erro ao restaurar configurações', 'error');
            });
        }
    }
    
    /**
     * Aplica configurações em tempo real ao efeito Ambilight
     * (usado na página inicial para ajustes rápidos)
     */
    if (document.getElementById('apply-settings')) {
        document.getElementById('apply-settings').addEventListener('click', () => {
            const intensity = document.getElementById('intensity-slider') ? 
                parseFloat(document.getElementById('intensity-slider').value) / 100 : defaultSettings.intensity;
                
            const zonesPerSide = document.getElementById('zones-select') ? 
                parseInt(document.getElementById('zones-select').value) : defaultSettings.zones_per_side;
                
            const blurAmount = document.getElementById('blur-slider') ? 
                parseInt(document.getElementById('blur-slider').value) : defaultSettings.blur_amount;
            
            // Atualiza as configurações no servidor via WebSocket
            if (typeof window.updateServerSettings === 'function') {
                window.updateServerSettings({
                    intensity: intensity,
                    zones_per_side: zonesPerSide,
                    blur_amount: blurAmount
                });
            }
            
            // Atualiza as configurações locais
            if (typeof window.updateAmbilightSettings === 'function') {
                window.updateAmbilightSettings({
                    intensity: intensity,
                    zonesPerSide: zonesPerSide,
                    blurAmount: blurAmount
                });
            }
        });
    }
    
    /**
     * Mostra uma notificação
     * (função global definida em player.js, mas declarada aqui para garantir)
     */
    if (typeof window.showNotification !== 'function') {
        window.showNotification = function(message, type = 'info') {
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
        };
    }
});