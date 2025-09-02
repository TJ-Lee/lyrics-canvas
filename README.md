# 🎵 LyricsCanvas

**가사를 아름다운 이미지로 변환하는 도구**

LyricsCanvas는 가사를 입력하고 다양한 설정을 통해 아름다운 이미지를 생성할 수 있는 웹 애플리케이션입니다. 세로/가로 모드, 폰트 설정, 색상 조정 등 다양한 옵션을 제공합니다.

![LyricsCanvas Preview](https://via.placeholder.com/800x400/1f2937/ffffff?text=LyricsCanvas+Preview)

## ✨ 주요 기능

- 🎨 **실시간 미리보기**: 설정 변경 시 즉시 반영되는 캔버스 미리보기
- 📝 **가사 입력**: 제목, 내용, 작사가 정보 입력
- ⚙️ **다양한 설정**: 폰트, 색상, 정렬, 레이아웃 모드 설정
- 📱 **반응형 디자인**: 다양한 화면 크기에 최적화된 UI
- 💾 **이미지 내보내기**: PNG, JPEG, WebP 형식으로 저장
- 📤 **공유 기능**: Web Share API를 통한 이미지 공유
- 💾 **자동 저장**: 로컬 스토리지를 통한 설정 및 데이터 자동 저장
- 🖥️ **데스크톱 앱**: Electron을 통한 데스크톱 애플리케이션 지원

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **상태 관리**: React Hooks, LocalStorage
- **데스크톱**: Electron
- **이미지 처리**: html2canvas, file-saver
- **패키지 관리**: pnpm

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- pnpm (권장) 또는 npm

### 설치

1. 저장소 클론
```bash
git clone https://github.com/your-username/lyrics-canvas.git
cd lyrics-canvas
```

2. 의존성 설치
```bash
pnpm install
```

3. 개발 서버 시작
```bash
pnpm run dev
```

4. 브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
# 웹 빌드
pnpm run build

# Electron 앱 빌드
pnpm run build:electron
```

## 📖 사용법

1. **가사 입력**: 왼쪽 패널에서 제목, 내용, 작사가를 입력합니다
2. **설정 조정**: 폰트, 색상, 정렬, 레이아웃 모드를 설정합니다
3. **미리보기**: 오른쪽 캔버스에서 실시간으로 결과를 확인합니다
4. **내보내기**: 원하는 이미지 형식으로 저장하거나 공유합니다

## 🎨 레이아웃 모드

- **세로 모드 (9:16)**: 모바일 화면에 최적화된 세로 레이아웃
- **가로 모드 (16:9)**: 데스크톱 및 TV 화면에 최적화된 가로 레이아웃

## 📁 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트들
│   ├── LyricsCanvas.tsx    # 메인 캔버스 컴포넌트
│   ├── LyricsInput.tsx     # 가사 입력 폼
│   ├── CanvasSettings.tsx  # 캔버스 설정 패널
│   ├── ExportPanel.tsx     # 내보내기 패널
│   └── ui/                 # shadcn/ui 컴포넌트들
├── services/            # 비즈니스 로직
│   ├── CanvasManager.tsx   # 캔버스 관리
│   ├── ExportManager.ts    # 내보내기 관리
│   └── LocalStorageService.ts # 로컬 저장소
├── models/              # 데이터 모델
├── pages/               # 페이지 컴포넌트
└── lib/                 # 유틸리티 함수들
```

## 🔧 개발 명령어

```bash
# 개발 서버 시작
pnpm run dev

# 프로덕션 빌드
pnpm run build

# 미리보기
pnpm run preview

# 린트 검사
pnpm run lint

# Electron 앱 실행
pnpm run electron

# Electron 앱 빌드
pnpm run build:electron
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 [Issues](https://github.com/your-username/lyrics-canvas/issues)를 통해 제출해 주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
