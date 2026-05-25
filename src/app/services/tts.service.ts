import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private readonly isNative = Capacitor.isNativePlatform();
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  constructor() {
    if (!this.isNative && this.synth) {
      // Trigger voice list load on web
      if (this.synth.getVoices().length === 0) {
        this.synth.addEventListener('voiceschanged', () => {}, { once: true });
      }
    }
  }

  async speak(text: string, lang = 'de-DE'): Promise<void> {
    if (this.isNative) {
      await TextToSpeech.stop().catch(() => {});
      await TextToSpeech.speak({ text, lang, rate: 0.9, volume: 1.0 });
    } else {
      if (!this.synth) return;
      this.synth.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        const voices = this.synth!.getVoices();
        const germanVoice = voices.find(v => v.lang === lang) ?? voices.find(v => v.lang.startsWith('de'));
        if (germanVoice) utterance.voice = germanVoice;
        this.synth!.speak(utterance);
      }, 100);
    }
  }

  isSupported(): boolean {
    return this.isNative || !!this.synth;
  }
}
