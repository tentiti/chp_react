import eventlet
eventlet.monkey_patch()

from backend.app import app  # app.py에서 Flask 애플리케이션 가져오기
from flask_socketio import SocketIO

socketio = SocketIO(app)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
