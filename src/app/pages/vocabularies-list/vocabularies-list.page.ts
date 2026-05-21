import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonSearchbar, IonSelect,
  IonSelectOption, IonButtons, IonBackButton, IonFooter
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
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
    IonSelectOption, IonButtons, IonBackButton, IonFooter,
    TranslatePipe
  ]
})
export class VocabulariesListPage implements OnInit {
  private router = inject(Router);
  private vocabService = inject(VocabularyService);

  searchTerm = signal('');
  filterType = signal<WordType | ''>('');
  filterLevel = signal<CefrLevel | ''>('');
  filterLearned = signal<'all' | 'learned' | 'unlearned'>('all');

  private allVocabs = toSignal(this.vocabService.vocabs$, { initialValue: [] as Vocabulary[] });

  filteredVocabs = computed(() => {
    const learned = this.filterLearned();
    return this.vocabService.filter(
      this.allVocabs(),
      this.filterType(),
      this.filterLevel(),
      this.searchTerm()
    ).filter(v =>
      learned === 'all' ? true :
      learned === 'learned' ? v.learned :
      !v.learned
    );
  });

  totalVocabs = computed(() => this.allVocabs().length);

  wordTypes: Array<{ value: WordType | ''; labelKey: string }> = [
    { value: '', labelKey: 'home.filter.allTypes' },
    { value: 'noun',        labelKey: 'wordType.noun' },
    { value: 'verb',        labelKey: 'wordType.verb' },
    { value: 'adjective',   labelKey: 'wordType.adjective' },
    { value: 'adverb',      labelKey: 'wordType.adverb' },
    { value: 'preposition', labelKey: 'wordType.preposition' },
    { value: 'conjunction', labelKey: 'wordType.conjunction' },
    { value: 'pronoun',     labelKey: 'wordType.pronoun' },
    { value: 'other',       labelKey: 'wordType.other' }
  ];

  levels: Array<{ value: CefrLevel | ''; label: string }> = [
    { value: '', label: 'home.filter.allLevels' },
    { value: 'A1', label: 'A1' }, { value: 'A2', label: 'A2' },
    { value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' },
    { value: 'C1', label: 'C1' }, { value: 'C2', label: 'C2' }
  ];

  constructor() {
    addIcons({ add, checkmarkCircle, ellipseOutline });
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
