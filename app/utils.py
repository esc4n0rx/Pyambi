
"""
Funções utilitárias para o Ambilight Player
"""

import os
import re
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Union, Tuple

def sanitize_filename(filename: str) -> str:
    """
    Sanitiza um nome de arquivo removendo caracteres inválidos.
    
    Args:
        filename: Nome do arquivo a ser sanitizado
        
    Returns:
        Nome de arquivo sanitizado
    """
    # Remove caracteres não permitidos em nomes de arquivos
    sanitized = re.sub(r'[^\w\s.-]', '_', filename)
    return sanitized.strip()

def format_timestamp(timestamp: Union[float, datetime]) -> str:
    """
    Formata um timestamp para exibição.
    
    Args:
        timestamp: Timestamp como float (segundos desde epoch) ou objeto datetime
        
    Returns:
        String formatada
    """
    if isinstance(timestamp, float) or isinstance(timestamp, int):
        dt = datetime.fromtimestamp(timestamp)
    else:
        dt = timestamp
        
    return dt.strftime('%d/%m/%Y %H:%M:%S')

def human_readable_size(size_bytes: int) -> str:
    """
    Converte um tamanho em bytes para um formato legível por humanos.
    
    Args:
        size_bytes: Tamanho em bytes
        
    Returns:
        String formatada (ex: "2.5 MB")
    """
    if size_bytes == 0:
        return "0B"
        
    size_name = ("B", "KB", "MB", "GB", "TB", "PB")
    i = 0
    while size_bytes >= 1024 and i < len(size_name) - 1:
        size_bytes /= 1024
        i += 1
        
    return f"{size_bytes:.2f} {size_name[i]}"

def list_supported_videos(directory: str, supported_extensions: List[str]) -> List[Dict[str, Any]]:
    """
    Lista todos os vídeos suportados em um diretório.
    
    Args:
        directory: Diretório a ser verificado
        supported_extensions: Lista de extensões suportadas
        
    Returns:
        Lista de dicionários com informações sobre os vídeos
    """
    if not os.path.exists(directory):
        return []
        
    videos = []
    
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        
        # Verifica se é um arquivo regular e tem extensão suportada
        if os.path.isfile(filepath) and any(filename.lower().endswith(f".{ext}") for ext in supported_extensions):
            file_stats = os.stat(filepath)
            
            video_info = {
                'filename': filename,
                'path': filepath,
                'size': file_stats.st_size,
                'size_human': human_readable_size(file_stats.st_size),
                'modified': file_stats.st_mtime,
                'modified_human': format_timestamp(file_stats.st_mtime)
            }
            
            videos.append(video_info)
    
    # Ordena por data de modificação (mais recente primeiro)
    videos.sort(key=lambda x: x['modified'], reverse=True)
    
    return videos

def create_directory_if_not_exists(directory: str) -> bool:
    """
    Cria um diretório se ele não existir.
    
    Args:
        directory: Caminho do diretório
        
    Returns:
        True se o diretório foi criado ou já existe, False em caso de erro
    """
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
        return True
    except Exception as e:
        print(f"Erro ao criar diretório {directory}: {e}")
        return False

def get_file_extension(filename: str) -> str:
    """
    Obtém a extensão de um arquivo.
    
    Args:
        filename: Nome do arquivo
        
    Returns:
        Extensão do arquivo (sem o ponto)
    """
    return os.path.splitext(filename)[1][1:].lower()

class PerformanceTimer:
    """Classe para medir o tempo de execução de operações."""
    
    def __init__(self, name: str = "Operation"):
        """
        Inicializa o timer.
        
        Args:
            name: Nome da operação
        """
        self.name = name
        self.start_time = None
        
    def __enter__(self):
        """Inicia o timer."""
        self.start_time = time.time()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Finaliza o timer e imprime o tempo decorrido."""
        end_time = time.time()
        elapsed_time = end_time - self.start_time
        print(f"{self.name} completed in {elapsed_time:.4f} seconds")
        
    def elapsed(self) -> float:
        """
        Retorna o tempo decorrido desde o início do timer.
        
        Returns:
            Tempo decorrido em segundos
        """
        if self.start_time is None:
            return 0
        return time.time() - self.start_time

def clean_old_uploads(directory: str, max_age_days: int = 7, excluded_files: List[str] = None) -> int:
    """
    Remove arquivos antigos de um diretório.
    
    Args:
        directory: Diretório para limpar
        max_age_days: Idade máxima dos arquivos em dias
        excluded_files: Lista de arquivos a serem excluídos da limpeza
        
    Returns:
        Número de arquivos removidos
    """
    if not os.path.exists(directory):
        return 0
        
    if excluded_files is None:
        excluded_files = []
        
    now = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    count = 0
    
    for filename in os.listdir(directory):
        if filename in excluded_files:
            continue
            
        filepath = os.path.join(directory, filename)
        
        if os.path.isfile(filepath):
            file_age = now - os.path.getmtime(filepath)
            
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                    count += 1
                except Exception as e:
                    print(f"Erro ao remover arquivo {filepath}: {e}")
    
    return count

def is_video_format_supported(filename: str, supported_extensions: List[str]) -> bool:
    """
    Verifica se um formato de vídeo é suportado.
    
    Args:
        filename: Nome do arquivo
        supported_extensions: Lista de extensões suportadas
        
    Returns:
        True se o formato for suportado, False caso contrário
    """
    extension = get_file_extension(filename)
    return extension in supported_extensions

def get_video_dimensions(filepath: str) -> Tuple[int, int]:
    """
    Obtém as dimensões de um vídeo usando OpenCV.
    
    Args:
        filepath: Caminho para o arquivo de vídeo
        
    Returns:
        Tupla (largura, altura) do vídeo
    """
    try:
        import cv2
        video = cv2.VideoCapture(filepath)
        
        if not video.isOpened():
            return (0, 0)
            
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        video.release()
        return (width, height)
    except Exception as e:
        print(f"Erro ao obter dimensões do vídeo: {e}")
        return (0, 0)

def get_video_duration(filepath: str) -> float:
    """
    Obtém a duração de um vídeo em segundos usando OpenCV.
    
    Args:
        filepath: Caminho para o arquivo de vídeo
        
    Returns:
        Duração do vídeo em segundos
    """
    try:
        import cv2
        video = cv2.VideoCapture(filepath)
        
        if not video.isOpened():
            return 0.0
            
        # Obtém o FPS e o número total de frames
        fps = video.get(cv2.CAP_PROP_FPS)
        frame_count = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calcula a duração
        duration = frame_count / fps if fps > 0 else 0
        
        video.release()
        return duration
    except Exception as e:
        print(f"Erro ao obter duração do vídeo: {e}")
        return 0.0

def format_duration(seconds: float) -> str:
    """
    Formata uma duração em segundos para exibição.
    
    Args:
        seconds: Duração em segundos
        
    Returns:
        String formatada (ex: "1:23:45")
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"

def generate_video_thumbnail(input_file: str, output_file: str, time_offset: float = 5.0, size: Tuple[int, int] = (320, 180)) -> bool:
    """
    Gera uma miniatura de um vídeo usando OpenCV.
    
    Args:
        input_file: Caminho para o arquivo de vídeo
        output_file: Caminho para salvar a miniatura
        time_offset: Tempo em segundos para capturar o frame
        size: Tamanho da miniatura (largura, altura)
        
    Returns:
        True se a miniatura foi gerada com sucesso, False caso contrário
    """
    try:
        import cv2
        import numpy as np
        
        # Abre o vídeo
        cap = cv2.VideoCapture(input_file)
        
        if not cap.isOpened():
            return False
        
        # Obtém a duração do vídeo
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Limita o offset ao tamanho do vídeo
        if time_offset >= duration:
            time_offset = max(0, duration / 2)
        
        # Posiciona no frame desejado
        frame_position = int(fps * time_offset)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_position)
        
        # Lê o frame
        ret, frame = cap.read()
        
        if not ret:
            cap.release()
            return False
        
        # Redimensiona o frame
        thumbnail = cv2.resize(frame, size)
        
        # Salva a miniatura
        cv2.imwrite(output_file, thumbnail)
        
        cap.release()
        return True
    except Exception as e:
        print(f"Erro ao gerar miniatura do vídeo: {e}")
        return False