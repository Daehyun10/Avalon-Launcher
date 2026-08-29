<p align="right">
  <a href="./README.md">English</a> · <strong>한국어</strong>
</p>

<p align="center">
  <img src="./app/assets/images/avalon/avalon-logo.png" width="420" alt="아발론 로고">
</p>

<h1 align="center">아발론 런처</h1>

<p align="center">
  <a href="https://github.com/Daehyun10/Avalon-Launcher/releases/latest"><img src="https://img.shields.io/github/v/release/Daehyun10/Avalon-Launcher?style=flat-square&label=release" alt="최신 버전"></a>
  <a href="https://github.com/Daehyun10/Avalon-Launcher/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/Daehyun10/Avalon-Launcher/build.yml?style=flat-square&label=build" alt="Windows 빌드"></a>
  <a href="./LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-b08d57?style=flat-square" alt="MIT 라이선스"></a>
</p>

아발론 런처는 아발론 Minecraft 클라이언트를 설치하고 업데이트한 뒤 실행하는 프로그램입니다. 현재 공개 버전은 Windows x64와 Minecraft 1.20.1을 기준으로 제작되어 있습니다.

## 다운로드

[최신 릴리스](https://github.com/Daehyun10/Avalon-Launcher/releases/latest)에서 Windows 설치 파일을 받을 수 있습니다.

| 운영체제 | 파일 | 배포 상태 |
| --- | --- | --- |
| Windows x64 | `AVALON-Launcher-Setup-VERSION.exe` | 배포 중 |
| macOS | DMG | 미배포 |
| Linux x64 | AppImage | 미배포 |

현재 Windows 설치 파일에는 코드 서명이 없습니다. 처음 실행할 때 Windows SmartScreen 경고가 나타날 수 있습니다. 이 저장소의 릴리스에서 받은 파일인지 확인한 뒤 실행하세요.

## 현재 상태

저장소에 포함된 개발용 설정은 서버 주소로 `localhost`를 사용합니다. 같은 컴퓨터에서 Minecraft 서버를 실행하거나 실제 서버 주소로 변경하기 전까지 런처에는 `SERVER OFFLINE`이 표시됩니다.

배포용 모드 목록은 아직 설정되어 있지 않습니다.

## 기능

- Microsoft 계정 로그인과 계정 전환
- Java 실행 파일과 메모리 설정
- 현재 Minecraft 버전에 필요한 Java 17 x64 확인
- Minecraft 클라이언트, 라이브러리, 에셋, 모듈 파일 확인
- 설정된 서버로 바로 접속
- GitHub Releases를 이용한 런처 업데이트
- GitHub Actions를 이용한 Windows 설치 파일 생성

## 자동 업데이트

설치된 배포 버전은 이 저장소에서 새 버전을 확인합니다. 업데이트가 있으면 파일을 내려받고 런처를 종료하거나 다시 시작할 때 설치합니다.

릴리스에는 다음 파일이 필요합니다.

- `AVALON-Launcher-Setup-VERSION.exe`
- `AVALON-Launcher-Setup-VERSION.exe.blockmap`
- `latest.yml`

`v`로 시작하는 태그를 올리면 `.github/workflows/build.yml`에 있는 작업이 위 파일을 만듭니다.

## 서버 설정

로컬 테스트 설정은 `app/assets/distribution_dev.json`에서 수정합니다.

1. `address`를 서버 도메인이나 IP 주소로 변경합니다.
2. Minecraft 버전과 Java 범위를 확인합니다.
3. Forge, 라이브러리, 모드와 필요한 모듈을 추가합니다.
4. 설치, 파일 확인, 서버 접속 과정을 테스트합니다.

외부에 올린 배포 설정 파일을 사용하려면 `AVALON_DISTRIBUTION_URL`을 지정하거나 `app/assets/js/brand.js`의 `remoteDistributionUrl`을 설정합니다.

## 개발

### 준비 사항

- Node.js 22
- npm
- 현재 Minecraft 1.20.1 설정에 맞는 Java 17 x64

### 설치와 실행

```powershell
git clone https://github.com/Daehyun10/Avalon-Launcher.git
cd Avalon-Launcher
npm ci
npm start
```

### 검사와 빌드

```powershell
npm run lint
npm run dist:win
```

빌드 결과는 `dist/`에 생성됩니다.

## 새 버전 배포

`package.json`과 `package-lock.json`의 버전을 변경하고 커밋한 뒤 같은 버전의 태그를 올립니다.

```powershell
git tag -a v0.1.8 -m "AVALON Launcher v0.1.8"
git push origin main
git push origin v0.1.8
```

GitHub Actions가 설치 파일을 만들고 태그에 해당하는 릴리스에 등록합니다.

## 주요 파일

```text
app/                         런처 화면과 코드
app/assets/distribution_dev.json
                             로컬 서버와 Minecraft 설정
app/assets/images/avalon/    아발론 이미지
build/                       설치 파일 아이콘과 빌드 리소스
index.js                     Electron 메인 프로세스와 업데이트 처리
electron-builder.yml         설치 파일과 릴리스 설정
.github/workflows/build.yml  Windows 릴리스 작업
```

## 원작자

이 프로젝트는 [Daniel Scalzi](https://github.com/dscalzi)가 만든 [HeliosLauncher](https://github.com/dscalzi/HeliosLauncher)를 기반으로 수정했습니다. 원본 저작권 표시는 `LICENSE.txt`에 보존되어 있습니다.

Minecraft는 Microsoft Corporation의 상표입니다. 이 프로젝트는 Mojang Studios 또는 Microsoft의 공식 프로젝트가 아닙니다.

## 라이선스

소스 코드는 [MIT 라이선스](./LICENSE.txt)로 배포됩니다. 코드를 복사하거나 배포할 때 저작권 표시와 라이선스 내용을 유지해야 합니다.

아발론 이름, 로고, 이미지, 음악, 폰트와 프로젝트 전용 파일에는 별도 조건이 적용될 수 있습니다. 직접 소유하거나 배포 허가를 받은 파일만 사용하세요.
