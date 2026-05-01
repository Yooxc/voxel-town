# voxel-town auth server

메타마스크 nonce 검증 로그인용 1차 백엔드 뼈대입니다.

## 역할

- `POST /auth/nonce`
  - 지갑 주소를 받아 nonce와 서명 메시지를 발급
- `POST /auth/verify`
  - 주소, nonce, signature를 받아 서명 검증 후 세션 토큰 발급
- `GET /auth/me`
  - Bearer 토큰으로 현재 유저 정보 조회
- `PATCH /auth/nickname`
  - Bearer 토큰으로 닉네임 저장/수정

## 빠른 시작

```bash
cd server
npm install
npm run dev
```

또는 루트에서:

```bash
npm run server:dev
```

## 환경 변수

`.env.example`

```bash
PORT=8787
HOST=localhost
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
NONCE_TTL_SECONDS=300
SESSION_TTL_SECONDS=2592000
```

## 저장 방식

현재는 빠른 프로토타입을 위해 `server/data/app.json` 파일에 다음 데이터를 저장합니다.

- users
- nonces
- sessions

정식 단계에서는 SQLite/Postgres 같은 DB로 교체하는 걸 권장합니다.

## 프론트 연동 시 다음 단계

1. 프론트 로그인 버튼이 `POST /auth/nonce` 호출
2. 응답으로 받은 `message`를 메타마스크로 서명
3. `POST /auth/verify`로 `address`, `nonce`, `signature` 전달
4. 응답 `token`을 저장
5. 이후 `Authorization: Bearer <token>`으로 닉네임/플레이어 데이터 요청
