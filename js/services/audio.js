// 8비트 효과음: 사각파 비프 시퀀스
const SEQ = { buy: [[660, .06], [880, .08]], alert: [[440, .1], [330, .1], [440, .1]], rank: [[523, .1], [659, .1], [784, .2]], fail: [[160, .15]] };
let ac, on = true;
export const Sfx = {
  toggle() { on = !on; return on; },
  unlock() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume().catch(() => { }); } catch (e) { } }, // 아이폰: 터치할 때 깨워 둔다
  play(name) {
    if (!on) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== 'running') ac.resume().catch(() => { });
      let t = ac.currentTime;
      (SEQ[name] || []).forEach(([f, d]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'square'; o.frequency.value = f; g.gain.value = .04;
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d;
      });
    } catch (e) { }
  },
};
