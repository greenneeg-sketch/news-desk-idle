// 단일 상태 저장소 (Redux 스타일): 상태는 reducer로만 바뀐다
export function createStore(reducer, init) {
  let state = init; const subs = new Set();
  return {
    getState: () => state,
    dispatch(a) { const n = reducer(state, a); if (n !== state) { const p = state; state = n; subs.forEach(f => f(state, p)); } return state; },
    subscribe: f => { subs.add(f); return () => subs.delete(f); },
  };
}
