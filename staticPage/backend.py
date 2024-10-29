from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///1029.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Postcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gif_name = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    comment = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    number = db.Column(db.String(50), nullable=True)

    def to_dict(self, new_id=None):
        return {
            "id": new_id if new_id is not None else self.id,
            "gif_name": self.gif_name,
            "name": self.name,
            "comment": self.comment,
            "timestamp": self.timestamp.isoformat(),
            "number": self.number,
        }


# JSON 파일 생성 함수 (ID 재매기기)
def generate_json_file_with_sequential_ids():
    try:
        postcards = Postcard.query.all()
        data = {
            "postcards": [
                postcard.to_dict(new_id=index + 1)
                for index, postcard in enumerate(postcards)
            ]
        }

        # JSON 파일 경로 확인 및 생성
        output_dir = os.path.join("frontend", "public", "data")
        os.makedirs(output_dir, exist_ok=True)  # 경로가 없으면 생성

        with open(
            os.path.join(output_dir, "allData.json"), "w", encoding="utf-8"
        ) as json_file:
            json.dump(data, json_file, ensure_ascii=False, indent=4)

        print("JSON file with sequential IDs generated successfully.")
    except Exception as e:
        print(f"Error generating JSON file: {e}")


if __name__ == "__main__":
    with app.app_context():
        # 테이블이 없을 경우 생성
        db.create_all()

        # JSON 파일 생성
        generate_json_file_with_sequential_ids()
