import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
  IonSelectOption, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent,
  IonAccordionGroup, IonAccordion, IonToggle
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, remove, save, imageOutline, closeCircleOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { VocabularyService } from '../../services/vocabulary.service';
import {
  Vocabulary, WordType, CefrLevel, NounDetails, VerbDetails, AdjectiveDetails, ExampleSentence
} from '../../models/vocabulary.model';

@Component({
  selector: 'app-edit-vocabulary',
  templateUrl: './edit-vocabulary.page.html',
  styleUrls: ['./edit-vocabulary.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent,
    IonAccordionGroup, IonAccordion, IonToggle,
    TranslatePipe
  ]
})
export class EditVocabularyPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private vocabService = inject(VocabularyService);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);

  isNew = signal(true);
  existingVocab = signal<Vocabulary | null>(null);
  saving = signal(false);
  imagePreview = signal<string | null>(null);

  form!: FormGroup;

  wordTypes: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'other'];
  levels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  articles = ['der', 'die', 'das'] as const;

  constructor() {
    addIcons({ add, remove, save, imageOutline, closeCircleOutline });
  }

  async ngOnInit() {
    this.buildForm();
    const id = this.route.snapshot.paramMap.get('id')!;
    if (id !== 'new') {
      this.isNew.set(false);
      const vocab = await this.vocabService.getById(id);
      this.existingVocab.set(vocab);
      this.patchForm(vocab);
      if (vocab.imagePath) this.imagePreview.set(vocab.imagePath);
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      german: ['', Validators.required],
      english: ['', Validators.required],
      wordType: ['noun', Validators.required],
      level: ['A1', Validators.required],
      description: [''],
      learned: [false],
      imagePath: [''],
      examples: this.fb.array([]),

      // Noun
      nounArticle: ['der'],
      nounPlural: [''],
      nounBestimmt: this.buildDeklinationGroup(),
      nounUnbestimmt: this.buildDeklinationGroup(),

      // Verb
      verbIsSeparable: [false],
      verbIsRegular: [true],
      verbIsReflexive: [false],
      verbHilfsverb: ['haben'],
      verbPresent: this.buildConjugationGroup(),
      verbSimplePast: this.buildConjugationGroup(),
      verbPastPerfect: this.buildConjugationGroup(),
      verbFuture: this.buildConjugationGroup(),
      verbImperative: this.fb.group({ du: [''], wir: [''], ihr: [''], Sie: [''] }),

      // Adjective
      adjKomparativ: [''],
      adjSuperlativ: [''],
      adjMaskulin: this.buildDeklinationGroup(),
      adjFeminin: this.buildDeklinationGroup(),
      adjNeutral: this.buildDeklinationGroup(),
      adjPlurar: this.buildDeklinationGroup(),
    });
  }

  private buildDeklinationGroup(): FormGroup {
    return this.fb.group({ nominative: [''], akkusativ: [''], genitiv: [''], dativ: [''] });
  }

  private buildConjugationGroup(): FormGroup {
    return this.fb.group({ ich: [''], du: [''], erSieEs: [''], wir: [''], ihr: [''], sie: [''] });
  }

  get examples(): FormArray {
    return this.form.get('examples') as FormArray;
  }

  pickImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.imagePreview.set(dataUrl);
      this.form.patchValue({ imagePath: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imagePreview.set(null);
    this.form.patchValue({ imagePath: '' });
  }

  addExample() {
    if (this.examples.length < 5) {
      this.examples.push(this.fb.group({ german: [''], english: [''] }));
    }
  }

  removeExample(i: number) {
    this.examples.removeAt(i);
  }

  get selectedWordType(): WordType {
    return this.form.get('wordType')?.value;
  }

  private patchForm(vocab: Vocabulary) {
    this.form.patchValue({
      german: vocab.german,
      english: vocab.english,
      wordType: vocab.wordType,
      level: vocab.level,
      description: vocab.description || '',
      learned: vocab.learned,
      imagePath: vocab.imagePath || '',
    });

    // patch examples
    this.examples.clear();
    (vocab.examples || []).forEach(ex => {
      this.examples.push(this.fb.group({ german: [ex.german], english: [ex.english] }));
    });

    if (vocab.nounDetails) {
      const n = vocab.nounDetails;
      this.form.patchValue({
        nounArticle: n.article,
        nounPlural: n.plural,
        nounBestimmt: n.deklinationBestimmt,
        nounUnbestimmt: n.deklinationUnbestimmt,
      });
    }

    if (vocab.verbDetails) {
      const v = vocab.verbDetails;
      this.form.patchValue({
        verbIsSeparable: v.isSeparable,
        verbIsRegular: v.isRegular,
        verbIsReflexive: v.isReflexive ?? false,
        verbHilfsverb: v.hilfsverb,
        verbPresent: v.present,
        verbSimplePast: v.simplePast,
        verbPastPerfect: v.pastPerfect,
        verbFuture: v.future,
        verbImperative: v.imperative,
      });
    }

    if (vocab.adjectiveDetails) {
      const a = vocab.adjectiveDetails;
      this.form.patchValue({
        adjKomparativ: a.komparativ,
        adjSuperlativ: a.superlativ,
        adjMaskulin: a.deklinationMaskulin,
        adjFeminin: a.deklinationFeminin,
        adjNeutral: a.deklinationNeutral,
        adjPlurar: a.deklinationPlurar,
      });
    }
  }

  async save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const f = this.form.value;
    const now = new Date().toISOString();

    const examplesData: ExampleSentence[] = this.examples.controls
      .map(c => ({ german: c.get('german')?.value || '', english: c.get('english')?.value || '' }))
      .filter(e => e.german.trim());

    const vocab: Vocabulary = {
      _id: this.existingVocab()?._id || '',
      german: f.german,
      english: f.english,
      wordType: f.wordType,
      level: f.level,
      description: f.description,
      learned: f.learned,
      imagePath: f.imagePath || undefined,
      examples: examplesData,
      createdAt: this.existingVocab()?.createdAt || now,
      updatedAt: now,
    };

    if (f.wordType === 'noun') {
      vocab.nounDetails = {
        article: f.nounArticle,
        plural: f.nounPlural,
        deklinationBestimmt: f.nounBestimmt,
        deklinationUnbestimmt: f.nounUnbestimmt,
      };
    }

    if (f.wordType === 'verb') {
      vocab.verbDetails = {
        isSeparable: f.verbIsSeparable,
        isRegular: f.verbIsRegular,
        isReflexive: f.verbIsReflexive,
        hilfsverb: f.verbHilfsverb,
        present: f.verbPresent,
        simplePast: f.verbSimplePast,
        pastPerfect: f.verbPastPerfect,
        future: f.verbFuture,
        imperative: f.verbImperative,
      };
    }

    if (f.wordType === 'adjective') {
      vocab.adjectiveDetails = {
        komparativ: f.adjKomparativ,
        superlativ: f.adjSuperlativ,
        deklinationMaskulin: f.adjMaskulin,
        deklinationFeminin: f.adjFeminin,
        deklinationNeutral: f.adjNeutral,
        deklinationPlurar: f.adjPlurar,
      };
    }

    // Duplicate check only for new vocabs
    if (this.isNew()) {
      const duplicate = this.vocabService.findDuplicate(vocab.german, vocab.wordType);
      if (duplicate) {
        this.saving.set(false);
        const alert = await this.alertCtrl.create({
          header: this.translate.instant('edit.duplicate.title'),
          message: this.translate.instant('edit.duplicate.message'),
          buttons: [
            { text: this.translate.instant('edit.duplicate.ignore'), role: 'ignore' },
            { text: this.translate.instant('edit.duplicate.replace'), role: 'replace' },
          ]
        });
        await alert.present();
        const { role } = await alert.onDidDismiss();
        if (role !== 'replace') return;
        // overwrite the existing record
        vocab._id = duplicate._id;
        vocab.createdAt = duplicate.createdAt;
        this.saving.set(true);
      }
    }

    const saved = await this.vocabService.save(vocab);
    this.saving.set(false);
    this.router.navigate(['/vocabulary-details', saved._id]);
  }
}
