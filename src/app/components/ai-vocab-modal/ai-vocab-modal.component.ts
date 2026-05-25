import { Component, inject, signal, computed } from '@angular/core';
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
import { sparkles, save, close, refreshOutline, checkmarkCircle } from 'ionicons/icons';
import { VocabAiService, AiVocabResponse } from '../../services/vocab-ai.service';
import { VocabularyService } from '../../services/vocabulary.service';
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
export class AiVocabModalComponent {
  private modalCtrl   = inject(ModalController);
  private toastCtrl   = inject(ToastController);
  private alertCtrl   = inject(AlertController);
  private translate   = inject(TranslateService);
  private aiService   = inject(VocabAiService);
  private vocabService = inject(VocabularyService);

  step = signal<ModalStep>('input');
  word = signal('');
  wordType = signal<WordType | 'unknown'>('unknown');
  result = signal<AiVocabResponse | null>(null);
  errorMsg = signal('');

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
    addIcons({ sparkles, save, close, refreshOutline, checkmarkCircle });
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
      if (existingId) vocab._id = existingId;
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
}
