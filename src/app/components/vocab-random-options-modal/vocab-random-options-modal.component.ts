import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { close, refreshOutline, save, shuffle, sparkles, volumeHigh } from 'ionicons/icons';
import { Observable, of, retry } from 'rxjs';
import { CefrLevel, WordType } from '../../models/vocabulary.model';
import { LanguageService } from '../../services/language.service';
import { TtsService } from '../../services/tts.service';
import { AiVocabResponse, VocabAiService } from '../../services/vocab-ai.service';
import { VocabularyService } from '../../services/vocabulary.service';

export interface RandomVocabOptions {
  wordType: WordType | 'any';
  level: CefrLevel | 'any';
}

type ConjugationTab = 'present' | 'simplePast' | 'pastPerfect' | 'future';

@Component({
  selector: 'app-vocab-random-options-modal',
  templateUrl: './vocab-random-options-modal.component.html',
  styleUrls: ['./vocab-random-options-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonBadge,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    TranslatePipe,
  ],
})
export class VocabRandomOptionsModalComponent {
  private modalCtrl = inject(ModalController);
  private aiService = inject(VocabAiService);
  private vocabService = inject(VocabularyService);
  private toastCtrl = inject(ToastController);
  private langService = inject(LanguageService);
  private tts = inject(TtsService);
  private recentCanonicalWords: string[] = [];

  wordType = signal<WordType | 'any'>('any');
  level = signal<CefrLevel | 'any'>('any');
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal('');
  result = signal<AiVocabResponse | null>(null);
  conjugationTab = signal<ConjugationTab>('present');

  readonly cefrColors: Record<CefrLevel, string> = {
    A1: 'success',
    A2: 'success',
    B1: 'warning',
    B2: 'warning',
    C1: 'danger',
    C2: 'danger',
  };

  readonly wordTypes: Array<{ value: WordType | 'any'; labelKey: string }> = [
    { value: 'any', labelKey: 'ai.modal.randomAnyType' },
    { value: 'noun', labelKey: 'wordType.noun' },
    { value: 'verb', labelKey: 'wordType.verb' },
    { value: 'adjective', labelKey: 'wordType.adjective' },
    { value: 'adverb', labelKey: 'wordType.adverb' },
    { value: 'preposition', labelKey: 'wordType.preposition' },
    { value: 'conjunction', labelKey: 'wordType.conjunction' },
    { value: 'pronoun', labelKey: 'wordType.pronoun' },
    { value: 'other', labelKey: 'wordType.other' },
  ];

  readonly levels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  nativeTranslation = computed(() => {
    const res = this.result();
    if (!res) return null;
    const lang = this.langService.currentLang();
    if (lang === 'tr' && res.turkish) return res.turkish;
    if (lang === 'fa' && res.persian) return res.persian;
    return null;
  });

  currentConjugation = computed(() => {
    const res = this.result();
    if (!res?.verbDetails) return null;
    return res.verbDetails[this.conjugationTab()];
  });

  constructor() {
    addIcons({ close, shuffle, sparkles, save, refreshOutline, volumeHigh });
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  generate() {
    this.errorMsg.set('');
    this.loading.set(true);

    const selectedType = this.wordType();
    const selectedLevel = this.level();

    const previousGerman = this.toCanonicalGerman(this.result()?.german ?? '');
    this.result.set(null);
    this.conjugationTab.set('present');

    this.requestRandomVocabulary(
      {
        wordType: selectedType === 'any' ? undefined : selectedType,
        level: selectedLevel === 'any' ? undefined : selectedLevel,
      },
      previousGerman,
      0,
    );
  }

  private requestRandomVocabulary(
    options: { wordType?: WordType; level?: CefrLevel },
    previousGerman: string | undefined,
    sameWordRetries: number,
  ) {
    this.fetchRandomCandidate(options, previousGerman, sameWordRetries)
      .pipe(retry(1))
      .subscribe({
        next: (res) => {
          const normalized = this.toCanonicalGerman(res.german);
          const isDuplicate =
            (!!previousGerman && normalized === previousGerman) ||
            this.recentCanonicalWords.includes(normalized);

          if (isDuplicate && sameWordRetries < 7) {
            this.requestRandomVocabulary(options, previousGerman, sameWordRetries + 1);
            return;
          }

          if (isDuplicate) {
            const fallback = this.aiService.generateLocalRandom(options, [
              previousGerman ?? '',
              ...this.recentCanonicalWords,
            ]);
            this.pushRecentCanonicalWord(this.toCanonicalGerman(fallback.german));
            this.enrichForPreview(fallback, options, previousGerman, sameWordRetries);
            return;
          }

          this.pushRecentCanonicalWord(normalized);
          this.enrichForPreview(res, options, previousGerman, sameWordRetries);
        },
        error: () => {
          this.loading.set(false);
          this.errorMsg.set('Could not generate a random vocabulary right now. Please try again.');
        },
      });
  }

  private fetchRandomCandidate(
    options: { wordType?: WordType; level?: CefrLevel },
    previousGerman: string | undefined,
    attempt: number,
  ): Observable<AiVocabResponse> {
    if (attempt % 2 === 1) {
      return of(
        this.aiService.generateLocalRandom(options, [
          previousGerman ?? '',
          ...this.recentCanonicalWords,
        ]),
      );
    }

    return this.aiService.generateRandom(options);
  }

  private enrichForPreview(
    seed: AiVocabResponse,
    options: { wordType?: WordType; level?: CefrLevel },
    previousGerman: string | undefined,
    sameWordRetries: number,
  ) {
    const wt = seed.wordType === 'unknown' ? undefined : seed.wordType;
    const normalizedGerman = this.normalizeGermanForEnrichment(seed.german);
    this.aiService
      .generate(normalizedGerman, { wordType: wt })
      .pipe(retry(1))
      .subscribe({
        next: (enriched) => {
          if (!this.isRequestedLevelMatch(enriched.level, options.level)) {
            if (sameWordRetries < 7) {
              this.requestRandomVocabulary(options, previousGerman, sameWordRetries + 1);
              return;
            }

            const strictFallback = this.aiService.generateLocalRandom(options, [
              previousGerman ?? '',
              ...this.recentCanonicalWords,
            ]);
            this.pushRecentCanonicalWord(this.toCanonicalGerman(strictFallback.german));
            this.result.set(strictFallback);
            this.loading.set(false);
            return;
          }

          this.result.set(enriched);
          this.loading.set(false);
        },
        error: () => {
          if (!this.isRequestedLevelMatch(seed.level, options.level) && sameWordRetries < 7) {
            this.requestRandomVocabulary(options, previousGerman, sameWordRetries + 1);
            return;
          }

          // Fallback to seed result if enrichment fails.
          this.result.set(seed);
          this.loading.set(false);
        },
      });
  }

  private isRequestedLevelMatch(level: string | undefined, requestedLevel: CefrLevel | undefined) {
    if (!requestedLevel) return true;
    return (level ?? '').toUpperCase() === requestedLevel;
  }

  private normalizeGermanForEnrichment(german: string): string {
    const trimmed = german.trim();
    // Random responses sometimes include leading articles/pronouns that degrade enrich quality.
    return trimmed.replace(/^(der|die|das|ein|eine|einer|einem|einen|sich)\s+/i, '').trim();
  }

  private toCanonicalGerman(german: string): string {
    return this.normalizeGermanForEnrichment(german).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private pushRecentCanonicalWord(word: string) {
    if (!word) return;
    this.recentCanonicalWords = [...this.recentCanonicalWords.filter((w) => w !== word), word];
    if (this.recentCanonicalWords.length > 20) {
      this.recentCanonicalWords = this.recentCanonicalWords.slice(-20);
    }
  }

  setConjugationTab(value: string | undefined) {
    if (
      value === 'present' ||
      value === 'simplePast' ||
      value === 'pastPerfect' ||
      value === 'future'
    ) {
      this.conjugationTab.set(value);
    }
  }

  async speakVerb() {
    const res = this.result();
    if (!res || res.wordType !== 'verb') return;
    await this.tts.speak(res.german);
  }

  wordTypeColor(type: WordType): string {
    const map: Record<WordType, string> = {
      noun: 'primary',
      verb: 'success',
      adjective: 'warning',
      adverb: 'tertiary',
      preposition: 'medium',
      conjunction: 'dark',
      pronoun: 'secondary',
      other: 'light',
      unknown: 'medium',
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

  async save() {
    const result = this.result();
    if (!result) return;

    this.saving.set(true);
    try {
      const saved = await this.vocabService.save(this.aiService.toVocabulary(result));
      const toast = await this.toastCtrl.create({
        message: 'Random vocabulary saved.',
        duration: 1400,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
      this.modalCtrl.dismiss(saved, 'saved');
    } catch {
      this.errorMsg.set('Could not save vocabulary. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
