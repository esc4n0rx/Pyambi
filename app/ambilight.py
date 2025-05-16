
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
import time

class AmbilightProcessor:
    """
    Classe responsável por processar frames de vídeo e extrair cores das bordas
    para criar o efeito Ambilight.
    """
    
    def __init__(self, zones_per_side: int = 10, intensity: float = 1.0, blur_amount: int = 15):
        """
        Inicializa o processador Ambilight.
        
        Args:
            zones_per_side: Número de zonas por lado do vídeo
            intensity: Intensidade do efeito (0.0 - 1.0)
            blur_amount: Quantidade de desfoque em pixels
        """
        self.zones_per_side = zones_per_side
        self.intensity = intensity
        self.blur_amount = blur_amount
        self.frame_cache = {}
        self.last_processed_time = 0
        self.processing_interval = 1 / 30  # Processa no máximo 30 frames por segundo
    
    def extract_border_colors(self, frame: np.ndarray) -> Dict[str, List[List[int]]]:
        """
        Extrai as cores das bordas de um frame de vídeo.
        
        Args:
            frame: Frame do vídeo em formato numpy array (BGR)
            
        Returns:
            Dicionário com as cores médias para cada borda (top, right, bottom, left)
            Cada cor é representada como [R, G, B]
        """
        # Verifica se já processamos recentemente para evitar sobrecarga
        current_time = time.time()
        if current_time - self.last_processed_time < self.processing_interval:
            # Retorna o último resultado se tiver processado recentemente
            if hasattr(self, 'last_result'):
                return self.last_result
        
        self.last_processed_time = current_time
        
        # Converte de BGR para RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        height, width = frame.shape[:2]
        
        # Define a largura da borda para análise (5% da dimensão)
        border_width_v = max(1, int(height * 0.05))  # Vertical (top/bottom)
        border_width_h = max(1, int(width * 0.05))   # Horizontal (left/right)
        
        # Extrai as regiões de borda
        top_border = frame_rgb[:border_width_v, :]
        bottom_border = frame_rgb[height - border_width_v:, :]
        left_border = frame_rgb[:, :border_width_h]
        right_border = frame_rgb[:, width - border_width_h:]
        
        # Calcula as cores médias para cada zona
        result = {
            'top': self._calculate_zone_colors(top_border, self.zones_per_side, horizontal=True),
            'right': self._calculate_zone_colors(right_border, self.zones_per_side, horizontal=False),
            'bottom': self._calculate_zone_colors(bottom_border, self.zones_per_side, horizontal=True),
            'left': self._calculate_zone_colors(left_border, self.zones_per_side, horizontal=False)
        }
        
        # Aplica a intensidade do efeito
        if self.intensity < 1.0:
            for side in result:
                for i, color in enumerate(result[side]):
                    result[side][i] = [int(c * self.intensity) for c in color]
        
        # Armazena o resultado para uso em cache
        self.last_result = result
        return result
    
    def _calculate_zone_colors(self, border: np.ndarray, num_zones: int, horizontal: bool) -> List[List[int]]:
        """
        Calcula as cores médias para cada zona de uma borda.
        
        Args:
            border: Região da borda como numpy array
            num_zones: Número de zonas a dividir
            horizontal: Se True, divide horizontalmente, caso contrário, verticalmente
            
        Returns:
            Lista de cores médias [R, G, B] para cada zona
        """
        height, width = border.shape[:2]
        zone_colors = []
        
        if horizontal:
            # Divide a borda horizontalmente
            zone_width = width // num_zones
            for i in range(num_zones):
                start_x = i * zone_width
                end_x = start_x + zone_width if i < num_zones - 1 else width
                zone = border[:, start_x:end_x]
                avg_color = self._average_color(zone)
                zone_colors.append(avg_color)
        else:
            # Divide a borda verticalmente
            zone_height = height // num_zones
            for i in range(num_zones):
                start_y = i * zone_height
                end_y = start_y + zone_height if i < num_zones - 1 else height
                zone = border[start_y:end_y, :]
                avg_color = self._average_color(zone)
                zone_colors.append(avg_color)
        
        return zone_colors
    
    def _average_color(self, region: np.ndarray) -> List[int]:
        """
        Calcula a cor média de uma região.
        
        Args:
            region: Região como numpy array
            
        Returns:
            Cor média [R, G, B]
        """
        avg_color = np.mean(region, axis=(0, 1)).astype(int).tolist()
        return avg_color
    
    def set_zones_per_side(self, zones: int) -> None:
        """Altera o número de zonas por lado."""
        self.zones_per_side = max(1, min(zones, 30))  # Limita entre 1 e 30
        
    def set_intensity(self, intensity: float) -> None:
        """Altera a intensidade do efeito."""
        self.intensity = max(0.0, min(intensity, 1.0))  # Limita entre 0.0 e 1.0
        
    def set_blur_amount(self, blur: int) -> None:
        """Altera a quantidade de desfoque."""
        self.blur_amount = max(0, min(blur, 50))  # Limita entre 0 e 50

# Função de teste
def test_processor():
    """Testa o processador com uma imagem simples."""
    # Cria uma imagem de teste
    test_frame = np.zeros((300, 400, 3), dtype=np.uint8)
    # Adiciona cores diferentes nas bordas
    test_frame[0:30, :] = [0, 0, 255]  # Top: vermelho
    test_frame[-30:, :] = [0, 255, 0]  # Bottom: verde
    test_frame[:, 0:30] = [255, 0, 0]  # Left: azul
    test_frame[:, -30:] = [255, 255, 0]  # Right: amarelo
    
    processor = AmbilightProcessor(zones_per_side=5)
    colors = processor.extract_border_colors(test_frame)
    
    print("Cores extraídas:")
    for side, colors_list in colors.items():
        print(f"{side}: {colors_list}")
    
    return colors

if __name__ == "__main__":
    test_processor()