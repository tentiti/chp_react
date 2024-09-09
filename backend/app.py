from PIL import Image, ImageDraw, ImageSequence
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
import random
import eventlet
eventlet.monkey_patch()


# 필요한 경우 이벤트렛 패치

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app, resources={r"/*": {"origins": "*"}})  # 혹은 특정 도메인을 설정

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


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


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
    print(unique_filename)
    return jsonify({"filename": unique_filename}), 200


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


# 이미지 저장 폴더 경로 설정
app.config['IMAGE_UPLOAD_FOLDER'] = os.path.join(
    os.path.dirname(__file__), 'imageuploads')

if not os.path.exists(app.config['IMAGE_UPLOAD_FOLDER']):
    os.makedirs(app.config['IMAGE_UPLOAD_FOLDER'])

# 배경 색상 설정 (number 값에 따라 결정)
BACKGROUND_COLORS = {
    1: (255, 0, 0),    # Red
    2: (0, 255, 0),    # Green
    3: (0, 0, 255)     # Blue
}


@app.route('/submit-postcard', methods=['POST'])
def submit_postcard():
    try:
        # JSON 데이터 파싱
        data = request.get_json()

        gif_name = data.get('gifName')
        name = data.get('name')
        comment = data.get('comment')
        timestamp = data.get('timestamp')
        number = data.get('selectedBackground')

        # 파일 이름만 추출하여 사용
        gif_filename = os.path.basename(gif_name)

        # Postcard 객체 생성 및 데이터베이스에 저장
        new_postcard = Postcard(
            gif_name=gif_filename,
            name=name,
            comment=comment,
            timestamp=datetime.fromisoformat(timestamp),
            number=number
        )
        db.session.add(new_postcard)
        db.session.commit()

        # 랜덤 프레임 추출 및 PNG 저장
        gif_path = os.path.join(app.config['UPLOAD_FOLDER'], gif_filename)
        with Image.open(gif_path) as gif:
            frames = [frame.convert("RGBA")
                      for frame in ImageSequence.Iterator(gif)]
            random_frame = random.choice(frames)
            print('***************', number)

            # 원 그리기 (이미지를 꽉 채우는 원)
            if number in BACKGROUND_COLORS:
                # 원을 먼저 그리기 위한 새로운 레이어 생성
                overlay = Image.new('RGBA', random_frame.size)
                draw = ImageDraw.Draw(overlay)
                width, height = random_frame.size
                radius = min(width, height) // 2  # 반지름을 이미지 크기의 절반으로 설정
                center = (width // 2, height // 2)
                color = BACKGROUND_COLORS[number] + (255,)  # 불투명한 색상으로 설정
                draw.ellipse([center[0] - radius, center[1] - radius,
                              center[0] + radius, center[1] + radius], fill=color)

                # 원을 그린 레이어를 프레임 위에 합성
                combined = Image.alpha_composite(overlay, random_frame)
                random_frame = combined

            # PNG로 저장 (new_postcard.id.png) - RGBA 모드 유지
            png_filename = os.path.splitext(gif_filename)[0] + '.png'
            png_path = os.path.join(
                app.config['UPLOAD_FOLDER'], png_filename)
            random_frame.save(png_path, format='PNG')

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
        print(postcard.gif_name, id)
        return jsonify({
            "id": postcard.id,
            "gif_name": postcard.gif_name,
            "png_name": postcard.gif_name.replace('.gif', '.png'),
            "name": postcard.name,
            "comment": postcard.comment,
            "timestamp": postcard.timestamp.strftime("%Y년 %m월 %d일에 함께한") + f"\n{postcard.id}번째 춤",
            "number": postcard.number
        }), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Postcard not found"}), 404


@app.route('/api/postcards', methods=['GET'])
def get_postcards():
    try:
        # 모든 Postcard 데이터를 데이터베이스에서 가져옵니다.
        postcards = Postcard.query.order_by(Postcard.timestamp.desc()).all()
        # 각 Postcard 객체를 JSON 형태로 변환하여 응답합니다.
        postcards_data = [
            {
                "id": postcard.id,
                "gif_name": postcard.gif_name,
                # .gif을 .png로 변환
                "png_name": postcard.gif_name.replace('.gif', '.png'),
                "name": postcard.name,
                "comment": postcard.comment,
                "timestamp": postcard.timestamp.strftime("%Y년 %m월 %d일에 함께한") + f"{postcard.id}번째 춤",
                "number": postcard.number
            }
            for postcard in postcards
        ]

        return jsonify(postcards_data), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to fetch postcards"}), 500


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=8000,
                 keyfile='/Users/hyungyulee/chp_react/backend/key.pem', certfile='/Users/hyungyulee/chp_react/backend/cert.pem')
