import numpy as np
import cv2
from datetime import datetime
import uuid
import os
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask import Flask, request, jsonify, send_from_directory, render_template, url_for
import eventlet
eventlet.monkey_patch()


# 필요한 경우 이벤트렛 패치

app = Flask(__name__)
CORS(app)

app.config['UPLOAD_FOLDER'] = os.path.join(
    os.path.dirname(__file__), 'uploads')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///postcard.db'
db = SQLAlchemy(app)


class Postcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gif_name = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    comment = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    number = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f'<Postcard {self.name}>'


socketio = SocketIO(app)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


@app.context_processor
def override_url_for():
    return dict(url_for=lambda endpoint, **values: url_for(endpoint, _scheme='https', **values))


with app.app_context():
    db.create_all()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/invitation')
def invitation():
    return render_template('invitation.html')


@ app.route('/createCharacter')
def createCharacter():
    return render_template('createCharacter.html')


@ app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    filename = secure_filename(file.filename)
    file_ext = os.path.splitext(filename)[1]
    unique_filename = str(uuid.uuid4()) + file_ext
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
    return jsonify({"message": "File uploaded successfully", "filename": unique_filename}), 200


@ app.route('/comment', methods=['POST'])
def post_comment():
    data = request.get_json()
    video_name = data['video_name']
    comment_text = data['comment']
    comment_datetime = datetime.fromisoformat(data['datetime'])
    new_comment = Comment(video_name=video_name,
                          comment=comment_text, datetime=comment_datetime)
    db.session.add(new_comment)
    db.session.commit()
    return jsonify({"message": "Comment added"}), 200


@ app.route('/uploads/<filename>', methods=['GET'])
def get_video(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/submit-postcard', methods=['POST'])
def submit_postcard():
    try:
        # JSON 데이터 파싱
        data = request.get_json()

        gif_name = data.get('gifName')
        name = data.get('name')
        comment = data.get('comment')
        timestamp = data.get('timestamp')
        number = data.get('number')

        # Postcard 객체 생성 및 데이터베이스에 저장
        new_postcard = Postcard(
            gif_name=gif_name,
            name=name,
            comment=comment,
            timestamp=datetime.fromisoformat(timestamp),
            number=number
        )
        db.session.add(new_postcard)
        db.session.commit()

        # 응답 반환
        return jsonify({"message": "Postcard submitted successfully", "id": new_postcard.id}), 200

    except Exception as e:
        # 오류 발생 시 오류 메시지와 함께 500 응답 반환
        print(f"Error: {e}")
        return jsonify({"error": "Failed to submit postcard"}), 500


@app.route('/postcard/<int:id>', methods=['GET'])
def get_postcard(id):
    try:
        postcard = Postcard.query.get_or_404(id)
        return jsonify({
            "id": postcard.id,
            "gif_name": postcard.gif_name,
            "name": postcard.name,
            "comment": postcard.comment,
            "timestamp": postcard.timestamp.isoformat(),
            "number": postcard.number
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Postcard not found"}), 404


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8000,
                 keyfile='/Users/hyungyulee/chp_react/certs/key.pem', certfile='/Users/hyungyulee/chp_react/certs/cert.pem')
