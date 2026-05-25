import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonBadge, IonImg
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { App } from '@capacitor/app';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, ellipseOutline, informationCircleOutline,
  refreshOutline, arrowForwardOutline, schoolOutline, volumeHighOutline, closeCircleOutline,
  statsChartOutline, timeOutline
} from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { TtsService } from '../../services/tts.service';
import { DatabaseService } from '../../services/database.service';
import { Vocabulary } from '../../models/vocabulary.model';
import { TrainSession, TrainSessionItem } from '../../models/train-session.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-train',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonBadge, IonImg,
    TranslatePipe
  ],
  templateUrl: './train.page.html',
  styleUrls: ['./train.page.scss']
})
export class TrainPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  private router = inject(Router);
  private vocabService = inject(VocabularyService);
  private tts = inject(TtsService);
  private db = inject(DatabaseService);
  private translate = inject(TranslateService);

  private allVocabs = toSignal(this.vocabService.vocabs$, { initialValue: [] as Vocabulary[] });

  unlearned = computed(() => this.allVocabs().filter(v => !v.learned));

  current = signal<Vocabulary | null>(null);
  flipped = signal(false);
  done = signal(false);
  elapsedSec = signal(0);

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private appStateHandle: { remove: () => Promise<void> } | null = null;

  // Session tracking
  private sessionId = '';
  private sessionStartedAt = 0;
  private cardShownAt = 0;
  private sessionItems: TrainSessionItem[] = [];
  private sessionSaved = false;
  private isNavigatingToDetails = false;

  constructor() {
    addIcons({ checkmarkCircleOutline, ellipseOutline, informationCircleOutline, refreshOutline, arrowForwardOutline, schoolOutline, volumeHighOutline, closeCircleOutline, statsChartOutline, timeOutline });
  }

  async ngOnInit() {
    this.initSession();
    await this.vocabService.load();
    await this.pickRandom();
    this.setupAppStateListener();
  }

  ngOnDestroy() {
    this.stopTimer();
    this.appStateHandle?.remove();
  }

  private initSession() {
    const now = Date.now();
    this.sessionId = `session_${now}_${Math.random().toString(36).slice(2)}`;
    this.sessionStartedAt = now;
    this.cardShownAt = now;
    this.sessionItems = [];
    this.sessionSaved = false;
    this.elapsedSec.set(0);
    this.startTimer();
  }

  private async setupAppStateListener() {
    this.appStateHandle = await App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        void this.autoSaveSession();
      }
    });
  }

  ionViewWillLeave() {
    if (!this.isNavigatingToDetails) {
      void this.autoSaveSession();
    }
    this.isNavigatingToDetails = false;
  }

  private async autoSaveSession() {
    if (this.sessionSaved || this.sessionItems.length === 0) return;
    this.sessionSaved = true;
    this.stopTimer();
    const now = Date.now();
    const session: TrainSession = {
      _id: this.sessionId,
      startedAt: new Date(this.sessionStartedAt).toISOString(),
      finishedAt: new Date(now).toISOString(),
      totalTimeMs: now - this.sessionStartedAt,
      learnedCount: this.sessionItems.filter(i => i.learnedInSession).length,
      notLearnedCount: this.sessionItems.filter(i => !i.learnedInSession).length,
      items: [...this.sessionItems]
    };
    await this.db.saveTrainSession(session);
  }

  private startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedSec.set(Math.floor((Date.now() - this.sessionStartedAt) / 1000));
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatElapsed(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async ionViewWillEnter() {
    await this.vocabService.load();
    // Refresh the current card so learned-state changes from the detail page are reflected,
    // but do NOT pick a new random card — the user should stay on the same flashcard.
    const v = this.current();
    if (v) {
      const refreshed = await this.vocabService.getById(v._id);
      this.current.set(refreshed);
    } else if (!this.done()) {
      await this.pickRandom();
    }
  }

  async pickRandom() {
    const pool = this.unlearned();
    if (!pool.length) {
      this.current.set(null);
      if (this.sessionItems.length > 0) {
        await this.saveSession();
      } else {
        this.done.set(true);
      }
      return;
    }
    // Exclude current card if possible so we don't get the same one twice in a row
    const currentId = this.current()?._id;
    const candidates = pool.length > 1 ? pool.filter(v => v._id !== currentId) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    this.current.set(next);
    this.flipped.set(false);
    this.done.set(false);
    this.cardShownAt = Date.now();
  }

  private async saveSession() {
    this.sessionSaved = true;
    this.stopTimer();
    const now = Date.now();
    const session: TrainSession = {
      _id: this.sessionId,
      startedAt: new Date(this.sessionStartedAt).toISOString(),
      finishedAt: new Date(now).toISOString(),
      totalTimeMs: now - this.sessionStartedAt,
      learnedCount: this.sessionItems.filter(i => i.learnedInSession).length,
      notLearnedCount: this.sessionItems.filter(i => !i.learnedInSession).length,
      items: [...this.sessionItems]
    };
    await this.db.saveTrainSession(session);
    this.router.navigate(['/train-summary', session._id], { replaceUrl: true });
  }

  async speak(event: Event, text: string) {
    event.stopPropagation();
    await this.tts.speak(text);
  }

  flip() {
    this.flipped.set(!this.flipped());
  }

  async markLearned() {
    const v = this.current();
    if (!v) return;
    this.sessionItems.push({
      vocabId: v._id,
      german: v.german,
      english: v.english,
      learnedInSession: true,
      timeSpentMs: Date.now() - this.cardShownAt
    });
    if (!v.learned) await this.vocabService.toggleLearned(v);
    await this.pickRandom();
  }

  async markNotLearned() {
    const v = this.current();
    if (!v) return;
    this.sessionItems.push({
      vocabId: v._id,
      german: v.german,
      english: v.english,
      learnedInSession: false,
      timeSpentMs: Date.now() - this.cardShownAt
    });
    if (v.learned) await this.vocabService.toggleLearned(v);
    await this.pickRandom();
  }

  goToDetails() {
    const v = this.current();
    if (v) {
      this.isNavigatingToDetails = true;
      this.router.navigate(['/vocabulary-details', v._id]);
    }
  }

  goToHistory() {
    this.router.navigate(['/train-summary']);
  }

  async restart() {
    this.initSession();
    this.done.set(false);
    await this.pickRandom();
  }

  levelColor(level: string): string {
    const map: Record<string, string> = { A1: 'success', A2: 'success', B1: 'warning', B2: 'warning', C1: 'danger', C2: 'danger' };
    return map[level] ?? 'medium';
  }

  wordTypeColor(type: string): string {
    const map: Record<string, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', preposition: 'medium', conjunction: 'dark',
      pronoun: 'secondary', other: 'light'
    };
    return map[type] ?? 'medium';
  }
}
