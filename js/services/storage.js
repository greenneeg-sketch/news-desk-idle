import { SAVE_KEY } from '../data/config.js';
import { initialState, reducer } from '../state/reducer.js';
import { rates, scoreMul } from '../systems/economy.js';
const SAVE = ['score', 'run', 'pts', 'lv', 'mg', 'chief', 'ach', 'evCount', 'goldCount', 'name', 'uid', 'total', 'maxLv', 'bestRating', 'views', 'day', 'hist', 'lastRating', 'prevRating', 'lastViews', 'cards', 'pulls', 'pity', 'tickets', 'login', 'week', 'chal', 'chalDone', 'season', 'lastSeason', 'tut', 'outT', 'buyT', 'scoopT', 'win', 'bestWin', 'mis', 'misAll', 'rp', 'res', 'deco', 'career', 'wev', 'badges', 'tips', 'job'];
// Repository 패턴: 저장 매체(localStorage)를 이 모듈 안에 가둔다
export const Repo = {
  snapshot: s => ({ ...Object.fromEntries(SAVE.map(k => [k, s[k]])), t: Date.now() }), // 클라우드 저장에도 같은 모양을 쓴다
  save(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Repo.snapshot(s))); } catch (e) { } },
  write(o) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }, // 클라우드에서 불러온 저장본
  load() {
    try {
      const o = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!o || !o.lv) return null;
      const nt = (o.res && o.res.night) || 0, sec = Math.min((Date.now() - o.t) / 1000, 28800 + 3600 * nt), { t, ...s } = o;
      const st = reducer(initialState(), { type: 'LOAD', s });
      const n = sec >= 60 && st.name ? Math.floor(Math.min(...rates(st)) * 10 * scoreMul(st) * sec * (.5 + .1 * nt)) : 0;
      return { s, offline: n >= 10 ? { n, min: Math.floor(sec / 60) } : null };
    } catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } },
};
