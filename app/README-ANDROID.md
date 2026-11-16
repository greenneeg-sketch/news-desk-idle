# NEWS DESK 안드로이드 앱

- 방식: Capacitor 8로 웹 게임(index.html)을 안드로이드 앱에 그대로 넣는다. 패키지 이름 `io.github.greenneeg.newsdesk`(바꿀 수 없음)
- 빌드: GitHub Actions(`.github/workflows/android.yml`). main에 index.html·icons·app/이 바뀌면 자동 실행, 수동 실행은 Actions → Android build → Run workflow
  - 결과물(Artifacts): `app-debug.apk`(폰에 바로 설치해 보는 테스트용), `app-release.aab`(플레이 스토어 업로드용)
  - 버전 번호(versionCode)는 Actions 실행 번호. 같은 번호는 스토어에 다시 못 올린다
- 서명: 저장소 Settings → Secrets and variables → Actions에 4개 — `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. 키 파일(.jks)은 저장소에 올리지 않는다. 플레이 앱 서명(Play App Signing)을 쓰므로 이 키는 '업로드 키'
- 광고: `js/services/ads.js`(보상형 광고). 앱 안에서만 AdMob, 웹에서는 바로 보상. 지금은 구글 공식 테스트 ID
  - 실제 광고로 바꿀 때: `ads.js`의 `AD_UNIT`(보상형 광고 단위 ID)과 `AD_TEST = false`, `app/android/app/src/main/res/values/strings.xml`의 `admob_app_id`(앱 ID, `~`가 들어간 것)
- 로컬에서 직접 빌드(안드로이드 스튜디오가 있을 때): `cd app && npm ci && npm run sync`, 그다음 `app/android`를 안드로이드 스튜디오로 연다
- 개인정보처리방침: https://greenneeg-sketch.github.io/news-desk-idle/privacy.html
- 앱에서는 서비스 워커·웹 푸시를 쓰지 않는다(웹 버전만)
- 서명 키(GitHub Secrets) 등록 완료: 2026-11-16
