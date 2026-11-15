import { jobOf } from '../data/config.js';
import { SAVE_KEY } from '../data/config.js';
import { LB_EP } from '../systems/ranking.js';
import { initialState, reducer } from '../state/reducer.js';
import { rates, scoreMul } from '../systems/economy.js';
const SAVE = ['score', 'run', 'pts', 'lv', 'mg', 'chief', 'ach', 'evCount', 'goldCount', 'name', 'uid', 'total', 'maxLv', 'bestRating', 'views', 'day', 'hist', 'lastRating', 'prevRating', 'lastViews', 'cards', 'pulls', 'pity', 'tickets', 'login', 'week', 'chal', 'chalDone', 'season', 'lastSeason', 'tut', 'outT', 'buyT', 'scoopT', 'win', 'bestWin', 'mis', 'misAll', 'rp', 'res', 'deco', 'career', 'wev', 'badges', 'tips', 'job', 'unl', 'presV', 'lbEp', 'lbBase'];
// Repository 패턴: 저장 매체(localStorage)를 이 모듈 안에 가둔다
export const Repo = {
  snapshot: s => ({ ...Object.fromEntries(SAVE.map(k => [k, s[k]])), t: Date.now() }), // 클라우드 저장에도 같은 모양을 쓴다
  save(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Repo.snapshot(s))); } catch (e) { } },
  write(o) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }, // 클라우드에서 불러온 저장본
  load() {
    try {
      const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!o || !o.lv) return null;
      if (!o.presV) { if (o.pts > 0) o.pts = Math.floor(Math.cbrt(o.pts * o.pts / 200)); o.presV = 2; }
      if ((o.lbEp || 0) < LB_EP) { o.lbBase = { total: o.total || 0, views: o.views || 0 }; if (o.season) o.season = { ...o.season, base: Math.max(o.season.base || 0, o.total || 0) }; o.lbEp = LB_EP; } // 순위 초기화: 지금까지 쌓인 기록은 순위에서 빼고 새로 센다 // 개편 공식 변경 전 기록: 같은 점수를 새 공식으로 받았을 때의 포인트로 변환
      const nt = (o.res && o.res.night) || 0, sec = Math.min((Date.now() - o.t) / 1000, 28800 + 3600 * nt), { t, ...s } = o;
    const jo = jobOf(o).off || 0; // 방송 엔지니어: 오프라인 수익 +20%p
      const st = reducer(initialState(), { type: 'LOAD', s });
      const n = sec >= 60 && st.name ? Math.floor(Math.min(...rates(st)) * 10 * scoreMul(st) * sec * (.5 + .1 * nt + jo)) : 0;
      return { s, offline: n >= 10 ? { n, min: Math.floor(sec / 60) } : null };
    } catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } },
};
