import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonBadge, IonImg
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, ellipseOutline, informationCircleOutline,
  refreshOutline, arrowForwardOutline, schoolOutline, volumeHighOutline, closeCircleOutline
} from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { TtsService } from '../../services/tts.service';
import { Vocabulary } from '../../models/vocabulary.model';
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
export class TrainPage implements OnInit, ViewWillEnter {
  private router = inject(Router);
  private vocabService = inject(VocabularyService);
  private tts = inject(TtsService);
  private translate = inject(TranslateService);

  private allVocabs = toSignal(this.vocabService.vocabs$, { initialValue: [] as Vocabulary[] });

  unlearned = computed(() => this.allVocabs().filter(v => !v.learned));

  current = signal<Vocabulary | null>(null);
  flipped = signal(false);
  done = signal(false);

  constructor() {
    addIcons({ checkmarkCircleOutline, ellipseOutline, informationCircleOutline, refreshOutline, arrowForwardOutline, schoolOutline, volumeHighOutline, closeCircleOutline });
  }

  async ngOnInit() {
    await this.vocabService.load();
    this.pickRandom();
  }

  async ionViewWillEnter() {
    await this.vocabService.load();
    // Refresh the current card so learned-state changes from the detail page are reflected,
    // but do NOT pick a new random card — the user should stay on the same flashcard.
    const v = this.current();
    if (v) {
      const refreshed = await this.vocabService.getById(v._id);
      this.current.set(refreshed);
    } else {
      this.pickRandom();
    }
  }

  pickRandom() {
    const pool = this.unlearned();
    if (!pool.length) {
      this.current.set(null);
      this.done.set(true);
      return;
    }
    // Exclude current card if possible so we don't get the same one twice in a row
    const currentId = this.current()?._id;
    const candidates = pool.length > 1 ? pool.filter(v => v._id !== currentId) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    this.current.set(next);
    this.flipped.set(false);
    this.done.set(false);
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
    if (!v.learned) {
      await this.vocabService.toggleLearned(v);
    }
    this.pickRandom();
  }

  async markNotLearned() {
    const v = this.current();
    if (!v) return;
    if (v.learned) {
      await this.vocabService.toggleLearned(v);
    }
    this.pickRandom();
  }

  goToDetails() {
    const v = this.current();
    if (v) this.router.navigate(['/vocabulary-details', v._id]);
  }

  restart() {
    this.done.set(false);
    this.pickRandom();
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
