import os
from PIL import Image

# 입력 폴더와 출력 폴더 설정
input_folder = "/Users/hyungyulee/chp_react/frontend/public/static"
output_folder = "/Users/hyungyulee/chp_react/frontend/public/newstatic"

# 출력 폴더가 없으면 생성
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# 재귀적으로 폴더 탐색하여 이미지를 WebP로 변환
for root, dirs, files in os.walk(input_folder):
    for file in files:
        if file.endswith(
            (".png", ".jpg", ".jpeg", ".bmp")
        ):  # 변환할 이미지 파일 확장자 지정
            file_path = os.path.join(root, file)  # 원본 파일 경로
            relative_path = os.path.relpath(root, input_folder)  # 상대 경로 계산
            output_subfolder = os.path.join(
                output_folder, relative_path
            )  # 출력 경로 설정

            # 출력 서브 폴더가 없으면 생성
            if not os.path.exists(output_subfolder):
                os.makedirs(output_subfolder)

            img = Image.open(file_path)
            output_path = os.path.join(
                output_subfolder, os.path.splitext(file)[0] + ".webp"
            )  # WebP로 저장할 경로
            img.save(output_path, "webp")
            print(f"{file_path} -> {output_path} 변환 완료")
