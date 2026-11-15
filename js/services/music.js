// 8비트 배경음악(오리지널 작곡): Web Audio로 실시간 연주한다. 음원 파일이 없어 저작권 걱정이 없다.
// 곡: title(타이틀, 경쾌한 뉴스 시그널풍) / desk(보도국, 잔잔한 반복) / breaking(속보, 긴박한 오스티나토)
// 표기: 16분음표 한 칸 = 토큰 하나. '.' 쉼표, '-' 앞 음 길게, 'C5' 음이름+옥타브. 드럼: k 킥, s 스네어, h 하이햇
export const Music = (() => {
const SONGS = {
  title: {
    bpm: 132,
    lead: ['C5 . E5 . G5 . C6 . B5 . G5 . E5 . G5 .', 'A5 . - . E5 . A5 . C6 . B5 . A5 . E5 .', 'F5 . A5 . C6 . A5 . G5 . F5 . E5 . F5 .', 'G5 . - . D5 . G5 . B5 . - . D6 - - -',
      'C6 . G5 . E5 . G5 . C6 . D6 . E6 . C6 .', 'A5 . E5 . C5 . E5 . A5 . B5 . C6 . A5 .', 'F5 . A5 . C6 . F6 . E6 . C6 . A5 . C6 .', 'B5 . G5 . D6 . B5 . C6 - - - - - - .'],
    bass: ['C3 . C4 . C3 . C4 . C3 . C4 . C3 . C4 .', 'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .', 'F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 .', 'G2 . G3 . G2 . G3 . G2 . G3 . B2 . D3 .'],
    drum: ['k . h . s . h . k . h k s . h h'],
  },
  desk: {
    bpm: 100,
    lead: ['A4 . C5 . E5 . . . D5 . C5 . B4 . . .', 'A4 . C5 . F5 . . . E5 . C5 . A4 . . .', 'G4 . C5 . E5 . . . G5 . E5 . D5 . . .', 'B4 . D5 . G5 . . . F5 . D5 . B4 - - -',
      'E5 . . . A5 . . . G5 . E5 . C5 . . .', 'F5 . . . A5 . . . G5 . F5 . C5 . . .', 'E5 . . . G5 . . . C6 . G5 . E5 . . .', 'D5 . . . G5 . . . B4 - - - . . . .'],
    bass: ['A2 . . . A2 . E3 . A2 . . . A2 . E3 .', 'F2 . . . F2 . C3 . F2 . . . F2 . C3 .', 'C3 . . . C3 . G3 . C3 . . . C3 . G3 .', 'G2 . . . G2 . D3 . G2 . . . G2 . B2 .'],
    drum: ['k . h . s . h . k . h . s . h h'],
  },
  breaking: {
    bpm: 150,
    lead: ['D5 D5 . D5 F5 . D5 . A5 . G5 F5 E5 . C5 .', 'D5 D5 . D5 F5 . D5 . C6 . A5 . G5 - - .', 'D5 D5 . D5 F5 . D5 . A5 . G5 F5 E5 . F5 .', 'A5 . G5 . F5 . E5 . D5 - - - . . . .'],
    bass: ['D3 D3 D3 D3 D3 D3 D3 D3 D3 D3 D3 D3 C3 C3 C3 C3', 'A#2 A#2 A#2 A#2 A#2 A#2 A#2 A#2 A2 A2 A2 A2 A2 A2 A2 A2'],
    drum: ['k h s h k k s h k h s h k k s s'],
  },
};
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const hz = t => { const m = /^([A-G]#?)(\d)$/.exec(t); return m ? 440 * 2 ** ((NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12) : 0; };
// 마디 문자열들을 [음, 길이(칸)] 배열로 바꾼다
function parse(bars) {
  const out = []; let last = null;
  bars.join(' ').split(/\s+/).filter(Boolean).forEach(t => {
    if (t === '-') { if (last) last.len++; out.push(null); }
    else if (t === '.') { last = null; out.push(null); }
    else { last = { t, len: 1 }; out.push(last); }
  });
  return out;
}
const PARSED = Object.fromEntries(Object.entries(SONGS).map(([k, s]) => [k, { bpm: s.bpm, lead: parse(s.lead), bass: parse(s.bass), drum: s.drum.join(' ').split(/\s+/) }]));

let ac = null, master = null, noise = null, on = true, cur = null, want = null, step = 0, nextT = 0, timer = 0;
try { on = localStorage.getItem('newsDeskBgm') !== 'off'; } catch (e) { }
function init() {
  if (ac) return true;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * .3, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  } catch (e) { return false; }
}
function tone(type, f, t, dur, vol) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(vol * .4, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
}
function drum(k, t) {
  if (k === 'k') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .14); o.connect(g).connect(master); o.start(t); o.stop(t + .15); return; }
  if (k !== 's' && k !== 'h') return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise;
  f.type = k === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = k === 'h' ? 7000 : 1800;
  const v = k === 'h' ? .025 : .06, d = k === 'h' ? .03 : .1; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + d + .01);
}
// 앞으로 0.15초 안에 울릴 음을 미리 예약한다(타이머가 늦어도 박자가 흔들리지 않게)
function tick() {
  if (!ac || !cur) return;
  const S = PARSED[cur], sec = 60 / S.bpm / 4;
  while (nextT < ac.currentTime + .15) {
    const L = S.lead[step % S.lead.length], B = S.bass[step % S.bass.length], D = S.drum[step % S.drum.length];
    if (L) tone('square', hz(L.t), nextT, sec * L.len * .95, .032);
    if (B) tone('triangle', hz(B.t), nextT, sec * B.len * .9, .09);
    drum(D, nextT);
    nextT += sec; step++;
    if (want && want !== cur && step % 16 === 0) { cur = want; step = 0; } // 곡 전환은 마디가 끝날 때
  }
}
return {
  get on() { return on; },
  play(name) {
    want = name; if (!on || !init()) return;
    if (ac.state === 'suspended') ac.resume().catch(() => { });
    if (!cur) { cur = name; step = 0; nextT = ac.currentTime + .05; }
    if (!timer) timer = setInterval(tick, 30);
  },
  toggle() {
    on = !on; try { localStorage.setItem('newsDeskBgm', on ? 'on' : 'off'); } catch (e) { }
    if (on) { const w = want || 'title'; cur = null; this.play(w); } else { clearInterval(timer); timer = 0; cur = null; }
    return on;
  },
  pause() { if (ac && ac.state === 'running') ac.suspend().catch(() => { }); },
  resume() { if (ac && on && cur && ac.state === 'suspended') ac.resume().catch(() => { }); },
};
})();
