"""
Gerenciamento de WebSockets para o Ambilight Player
"""

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import threading
import time
import cv2
import numpy as np
import os
from typing import Dict, Any, Optional

# Será inicializado na aplicação principal
socketio = None

# Registro de conexões ativas
active_connections = {}

# Threads de processamento ativas
processing_threads = {}

# Eventos para controlar threads
stop_events = {}

def init_socketio(app):
    """
    Inicializa o Socket.IO com a aplicação Flask.
    
    Args:
        app: Aplicação Flask
        
    Returns:
        Instância do SocketIO
    """
    global socketio
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
    
    # Configurar eventos do Socket.IO
    configure_events()
    
    return socketio

def configure_events():
    """Configura os eventos do Socket.IO."""
    
    @socketio.on('connect')
    def handle_connect():
        """Manipula nova conexão WebSocket."""
        client_id = request.sid
        active_connections[client_id] = {
            'connected_at': time.time(),
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown'),
            'processing': False
        }
        print(f"Cliente conectado: {client_id} ({request.remote_addr})")
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Manipula desconexão WebSocket."""
        client_id = request.sid
        
        # Interrompe qualquer processamento para este cliente
        stop_processing(client_id)
        
        # Remove das conexões ativas
        if client_id in active_connections:
            active_connections.pop(client_id)
        
        print(f"Cliente desconectado: {client_id}")
    
    @socketio.on('start_video_processing')
    def handle_start_processing(data):
        """
        Inicia o processamento de vídeo.
        
        Args:
            data: Dicionário com os dados do vídeo
        """
        client_id = request.sid
        video_path = data.get('video_path')
        
        if not video_path:
            emit('error', {'message': 'Caminho do vídeo não fornecido'})
            return
        
        # Converte o caminho relativo para absoluto se necessário
        if video_path.startswith('/uploads/'):
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            uploads_dir = os.path.join(base_dir, 'uploads')
            video_path = os.path.join(uploads_dir, video_path.replace('/uploads/', ''))
        
        # Interrompe qualquer processamento anterior
        stop_processing(client_id)
        
        # Cria um novo evento de parada
        stop_event = threading.Event()
        stop_events[client_id] = stop_event
        
        # Inicia uma nova thread de processamento
        thread = threading.Thread(
            target=process_video,
            args=(video_path, client_id, stop_event)
        )
        thread.daemon = True
        thread.start()
        
        # Registra a thread
        processing_threads[client_id] = thread
        
        # Atualiza o status da conexão
        if client_id in active_connections:
            active_connections[client_id]['processing'] = True
        
        emit('processing_started', {'success': True})
    
    @socketio.on('stop_video_processing')
    def handle_stop_processing():
        """Para o processamento de vídeo."""
        client_id = request.sid
        
        # Interrompe o processamento
        stop_processing(client_id)
        
        emit('processing_stopped', {'success': True})
    
    @socketio.on('update_settings')
    def handle_update_settings(data):
        """
        Atualiza as configurações do processador Ambilight.
        
        Args:
            data: Dicionário com as configurações
        """
        from app import ambilight_processor
        
        try:
            # Atualiza as configurações no processador
            if 'zones_per_side' in data:
                ambilight_processor.set_zones_per_side(int(data['zones_per_side']))
            
            if 'intensity' in data:
                ambilight_processor.set_intensity(float(data['intensity']))
            
            if 'blur_amount' in data:
                ambilight_processor.set_blur_amount(int(data['blur_amount']))
            
            # Salva as configurações no banco de dados
            from app.routes import save_settings
            
            settings = {
                'zones_per_side': ambilight_processor.zones_per_side,
                'intensity': ambilight_processor.intensity,
                'blur_amount': ambilight_processor.blur_amount
            }
            
            if 'autoplay' in data:
                settings['autoplay'] = bool(data['autoplay'])
            
            save_settings(settings)
            
            emit('settings_updated', {'success': True})
        except Exception as e:
            emit('error', {'message': f'Erro ao atualizar configurações: {str(e)}'})

def stop_processing(client_id):
    """
    Interrompe o processamento para um cliente específico.
    
    Args:
        client_id: ID do cliente
    """
    # Define o evento de parada, se existir
    if client_id in stop_events:
        stop_events[client_id].set()
    
    # Aguarda o término da thread, se existir
    if client_id in processing_threads:
        thread = processing_threads.pop(client_id)
        if thread and thread.is_alive():
            thread.join(timeout=1.0)
    
    # Remove o evento de parada
    if client_id in stop_events:
        stop_events.pop(client_id)
    
    # Atualiza o status da conexão
    if client_id in active_connections:
        active_connections[client_id]['processing'] = False

def process_video(video_path, client_id, stop_event):
    """
    Processa um vídeo frame por frame e envia dados de cores para o cliente.
    
    Args:
        video_path: Caminho para o vídeo
        client_id: ID do cliente
        stop_event: Evento para interromper o processamento
    """
    # Import aqui para evitar importação circular
    from app.routes import ambilight_processor
    
    try:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            if socketio:
                socketio.emit('error', {'message': 'Não foi possível abrir o vídeo'}, room=client_id)
            return
        
        frame_count = 0
        
        while not stop_event.is_set():
            ret, frame = cap.read()
            
            if not ret:
                # Reinicia o vídeo quando terminar
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Processa apenas 1 a cada 3 frames para melhor desempenho
            if frame_count % 3 == 0:
                try:
                    colors = ambilight_processor.extract_border_colors(frame)
                    
                    if socketio and client_id in active_connections:
                        socketio.emit('colors', colors, room=client_id)
                except Exception as e:
                    print(f"Erro ao processar frame: {e}")
            
            frame_count += 1
            
            # Limita a taxa de frames para não sobrecarregar o cliente
            time.sleep(0.03)  # Aprox. 30fps
    
    except Exception as e:
        if socketio:
            socketio.emit('error', {'message': f'Erro no processamento do vídeo: {str(e)}'}, room=client_id)
    finally:
        if 'cap' in locals():
            cap.release()