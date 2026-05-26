import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonTextarea, IonButton, IonButtons, IonIcon, IonSpinner,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonList,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { close, sparkles, save, refreshOutline, mic, micOutline } from 'ionicons/icons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { SentenceAiService, AiSentenceResponse } from '../../services/sentence-ai.service';
import { SentenceService } from '../../services/sentence.service';
import { LanguageService } from '../../services/language.service';

type ModalStep = 'input' | 'loading' | 'preview' | 'saving';

@Component({
  selector: 'app-ai-sentence-modal',
  templateUrl: './ai-sentence-modal.component.html',
  styleUrls: ['./ai-sentence-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonTextarea, IonButton, IonButtons, IonIcon, IonSpinner,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonList,
    TranslatePipe
  ]
})
export class AiSentenceModalComponent implements OnInit, OnDestroy {
  private modalCtrl     = inject(ModalController);
  private toastCtrl     = inject(ToastController);
  private translate     = inject(TranslateService);
  private aiService     = inject(SentenceAiService);
  private sentenceService = inject(SentenceService);
  private langService   = inject(LanguageService);

  step        = signal<ModalStep>('input');
  sentence    = signal('');
  result      = signal<AiSentenceResponse | null>(null);
  errorMsg    = signal('');
  recording   = signal(false);
  speechSupported = signal(false);
  private webRecognition: any = null;

  constructor() {
    addIcons({ close, sparkles, save, refreshOutline, mic, micOutline });
  }

  ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      SpeechRecognition.available().then(({ available }) => this.speechSupported.set(available));
    } else {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.speechSupported.set(true);
        this.webRecognition = new SR();
        this.webRecognition.lang = 'de-DE';
        this.webRecognition.interimResults = false;
        this.webRecognition.maxAlternatives = 1;
        this.webRecognition.onresult = (event: any) => {
          this.sentence.set(event.results[0][0].transcript.trim());
          this.recording.set(false);
        };
        this.webRecognition.onerror = () => this.recording.set(false);
        this.webRecognition.onend   = () => this.recording.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.stopRecording();
  }

  async toggleRecording() {
    if (this.recording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    this.recording.set(true);
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await SpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== 'granted') {
          this.recording.set(false);
          return;
        }
        await SpeechRecognition.start({ language: 'de-DE', maxResults: 1, prompt: '', partialResults: false, popup: false });
        SpeechRecognition.addListener('partialResults', (data: any) => {
          if (data.matches?.length) {
            this.sentence.set(data.matches[0]);
            this.recording.set(false);
            SpeechRecognition.stop();
          }
        });
      } catch {
        this.recording.set(false);
      }
    } else {
      this.webRecognition?.start();
    }
  }

  private stopRecording() {
    if (!this.recording()) return;
    this.recording.set(false);
    if (Capacitor.isNativePlatform()) {
      SpeechRecognition.stop();
    } else {
      this.webRecognition?.stop();
    }
  }

  get canAnalyze(): boolean {
    return this.sentence().trim().length > 2;
  }

  nativeTranslation(): string | null {
    const res = this.result();
    if (!res) return null;
    const lang = this.langService.currentLang();
    if (lang === 'tr') return res.turkish ?? null;
    if (lang === 'fa') return res.persian ?? null;
    return null;
  }

  async analyze() {
    this.errorMsg.set('');
    this.step.set('loading');
    this.aiService.analyze(this.sentence()).subscribe({
      next: (res) => {
        this.result.set(res);
        this.step.set('preview');
      },
      error: () => {
        this.errorMsg.set(this.translate.instant('sentences.modal.analyzeError'));
        this.step.set('input');
      }
    });
  }

  async save() {
    const res = this.result();
    if (!res) return;
    this.step.set('saving');
    const sentence = this.aiService.toSentence(res);
    await this.sentenceService.save(sentence);
    const toast = await this.toastCtrl.create({
      message: this.translate.instant('sentences.modal.saveSuccess'),
      duration: 2000, color: 'success', position: 'bottom'
    });
    await toast.present();
    this.modalCtrl.dismiss({ saved: true });
  }

  retry() {
    this.result.set(null);
    this.errorMsg.set('');
    this.step.set('input');
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  wordTypeColor(type: string): string {
    const map: Record<string, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', other: 'medium'
    };
    return map[type] ?? 'medium';
  }
}
