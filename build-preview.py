import re, pathlib
r = pathlib.Path(__file__).parent
order = ['data/config','data/quotes','systems/season','systems/economy','systems/cards','systems/ranking','systems/nameFilter','systems/ratings','systems/missions','core/EventBus','core/Store','core/Loop','state/reducer','systems/events','services/storage','services/leaderboard','services/audio','ui/scene','ui/bubbles','ui/paper','ui/intro','ui/tutorial','ui/hud','main']
js = ''
for m in order:
    t = (r / 'js' / f'{m}.js').read_text(encoding='utf-8')
    t = re.sub(r'^import .*$', '', t, flags=re.M)
    js += re.sub(r'^export ', '', t, flags=re.M) + '\n'
h = (r / 'index.html').read_text(encoding='utf-8')
css = (r / 'css/main.css').read_text(encoding='utf-8')
h = h.replace('<link rel="stylesheet" href="css/main.css">', '<style>' + css + '</style>')
h = h.replace('<script type="module" src="js/main.js"></script>', '<script>(()=>{' + js + '})();</script>')
(r.parent / 'news-desk-preview.html').write_text(h, encoding='utf-8')
