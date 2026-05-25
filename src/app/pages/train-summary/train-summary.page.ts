import { Component, OnInit, inject, signal } from '@angular/core';
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

  session = signal<TrainSession | null>(null);

  constructor() {
    addIcons({ checkmarkCircleOutline, closeCircleOutline, timeOutline, refreshOutline, trophyOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const session = await this.db.getTrainSessionById(id);
      this.session.set(session ?? null);
    }
  }

  formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
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
