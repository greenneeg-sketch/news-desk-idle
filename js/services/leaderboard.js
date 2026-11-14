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
// Supabase 어댑터: 익명 로그인으로 플레이어별 계정을 만들고, 자기 기록만 쓴다(서버 RLS·검증은 supabase/setup.sql)
const SB_KEY = 'newsDeskSb';
const SupabaseAdapter = ({ url, key }) => {
  let ses = null; try { ses = JSON.parse(localStorage.getItem(SB_KEY)); } catch (e) { }
  const save = () => { try { localStorage.setItem(SB_KEY, JSON.stringify(ses)); } catch (e) { } };
  const H = t => ({ apikey: key, Authorization: 'Bearer ' + (t || key), 'Content-Type': 'application/json' });
  async function auth() {
    if (ses && ses.exp > Date.now() / 1000 + 60) return ses;
    let r = null;
    if (ses && ses.refresh) r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: H(), body: JSON.stringify({ refresh_token: ses.refresh }) });
    if (!r || !r.ok) r = await fetch(`${url}/auth/v1/signup`, { method: 'POST', headers: H(), body: JSON.stringify({ data: {} }) }); // 익명 로그인
    const d = await r.json(); if (!d.access_token) throw new Error('auth failed');
    ses = { token: d.access_token, refresh: d.refresh_token, exp: d.expires_at || Date.now() / 1000 + (d.expires_in || 3600), uid: d.user && d.user.id }; save(); return ses;
  }
  const row = x => clean({ uid: x.user_id, name: x.name, total: x.total, maxLv: x.max_lv, bestRating: x.best_rating, views: x.views, rankScore: x.rank_score, season: x.season, seasonPts: x.season_pts });
  return {
    mode: 'server', get me() { return ses && ses.uid; },
    async submit(e) {
      const s = await auth();
      const r = await fetch(`${url}/rest/v1/leaderboard?on_conflict=user_id`, { method: 'POST', headers: { ...H(s.token), Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: s.uid, name: e.name, total: e.total, max_lv: e.maxLv, best_rating: Math.min(30, e.bestRating), views: e.views, season: e.season, season_pts: e.seasonPts }) });
      if (!r.ok) throw new Error('submit ' + r.status + ' ' + (await r.text()).slice(0, 120));
    },
    async top(n) { const r = await fetch(`${url}/rest/v1/leaderboard?select=*&order=rank_score.desc&limit=${n}`, { headers: H() }); if (!r.ok) throw new Error('top ' + r.status); return (await r.json()).map(row); },
    async now() { const r = await fetch(`${url}/rest/v1/rpc/server_time`, { method: 'POST', headers: H(), body: '{}' }); if (!r.ok) throw new Error('time'); return Date.parse(await r.json()); },
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
    now: () => ad.now ? ad.now() : Promise.resolve(Date.now()),
  };
}
