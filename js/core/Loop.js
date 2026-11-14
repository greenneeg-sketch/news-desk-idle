// 고정 타임스텝 게임 루프: 로직은 일정 간격, 렌더는 프레임마다
export function GameLoop({ step, render, dt = .05 }) {
  let acc = 0, last = 0;
  const frame = t => {
    requestAnimationFrame(frame);
    acc += Math.min((t - last) / 1000, .5); last = t;
    while (acc >= dt) { step(dt); acc -= dt; }
    render(t / 1000);
  };
  return { start() { last = performance.now(); requestAnimationFrame(frame); } };
}
