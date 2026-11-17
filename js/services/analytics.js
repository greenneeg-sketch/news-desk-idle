// 익명 사용 통계 + 오류 기록. 닉네임·기기 열쇠와 연결하지 않는 별도 무작위 id만 쓰고, 설정에서 끌 수 있다(supabase/analytics.sql).
// 보내는 것: 튜토리얼·스카우트·광고·결제 같은 진행 이벤트, 앱 버전, 오류 문구. 보내지 않는 것: 닉네임, 연락처, 광고 ID.
export const Analytics = (() => {
  const AID = 'newsDeskAid', OFF = 'newsDeskAnOff';
  let cfg = null, aid = '', sess = Math.random().toString(36).slice(2, 8), q = [], timer = 0, errN = 0, seen = {}, t0 = Date.now();
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const rand = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); };
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : (h => `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`)(rand(16));
  const enabled = () => !!cfg && get(OFF) !== '1';
  const plat = () => { const c = window.Capacitor; return c && c.isNativePlatform && c.isNativePlatform() ? 'app' : 'web'; };
  function flush(bye) {
    if (!enabled() || !q.length) return; const ev = q.splice(0, 40); clearTimeout(timer); timer = 0;
    try {
      fetch(`${cfg.url}/rest/v1/rpc/nd_log`, { method: 'POST', headers: { apikey: cfg.key, 'Content-Type': 'application/json' }, keepalive: !!bye,
        body: JSON.stringify({ p_aid: aid, p_ver: cfg.ver, p_plat: plat(), p_sess: sess, p_events: ev }) }).catch(() => { });
    } catch (e) { }
    if (q.length) timer = setTimeout(flush, 3000);
  }
  function log(ev, p) {
    if (!enabled()) return; if (q.length > 200) q.shift();
    q.push(p === undefined ? { ev } : { ev, p }); if (q.length >= 10) flush(); else if (!timer) timer = setTimeout(() => flush(), 20000);
  }
  function once(ev, p) { if (seen[ev]) return; seen[ev] = 1; log(ev, p); } // 한 번만(세션당)
  function init(c) {
    cfg = c; aid = get(AID); if (!aid) { aid = uuid(); set(AID, aid); }
    addEventListener('error', e => { if (errN++ < 8) log('err', { m: String(e.message || 'error').slice(0, 140), s: String(e.filename || '').split('/').pop().slice(0, 40) + ':' + (e.lineno || 0) }); });
    addEventListener('unhandledrejection', e => { if (errN++ < 8) log('err', { m: ('promise: ' + (e.reason && e.reason.message || e.reason || '')).slice(0, 140), s: 'rej' }); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { log('end', { sec: Math.round((Date.now() - t0) / 1000) }); flush(true); } else t0 = Date.now(); });
  }
  return { init, log, once, flush, enabled, setOn: on => { set(OFF, on ? '0' : '1'); if (!on) q = []; } };
})();
