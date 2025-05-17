/**
 * player.js
 * Controlador do player de vídeo com integração ao efeito Ambilight
 * Versão corrigida para garantir compatibilidade com o efeito Ambilight
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Inicializando player de vídeo...");
    
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
    
    // Verificar elementos críticos
    if (!videoPlayer || !videoContainer) {
        console.error('Elementos críticos do player não encontrados!');
        return;
    }

    // Estado do player
    let isUserInteracting = false;
    let hideControlsTimeout;
    
    // Inicialização
    initPlayer();
    
    /**
     * Inicializa o player de vídeo
     */
    function initPlayer() {
        console.log("Inicializando player de vídeo...");
        
        // Adicionar event listeners
        addVideoEventListeners();
        addControlEventListeners();
        
        // Carregar configurações de autoplay
        loadAutoplaySetting();
        
        console.log("Player de vídeo inicializado");
    }
    
    /**
     * Carrega configuração de autoplay
     */
    function loadAutoplaySetting() {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.autoplay && videoPlayer) {
                    // Tentar autoplay quando o vídeo estiver pronto
                    videoPlayer.addEventListener('loadedmetadata', () => {
                        videoPlayer.play()
                            .then(() => {
                                updatePlayPauseButton(true);
                            })
                            .catch(error => {
                                console.error('Autoplay falhou:', error);
                                showNotification('Autoplay bloqueado pelo navegador. Clique para reproduzir.', 'info');
                            });
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar configurações:', error);
            });
    }
    
    /**
     * Adiciona event listeners ao vídeo
     */
    function addVideoEventListeners() {
        // Play/Pause no clique
        if (videoOverlay) {
            videoOverlay.addEventListener('click', togglePlayPause);
        }
        
        // Atualiza a barra de progresso
        videoPlayer.addEventListener('timeupdate', updateProgress);
        
        // Atualiza o buffer
        videoPlayer.addEventListener('progress', updateBuffer);
        
        // Metadados carregados
        videoPlayer.addEventListener('loadedmetadata', () => {
            updateDuration();
        });
        
        // Vídeo terminou
        videoPlayer.addEventListener('ended', () => {
            videoPlayer.currentTime = 0;
            updatePlayPauseButton(false);
        });
        
        // Erro no vídeo
        videoPlayer.addEventListener('error', (e) => {
            console.error('Erro no vídeo:', e);
            showNotification('Erro ao reproduzir o vídeo', 'error');
        });
    }
    
    /**
     * Adiciona event listeners aos controles
     */
    function addControlEventListeners() {
        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }
        
        // Mute/Unmute
        if (muteBtn) {
            muteBtn.addEventListener('click', toggleMute);
        }
        
        // Volume
        if (volumeSlider) {
            volumeSlider.addEventListener('input', () => {
                videoPlayer.volume = volumeSlider.value;
                updateVolumeIcon();
            });
        }
        
        // Fullscreen
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Barra de progresso
        if (progressBar) {
            // Atualizar a posição no clique
            progressBar.addEventListener('input', () => {
                const seekTime = (progressBar.value / 100) * videoPlayer.duration;
                videoPlayer.currentTime = seekTime;
            });
        }
        
        // Auto-hide dos controles
        setupControlsVisibility();
    }
    
    /**
     * Configurar visibilidade automática dos controles
     */
    function setupControlsVisibility() {
        const controlBar = document.querySelector('.control-bar');
        if (!controlBar || !videoContainer) return;
        
        // Mostrar controles no mousemove
        videoContainer.addEventListener('mousemove', () => {
            controlBar.style.opacity = '1';
            clearTimeout(hideControlsTimeout);
            
            // Esconder após 3 segundos se não estiver pausado e não estiver interagindo
            if (!videoPlayer.paused && !isUserInteracting) {
                hideControlsTimeout = setTimeout(() => {
                    controlBar.style.opacity = '0';
                }, 3000);
            }
        });
        
        // Esconder quando o cursor sair do container
        videoContainer.addEventListener('mouseleave', () => {
            if (!videoPlayer.paused && !isUserInteracting) {
                controlBar.style.opacity = '0';
            }
        });
        
        // Quando interagir com os controles, não esconder
        controlBar.addEventListener('mouseenter', () => {
            isUserInteracting = true;
            clearTimeout(hideControlsTimeout);
        });
        
        controlBar.addEventListener('mouseleave', () => {
            isUserInteracting = false;
            if (!videoPlayer.paused) {
                hideControlsTimeout = setTimeout(() => {
                    controlBar.style.opacity = '0';
                }, 3000);
            }
        });
    }
    
    /**
     * Alterna entre reproduzir e pausar o vídeo
     */
    function togglePlayPause() {
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
    
    /**
     * Atualiza o botão de play/pause
     * @param {boolean} isPlaying - Indica se o vídeo está sendo reproduzido
     */
    function updatePlayPauseButton(isPlaying) {
        // Atualizar ícone do botão de play/pause
        const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
        if (playPauseIcon) {
            playPauseIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
        
        // Atualizar ícone do overlay central
        const overlayIcon = playButton ? playButton.querySelector('i') : null;
        if (overlayIcon) {
            overlayIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
        
        // Mostrar/esconder o botão central
        if (playButton) {
            playButton.style.opacity = isPlaying ? '0' : '1';
        }
        
        // Atualizar efeito Ambilight
        if (isPlaying) {
            if (document.getElementById('ambilight-effect')) {
                document.getElementById('ambilight-effect').classList.remove('pulse-animation');
            }
        } else {
            if (document.getElementById('ambilight-effect')) {
                document.getElementById('ambilight-effect').classList.add('pulse-animation');
            }
        }
    }
    
    /**
     * Alterna mudo/som no vídeo
     */
    function toggleMute() {
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeIcon();
    }
    
    /**
     * Atualiza o ícone de volume
     */
    function updateVolumeIcon() {
        if (!muteBtn) return;
        
        const icon = muteBtn.querySelector('i');
        if (!icon) return;
        
        icon.className = '';
        
        if (videoPlayer.muted || videoPlayer.volume === 0) {
            icon.classList.add('fas', 'fa-volume-mute');
            if (volumeSlider) volumeSlider.value = 0;
        } else if (videoPlayer.volume < 0.5) {
            icon.classList.add('fas', 'fa-volume-down');
        } else {
            icon.classList.add('fas', 'fa-volume-up');
        }
    }
    
    /**
     * Alterna tela cheia
     */
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                showNotification(`Erro ao entrar em tela cheia: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Atualiza a barra de progresso
     */
    function updateProgress() {
        if (!videoPlayer.duration) return;
        
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        
        if (progressBar) progressBar.value = percentage;
        if (progressIndicator) progressIndicator.style.width = `${percentage}%`;
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
    }
    
    /**
     * Atualiza a barra de buffer
     */
    function updateBuffer() {
        if (!videoPlayer.buffered.length || !bufferedBar) return;
        
        const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
        const duration = videoPlayer.duration;
        if (duration > 0) {
            const bufferedPercentage = (bufferedEnd / duration) * 100;
            bufferedBar.style.width = `${bufferedPercentage}%`;
        }
    }
    
    /**
     * Atualiza o display de duração
     */
    function updateDuration() {
        if (durationDisplay && !isNaN(videoPlayer.duration)) {
            durationDisplay.textContent = formatTime(videoPlayer.duration);
        }
    }
    
    /**
     * Formata o tempo em segundos para MM:SS
     * @param {number} seconds - Tempo em segundos
     * @returns {string} Tempo formatado
     */
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Sistema de notificações global
    window.showNotification = function(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        if (!notifications) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        
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
});