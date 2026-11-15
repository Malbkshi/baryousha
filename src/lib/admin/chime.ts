"use client";

// A short two-note chime made with Web Audio, so there is no sound file to
// ship. Browsers only allow sound after the page has been tapped or clicked,
// hence `unlockChime`.

let context: AudioContext | null = null;

export function unlockChime(): void {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // No audio on this device; the visual alert still works.
  }
}

export function chimeReady(): boolean {
  return context?.state === "running";
}

export function playChime(): void {
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  for (const [index, frequency] of [880, 1175].entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + index * 0.18;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.4);
  }
}
