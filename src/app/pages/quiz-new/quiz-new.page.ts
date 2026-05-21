import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonBadge, IonProgressBar, IonIcon, IonSelect, IonSelectOption, IonLabel,
  IonInput
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle, closeCircle, trophyOutline, refreshOutline, arrowForward,
  arrowBack, helpCircleOutline, linkOutline, pencilOutline, listOutline
} from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { Vocabulary } from '../../models/vocabulary.model';
import { QuizSet, QuizType, Direction, SavedQuestion, SavedMCQ, SavedFillQ, SavedMatchQ } from '../../models/quiz-set.model';
import { QuizSetService } from '../../services/quiz-set.service';

type QuizPhase = 'start' | 'question' | 'result';

interface MCQuestion {
  type: 'multiple-choice';
  vocab: Vocabulary;
  options: string[];
  correctAnswer: string;
}

interface FillQuestion {
  type: 'fill-blank';
  vocab: Vocabulary;
  sentence: string;
  correctAnswer: string;
  fullSentence: string;
}

interface MatchPair { id: string; german: string; english: string; }
interface MatchQuestion {
  type: 'matching';
  pairs: MatchPair[];
  leftItems: MatchPair[];
  rightItems: MatchPair[];
  matched: Record<string, string>;
  wrongPair: string | null;
}

type QuizQuestion = MCQuestion | FillQuestion | MatchQuestion;

@Component({
  selector: 'app-quiz-new',
  standalone: true,
  templateUrl: './quiz-new.page.html',
  styleUrls: ['./quiz-new.page.scss'],
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonBadge, IonProgressBar, IonIcon, IonSelect, IonSelectOption, IonLabel,
    IonInput,
    TranslatePipe
  ]
})
export class QuizNewPage implements OnInit {
  private vocabService = inject(VocabularyService);
  private quizSetService = inject(QuizSetService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private allVocabs = toSignal(this.vocabService.vocabs$, { initialValue: [] as Vocabulary[] });

  phase = signal<QuizPhase>('start');
  private activeQuizSet: QuizSet | null = null;
  private existingId: string | null = null;
  questionCount = signal<number>(10);
  direction = signal<Direction>('de-en');
  quizType = signal<QuizType>('multiple-choice');

  questions: QuizQuestion[] = [];
  currentIndex = signal(0);
  score = signal(0);

  selectedAnswer = signal<string | null>(null);
  answered = signal(false);

  fillInput = signal('');
  fillChecked = signal(false);
  fillCorrect = signal(false);

  selectedLeft = signal<string | null>(null);
  matchDone = signal(false);

  readonly questionCountOptions = [5, 10, 20, 30];
  readonly quizTypes: Array<{ value: QuizType; labelKey: string; icon: string }> = [
    { value: 'multiple-choice', labelKey: 'quiz.type.multipleChoice', icon: 'list-outline' },
    { value: 'fill-blank',      labelKey: 'quiz.type.fillBlank',      icon: 'pencil-outline' },
    { value: 'matching',        labelKey: 'quiz.type.matching',        icon: 'link-outline' },
  ];

  currentQuestion = computed(() => this.questions[this.currentIndex()] ?? null);
  progress = computed(() => this.questions.length
    ? (this.currentIndex() + (this.answered() || this.fillChecked() || this.matchDone() ? 1 : 0)) / this.questions.length
    : 0);
  scorePercent = computed(() => this.questions.length
    ? Math.round((this.score() / this.maxScore()) * 100)
    : 0);

  constructor() {
    addIcons({ checkmarkCircle, closeCircle, trophyOutline, refreshOutline, arrowForward, arrowBack, helpCircleOutline, linkOutline, pencilOutline, listOutline });
  }

  async ngOnInit() {
    const p = this.route.snapshot.queryParamMap;
    if (p.get('type')) this.quizType.set(p.get('type') as QuizType);
    if (p.get('direction')) this.direction.set(p.get('direction') as Direction);
    if (p.get('count')) this.questionCount.set(Number(p.get('count')));
    if (p.get('id')) this.existingId = p.get('id');
    await this.vocabService.load();
    if (p.get('autostart') === '1' && this.existingId) {
      const existing = await this.quizSetService.getById(this.existingId);
      if (existing?.savedQuestions?.length) {
        // Resume from saved state
        this.activeQuizSet = existing;
        this.existingId = null;
        this.questions = this._restoreQuestions(existing.savedQuestions);
        this.currentIndex.set(existing.currentIndex ?? 0);
        this.score.set(existing.score ?? 0);
        this._resetQuestionState();
        this.phase.set('question');
        return;
      }
    }
    if (p.get('autostart') === '1') {
      await this.startQuiz();
    }
  }

  germanDisplay(vocab: Vocabulary): string {
    if (vocab.wordType === 'noun' && vocab.nounDetails) {
      return `${vocab.nounDetails.article} ${vocab.german}`;
    }
    return vocab.german;
  }

  async startQuiz() {
    const pool = [...this.allVocabs()];
    if (pool.length < 4) return;

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const type = this.quizType();

    if (type === 'matching') {
      const groupSize = 4;
      const count = Math.min(this.questionCount(), Math.floor(shuffled.length / groupSize) * groupSize);
      const selected = shuffled.slice(0, count);
      this.questions = [];
      for (let i = 0; i < selected.length; i += groupSize) {
        const chunk = selected.slice(i, i + groupSize);
        const pairs: MatchPair[] = chunk.map(v => ({ id: v._id, german: this.germanDisplay(v), english: v.english }));
        this.questions.push({
          type: 'matching',
          pairs,
          leftItems: pairs,
          rightItems: [...pairs].sort(() => Math.random() - 0.5),
          matched: {},
          wrongPair: null,
        });
      }
    } else if (type === 'fill-blank') {
      const withExamples = shuffled.filter(v => v.examples && v.examples.length > 0);
      const selected = withExamples.slice(0, Math.min(this.questionCount(), withExamples.length));
      this.questions = selected.map(vocab => {
        const example = vocab.examples[Math.floor(Math.random() * vocab.examples.length)];
        const word = vocab.german;
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const sentence = example.german.replace(regex, '_____');
        return {
          type: 'fill-blank' as const,
          vocab,
          sentence,
          fullSentence: example.german,
          correctAnswer: word.toLowerCase(),
        };
      });
    } else {
      const selected = shuffled.slice(0, Math.min(this.questionCount(), shuffled.length));
      const dir = this.direction();
      this.questions = selected.map(vocab => {
        const correct = dir === 'de-en' ? vocab.english : this.germanDisplay(vocab);
        const wrongs = pool
          .filter(v => v._id !== vocab._id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(v => dir === 'de-en' ? v.english : this.germanDisplay(v));
        const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
        return { type: 'multiple-choice' as const, vocab, options, correctAnswer: correct };
      });
    }

    let totalQuestions: number;
    if (type === 'matching') {
      totalQuestions = this.questions.reduce((sum, q) =>
        sum + (q.type === 'matching' ? q.pairs.length : 0), 0);
    } else {
      totalQuestions = this.questions.length;
    }

    this.currentIndex.set(0);
    this.score.set(0);
    this._resetQuestionState();

    if (this.existingId) {
      // Reuse the existing QuizSet record — reset it for a fresh attempt
      const existing = await this.quizSetService.getById(this.existingId);
      if (existing) {
        this.activeQuizSet = await this.quizSetService.update({
          ...existing,
          quizType: type,
          direction: this.direction(),
          totalQuestions,
          questionsAnswered: 0,
          score: 0,
          status: 'in-progress',
          completedAt: undefined,
        });
        this.existingId = null;
      }
    }
    if (!this.activeQuizSet) {
      this.activeQuizSet = await this.quizSetService.create({
        quizType: type,
        direction: this.direction(),
        totalQuestions,
        questionsAnswered: 0,
        score: 0,
        status: 'in-progress',
      });
    }

    // Save questions so the quiz can be resumed if the user leaves
    if (this.activeQuizSet) {
      await this.quizSetService.update({
        ...this.activeQuizSet,
        savedQuestions: this._serializeQuestions(),
        currentIndex: 0,
      });
    }

    this.phase.set('question');
  }

  private _serializeQuestions(): SavedQuestion[] {
    return this.questions.map(q => {
      if (q.type === 'multiple-choice') {
        return {
          type: 'multiple-choice',
          vocabId: q.vocab._id,
          vocabGerman: q.vocab.german,
          vocabEnglish: q.vocab.english,
          vocabWordType: q.vocab.wordType,
          nounArticle: q.vocab.nounDetails?.article,
          options: q.options,
          correctAnswer: q.correctAnswer,
        } as SavedMCQ;
      } else if (q.type === 'fill-blank') {
        return {
          type: 'fill-blank',
          vocabId: q.vocab._id,
          vocabGerman: q.vocab.german,
          vocabWordType: q.vocab.wordType,
          sentence: q.sentence,
          fullSentence: q.fullSentence,
          correctAnswer: q.correctAnswer,
        } as SavedFillQ;
      } else {
        return {
          type: 'matching',
          pairs: q.pairs,
          leftOrder: q.leftItems.map(i => i.id),
          rightOrder: q.rightItems.map(i => i.id),
        } as SavedMatchQ;
      }
    });
  }

  private _restoreQuestions(saved: SavedQuestion[]): QuizQuestion[] {
    return saved.map(q => {
      if (q.type === 'multiple-choice') {
        const vocab = {
          _id: q.vocabId, german: q.vocabGerman, english: q.vocabEnglish,
          wordType: q.vocabWordType as any,
          nounDetails: q.nounArticle ? { article: q.nounArticle } as any : undefined,
          examples: [], learned: false,
        } as unknown as Vocabulary;
        return { type: 'multiple-choice', vocab, options: q.options, correctAnswer: q.correctAnswer } as MCQuestion;
      } else if (q.type === 'fill-blank') {
        const vocab = {
          _id: q.vocabId, german: q.vocabGerman, english: '',
          wordType: q.vocabWordType as any, examples: [], learned: false,
        } as unknown as Vocabulary;
        return { type: 'fill-blank', vocab, sentence: q.sentence, fullSentence: q.fullSentence, correctAnswer: q.correctAnswer } as FillQuestion;
      } else {
        const pairMap = new Map(q.pairs.map(p => [p.id, p]));
        return {
          type: 'matching',
          pairs: q.pairs,
          leftItems: q.leftOrder.map(id => pairMap.get(id)!),
          rightItems: q.rightOrder.map(id => pairMap.get(id)!),
          matched: {},
          wrongPair: null,
        } as MatchQuestion;
      }
    });
  }

  private _resetQuestionState() {
    this.selectedAnswer.set(null);
    this.answered.set(false);
    this.fillInput.set('');
    this.fillChecked.set(false);
    this.fillCorrect.set(false);
    this.selectedLeft.set(null);
    this.matchDone.set(false);
  }

  selectAnswer(option: string) {
    if (this.answered()) return;
    this.selectedAnswer.set(option);
    this.answered.set(true);
    const q = this.currentQuestion() as MCQuestion;
    if (option === q.correctAnswer) this.score.update(s => s + 1);
  }

  optionColor(option: string): string {
    if (!this.answered()) return 'light';
    const q = this.currentQuestion() as MCQuestion;
    if (option === q.correctAnswer) return 'success';
    if (option === this.selectedAnswer()) return 'danger';
    return 'light';
  }

  optionIcon(option: string): string | null {
    if (!this.answered()) return null;
    const q = this.currentQuestion() as MCQuestion;
    if (option === q.correctAnswer) return 'checkmark-circle';
    if (option === this.selectedAnswer()) return 'close-circle';
    return null;
  }

  questionPrompt = computed(() => {
    const q = this.currentQuestion();
    if (!q || q.type !== 'multiple-choice') return '';
    return this.direction() === 'de-en' ? this.germanDisplay(q.vocab) : q.vocab.english;
  });

  get mcQuestion(): MCQuestion | null {
    const q = this.currentQuestion();
    return q?.type === 'multiple-choice' ? q : null;
  }
  get fillQuestion(): FillQuestion | null {
    const q = this.currentQuestion();
    return q?.type === 'fill-blank' ? q : null;
  }
  get matchQuestion(): MatchQuestion | null {
    const q = this.currentQuestion();
    return q?.type === 'matching' ? q : null;
  }

  checkFill() {
    if (this.fillChecked()) return;
    const q = this.currentQuestion() as FillQuestion;
    const correct = this.fillInput().trim().toLowerCase() === q.correctAnswer.toLowerCase();
    this.fillCorrect.set(correct);
    this.fillChecked.set(true);
    if (correct) this.score.update(s => s + 1);
  }

  selectLeft(id: string) {
    if (this.matchDone()) return;
    const q = this.currentQuestion() as MatchQuestion;
    if (q.matched[id] !== undefined) return;
    this.selectedLeft.set(id);
  }

  selectRight(id: string) {
    const leftId = this.selectedLeft();
    if (!leftId || this.matchDone()) return;
    const q = this.currentQuestion() as MatchQuestion;
    if (q.matched[leftId] !== undefined) return;

    const correct = leftId === id;
    if (correct) {
      q.matched[leftId] = id;
      q.wrongPair = null;
      this.selectedLeft.set(null);
      this.score.update(s => s + 1);
      if (Object.keys(q.matched).length === q.pairs.length) {
        this.matchDone.set(true);
      }
    } else {
      q.wrongPair = leftId;
      setTimeout(() => { q.wrongPair = null; }, 700);
      this.selectedLeft.set(null);
    }
  }

  isMatchedLeft(id: string): boolean {
    const q = this.currentQuestion() as MatchQuestion;
    return q.matched[id] !== undefined;
  }

  isMatchedRight(id: string): boolean {
    const q = this.currentQuestion() as MatchQuestion;
    return Object.values(q.matched).includes(id);
  }

  leftColor(id: string): string {
    const q = this.currentQuestion() as MatchQuestion;
    if (q.matched[id]) return 'success';
    if (q.wrongPair === id) return 'danger';
    if (this.selectedLeft() === id) return 'warning';
    return 'light';
  }

  rightColor(id: string): string {
    if (this.isMatchedRight(id)) return 'success';
    return 'light';
  }

  async next() {
    const next = this.currentIndex() + 1;
    if (next >= this.questions.length) {
      await this._completeQuizSet();
      this.phase.set('result');
    } else {
      this.currentIndex.set(next);
      this._resetQuestionState();
    }
  }

  private async _completeQuizSet() {
    if (!this.activeQuizSet) return;
    await this.quizSetService.update({
      ...this.activeQuizSet,
      score: this.score(),
      questionsAnswered: this.activeQuizSet.totalQuestions,
      status: 'completed',
      completedAt: new Date().toISOString(),
      savedQuestions: undefined,
      currentIndex: undefined,
    });
    this.activeQuizSet = null;
  }

  scoreGrade = computed(() => {
    const p = this.scorePercent();
    if (p >= 90) return 'quiz.grade.excellent';
    if (p >= 70) return 'quiz.grade.good';
    if (p >= 50) return 'quiz.grade.fair';
    return 'quiz.grade.keepPracticing';
  });

  maxScore = computed(() => {
    if (this.quizType() === 'matching') {
      return this.questions.reduce((sum, q) => sum + (q.type === 'matching' ? q.pairs.length : 0), 0);
    }
    return this.questions.length;
  });

  restart() { this.phase.set('start'); }

  async goBack() {
    await this._saveProgress();
    this.router.navigate(['/quiz']);
  }

  private async _saveProgress() {
    if (this.activeQuizSet && this.phase() === 'question') {
      await this.quizSetService.update({
        ...this.activeQuizSet,
        score: this.score(),
        questionsAnswered: this.currentIndex(),
        currentIndex: this.currentIndex(),
        savedQuestions: this._serializeQuestions(),
      });
    }
  }
}
