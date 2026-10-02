// Audio synthesis and playback utility for VendorMateAI

let currentAudio: HTMLAudioElement | null = null;

// Play sound chime with Web Audio API for immediate tactile feedback
export function playChime(type: 'start' | 'success' | 'alert') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    console.debug('Audio chime error:', e);
  }
}

export async function speakVoiceFeedback(
  text: string,
  lang: 'luganda' | 'english' = 'english',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // Stop existing audio
  stopSpeaking();

  if (!text) return;

  onStart?.();

  // Try Server-side Gemini TTS first
  try {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceName: 'Kore',
        style: lang === 'luganda' ? 'Warm, cheerful Ugandan merchant speaking Luganda' : 'Warm, clear African market vendor assistant',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        currentAudio = audio;
        audio.onended = () => {
          currentAudio = null;
          onEnd?.();
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(text, lang, onEnd);
        };
        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.debug('Server TTS skipped or unavailable, using Web Speech Synthesis fallback', err);
  }

  // Fallback to browser SpeechSynthesis
  fallbackSpeechSynthesis(text, lang, onEnd);
}

function fallbackSpeechSynthesis(
  text: string,
  lang: 'luganda' | 'english',
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language preference if available
  const voices = window.speechSynthesis.getVoices();
  // Look for African English or generic English/Swahili voices
  const preferredVoice = voices.find(
    (v) => v.lang.includes('UG') || v.lang.includes('KE') || v.lang.includes('en-GB') || v.lang.includes('en')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.95; // Slightly slower for clear marketplace comprehension
  utterance.pitch = 1.0;

  utterance.onend = () => {
    onEnd?.();
  };
  utterance.onerror = () => {
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
