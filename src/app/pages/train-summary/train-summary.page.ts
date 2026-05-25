import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonCard, IonCardContent,
  IonBadge, IonList, IonItem, IonLabel, IonDatetime,
  IonSegment, IonSegmentButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, timeOutline,
  refreshOutline, trophyOutline, calendarOutline, barChartOutline,
  chevronBackOutline
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
    IonSegment, IonSegmentButton, IonSelect, IonSelectOption,
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
  sessionsLoaded = signal(false);

  readonly todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  selectedDate = signal<string | null>(this.todayStr);
  activeTab = signal<'calendar' | 'monthly'>('calendar');
  selectedMonth = signal<string | null>(this.todayStr.slice(0, 7));

  readonly currentYear = new Date().getFullYear();
  readonly minYear = this.currentYear - 4;          // 5-year range, same as ion-datetime [min]
  readonly minDateStr = `${this.minYear}-01-01`;
  selectedYear = signal<number>(new Date().getFullYear());

  availableYears = computed(() => {
    const years: number[] = [];
    for (let y = this.currentYear; y >= this.minYear; y--) years.push(y);
    return years;
  });

  sessionsByDate = computed(() => {
    const map = new Map<string, TrainSession[]>();
    for (const s of this.sessions()) {
      const dateStr = this.isoToLocalDate(s.startedAt);
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

  selectedDayTotals = computed(() => {
    const list = this.selectedDaySessions();
    return {
      learnedCount: list.reduce((sum, s) => sum + s.learnedCount, 0),
      totalTimeMs: list.reduce((sum, s) => sum + s.totalTimeMs, 0),
      sessionCount: list.length,
    };
  });

  yearSummary = computed(() => {
    const year = this.selectedYear();
    const currentYearMonth = this.todayStr.slice(0, 7); // "YYYY-MM"
    const byMonth = new Map<string, { learned: number; notLearned: number; timeMs: number; sessions: number }>();
    for (const s of this.sessions()) {
      const m = this.isoToLocalDate(s.startedAt).slice(0, 7);
      if (m.startsWith(String(year))) {
        if (!byMonth.has(m)) byMonth.set(m, { learned: 0, notLearned: 0, timeMs: 0, sessions: 0 });
        const e = byMonth.get(m)!;
        e.learned += s.learnedCount;
        e.notLearned += s.notLearnedCount;
        e.timeMs += s.totalTimeMs;
        e.sessions++;
      }
    }
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
      const data = byMonth.get(monthStr);
      return {
        monthStr,
        label: new Date(year, i, 1).toLocaleDateString(undefined, { month: 'long' }),
        hasData: !!data,
        isSelectable: monthStr <= currentYearMonth,
        learned: data?.learned ?? 0,
        notLearned: data?.notLearned ?? 0,
        timeMs: data?.timeMs ?? 0,
        sessions: data?.sessions ?? 0,
      };
    });
  });

  selectedMonthLabel = computed(() => {
    const m = this.selectedMonth();
    if (!m) return '';
    const [year, month] = m.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  monthlyReport = computed(() => {
    const monthPrefix = this.selectedMonth() ?? this.todayStr.slice(0, 7);
    const monthSessions = this.sessions().filter(s => this.isoToLocalDate(s.startedAt).slice(0, 7) === monthPrefix);
    const byDate = new Map<string, { learned: number; notLearned: number; timeMs: number }>();
    for (const s of monthSessions) {
      const d = this.isoToLocalDate(s.startedAt);
      if (!byDate.has(d)) byDate.set(d, { learned: 0, notLearned: 0, timeMs: 0 });
      const entry = byDate.get(d)!;
      entry.learned += s.learnedCount;
      entry.notLearned += s.notLearnedCount;
      entry.timeMs += s.totalTimeMs;
    }
    const days = Array.from(byDate.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date));
    return {
      totalLearned: monthSessions.reduce((sum, s) => sum + s.learnedCount, 0),
      totalNotLearned: monthSessions.reduce((sum, s) => sum + s.notLearnedCount, 0),
      totalTimeMs: monthSessions.reduce((sum, s) => sum + s.totalTimeMs, 0),
      sessionCount: monthSessions.length,
      days,
    };
  });

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline, refreshOutline, trophyOutline, calendarOutline, barChartOutline, chevronBackOutline });
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
      this.sessionsLoaded.set(true);
    }
  }

  onDateChange(event: CustomEvent) {
    const val = event.detail.value as string | null;
    this.selectedDate.set(val ? val.slice(0, 10) : null);
  }

  onYearChange(year: number) {
    this.selectedYear.set(year);
    this.selectedMonth.set(null);
  }

  formatDayLabel(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
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
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  formatSessionTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
  }

  private isoToLocalDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  trainAgain() {
    this.router.navigate(['/train']);
  }

  goToDetails(vocabId: string) {
    this.router.navigate(['/vocabulary-details', vocabId]);
  }
}

