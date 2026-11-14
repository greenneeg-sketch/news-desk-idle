import { rankScore } from '../systems/ranking.js';
// 순위 서비스: 어댑터 패턴으로 저장소를 바꿔 끼운다 (Claude db 공유 저장소 / REST 서버 / 오프라인 샘플)
const SAMPLE = [['한강TV', 2e7, 70, 18.4, 6e6], ['새벽뉴스', 3e6, 45, 12.1, 8e5], ['별빛방송', 4e5, 30, 8.7, 9e4], ['미래 미디어', 5e4, 18, 6.2, 1.5e4], ['동네 라디오', 5e3, 8, 3.9, 1200]]
  .map(([name, total, maxLv, bestRating, views], i) => ({ uid: 'sample' + i, name, total, maxLv, bestRating, views, sample: true, rankScore: rankScore({ total, maxLv, bestRating, views }) }));
const clean = e => ({ uid: String(e.uid || '').slice(0, 64), name: String(e.name || '').slice(0, 12), total: +e.total || 0, maxLv: +e.maxLv || 0, bestRating: +e.bestRating || 0, views: +e.views || 0, rankScore: +e.rankScore || 0, season: String(e.season || '').slice(0, 7), seasonPts: +e.seasonPts || 0, sample: !!e.sample });
const LocalAdapter = () => ({ mode: 'local', me: null, async submit() { }, async top(n, own) { return [...SAMPLE.map(x => ({ ...x, season: own.season, seasonPts: Math.floor(x.total * .3) })), clean(own)].sort((a, b) => b.rankScore - a.rankScore).slice(0, n); } });
const DbAdapter = (db, id) => ({
  mode: 'db', me: id,
  async submit(e) { await db.doc('leaderboard/' + id).set({ ...e, uid: id }); },
  async top(n) { const snap = await db.collection('leaderboard').orderBy('rankScore', 'desc').limit(n).get(); return snap.docs.map(d => clean(d.data())); },
});
const RestAdapter = ({ url, key }) => {
  const h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  return {
    mode: 'rest', me: null,
    async submit(e) { await fetch(`${url}/rest/v1/leaderboard?on_conflict=uid`, { method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ uid: e.uid, name: e.name, total: e.total, max_lv: e.maxLv, best_rating: e.bestRating, views: e.views, rank_score: e.rankScore, season: e.season, season_pts: e.seasonPts }]) }); },
    async top(n) { const r = await fetch(`${url}/rest/v1/leaderboard?select=*&order=rank_score.desc&limit=${n}`, { headers: h }); return (await r.json()).map(x => clean({ uid: x.uid, name: x.name, total: x.total, maxLv: x.max_lv, bestRating: x.best_rating, views: x.views, rankScore: x.rank_score, season: x.season, seasonPts: x.season_pts })); },
  };
};
export async function createBoard(cfg) {
  let ad = LocalAdapter();
  try { const c = window.claude; if (c && c.use) { const [db, user] = await Promise.all([c.use('db'), c.use('user')]); const id = db && user ? await user.id() : null; if (id) ad = DbAdapter(db, id); } } catch (e) { }
  if (ad.mode === 'local' && cfg.url && cfg.key) ad = RestAdapter(cfg);
  let last = '';
  return {
    get mode() { return ad.mode; }, get me() { return ad.me; },
    async submit(e) { const k = JSON.stringify([e.name, e.rankScore]); if (k === last) return; await ad.submit(ad.me ? { ...e, uid: ad.me } : e); last = k; },
    top: (n, own) => ad.top(n, own),
  };
}
