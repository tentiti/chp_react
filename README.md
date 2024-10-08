# 이젠 댄스타임
> 평화의 나무에 달빛이 닿은 날, 반짝이는 춤결


 김화순 작가님 개인전 [우리는 몇 번의 만월을 더 볼 수 있을까](https://www.instagram.com/kkot.pida.gallery/) (10/12 ~ 11/3, 서울 자하미술관) 과 연계하여, 전시에 미디어아트로서 기능하는 춤판과 그 춤판에 삽입할 캐릭터를 만드는 웹입니다.

## 프로젝트 구조
```plaintext
CHP_react/
│
├── frontend/      # React 기반 프론트엔드 파일
├── backend/       # Flask 기반 백엔드 파일
└── certs/         # React, Flask 간 HTTPS 연결을 위한 인증서
```



## 페이지 설명

- **`/`** - **홈페이지**
  - 프론트엔드 워크플로우의 시작점입니다. 

- **`/api/admin`** - **데이터베이스 관리자**
  - 데이터베이스를 관리하는 관리자 페이지 입니다.
- **`/api/map`** - **춤판**
  - 전시 연계 미디어아트 중 하나인 ‘춤판’을 보여주는 페이지로, 사람들이 만든 캐릭터가 10초마다 갱신됩니다.

## 테크 스택
- **프론트엔드**: React, Three.js
- **백엔드**: Flask
- **배포**: AWS EC2, Gunicorn, Nginx

## 실행 방법
- npm, python이 설치되어 있어야 합니다.

1. 모든 파일을 다운로드합니다.

2. **프론트엔드 시작**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   - 프론트엔드는 기본적으로 `3000`번 포트에서 실행됩니다.

3. **백엔드 시작**
   ```bash
   cd ..
   cd backend
   # 필요한 경우 가상환경 생성 및 활성화
   # python -m venv venv
   # source venv/bin/activate  (리눅스/macOS)
   # .\venv\Scripts\activate  (Windows)
   pip install -r requirements.txt
   python app.py
   ```
   - 백엔드는 기본적으로 `8000`번 포트에서 실행됩니다.

4. **웹사이트 접속**
   - [https://localhost:3000](https://localhost:3000) 으로 접속하여 서비스를 확인하세요.
   - **참고**: `https://localhost:8000`으로 접속할 경우 첫 화면만 표시되며 정상 작동하지 않습니다.

## 배포
https://letsdance.kr


## 크레딧
- **웹 개발 및 배포**: 이현규
- **기획 및 디자인, 3D 에셋 제작**: 유채영, 김휴초
