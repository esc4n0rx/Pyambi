from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import os
import json
import cv2
import numpy as np
import threading
import time
from werkzeug.utils import secure_filename
from datetime import datetime

from app.ambilight import AmbilightProcessor
from app.models import DatabaseManager, Settings, History
from app.utils import list_supported_videos, sanitize_filename, create_directory_if_not_exists, is_video_format_supported

# Configuração da aplicação Flask
app = Flask(__name__, 
           template_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'templates'),
           static_folder=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static'))
app.config['SECRET_KEY'] = 'ambilight-secret-key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 1000 * 1024 * 1024  # 1000 MB max upload size
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'mkv', 'avi', 'mov', 'webm'}

# Certifique-se de que a pasta de uploads existe
create_directory_if_not_exists(app.config['UPLOAD_FOLDER'])

# Configuração do Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Configuração do banco de dados
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance', 'config.sqlite')
db_manager = DatabaseManager(db_path)
settings_model = Settings(db_manager)
history_model = History(db_manager)

# Instância global do processador Ambilight
ambilight_processor = AmbilightProcessor()

# Threads de processamento de vídeo
video_threads = {}
video_stop_events = {}

# Funções utilitárias
def allowed_file(filename):
    """Verifica se um arquivo tem uma extensão permitida."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def get_settings():
    """Recupera as configurações do banco de dados."""
    return settings_model.get()

def save_settings(settings):
    """Salva as configurações no banco de dados."""
    return settings_model.update(settings)

def add_to_history(filename, path):
    """Adiciona um vídeo ao histórico."""
    return history_model.add(filename, path)

def get_history(limit=10):
    """Recupera o histórico de vídeos."""
    return history_model.get_all(limit)

def process_video(video_path, client_sid):
    """
    Processa um vídeo frame por frame e envia dados de cores para o cliente.
    Executado em uma thread separada.
    """
    stop_event = video_stop_events.get(client_sid, threading.Event())
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            socketio.emit('error', {'message': 'Não foi possível abrir o vídeo'}, room=client_sid)
            return
        
        settings = get_settings()
        ambilight_processor.set_zones_per_side(settings['zones_per_side'])
        ambilight_processor.set_intensity(settings['intensity'])
        ambilight_processor.set_blur_amount(settings['blur_amount'])
        
        frame_count = 0
        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                # Reinicia o vídeo ao final
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            
            # Processa apenas 1 a cada 3 frames para melhor desempenho
            if frame_count % 3 == 0:
                try:
                    colors = ambilight_processor.extract_border_colors(frame)
                    socketio.emit('colors', colors, room=client_sid)
                except Exception as e:
                    print(f"Erro ao processar frame: {e}")
            
            frame_count += 1
            time.sleep(0.03)  # Limita para cerca de 30fps
    
    except Exception as e:
        socketio.emit('error', {'message': f'Erro ao processar vídeo: {str(e)}'}, room=client_sid)
    finally:
        if 'cap' in locals():
            cap.release()

# Atualiza as configurações do processador Ambilight com base nas configurações salvas
settings = get_settings()
ambilight_processor.set_zones_per_side(settings['zones_per_side'])
ambilight_processor.set_intensity(settings['intensity'])
ambilight_processor.set_blur_amount(settings['blur_amount'])

# Rotas Flask
@app.route('/')
def index():
    """Página principal."""
    return render_template('index.html')

@app.route('/settings')
def settings_page():
    """Página de configurações."""
    settings = get_settings()
    return render_template('settings.html', settings=settings)

@app.route('/about')
def about():
    """Página sobre."""
    return render_template('about.html')

@app.route('/api/settings', methods=['GET'])
def get_settings_api():
    """API para obter configurações."""
    return jsonify(get_settings())

@app.route('/api/settings', methods=['POST'])
def update_settings_api():
    """API para atualizar configurações."""
    data = request.json
    
    try:
        settings = {
            'zones_per_side': int(data.get('zones_per_side', 10)),
            'intensity': float(data.get('intensity', 1.0)),
            'blur_amount': int(data.get('blur_amount', 15)),
            'autoplay': bool(data.get('autoplay', False))
        }
        
        # Atualiza o processador Ambilight
        ambilight_processor.set_zones_per_side(settings['zones_per_side'])
        ambilight_processor.set_intensity(settings['intensity'])
        ambilight_processor.set_blur_amount(settings['blur_amount'])
        
        # Salva as configurações
        save_settings(settings)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/history', methods=['GET'])
def get_history_api():
    """API para obter histórico de vídeos."""
    limit = request.args.get('limit', 10, type=int)
    return jsonify(get_history(limit))

@app.route('/player/<path:filename>')
def player_page(filename):
    """Página dedicada do player."""
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Verificar se o arquivo existe
    if not os.path.exists(video_path):
        return render_template('error.html', error='Arquivo de vídeo não encontrado'), 404
    
    # Verificar se o formato é suportado
    if not is_video_format_supported(filename, app.config['ALLOWED_EXTENSIONS']):
        return render_template('error.html', error='Formato de vídeo não suportado'), 400
    
    # Adicionar ao histórico
    add_to_history(filename, video_path)
    
    # Renderizar a página do player
    return render_template('player.html', video_path=f'/uploads/{filename}')


@app.route('/api/videos')
def get_videos_api():
    """API para obter a lista de vídeos disponíveis."""
    uploads_dir = app.config['UPLOAD_FOLDER']
    allowed_extensions = app.config['ALLOWED_EXTENSIONS']
    
    try:
        videos = list_supported_videos(uploads_dir, allowed_extensions)
        return jsonify(videos)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """API para fazer upload de um arquivo de vídeo."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'})
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'})
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Adiciona ao histórico
        add_to_history(filename, file_path)
        
        return jsonify({
            'success': True, 
            'filename': filename, 
            'path': f'/uploads/{filename}'
        })
    
    return jsonify({'success': False, 'error': 'Tipo de arquivo não permitido'})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve os arquivos de vídeo enviados."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Eventos Socket.IO
@socketio.on('connect')
def handle_connect():
    """Manipula nova conexão websocket."""
    print(f"Cliente conectado: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    """Manipula desconexão websocket."""
    print(f"Cliente desconectado: {request.sid}")
    
    # Para qualquer processamento de vídeo em execução para este cliente
    if request.sid in video_threads:
        if request.sid in video_stop_events:
            video_stop_events[request.sid].set()
        
        thread = video_threads.pop(request.sid, None)
        if thread and thread.is_alive():
            thread.join(timeout=1.0)
        
        video_stop_events.pop(request.sid, None)

@socketio.on('start_video_processing')
def handle_start_processing(data):
    """Inicia o processamento de um vídeo."""
    video_path = data.get('video_path')
    
    if not video_path:
        emit('error', {'message': 'Caminho do vídeo não fornecido'})
        return
    
    # Converte o caminho relativo para absoluto
    if video_path.startswith('/uploads/'):
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], video_path.replace('/uploads/', ''))
    
    # Para qualquer processamento anterior
    if request.sid in video_stop_events:
        video_stop_events[request.sid].set()
    
    if request.sid in video_threads:
        old_thread = video_threads.pop(request.sid)
        if old_thread and old_thread.is_alive():
            old_thread.join(timeout=1.0)
    
    # Cria novo evento de parada
    video_stop_events[request.sid] = threading.Event()
    
    # Inicia nova thread de processamento
    thread = threading.Thread(
        target=process_video,
        args=(video_path, request.sid)
    )
    thread.daemon = True
    thread.start()
    
    video_threads[request.sid] = thread
    
    # Adiciona ao histórico
    filename = os.path.basename(video_path)
    add_to_history(filename, video_path)
    
    emit('processing_started', {'success': True})

@socketio.on('stop_video_processing')
def handle_stop_processing():
    """Para o processamento de um vídeo."""
    if request.sid in video_stop_events:
        video_stop_events[request.sid].set()
    
    emit('processing_stopped', {'success': True})

@socketio.on('update_settings')
def handle_update_settings(data):
    """Atualiza as configurações do Ambilight."""
    try:
        zones = int(data.get('zones_per_side', 10))
        intensity = float(data.get('intensity', 1.0))
        blur = int(data.get('blur_amount', 15))
        
        ambilight_processor.set_zones_per_side(zones)
        ambilight_processor.set_intensity(intensity)
        ambilight_processor.set_blur_amount(blur)
        
        settings = {
            'zones_per_side': zones,
            'intensity': intensity,
            'blur_amount': blur,
            'autoplay': bool(data.get('autoplay', False))
        }
        
        save_settings(settings)
        
        emit('settings_updated', {'success': True})
    except Exception as e:
        emit('error', {'message': f'Erro ao atualizar configurações: {str(e)}'})