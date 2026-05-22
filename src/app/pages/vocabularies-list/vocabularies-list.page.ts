import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonSearchbar, IonSelect,
  IonSelectOption, IonPopover, IonCheckbox, IonButton,
  IonButtons, IonBackButton, IonFooter
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, ellipseOutline, chevronDownOutline } from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { Vocabulary, WordType, CefrLevel } from '../../models/vocabulary.model';

@Component({
  selector: 'app-vocabularies-list',
  templateUrl: './vocabularies-list.page.html',
  styleUrls: ['./vocabularies-list.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonBadge, IonIcon, IonFab, IonFabButton, IonSearchbar, IonSelect,
    IonSelectOption, IonPopover, IonCheckbox, IonButton,
    IonButtons, IonBackButton, IonFooter,
    TranslatePipe
  ]
})
export class VocabulariesListPage implements OnInit {
  private router = inject(Router);
  private vocabService = inject(VocabularyService);

  readonly allWordTypeValues: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other'];
  readonly allLevelValues: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  searchTerm = signal('');
  filterTypes = signal<WordType[]>(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other']);
  filterLevels = signal<CefrLevel[]>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  filterLearned = signal<'all' | 'learned' | 'unlearned'>('all');

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
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    this.filterTypes.set(next.length === 0 ? [...this.allWordTypeValues] : next);
  }

  toggleLevel(level: CefrLevel) {
    const current = this.filterLevels();
    const next = current.includes(level) ? current.filter(l => l !== level) : [...current, level];
    this.filterLevels.set(next.length === 0 ? [...this.allLevelValues] : next);
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
    addIcons({ add, checkmarkCircle, ellipseOutline, chevronDownOutline });
  }

  async ngOnInit() {
    await this.vocabService.seedSampleData();
    await this.vocabService.load();
  }

  openDetail(id: string) {
    this.router.navigate(['/vocabulary-details', id]);
  }

  addNew() {
    this.router.navigate(['/edit-vocabulary', 'new']);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  wordTypeColor(type: WordType): string {
    const map: Record<WordType, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', preposition: 'medium', conjunction: 'dark',
      pronoun: 'secondary', other: 'light'
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
