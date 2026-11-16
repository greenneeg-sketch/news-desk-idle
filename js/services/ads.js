// 보상형 광고(AdMob). 안드로이드 앱(Capacitor) 안에서만 진짜 광고를 띄우고, 웹에서는 바로 보상을 준다.
// show() → 'web'(웹: 광고 없이 보상) · true(끝까지 봄: 보상) · false(닫음·실패: 보상 없음)
// 실제 출시 때는 AD_UNIT·AD_TEST와 AndroidManifest의 admob_app_id를 AdMob에서 받은 값으로 바꾼다(app/README-ANDROID.md)
export const Ads = (() => {
  const AD_UNIT = 'ca-app-pub-3940256099942544/5224354917', AD_TEST = true; // 구글 공식 테스트 보상형 광고
  const cap = () => window.Capacitor, native = () => !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
  let A = null, ready = null, busy = false;
  const plugin = () => A || (A = native() ? (cap().Plugins && cap().Plugins.AdMob) || (cap().registerPlugin && cap().registerPlugin('AdMob')) : null);
  function init() {
    if (ready) return ready; const P = plugin(); if (!P) return (ready = Promise.resolve(false));
    return (ready = P.initialize({ initializeForTesting: AD_TEST }).then(async () => {
      try { const c = await P.requestConsentInfo(); if (c && c.isConsentFormAvailable && c.status === 'REQUIRED') await P.showConsentForm(); } catch (e) { } // 유럽 등 동의가 필요한 지역만
      return true;
    }).catch(() => false));
  }
  async function show() {
    if (!native()) return 'web';
    const P = plugin(); if (!P || busy) return false; busy = true; const hs = [];
    try {
      if (!(await init())) return false;
      let got = false;
      const done = new Promise(res => {
        const on = (ev, fn) => Promise.resolve(P.addListener(ev, fn)).then(h => hs.push(h));
        on('onRewardedVideoAdReward', () => { got = true; });
        on('onRewardedVideoAdDismissed', () => res(got));
        on('onRewardedVideoAdFailedToShow', () => res(false));
        on('onRewardedVideoAdFailedToLoad', () => res(false));
      });
      await P.prepareRewardVideoAd({ adId: AD_UNIT, isTesting: AD_TEST });
      const r = await P.showRewardVideoAd(); if (r) got = true;
      return await Promise.race([done, new Promise(res => setTimeout(() => res(got), 90000))]);
    } catch (e) { return false; } finally { busy = false; hs.forEach(h => { try { h.remove(); } catch (e) { } }); }
  }
  return { show, init, native };
})();
