import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent,
  IonBadge, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, timeOutline,
  refreshOutline, trophyOutline, calendarOutline,
  chevronBackOutline, chevronForwardOutline
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { TrainSession } from '../../models/train-session.model';

interface CalendarCell {
  date: Date | null;
  dateStr: string;
  sessions: TrainSession[];
}

@Component({
  selector: 'app-train-summary',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonCard, IonCardContent,
    IonBadge, IonList, IonItem, IonLabel,
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

  viewDate = signal(new Date());
  selectedDate = signal<string | null>(null);

  sessionsByDate = computed(() => {
    const map = new Map<string, TrainSession[]>();
    for (const s of this.sessions()) {
      const dateStr = s.startedAt.slice(0, 10);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(s);
    }
    return map;
  });

  calendarCells = computed<CalendarCell[]>(() => {
    const d = this.viewDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const byDate = this.sessionsByDate();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-first: Sun(0) → 6, Mon(1) → 0, …, Sat(6) → 5
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const cells: CalendarCell[] = [];
    for (let i = 0; i < startDow; i++) {
      cells.push({ date: null, dateStr: '', sessions: [] });
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ date: new Date(year, month, day), dateStr, sessions: byDate.get(dateStr) ?? [] });
    }
    return cells;
  });

  monthLabel = computed(() =>
    this.viewDate().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  );

  selectedDaySessions = computed(() => {
    const d = this.selectedDate();
    return d ? (this.sessionsByDate().get(d) ?? []) : [];
  });

  readonly weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline, refreshOutline, trophyOutline, calendarOutline, chevronBackOutline, chevronForwardOutline });
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

  prevMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.selectedDate.set(null);
  }

  nextMonth() {
    const d = this.viewDate();
    this.viewDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.selectedDate.set(null);
  }

  selectDate(dateStr: string) {
    this.selectedDate.set(this.selectedDate() === dateStr ? null : dateStr);
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().slice(0, 10);
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

