import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent,
  IonBadge, IonList, IonItem, IonLabel, IonDatetime
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, timeOutline,
  refreshOutline, trophyOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { TrainSession } from '../../models/train-session.model';

@Component({
  selector: 'app-train-summary',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonCard, IonCardContent,
    IonBadge, IonList, IonItem, IonLabel, IonDatetime,
    TranslatePipe
  ],
  templateUrl: './train-summary.page.html',
  styleUrls: ['./train-summary.page.scss']
})
export class TrainSummaryPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private db = inject(DatabaseService);

  mode = signal<'list' | 'detail'>('list');
  session = signal<TrainSession | null>(null);
  sessions = signal<TrainSession[]>([]);

  selectedDate = signal<string | null>(null);
  readonly todayStr = new Date().toISOString().slice(0, 10);

  sessionsByDate = computed(() => {
    const map = new Map<string, TrainSession[]>();
    for (const s of this.sessions()) {
      const dateStr = s.startedAt.slice(0, 10);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(s);
    }
    return map;
  });

  highlightedDates = computed(() =>
    Array.from(this.sessionsByDate().keys()).map(date => ({
      date,
      textColor: '#ffffff',
      backgroundColor: 'var(--ion-color-success)',
    }))
  );

  selectedDaySessions = computed(() => {
    const d = this.selectedDate();
    return d ? (this.sessionsByDate().get(d) ?? []) : [];
  });

  isDateEnabledFn = computed(() => {
    const map = this.sessionsByDate();
    return (isoString: string) => map.has(isoString.slice(0, 10));
  });

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline, refreshOutline, trophyOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.mode.set('detail');
      const s = await this.db.getTrainSessionById(id);
      this.session.set(s ?? null);
    } else {
      this.mode.set('list');
      const all = await this.db.getAllTrainSessions();
      this.sessions.set(all);
    }
  }

  onDateChange(event: CustomEvent) {
    const val = event.detail.value as string | null;
    this.selectedDate.set(val ? val.slice(0, 10) : null);
  }

  formatSelectedDate(): string {
    const d = this.selectedDate();
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  openSession(id: string) {
    this.router.navigate(['/train-summary', id]);
  }

  formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  formatSessionTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  trainAgain() {
    this.router.navigate(['/train']);
  }

  goToDetails(vocabId: string) {
    this.router.navigate(['/vocabulary-details', vocabId]);
  }
}

