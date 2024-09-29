#!/bin/bash

# 현재 폴더에 있는 'bottom'이 포함된 모든 파일에 대해 작업
for file in *bottom*.glb; do
  # 파일 이름에서 확장자(.glb) 제거
  base_name="${file%.glb}"
  
  # output 파일 이름을 base_name_compressed.glb로 설정
  output_file="${base_name}_compressed.glb"
  
  # gltf-transform optimize 명령 실행
  gltf-transform optimize "$file" "$output_file" --compress draco --texture-compress webp
  
  # 완료 메시지 출력
  echo "Optimized: $file -> $output_file"
done
