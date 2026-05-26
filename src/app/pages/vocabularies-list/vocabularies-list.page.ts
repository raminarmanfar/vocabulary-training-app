import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonFabList, IonSearchbar,
  IonPopover, IonCheckbox, IonButton,
  IonButtons, IonBackButton, IonFooter,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, ellipseOutline, chevronDownOutline, sparkles, mic, micOutline } from 'ionicons/icons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';
import { VocabularyService } from '../../services/vocabulary.service';
import { Vocabulary, WordType, CefrLevel } from '../../models/vocabulary.model';
import { AiVocabModalComponent } from '../../components/ai-vocab-modal/ai-vocab-modal.component';

@Component({
  selector: 'app-vocabularies-list',
  templateUrl: './vocabularies-list.page.html',
  styleUrls: ['./vocabularies-list.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonBadge, IonIcon, IonFab, IonFabButton, IonFabList, IonSearchbar,
    IonPopover, IonCheckbox, IonButton,
    IonButtons, IonBackButton, IonFooter,
    TranslatePipe
  ]
})
export class VocabulariesListPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private vocabService = inject(VocabularyService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  readonly allWordTypeValues: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other'];
  readonly allLevelValues: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  private loadTypes(): WordType[] {
    try {
      const saved = localStorage.getItem('filter_types');
      if (saved) return JSON.parse(saved) as WordType[];
    } catch {}
    return [...this.allWordTypeValues];
  }

  private loadLevels(): CefrLevel[] {
    try {
      const saved = localStorage.getItem('filter_levels');
      if (saved) return JSON.parse(saved) as CefrLevel[];
    } catch {}
    return [...this.allLevelValues];
  }

  private loadLearned(): 'all' | 'learned' | 'unlearned' {
    return (localStorage.getItem('filter_learned') as 'all' | 'learned' | 'unlearned') || 'all';
  }

  searchTerm = signal('');
  recording = signal(false);
  speechSupported = signal(false);
  private webRecognition: any = null;
  filterTypes = signal<WordType[]>(this.loadTypes());
  filterLevels = signal<CefrLevel[]>(this.loadLevels());
  filterLearned = signal<'all' | 'learned' | 'unlearned'>(this.loadLearned());

  private allVocabs = toSignal(this.vocabService.vocabs$, { initialValue: [] as Vocabulary[] });

  isAllTypesSelected = computed(() => this.filterTypes().length === this.allWordTypeValues.length);
  isAllLevelsSelected = computed(() => this.filterLevels().length === this.allLevelValues.length);

  filteredVocabs = computed(() => {
    const learned = this.filterLearned();
    const activeTypes = this.isAllTypesSelected() ? [] : this.filterTypes();
    const activeLevels = this.isAllLevelsSelected() ? [] : this.filterLevels();
    return this.vocabService.filter(
      this.allVocabs(),
      activeTypes,
      activeLevels,
      this.searchTerm()
    ).filter(v =>
      learned === 'all' ? true :
      learned === 'learned' ? v.learned :
      !v.learned
    );
  });

  totalVocabs = computed(() => this.allVocabs().length);

  toggleType(type: WordType) {
    const current = this.filterTypes();
    if (current.includes(type) && current.length === 1) return;
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    this.filterTypes.set(next);
  }

  toggleLevel(level: CefrLevel) {
    const current = this.filterLevels();
    if (current.includes(level) && current.length === 1) return;
    const next = current.includes(level) ? current.filter(l => l !== level) : [...current, level];
    this.filterLevels.set(next);
  }

  wordTypes: Array<{ value: WordType; labelKey: string }> = [
    { value: 'noun',        labelKey: 'wordType.noun' },
    { value: 'verb',        labelKey: 'wordType.verb' },
    { value: 'adjective',   labelKey: 'wordType.adjective' },
    { value: 'adverb',      labelKey: 'wordType.adverb' },
    { value: 'preposition', labelKey: 'wordType.preposition' },
    { value: 'conjunction', labelKey: 'wordType.conjunction' },
    { value: 'pronoun',     labelKey: 'wordType.pronoun' },
    { value: 'other',       labelKey: 'wordType.other' }
  ];

  levels: Array<{ value: CefrLevel; label: string }> = [
    { value: 'A1', label: 'A1' }, { value: 'A2', label: 'A2' },
    { value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' },
    { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }
  ];

  constructor() {
    addIcons({ add, checkmarkCircle, ellipseOutline, chevronDownOutline, sparkles, mic, micOutline });
    effect(() => localStorage.setItem('filter_types', JSON.stringify(this.filterTypes())));
    effect(() => localStorage.setItem('filter_levels', JSON.stringify(this.filterLevels())));
    effect(() => localStorage.setItem('filter_learned', this.filterLearned()));
  }

  async ngOnInit() {
    await this.vocabService.seedSampleData();
    await this.vocabService.load();
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
          this.searchTerm.set(event.results[0][0].transcript.trim());
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
  }

  ngOnDestroy() {
    if (this.recording()) this.stopRecording();
  }

  async toggleRecording() {
    if (this.recording()) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    this.searchTerm.set('');
    if (Capacitor.isNativePlatform()) {
      const { speechRecognition } = await SpeechRecognition.requestPermissions();
      if (speechRecognition !== 'granted') return;
      this.recording.set(true);
      try {
        const result = await SpeechRecognition.start({
          language: 'de-DE',
          maxResults: 1,
          partialResults: false,
          popup: true,
        });
        if (result.matches?.length) this.searchTerm.set(result.matches[0]);
      } catch { /* cancelled */ }
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

  openDetail(id: string) {
    this.router.navigate(['/vocabulary-details', id]);
  }

  addNew() {
    this.router.navigate(['/edit-vocabulary', 'new']);
  }

  async addWithAi() {
    const modal = await this.modalCtrl.create({
      component: AiVocabModalComponent,
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
      handleBehavior: 'cycle',
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data?._id) {
      this.router.navigate(['/vocabulary-details', data._id]);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  wordTypeColor(type: WordType): string {
    const map: Record<WordType, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', preposition: 'medium', conjunction: 'dark',
      pronoun: 'secondary', other: 'light', unknown: 'medium'
    };
    return map[type] || 'medium';
  }

  articleLabel(vocab: Vocabulary): string {
    if (vocab.wordType === 'noun' && vocab.nounDetails) {
      return vocab.nounDetails.article;
    }
    return '';
  }
}
