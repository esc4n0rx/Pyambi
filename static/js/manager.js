/**
 * manager.js
 * Script para gerenciar a biblioteca de vídeos e histórico na página inicial
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const uploadArea = document.getElementById('upload-area');
    const fileUpload = document.getElementById('file-upload');
    const progressBarUpload = document.getElementById('progress-bar-upload');
    const progressText = document.getElementById('progress-text');
    const uploadContent = document.querySelector('.upload-content');
    const uploadProgress = document.getElementById('upload-progress');
    const videosGrid = document.getElementById('videos-grid');
    const historyList = document.getElementById('history-list');
    const searchInput = document.getElementById('search-videos');
    
    // Templates
    const videoItemTemplate = document.getElementById('video-item-template');
    const historyItemTemplate = document.getElementById('history-item-template');
    
    // Inicialização
    init();
    
    /**
     * Função de inicialização
     */
    function init() {
        // Configurar upload de vídeos
        setupUpload();
        
        // Carregar biblioteca de vídeos
        loadVideos();
        
        // Carregar histórico
        loadHistory();
        
        // Configurar pesquisa
        setupSearch();
    }
    
    /**
     * Configura o upload de vídeos
     */
    function setupUpload() {
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Highlight na área de drop
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('border-primary');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('border-primary');
            });
        });
        
        // Drop de arquivo
        uploadArea.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file) {
                uploadVideo(file);
            }
        });
        
        // Seleção de arquivo no input
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadVideo(file);
            }
        });
    }

    /**
 * Faz upload de um vídeo usando chunks
 * @param {File} file - Arquivo a ser enviado
 */
async function uploadVideoInChunks(file) {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileName = file.name;
    const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Exibir barra de progresso
    uploadContent.style.display = 'none';
    uploadProgress.style.display = 'block';
    
    try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            
            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('fileName', fileName);
            formData.append('fileId', fileId);
            formData.append('chunkIndex', chunkIndex);
            formData.append('totalChunks', totalChunks);
            
            const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Erro no chunk ${chunkIndex}`);
            }
            
            // Atualizar progresso
            const progress = ((chunkIndex + 1) / totalChunks) * 100;
            progressBarUpload.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }
        
        // Finalizar upload
        const finalizeResponse = await fetch('/api/finalize-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, fileName })
        });
        
        const result = await finalizeResponse.json();
        
        if (result.success) {
            showNotification('Upload concluído com sucesso', 'success');
            if (confirm('Deseja reproduzir o vídeo agora?')) {
                window.location.href = `/player/${encodeURIComponent(result.filename)}`;
            }
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Erro no upload:', error);
        showNotification(`Erro no upload: ${error.message}`, 'error');
    } finally {
        resetUploadArea();
    }
}
    
    /**
     * Configura a funcionalidade de pesquisa
     */
    function setupSearch() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                const videoItems = videosGrid.querySelectorAll('.video-item');
                
                videoItems.forEach(item => {
                    const videoName = item.querySelector('.video-name').textContent.toLowerCase();
                    if (videoName.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }
    
    /**
     * Carrega a biblioteca de vídeos
     */
    function loadVideos() {
        // Limpar lista existente
        if (videosGrid) {
            videosGrid.innerHTML = '<div class="text-center p-4 col-span-full"><i class="fas fa-spinner fa-spin text-2xl text-primary mb-2"></i><p>Carregando vídeos...</p></div>';
        }
        
        // Fazer requisição à API
        fetch('/api/videos')
            .then(response => response.json())
            .then(videos => {
                if (videosGrid) {
                    // Limpar mensagem de loading
                    videosGrid.innerHTML = '';
                    
                    if (videos.length === 0) {
                        videosGrid.innerHTML = '<div class="text-center p-4 col-span-full text-gray-500 dark:text-gray-400"><i class="fas fa-film-slash text-3xl mb-2"></i><p>Nenhum vídeo encontrado</p></div>';
                        return;
                    }
                    
                    // Adicionar cada vídeo
                    videos.forEach(video => {
                        addVideoItem(video);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar vídeos:', error);
                if (videosGrid) {
                    videosGrid.innerHTML = '<div class="text-center p-4 col-span-full text-red-500"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p>Erro ao carregar vídeos</p></div>';
                }
                showNotification('Erro ao carregar biblioteca de vídeos', 'error');
            });
    }
    
    /**
     * Adiciona um item de vídeo ao grid
     * @param {Object} video - Dados do vídeo
     */
    function addVideoItem(video) {
        if (!videoItemTemplate || !videosGrid) return;
        
        // Clonar template
        const clone = document.importNode(videoItemTemplate.content, true);
        const videoItem = clone.querySelector('.video-item');
        
        // Preencher dados
        videoItem.querySelector('.video-name').textContent = video.filename;
        videoItem.querySelector('.video-date').textContent = formatDate(video.modified);
        videoItem.querySelector('.video-size').textContent = video.size_human;
        
        // Verificar se há miniatura
        if (video.thumbnail) {
            const thumbnail = videoItem.querySelector('.thumbnail');
            thumbnail.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = video.thumbnail;
            img.alt = video.filename;
            img.className = 'w-full h-full object-cover';
            
            thumbnail.appendChild(img);
        }
        
        // Adicionar evento de clique
        videoItem.addEventListener('click', () => {
            // Redirecionar para a página do player
            window.location.href = `/player/${encodeURIComponent(video.filename)}`;
        });
        
        // Adicionar ao grid
        videosGrid.appendChild(videoItem);
    }
    
    /**
     * Carrega o histórico de reprodução
     */
    function loadHistory() {
        // Limpar lista existente
        if (historyList) {
            historyList.innerHTML = '<div class="text-center p-4"><i class="fas fa-spinner fa-spin mr-2"></i>Carregando histórico...</div>';
        }
        
        // Fazer requisição à API
        fetch('/api/history')
            .then(response => response.json())
            .then(history => {
                if (historyList) {
                    // Limpar mensagem de loading
                    historyList.innerHTML = '';
                    
                    if (history.length === 0) {
                        historyList.innerHTML = '<div class="text-center p-4 text-gray-500 dark:text-gray-400">Nenhum vídeo reproduzido recentemente</div>';
                        return;
                    }
                    
                    // Adicionar cada item ao histórico
                    history.forEach(item => {
                        addHistoryItem(item);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar histórico:', error);
                if (historyList) {
                    historyList.innerHTML = '<div class="text-center p-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Erro ao carregar histórico</div>';
                }
                showNotification('Erro ao carregar histórico', 'error');
            });
    }
    
    /**
     * Adiciona um item ao histórico
     * @param {Object} item - Dados do item do histórico
     */
    function addHistoryItem(item) {
        if (!historyItemTemplate || !historyList) return;
        
        // Clonar template
        const clone = document.importNode(historyItemTemplate.content, true);
        const historyItem = clone.querySelector('.history-item');
        
        // Preencher dados
        historyItem.querySelector('.history-name').textContent = item.filename;
        historyItem.querySelector('.history-date').textContent = formatDate(new Date(item.last_played));
        
        // Configurar botão de reprodução
        const playBtn = historyItem.querySelector('.play-history-btn');
        playBtn.href = `/player/${encodeURIComponent(item.filename)}`;
        
        // Adicionar evento de clique para o item inteiro
        historyItem.addEventListener('click', (e) => {
            // Não fazer nada se o clique foi no botão
            if (e.target === playBtn || playBtn.contains(e.target)) {
                return;
            }
            
            // Redirecionar para a página do player
            window.location.href = `/player/${encodeURIComponent(item.filename)}`;
        });
        
        // Adicionar à lista
        historyList.appendChild(historyItem);
    }
    
    /**
     * Faz upload de um vídeo
     * @param {File} file - Arquivo a ser enviado
     */
    function uploadVideo(file) {
        // Verificar tamanho do arquivo
        const maxSize = 50 * 1024 * 1024 * 1024; // 50GB limite
        
        if (file.size > maxSize) {
            showNotification('Arquivo muito grande. Máximo: 50GB', 'error');
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            uploadVideoInChunks(file);
        } else {
            // Upload tradicional para arquivos pequenos
            uploadVideoTraditional(file);
        }
        
        // Exibir barra de progresso
        uploadContent.style.display = 'none';
        uploadProgress.style.display = 'block';
        
        // Criar FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Enviar arquivo
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
                    
                    // Perguntar se deseja reproduzir agora
                    if (confirm('Deseja reproduzir o vídeo agora?')) {
                        window.location.href = `/player/${encodeURIComponent(response.filename)}`;
                    } else {
                        // Recarregar a biblioteca de vídeos
                        loadVideos();
                        
                        // Recarregar o histórico
                        loadHistory();
                    }
                } else {
                    showNotification(`Erro no upload: ${response.error}`, 'error');
                }
            } else {
                showNotification('Erro no servidor durante o upload', 'error');
            }
            
            // Resetar a área de upload
            resetUploadArea();
        });
        
        xhr.addEventListener('error', () => {
            showNotification('Erro de conexão durante o upload', 'error');
            resetUploadArea();
        });
        
        xhr.addEventListener('abort', () => {
            showNotification('Upload cancelado', 'info');
            resetUploadArea();
        });
        
        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
    }
    
    /**
     * Reseta a área de upload
     */
    function resetUploadArea() {
        uploadContent.style.display = 'block';
        uploadProgress.style.display = 'none';
        progressBarUpload.style.width = '0%';
        progressText.textContent = '0%';
        fileUpload.value = '';
    }
    
    /**
     * Formata uma data para exibição
     * @param {Date|string|number} date - Data a ser formatada
     * @returns {string} Data formatada
     */
    function formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Mostra uma notificação
     * @param {string} message - Mensagem da notificação
     * @param {string} type - Tipo da notificação (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
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
});