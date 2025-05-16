
/**
 * Player de vídeo para o Ambilight Player
 * Gerencia os controles e funcionalidades do player de vídeo
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
    const toggleAmbilight = document.getElementById('toggle-ambilight');
    const uploadArea = document.getElementById('upload-area');
    const fileUpload = document.getElementById('file-upload');
    const progressBarUpload = document.getElementById('progress-bar-upload');
    const progressText = document.getElementById('progress-text');
    const uploadContent = document.querySelector('.upload-content');
    const uploadProgress = document.getElementById('upload-progress');
    
    // Estado do player
    let isAmbilightActive = true;
    let hideControlsTimeout;
    let isUserInteracting = false;
    
    // Inicialização
    initPlayer();
    loadHistory();
    
    // Funções de inicialização
    function initPlayer() {
        // Carregar configurações
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                // Aplicar configurações
                document.getElementById('intensity-slider').value = settings.intensity * 100;
                document.getElementById('intensity-value').textContent = Math.round(settings.intensity * 100);
                document.getElementById('zones-select').value = settings.zones_per_side;
                document.getElementById('blur-slider').value = settings.blur_amount;
                document.getElementById('blur-value').textContent = settings.blur_amount;
            })
            .catch(error => {
                console.error('Erro ao carregar configurações:', error);
                showNotification('Erro ao carregar configurações', 'error');
            });
        
        // Adicionar event listeners
        addVideoEventListeners();
        addControlEventListeners();
        setupDragAndDrop();
    }
    
    // Carrega o histórico de vídeos
    function loadHistory() {
        fetch('/api/history')
            .then(response => response.json())
            .then(history => {
                const historyList = document.getElementById('history-list');
                
                // Limpa o histórico atual
                historyList.innerHTML = '';
                
                if (history.length === 0) {
                    historyList.innerHTML = `
                        <div class="text-gray-500 dark:text-gray-400 text-center p-4">
                            Nenhum vídeo reproduzido recentemente
                        </div>
                    `;
                    return;
                }
                
                // Adiciona cada item ao histórico
                history.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-lg w-12 h-12 flex items-center justify-center">
                            <i class="fas fa-film text-gray-500 dark:text-gray-400"></i>
                        </div>
                        <div class="flex-grow overflow-hidden">
                            <p class="font-medium truncate">${item.filename}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                ${new Date(item.last_played).toLocaleString()}
                            </p>
                        </div>
                    `;
                    
                    // Adiciona evento de clique para carregar o vídeo
                    historyItem.addEventListener('click', () => {
                        loadVideo(`/uploads/${item.filename.replace(/^.*[\\\/]/, '')}`);
                    });
                    
                    historyList.appendChild(historyItem);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar histórico:', error);
                showNotification('Erro ao carregar histórico', 'error');
            });
    }
    
    // Event listeners para o player de vídeo
    function addVideoEventListeners() {
        // Play/Pause no vídeo
        videoOverlay.addEventListener('click', togglePlayPause);
        
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
    
    // Event listeners para os controles do player
    function addControlEventListeners() {
        // Play/Pause
        playPauseBtn.addEventListener('click', togglePlayPause);
        
        // Mute/Unmute
        muteBtn.addEventListener('click', toggleMute);
        
        // Volume
        volumeSlider.addEventListener('input', () => {
            videoPlayer.volume = volumeSlider.value;
            updateVolumeIcon();
        });
        
        // Fullscreen
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        // Progresso do vídeo (barra de progresso)
        progressBar.addEventListener('input', () => {
            const seekTime = (progressBar.value / 100) * videoPlayer.duration;
            videoPlayer.currentTime = seekTime;
        });
        
        // Toggle Ambilight
        toggleAmbilight.addEventListener('click', () => {
            isAmbilightActive = !isAmbilightActive;
            toggleAmbilight.querySelector('i').classList.toggle('fa-lightbulb', isAmbilightActive);
            toggleAmbilight.querySelector('i').classList.toggle('fa-lightbulb-slash', !isAmbilightActive);
            
            const ambilightEffect = document.getElementById('ambilight-effect');
            if (isAmbilightActive) {
                videoContainer.classList.add('ambilight-active');
                ambilightEffect.style.display = 'block';
                socketConnection.emit('start_video_processing', { video_path: videoPlayer.getAttribute('data-path') });
            } else {
                videoContainer.classList.remove('ambilight-active');
                ambilightEffect.style.display = 'none';
                socketConnection.emit('stop_video_processing');
            }
        });
        
        // Configurações rápidas
        document.getElementById('apply-settings').addEventListener('click', () => {
            const intensity = document.getElementById('intensity-slider').value / 100;
            const zones = document.getElementById('zones-select').value;
            const blur = document.getElementById('blur-slider').value;
            
            const settings = {
                intensity: intensity,
                zones_per_side: parseInt(zones),
                blur_amount: parseInt(blur)
            };
            
            socketConnection.emit('update_settings', settings);
            showNotification('Configurações aplicadas', 'success');
        });
        
        // Atualizações ao vivo dos valores
        document.getElementById('intensity-slider').addEventListener('input', function() {
            document.getElementById('intensity-value').textContent = this.value;
        });
        
        document.getElementById('blur-slider').addEventListener('input', function() {
            document.getElementById('blur-value').textContent = this.value;
        });
        
        // Auto-hide dos controles
        videoContainer.addEventListener('mousemove', () => {
            const controlBar = document.querySelector('.control-bar');
            controlBar.style.opacity = '1';
            clearTimeout(hideControlsTimeout);
            
            if (!videoPlayer.paused && !isUserInteracting) {
                hideControlsTimeout = setTimeout(() => {
                    controlBar.style.opacity = '0';
                }, 3000);
            }
        });
        
        videoContainer.addEventListener('mouseleave', () => {
            if (!videoPlayer.paused && !isUserInteracting) {
                const controlBar = document.querySelector('.control-bar');
                controlBar.style.opacity = '0';
            }
        });
        
        // Evita que os controles se escondam durante interação
        const controls = document.querySelector('.control-bar');
        controls.addEventListener('mouseenter', () => {
            isUserInteracting = true;
        });
        
        controls.addEventListener('mouseleave', () => {
            isUserInteracting = false;
            if (!videoPlayer.paused) {
                hideControlsTimeout = setTimeout(() => {
                    controls.style.opacity = '0';
                }, 3000);
            }
        });
    }
    
    // Configuração de Drag and Drop para upload de vídeos
    function setupDragAndDrop() {
        // Evento de clique no botão de upload
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadVideo(file);
            }
        });
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Highlight drop area quando o arquivo é arrastado sobre ela
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('bg-gray-200', 'dark:bg-gray-700');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('bg-gray-200', 'dark:bg-gray-700');
            }, false);
        });
        
        // Manipula o drop
        uploadArea.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                uploadVideo(file);
            }
        }, false);
    }
    
    // Funções de controle do player
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
    
    function updatePlayPauseButton(isPlaying) {
        const icon = playPauseBtn.querySelector('i');
        const overlayIcon = playButton.querySelector('i');
        
        if (isPlaying) {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            overlayIcon.classList.remove('fa-play');
            overlayIcon.classList.add('fa-pause');
            playButton.style.opacity = '0';
        } else {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            overlayIcon.classList.remove('fa-pause');
            overlayIcon.classList.add('fa-play');
            playButton.style.opacity = '1';
        }
    }
    
    function toggleMute() {
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeIcon();
    }
    
    function updateVolumeIcon() {
        const icon = muteBtn.querySelector('i');
        icon.className = ''; // Remove todas as classes
        
        if (videoPlayer.muted || videoPlayer.volume === 0) {
            icon.classList.add('fas', 'fa-volume-mute');
            volumeSlider.value = 0;
        } else if (videoPlayer.volume < 0.5) {
            icon.classList.add('fas', 'fa-volume-down');
        } else {
            icon.classList.add('fas', 'fa-volume-up');
        }
    }
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                showNotification(`Erro ao entrar em tela cheia: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    function updateProgress() {
        if (!progressBar.getAttribute('max')) {
            progressBar.setAttribute('max', '100');
        }
        
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressBar.value = percentage;
        progressIndicator.style.width = `${percentage}%`;
        
        // Atualiza o tempo atual
        currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
    }
    
    function updateBuffer() {
        if (videoPlayer.buffered.length > 0) {
            const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
            const duration = videoPlayer.duration;
            const bufferedPercentage = (bufferedEnd / duration) * 100;
            
            bufferedBar.style.width = `${bufferedPercentage}%`;
        }
    }
    
    function updateDuration() {
        durationDisplay.textContent = formatTime(videoPlayer.duration);
    }
    
    // Upload de vídeo
    function uploadVideo(file) {
        // Verifica se o arquivo é um vídeo
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/avi'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('Formato de arquivo não suportado', 'error');
            return;
        }
        
        // Prepara o upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Exibe a barra de progresso
        uploadContent.style.display = 'none';
        uploadProgress.style.display = 'block';
        
        // Realiza o upload
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                progressBarUpload.style.width = percentComplete + '%';
                progressText.textContent = Math.round(percentComplete) + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                
                if (response.success) {
                    showNotification('Upload concluído com sucesso', 'success');
                    loadVideo(response.path);
                    
                    // Atualiza o histórico
                    loadHistory();
                } else {
                    showNotification(`Erro no upload: ${response.error}`, 'error');
                }
            } else {
                showNotification('Erro no upload do arquivo', 'error');
            }
            
            // Reseta a área de upload
            resetUploadArea();
        });
        
        xhr.addEventListener('error', () => {
            showNotification('Erro na conexão durante o upload', 'error');
            resetUploadArea();
        });
        
        xhr.addEventListener('abort', () => {
            showNotification('Upload cancelado', 'info');
            resetUploadArea();
        });
        
        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
    }
    
    function resetUploadArea() {
        uploadContent.style.display = 'block';
        uploadProgress.style.display = 'none';
        progressBarUpload.style.width = '0%';
        progressText.textContent = '0%';
        fileUpload.value = '';
    }
    
    // Carregar vídeo no player
    function loadVideo(path) {
        // Para qualquer processamento atual
        socketConnection.emit('stop_video_processing');
        
        // Atualiza a fonte do vídeo
        videoPlayer.innerHTML = `<source src="${path}" type="video/mp4">`;
        videoPlayer.setAttribute('data-path', path);
        videoPlayer.load();
        
        // Inicia o processamento Ambilight quando o vídeo estiver pronto
        videoPlayer.addEventListener('loadeddata', () => {
            if (isAmbilightActive) {
                socketConnection.emit('start_video_processing', { video_path: path });
            }
        }, { once: true });
        
        // Reseta os controles
        progressBar.value = 0;
        progressIndicator.style.width = '0%';
        bufferedBar.style.width = '0%';
        currentTimeDisplay.textContent = '0:00';
        durationDisplay.textContent = '0:00';
        
        // Mostra o container de vídeo
        videoContainer.style.display = 'block';
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
});