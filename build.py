# 배포용 빌드: dev.html + js/ + css/ 를 한 파일 index.html로 합친다 (캐시 때문에 옛 파일과 섞이지 않게)
# 사용법: python3 build.py  → index.html 생성 (GitHub Pages가 여는 파일)
import re, pathlib, datetime
r = pathlib.Path(__file__).parent
order = ['data/config','data/quotes','systems/season','systems/economy','systems/cards','systems/ranking','systems/nameFilter','systems/ratings','systems/missions','core/EventBus','core/Store','core/Loop','state/reducer','systems/events','services/storage','services/leaderboard','services/audio','ui/scene','ui/bubbles','ui/paper','ui/intro','ui/tutorial','ui/hud','main']
js = ''
for m in order:
    t = (r / 'js' / f'{m}.js').read_text(encoding='utf-8')
    t = re.sub(r'^import .*$', '', t, flags=re.M)
    js += re.sub(r'^export ', '', t, flags=re.M) + '\n'
h = (r / 'dev.html').read_text(encoding='utf-8')
ver = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y.%m.%d-%H%M')
h = h.replace('__BUILD__', ver)
css = (r / 'css/main.css').read_text(encoding='utf-8')
h = h.replace('<link rel="stylesheet" href="css/main.css">', '<style>' + css + '</style>')
h = h.replace('<script type="module" src="js/main.js"></script>', '<script>(()=>{' + js + '})();</script>')
h = h.replace('<head>', '<head>\n<!-- 자동 생성 파일: 직접 고치지 말고 dev.html·js·css를 고친 뒤 python3 build.py -->', 1)
(r / 'index.html').write_text(h, encoding='utf-8')
print('built index.html', ver)
