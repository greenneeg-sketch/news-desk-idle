// 웹 게임(저장소 루트의 index.html·아이콘)을 앱용 www 폴더로 복사한다. 앱에서는 서비스 워커를 쓰지 않는다.
import { cpSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname, www = new URL('www/', import.meta.url).pathname;
rmSync(www, { recursive: true, force: true }); mkdirSync(www, { recursive: true });
copyFileSync(root + 'index.html', www + 'index.html');
copyFileSync(root + 'manifest.webmanifest', www + 'manifest.webmanifest');
cpSync(root + 'icons', www + 'icons', { recursive: true });
console.log('copied web build to app/www');
