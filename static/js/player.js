/**
 * player.js - Versão corrigida
 * Corrige os erros de elementos nulos e melhora a integração com o efeito Ambilight
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do player
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');
    const videoOverlay = document.getElementById('video-overlay');
    const playButton = document.getElementById('play-button');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const muteBtn = document.getElementById('mute-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressIndicator = document.getElementById('progress-indicator');
    const bufferedBar = document.getElementById('buffered-bar');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings');
    
    // Verificar elementos críticos antes de prosseguir
    if (!videoPlayer || !videoContainer) {
        console.error('Elementos críticos do player não encontrados!');
        return; // Sai da função se elementos críticos não existirem
    }

    // Estado do player
    let isAmbilightActive = true;
    let hideControlsTimeout;
    let isUserInteracting = false;
    
    // Inicialização
    initPlayer();
    
    // Funções de inicialização
    function initPlayer() {
        console.log("Inicializando player de vídeo...");
        
        // Carregar configurações com verificação de elementos
        loadSettings();
        
        // Adicionar event listeners apenas se os elementos existirem
        addVideoEventListeners();
        addControlEventListeners();
        
        // Iniciar o processamento Ambilight se o vídeo tiver um caminho definido
        if (videoPlayer && videoPlayer.getAttribute('data-path')) {
            // Delay para garantir que o WebSocket esteja conectado
            setTimeout(() => {
                if (typeof window.startVideoProcessing === 'function') {
                    window.startVideoProcessing(videoPlayer.getAttribute('data-path'));
                    console.log("Iniciando processamento Ambilight para:", videoPlayer.getAttribute('data-path'));
                } else {
                    console.error("Função startVideoProcessing não disponível");
                }
            }, 1000);
        }
    }
    
    // Carrega as configurações com segurança
    function loadSettings() {
        try {
            fetch('/api/settings')
                .then(response => response.json())
                .then(settings => {
                    // Aplicar configurações com verificações de null
                    const intensitySlider = document.getElementById('intensity-slider');
                    const intensityValue = document.getElementById('intensity-value');
                    const zonesSelect = document.getElementById('zones-select');
                    const blurSlider = document.getElementById('blur-slider');
                    const blurValue = document.getElementById('blur-value');
                    
                    if (intensitySlider) intensitySlider.value = settings.intensity * 100;
                    if (intensityValue) intensityValue.textContent = Math.round(settings.intensity * 100);
                    if (zonesSelect) zonesSelect.value = settings.zones_per_side;
                    if (blurSlider) blurSlider.value = settings.blur_amount;
                    if (blurValue) blurValue.textContent = settings.blur_amount;
                    
                    console.log("Configurações carregadas com sucesso");
                })
                .catch(error => {
                    console.error('Erro ao carregar configurações:', error);
                    showNotification('Erro ao carregar configurações', 'error');
                });
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
        }
    }
    
    // Event listeners para o player de vídeo
    function addVideoEventListeners() {
        if (!videoPlayer) return;
        
        // Play/Pause no vídeo (com verificação de overlay)
        if (videoOverlay) {
            videoOverlay.addEventListener('click', togglePlayPause);
        }
        
        // Atualiza a barra de progresso enquanto o vídeo é reproduzido
        videoPlayer.addEventListener('timeupdate', updateProgress);
        
        // Atualiza o buffer
        videoPlayer.addEventListener('progress', updateBuffer);
        
        // Quando o vídeo está pronto
        videoPlayer.addEventListener('loadedmetadata', () => {
            updateDuration();
            
            // Auto-play se configurado
            fetch('/api/settings')
                .then(response => response.json())
                .then(settings => {
                    if (settings.autoplay) {
                        videoPlayer.play()
                            .then(() => {
                                updatePlayPauseButton(true);
                            })
                            .catch(error => {
                                console.error('Autoplay falhou:', error);
                            });
                    }
                });
        });
        
        // Quando o vídeo termina
        videoPlayer.addEventListener('ended', () => {
            videoPlayer.currentTime = 0;
            updatePlayPauseButton(false);
        });
        
        // Quando ocorre um erro no vídeo
        videoPlayer.addEventListener('error', () => {
            showNotification('Erro ao reproduzir o vídeo', 'error');
        });
    }
    
    // Event listeners para os controles do player, com verificações
    function addControlEventListeners() {
        // Play/Pause (com verificação)
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }
        
        // Mute/Unmute (com verificação)
        if (muteBtn) {
            muteBtn.addEventListener('click', toggleMute);
        }
        
        // Volume (com verificação)
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                if (videoPlayer) {
                    videoPlayer.volume = volumeSlider.value;
                    updateVolumeIcon();
                }
            });
        }
        
        // Fullscreen (com verificação)
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Progresso do vídeo (com verificação)
        if (progressBar) {
            progressBar.addEventListener('input', () => {
                if (videoPlayer) {
                    const seekTime = (progressBar.value / 100) * videoPlayer.duration;
                    videoPlayer.currentTime = seekTime;
                }
            });
        }
        
        // Abrir/fechar painel de configurações
        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                settingsPanel.classList.toggle('visible');
            });
        }
        
        if (closeSettingsBtn && settingsPanel) {
            closeSettingsBtn.addEventListener('click', () => {
                settingsPanel.classList.remove('visible');
            });
        }
        
        // Aplicar configurações
        const applySettingsBtn = document.getElementById('apply-settings');
        if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', applySettings);
        }
        
        // Atualizações ao vivo dos valores com verificações
        const intensitySlider = document.getElementById('intensity-slider');
        const intensityValue = document.getElementById('intensity-value');
        if (intensitySlider && intensityValue) {
            intensitySlider.addEventListener('input', function() {
                intensityValue.textContent = this.value;
            });
        }
        
        const blurSlider = document.getElementById('blur-slider');
        const blurValue = document.getElementById('blur-value');
        if (blurSlider && blurValue) {
            blurSlider.addEventListener('input', function() {
                blurValue.textContent = this.value;
            });
        }
        
        // Auto-hide dos controles (com verificação)
        if (videoContainer) {
            const controlBar = document.querySelector('.control-bar');
            if (controlBar) {
                videoContainer.addEventListener('mousemove', () => {
                    controlBar.style.opacity = '1';
                    clearTimeout(hideControlsTimeout);
                    
                    if (videoPlayer && !videoPlayer.paused && !isUserInteracting) {
                        hideControlsTimeout = setTimeout(() => {
                            controlBar.style.opacity = '0';
                        }, 3000);
                    }
                });
                
                videoContainer.addEventListener('mouseleave', () => {
                    if (videoPlayer && !videoPlayer.paused && !isUserInteracting) {
                        controlBar.style.opacity = '0';
                    }
                });
                
                // Evita que os controles se escondam durante interação
                controlBar.addEventListener('mouseenter', () => {
                    isUserInteracting = true;
                });
                
                controlBar.addEventListener('mouseleave', () => {
                    isUserInteracting = false;
                    if (videoPlayer && !videoPlayer.paused) {
                        hideControlsTimeout = setTimeout(() => {
                            controlBar.style.opacity = '0';
                        }, 3000);
                    }
                });
            }
        }
    }
    
    // Aplicar configurações ao efeito Ambilight
    function applySettings() {
        const intensitySlider = document.getElementById('intensity-slider');
        const zonesSelect = document.getElementById('zones-select');
        const blurSlider = document.getElementById('blur-slider');
        
        const settings = {
            intensity: intensitySlider ? parseFloat(intensitySlider.value) / 100 : 1.0,
            zones_per_side: zonesSelect ? parseInt(zonesSelect.value) : 10,
            blur_amount: blurSlider ? parseInt(blurSlider.value) : 15
        };
        
        console.log("Aplicando configurações:", settings);
        
        // Enviar configurações para o servidor via WebSocket
        if (typeof window.updateServerSettings === 'function') {
            window.updateServerSettings(settings);
        }
        
        // Atualizar API Ambilight se disponível
        if (window.ambilightAPI) {
            window.ambilightAPI.setIntensity(settings.intensity);
            window.ambilightAPI.setZones(settings.zones_per_side);
            window.ambilightAPI.setBlur(settings.blur_amount);
            window.ambilightAPI.refreshEffect();
        }
        
        // Salvar configurações no servidor
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
    
    // Funções de controle do player
    function togglePlayPause() {
        if (!videoPlayer) return;
        
        if (videoPlayer.paused) {
            videoPlayer.play()
                .then(() => {
                    updatePlayPauseButton(true);
                })
                .catch(error => {
                    console.error('Play falhou:', error);
                    showNotification('Não foi possível reproduzir o vídeo', 'error');
                });
        } else {
            videoPlayer.pause();
            updatePlayPauseButton(false);
        }
    }
    
    function updatePlayPauseButton(isPlaying) {
        // Verificar elementos antes de tentar atualizá-los
        const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
        const overlayIcon = playButton ? playButton.querySelector('i') : null;
        
        if (playPauseIcon) {
            if (isPlaying) {
                playPauseIcon.className = 'fas fa-pause';
            } else {
                playPauseIcon.className = 'fas fa-play';
            }
        }
        
        if (overlayIcon) {
            if (isPlaying) {
                overlayIcon.className = 'fas fa-pause';
                playButton.style.opacity = '0';
            } else {
                overlayIcon.className = 'fas fa-play';
                playButton.style.opacity = '1';
            }
        }
    }
    
    function toggleMute() {
        if (!videoPlayer) return;
        
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeIcon();
    }
    
    function updateVolumeIcon() {
        if (!muteBtn || !videoPlayer) return;
        
        const icon = muteBtn.querySelector('i');
        if (!icon) return;
        
        icon.className = ''; // Remove todas as classes
        
        if (videoPlayer.muted || videoPlayer.volume === 0) {
            icon.classList.add('fas', 'fa-volume-mute');
            if (volumeSlider) volumeSlider.value = 0;
        } else if (videoPlayer.volume < 0.5) {
            icon.classList.add('fas', 'fa-volume-down');
        } else {
            icon.classList.add('fas', 'fa-volume-up');
        }
    }
    
    function toggleFullscreen() {
        if (!videoContainer) return;
        
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                showNotification(`Erro ao entrar em tela cheia: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    function updateProgress() {
        if (!videoPlayer || !progressBar || !progressIndicator) return;
        
        if (!progressBar.getAttribute('max')) {
            progressBar.setAttribute('max', '100');
        }
        
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressBar.value = percentage;
        progressIndicator.style.width = `${percentage}%`;
        
        // Atualiza o tempo atual
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
        }
    }
    
    function updateBuffer() {
        if (!videoPlayer || !bufferedBar) return;
        
        if (videoPlayer.buffered.length > 0) {
            const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
            const duration = videoPlayer.duration;
            const bufferedPercentage = (bufferedEnd / duration) * 100;
            
            bufferedBar.style.width = `${bufferedPercentage}%`;
        }
    }
    
    function updateDuration() {
        if (!videoPlayer || !durationDisplay) return;
        
        durationDisplay.textContent = formatTime(videoPlayer.duration);
    }
    
    // Funções utilitárias
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Sistema de notificações
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
    
    // Debug info
    console.log("Player inicializado:", {
        videoContainer: !!videoContainer,
        videoPlayer: !!videoPlayer,
        progressBar: !!progressBar,
        controlBar: !!document.querySelector('.control-bar')
    });
});