// نظام الأصوات: يستخدم Web Audio API لتوليد المؤثرات ونغمة هادئة
// اختيارية (بدون ملفات خارجية، لذا يعمل مباشرة بدون اتصال بالإنترنت).
// ملاحظة: يمكنك استبدال هذه النغمة بملف موسيقى عراقية حقيقية بوضعه في
// public/audio/ambient.mp3 وتعديل toggleMusic() لتشغيله عبر <audio>.

let ctx = null;
let musicNodes = null;
let musicPlaying = false;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function beep(freq, duration = 0.12, type = 'sine', gainValue = 0.15) {
  try {
    const audioCtx = getCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    /* الصوت غير مدعوم أو محظور قبل تفاعل المستخدم */
  }
}

export function playDiceSound() {
  beep(220, 0.08, 'square', 0.1);
  setTimeout(() => beep(330, 0.08, 'square', 0.1), 90);
}

export function playBuySound() {
  beep(523, 0.1, 'triangle', 0.15);
  setTimeout(() => beep(659, 0.15, 'triangle', 0.15), 100);
  setTimeout(() => beep(784, 0.2, 'triangle', 0.15), 200);
}

export function playPaySound() {
  beep(200, 0.15, 'sawtooth', 0.1);
  setTimeout(() => beep(150, 0.2, 'sawtooth', 0.1), 100);
}

export function playJailSound() {
  beep(110, 0.3, 'square', 0.12);
}

export function isMusicPlaying() {
  return musicPlaying;
}

// نغمة مقامية هادئة بسيطة: طبقتان متذبذبتان ببطء تحاكي أجواء شرقية دافئة
export function toggleMusic() {
  const audioCtx = getCtx();
  if (musicPlaying) {
    musicNodes?.forEach((n) => {
      try { n.stop(); } catch (e) {}
    });
    musicNodes = null;
    musicPlaying = false;
    return false;
  }

  const notes = [146.83, 174.61, 220]; // نغمات هادئة (D3, F3, A3)
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.05;
  masterGain.connect(audioCtx.destination);

  const nodes = [];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    lfo.frequency.value = 0.1 + i * 0.03;
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(masterGain);
    osc.start();
    lfo.start();
    nodes.push(osc, lfo);
  });
  nodes.push(masterGain);
  musicNodes = nodes;
  musicPlaying = true;
  return true;
}
