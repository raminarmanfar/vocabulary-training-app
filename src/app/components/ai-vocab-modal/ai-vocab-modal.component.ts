import { Component, inject, signal, computed, Input, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonSelect, IonSelectOption, IonButton, IonButtons,
  IonIcon, IonSpinner, IonList, IonBadge,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  AlertController, ModalController, ToastController
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { sparkles, save, close, refreshOutline, checkmarkCircle, micOutline, mic } from 'ionicons/icons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { VocabAiService, AiVocabResponse } from '../../services/vocab-ai.service';
import { VocabularyService } from '../../services/vocabulary.service';
import { LanguageService } from '../../services/language.service';
import { WordType, CefrLevel, Vocabulary } from '../../models/vocabulary.model';

type ModalStep = 'input' | 'loading' | 'preview' | 'saving';

@Component({
  selector: 'app-ai-vocab-modal',
  templateUrl: './ai-vocab-modal.component.html',
  styleUrls: ['./ai-vocab-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonSelect, IonSelectOption, IonButton, IonButtons,
    IonIcon, IonSpinner, IonList, IonBadge,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    TranslatePipe
  ]
})
export class AiVocabModalComponent implements OnInit, OnDestroy {
  private modalCtrl   = inject(ModalController);
  private toastCtrl   = inject(ToastController);
  private alertCtrl   = inject(AlertController);
  private translate   = inject(TranslateService);
  private aiService   = inject(VocabAiService);
  private vocabService = inject(VocabularyService);
  private langService  = inject(LanguageService);

  @Input() initialWord?: string;

  step = signal<ModalStep>('input');
  word = signal('');
  wordType = signal<WordType | 'unknown'>('unknown');
  result = signal<AiVocabResponse | null>(null);
  errorMsg = signal('');
  recording = signal(false);
  speechSupported = signal(false);
  // Web Speech API fallback for browser
  private webRecognition: any = null;

  readonly wordTypes: Array<{ value: WordType | 'unknown'; labelKey: string }> = [
    { value: 'unknown',     labelKey: 'wordType.unknown' },
    { value: 'noun',        labelKey: 'wordType.noun' },
    { value: 'verb',        labelKey: 'wordType.verb' },
    { value: 'adjective',   labelKey: 'wordType.adjective' },
    { value: 'adverb',      labelKey: 'wordType.adverb' },
    { value: 'preposition', labelKey: 'wordType.preposition' },
    { value: 'conjunction', labelKey: 'wordType.conjunction' },
    { value: 'pronoun',     labelKey: 'wordType.pronoun' },
    { value: 'other',       labelKey: 'wordType.other' },
  ];

  readonly cefrColors: Record<CefrLevel, string> = {
    A1: 'success', A2: 'success', B1: 'warning',
    B2: 'warning', C1: 'danger', C2: 'danger'
  };

  canGenerate = computed(() => this.word().trim().length > 0);

  constructor() {
    addIcons({ sparkles, save, close, refreshOutline, checkmarkCircle, micOutline, mic });
  }

  ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      // Native: use Capacitor plugin
      SpeechRecognition.available().then(({ available }) => {
        this.speechSupported.set(available);
      });
    } else {
      // Browser: fall back to Web Speech API
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.speechSupported.set(true);
        this.webRecognition = new SR();
        this.webRecognition.lang = 'de-DE';
        this.webRecognition.interimResults = false;
        this.webRecognition.maxAlternatives = 1;
        this.webRecognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.trim();
          this.word.set(transcript);
          this.recording.set(false);
        };
        this.webRecognition.onerror = (event: any) => {
          this.recording.set(false);
          const msg = event.error === 'not-allowed'
            ? 'Microphone permission denied'
            : event.error === 'network'
            ? 'Speech recognition requires internet (Chrome only)'
            : `Speech error: ${event.error}`;
          this.toastCtrl.create({ message: msg, duration: 3000, color: 'warning', position: 'bottom' })
            .then(t => t.present());
        };
        this.webRecognition.onend   = () => this.recording.set(false);
      }
    }
    if (this.initialWord) {
      this.word.set(this.initialWord);
      this.generate();
    }
  }

  ngOnDestroy() {
    this.stopRecording();
  }

  async toggleRecording() {
    if (this.recording()) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    this.word.set('');
    if (Capacitor.isNativePlatform()) {
      // Request permission if not already granted
      const { speechRecognition } = await SpeechRecognition.requestPermissions();
      if (speechRecognition !== 'granted') return;

      this.recording.set(true);
      try {
        // popup:true uses the native Android voice dialog — most reliable approach
        const result = await SpeechRecognition.start({
          language: 'de-DE',
          maxResults: 1,
          partialResults: false,
          popup: true,
        });
        if (result.matches?.length) this.word.set(result.matches[0]);
      } catch { /* user cancelled or error */ }
      this.recording.set(false);
    } else {
      this.webRecognition?.start();
      this.recording.set(true);
    }
  }

  private async stopRecording() {
    if (Capacitor.isNativePlatform()) {
      await SpeechRecognition.stop().catch(() => {});
    } else {
      this.webRecognition?.stop();
    }
    this.recording.set(false);
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async generate() {
    if (!this.canGenerate()) return;
    this.step.set('loading');
    this.errorMsg.set('');

    const wt = this.wordType() === 'unknown' ? undefined : this.wordType() as WordType;
    this.aiService.generate(this.word(), wt).subscribe({
      next: (res) => {
        this.result.set(res);
        this.step.set('preview');
      },
      error: (err) => {
        const code = err?.error?.error;
        const correction = err?.error?.correction;
        if (code === 'NOT_GERMAN_WORD') {
          this.errorMsg.set(this.translate.instant('ai.error.notGermanWord'));
        } else if (code === 'WORD_MISSPELLED' && correction) {
          this.errorMsg.set(this.translate.instant('ai.error.misspelled', { correction }));
        } else {
          this.errorMsg.set(this.translate.instant(code ?? 'ai.error.unknown'));
        }
        this.step.set('input');
      }
    });
  }

  reset() {
    this.result.set(null);
    this.step.set('input');
  }

  async save() {
    const res = this.result();
    if (!res) return;

    // Check for duplicate by German word (case-insensitive)
    const term = res.german.trim().toLowerCase();
    const existing = this.vocabService.vocabsSubject.value
      .find((v: Vocabulary) => v.german.trim().toLowerCase() === term);

    if (existing) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('ai.duplicate.header'),
        message: this.translate.instant('ai.duplicate.message', { word: existing.german }),
        buttons: [
          { text: this.translate.instant('ai.duplicate.cancel'), role: 'cancel', handler: () => this.step.set('preview') },
          { text: this.translate.instant('ai.duplicate.replace'), handler: () => this.doSave(res, existing._id) }
        ]
      });
      this.step.set('preview');
      await alert.present();
      return;
    }

    await this.doSave(res);
  }

  private async doSave(res: AiVocabResponse, existingId?: string) {
    this.step.set('saving');
    try {
      const vocab = this.aiService.toVocabulary(res);
      if (existingId) {
        vocab._id = existingId;
        const existing = this.vocabService.vocabsSubject.value
          .find((v: Vocabulary) => v._id === existingId);
        if (existing) {
          vocab.imagePath = existing.imagePath;
          vocab.learned = existing.learned;
        }
      }
      const saved = await this.vocabService.save(vocab);
      const toast = await this.toastCtrl.create({
        message: '',
        duration: 1800,
        color: 'success',
        position: 'bottom',
        icon: 'checkmark-circle'
      });
      await toast.present();
      this.modalCtrl.dismiss(saved, 'saved');
    } catch {
      this.errorMsg.set('ai.error.saveFailed');
      this.step.set('preview');
    }
  }

  wordTypeColor(type: WordType): string {
    const map: Record<WordType, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', preposition: 'medium', conjunction: 'dark',
      pronoun: 'secondary', other: 'light', unknown: 'medium'
    };
    return map[type] ?? 'medium';
  }

  levelColor(level: string): string {
    return this.cefrColors[level as CefrLevel] ?? 'medium';
  }

  objectKeys(obj: object | null | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  exampleTranslation(ex: { english: string; turkish?: string; persian?: string }): string {
    const lang = this.langService.currentLang();
    if (lang === 'tr') return ex.turkish ?? ex.english;
    if (lang === 'fa') return ex.persian ?? ex.english;
    return ex.english;
  }
}
