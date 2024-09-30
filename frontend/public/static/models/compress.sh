#!/bin/bash

# 모델들이 있는 디렉토리 경로 설정
model_dir="/Users/hyungyulee/chp_react/frontend/public/static/models"

# 모델 디렉토리에서 'animated'로 시작하는 모든 GLB 파일에 대해 작업 실행
for file in "$model_dir"/animation_*.glb
do
    if [ -f "$file" ]; then
        echo "Processing $file..."

        # 텍스처를 WebP로 변환하여 압축
        gltf-transform toktx "$file" "$file" --target webp

        echo "최적화가 완료되었습니다: $file"
    else
        echo "No animated models found in $model_dir"
    fi
done
