// 인앱 결제(Google Play). 안드로이드 앱 안에서만 동작하고, 웹에서는 상점을 숨긴다(주소 끝에 #shoptest를 붙이면 결제 없이 시험 구매).
// 상품 ID는 Play Console → 수익 창출 → 인앱 상품에서 똑같이 만들어야 한다(app/README-ANDROID.md).
// 상점 사용 여부. 정식 출시 첫 버전은 인앱 상품 없이 광고만으로 내보내려고 꺼 둔다(사업자 등록 전).
// 나중에 켜려면 true로 바꾸고 app/package.json에 @capgo/native-purchases를 다시 추가한다.
export const SHOP_ON = false;
export const SHOP_ITEMS = [
  { id: 'nd_noads', n: '광고 제거 패스', price: '₩5,900', d: '광고 보상 버튼을 누르면 광고 없이 바로 보상을 받아요. 미니게임 2배 · 신문 광고 수입 2배 · 오프라인 보상 2배 · 속도 부스트 · 무료 스카우트 모두 해당. 한 번 사면 계속 유지돼요.', once: true },
  { id: 'nd_starter', n: '신입 스타터 팩', price: '₩1,500', d: '스카우트 티켓 10장 + 처리 속도 x2 2시간 + 커피타임 30분. 계정당 한 번만 살 수 있어요.', once: true },
];
export const Shop = (() => {
  const cap = () => window.Capacitor, native = () => !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
  const test = () => /shoptest/.test(location.hash);
  let P = null; const plugin = () => P || (P = native() ? (cap().Plugins && cap().Plugins.NativePurchases) || (cap().registerPlugin && cap().registerPlugin('NativePurchases')) : null);
  const enabled = () => SHOP_ON && (native() || test());
  async function prices() { // 스토어에 등록된 실제 가격(현지 통화). 못 받으면 기본 가격 표시
    const out = {}; SHOP_ITEMS.forEach(i => out[i.id] = i.price); const p = plugin(); if (!p) return out;
    try { const r = await p.getProducts({ productIdentifiers: SHOP_ITEMS.map(i => i.id), productType: 'inapp' }); (r.products || []).forEach(x => { if (x.priceString) out[x.identifier] = x.priceString; }); } catch (e) { }
    return out;
  }
  async function buy(id) { // 'ok' · 'pending'(결제 대기) · 'cancel' · 'fail'
    if (!native()) return test() ? 'ok' : 'fail';
    const p = plugin(); if (!p) return 'fail';
    try { const tx = await p.purchaseProduct({ productIdentifier: id, productType: 'inapp', isConsumable: false });
      if (!tx) return 'fail'; if (tx.purchaseState === '0') return 'pending'; return tx.purchaseState == null || tx.purchaseState === '1' ? 'ok' : 'fail';
    } catch (e) { return /cancel/i.test(String(e && (e.message || e.code))) ? 'cancel' : 'fail'; }
  }
  async function owned() { // 이미 산 상품 ID 목록(앱 재설치·기기 변경 시 복원)
    const p = plugin(); if (!p) return [];
    try { const r = await p.getPurchases({ productType: 'inapp' }), ok = (r.purchases || []).filter(t => t.purchaseState == null || t.purchaseState === '1');
      for (const t of ok) if (t.isAcknowledged === false && t.purchaseToken) { try { await p.acknowledgePurchase({ purchaseToken: t.purchaseToken }); } catch (e) { } } // 앱 밖(Play 스토어 프로모션 코드)에서 받은 건: 3일 안에 확인 안 하면 구글이 환불한다
      return ok.map(t => t.productIdentifier); } catch (e) { return []; }
  }
  return { enabled, native, prices, buy, owned };
})();
