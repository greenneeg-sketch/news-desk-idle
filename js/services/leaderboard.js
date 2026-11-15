import { rankScore } from '../systems/ranking.js';
// 순위 서비스: 어댑터 패턴으로 저장소를 바꿔 끼운다 (Claude db 공유 저장소 / Supabase 서버 / 오프라인 샘플)
const SAMPLE = [['한강TV', 2e7, 70, 18.4, 6e6], ['새벽뉴스', 3e6, 45, 12.1, 8e5], ['별빛방송', 4e5, 30, 8.7, 9e4], ['미래 미디어', 5e4, 18, 6.2, 1.5e4], ['동네 라디오', 5e3, 8, 3.9, 1200]]
  .map(([name, total, maxLv, bestRating, views], i) => ({ uid: 'sample' + i, name, total, maxLv, bestRating, views, sample: true, rankScore: rankScore({ total, maxLv, bestRating, views }) }));
const clean = e => ({ uid: String(e.uid || '').slice(0, 64), name: String(e.name || '').slice(0, 12), total: +e.total || 0, maxLv: +e.maxLv || 0, bestRating: +e.bestRating || 0, views: +e.views || 0, rankScore: +e.rankScore || 0, season: String(e.season || '').slice(0, 7), seasonPts: +e.seasonPts || 0, sample: !!e.sample });
const LocalAdapter = () => ({ mode: 'local', me: null, async submit() { }, async top(n, own) { return [...SAMPLE.map(x => ({ ...x, season: own.season, seasonPts: Math.floor(x.total * .3) })), clean(own)].sort((a, b) => b.rankScore - a.rankScore).slice(0, n); } });
const DbAdapter = (db, id) => ({
  mode: 'db', me: id,
  async submit(e) { await db.doc('leaderboard/' + id).set({ ...e, uid: id }); },
  async top(n) { const snap = await db.collection('leaderboard').orderBy('rankScore', 'desc').limit(n).get(); return snap.docs.map(d => clean(d.data())); },
});
// Supabase 어댑터: 로그인 없이 '기기 열쇠'로 내 기록을 지킨다.
// 기기마다 무작위 id와 비밀 열쇠를 만들어 이 기기에만 보관하고, 서버 함수 nd_submit이 열쇠를 확인한 뒤에만 기록을 고친다(supabase/setup.sql)
const SB_KEY = 'newsDeskSb';
const rand = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };
const uuid = () => crypto.randomUUID ? crypto.randomUUID() : (h => `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`)(rand(16));
const SupabaseAdapter = ({ url, key }) => {
  let dev = null; try { dev = JSON.parse(localStorage.getItem(SB_KEY)); } catch (e) { }
  if (!dev || !dev.id || !dev.key) { dev = { id: uuid(), key: rand(32) }; try { localStorage.setItem(SB_KEY, JSON.stringify(dev)); } catch (e) { } }
  const H = { apikey: key, 'Content-Type': 'application/json' };
  const rpc = async (fn, body, keepalive = false) => { const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body), keepalive }); if (!r.ok) throw new Error(fn + ' ' + r.status + ' ' + (await r.text()).slice(0, 120)); return r.json(); };
  const COLS = 'id,name,total,max_lv,best_rating,views,rank_score,season,season_pts';
  const row = x => clean({ uid: x.id, name: x.name, total: x.total, maxLv: x.max_lv, bestRating: x.best_rating, views: x.views, rankScore: x.rank_score, season: x.season, seasonPts: x.season_pts });
  return {
    mode: 'server', get me() { return dev.id; },
    submit: e => rpc('nd_submit', { p_id: dev.id, p_key: dev.key, p_name: e.name, p_total: e.total, p_max_lv: e.maxLv, p_best: Math.min(30, e.bestRating), p_views: e.views, p_season: e.season, p_season_pts: e.seasonPts }),
    // 전체 상위 n명 + 이번 시즌 상위 n명을 함께 받아 합친다 (시즌 탭이 전체 순위 밖의 사람도 보이게)
    async top(n, own) {
      const q = p => fetch(`${url}/rest/v1/nd_leaderboard?select=${COLS}&${p}&limit=${n}`, { headers: H }).then(r => { if (!r.ok) throw new Error('top ' + r.status); return r.json(); });
      const sk = own && own.season ? encodeURIComponent(own.season) : '';
      const [a, b] = await Promise.all([q('rank_score=gt.0&order=rank_score.desc'), sk ? q(`season=eq.${sk}&season_pts=gt.0&order=season_pts.desc`) : []]);
      const m = new Map(); [...a, ...b].forEach(x => m.set(x.id, x)); return [...m.values()].map(row);
    },
    // 내 순위(목록 밖이어도): 나보다 점수가 높은 사람 수 + 1
    async myRank(own) {
      const cnt = async p => { const r = await fetch(`${url}/rest/v1/nd_leaderboard?select=id&${p}`, { method: 'HEAD', headers: { ...H, Prefer: 'count=exact', Range: '0-0' } }); const m = /\/(\d+)/.exec(r.headers.get('content-range') || ''); if (!m) throw new Error('count'); return +m[1]; };
      const [all, season] = await Promise.all([cnt(`rank_score=gt.${+own.rankScore || 0}`), cnt(`season=eq.${encodeURIComponent(own.season)}&season_pts=gt.${+own.seasonPts || 0}`)]);
      return { all: all + 1, season: season + 1 };
    },
    now: async () => Date.parse(await rpc('nd_server_time', {})),
    vapid: () => rpc('nd_vapid_public', {}),
    // 클라우드 저장: 저장본을 올리고 복구 코드를 받는다
    savePut: (data, keep = false) => rpc('nd_save_put', { p_id: dev.id, p_key: dev.key, p_data: data }, keep),
    // 복구: 코드로 저장본을 받고, 그 방송국의 기기 열쇠를 이 기기 것으로 바꾼다
    async restore(code) {
      const nk = rand(32), j = await rpc('nd_save_restore', { p_code: code, p_new_key: nk });
      dev = { id: j.id, key: nk }; try { localStorage.setItem(SB_KEY, JSON.stringify(dev)); } catch (e) { } return j;
    },
    // 푸시 알림 구독·예약: at(ISO 시각)에 알림, at=null이면 예약 취소, sub=null이면 구독 해제. 앱을 닫는 순간에도 보내지게 keepalive
    pushSet: (sub, at, keep = false) => rpc('nd_push_set', { p_id: dev.id, p_key: dev.key, p_sub: sub, p_at: at, p_kind: 'offline' }, keep),
  };
};
export async function createBoard(cfg) {
  let ad = LocalAdapter();
  try { const c = window.claude; if (c && c.use) { const [db, user] = await Promise.all([c.use('db'), c.use('user')]); const id = db && user ? await user.id() : null; if (id) ad = DbAdapter(db, id); } } catch (e) { }
  if (ad.mode === 'local' && cfg.url && cfg.key) ad = SupabaseAdapter(cfg);
  let last = '';
  return {
    get mode() { return ad.mode; }, get me() { return ad.me; },
    async submit(e) { const k = JSON.stringify([e.name, e.rankScore]); if (k === last) return; await ad.submit(ad.me ? { ...e, uid: ad.me } : e); last = k; },
    top: (n, own) => ad.top(n, own),
    myRank: own => ad.myRank ? ad.myRank(own) : Promise.resolve(null),
    now: () => ad.now ? ad.now() : Promise.resolve(Date.now()),
    vapid: () => ad.vapid ? ad.vapid() : Promise.reject(new Error('no server')),
    pushSet: (...a) => ad.pushSet ? ad.pushSet(...a) : Promise.reject(new Error('no server')),
    savePut: (...a) => ad.savePut ? ad.savePut(...a) : Promise.reject(new Error('no server')),
    restore: c => ad.restore ? ad.restore(c) : Promise.reject(new Error('no server')),
  };
}
