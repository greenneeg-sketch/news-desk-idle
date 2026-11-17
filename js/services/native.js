// 안드로이드 앱(Capacitor) 전용 기능: 진동과 복귀 알림. 웹에서는 아무 일도 하지 않는다.
// 알림은 앱이 백그라운드로 가면 예약하고, 다시 열면 취소한다. 밤(23~8시)에는 울리지 않도록 아침으로 미룬다.
export const Native = (() => {
  const cap = () => window.Capacitor, isApp = () => !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
  const plug = n => { if (!isApp()) return null; try { return (cap().Plugins && cap().Plugins[n]) || (cap().registerPlugin && cap().registerPlugin(n)); } catch (e) { return null; } };
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const HAP = 'newsDeskHapOff', LN = 'newsDeskLn';
  let lastH = 0;
  const haptic = name => { // 효과음 이름에 맞춰 짧게 진동. 0.08초 안에 또 부르면 건너뜀
    if (get(HAP) === '1') return; const P = plug('Haptics'), n = Date.now(); if (!P || n - lastH < 80) return; lastH = n;
    try { if (name === 'rank') P.notification({ type: 'SUCCESS' }); else if (name === 'fail') P.notification({ type: 'ERROR' }); else if (name === 'alert') P.impact({ style: 'MEDIUM' }); else P.impact({ style: 'LIGHT' }); } catch (e) { }
  };
  const quiet = d => { const h = d.getHours(); if (h >= 23) { d.setDate(d.getDate() + 1); d.setHours(8, 30, 0, 0); } else if (h < 8) d.setHours(8, 30, 0, 0); return d; };
  const notifOn = () => get(LN) === '1';
  async function notifSet(on) {
    const P = plug('LocalNotifications'); if (!P) return false;
    if (!on) { set(LN, '0'); try { await P.cancel({ notifications: [{ id: 1 }, { id: 2 }] }); } catch (e) { } return true; }
    try { let r = await P.checkPermissions(); if (r.display !== 'granted') r = await P.requestPermissions(); if (r.display !== 'granted') return false; set(LN, '1'); return true; } catch (e) { return false; }
  }
  async function schedule(capMs) { // capMs: 야간 근무 수익이 가득 차는 데까지 걸리는 시간(ms)
    const P = plug('LocalNotifications'); if (!P || !notifOn()) return;
    try {
      await P.cancel({ notifications: [{ id: 1 }, { id: 2 }] });
      const now = Date.now(), at = ms => ({ at: quiet(new Date(now + ms)), allowWhileIdle: true });
      await P.schedule({ notifications: [
        { id: 1, title: 'NEWS DESK', body: '야간 근무 수익이 가득 찼어요! 돌아와서 정산해 주세요.', schedule: at(capMs), smallIcon: 'ic_stat_nd' },
        { id: 2, title: 'NEWS DESK', body: '오늘의 편집회의가 기다리고 있어요. 속보가 터질지도 몰라요!', schedule: at(20 * 3600e3), smallIcon: 'ic_stat_nd' },
      ] });
    } catch (e) { }
  }
  const cancel = async () => { const P = plug('LocalNotifications'); if (P) try { await P.cancel({ notifications: [{ id: 1 }, { id: 2 }] }); } catch (e) { } };
  return { isApp, haptic, hapticOn: () => get(HAP) !== '1', setHaptic: on => set(HAP, on ? '0' : '1'), notifOn, notifSet, schedule, cancel };
})();
