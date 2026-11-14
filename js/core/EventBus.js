// Observer 패턴: UI 의도(buy, boost...)와 처리 로직을 분리한다
export class EventBus {
  #h = new Map();
  on(t, f) { (this.#h.get(t) || this.#h.set(t, []).get(t)).push(f); }
  emit(t, p) { (this.#h.get(t) || []).forEach(f => f(p)); }
}
