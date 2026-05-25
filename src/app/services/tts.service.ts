import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voicesReady = false;

  constructor() {
    if (this.synth) {
      // Voices load asynchronously; cache them once available
      if (this.synth.getVoices().length > 0) {
        this.voicesReady = true;
      } else {
        this.synth.addEventListener('voiceschanged', () => { this.voicesReady = true; }, { once: true });
      }
    }
  }

  speak(text: string, lang = 'de-DE'): void {
    if (!this.synth) return;
    // cancel() + immediate speak() silently drops speech in Chrome/WebView — use a small delay
    this.synth.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      // Prefer an exact German voice if one is available
      const voices = this.synth!.getVoices();
      const germanVoice = voices.find(v => v.lang === lang) ?? voices.find(v => v.lang.startsWith('de'));
      if (germanVoice) utterance.voice = germanVoice;
      this.synth!.speak(utterance);
    }, 100);
  }

  isSupported(): boolean {
    return !!this.synth;
  }
}
