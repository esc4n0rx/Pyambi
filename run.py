
from app import app, socketio

if __name__ == "__main__":
    # Iniciar o servidor com suporte a WebSockets
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)