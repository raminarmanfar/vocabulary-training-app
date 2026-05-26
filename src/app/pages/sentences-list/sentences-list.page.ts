import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonButtons, IonBackButton, IonNote,
  ModalController
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, chatboxOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SentenceService } from '../../services/sentence.service';
import { Sentence } from '../../models/sentence.model';
import { AiSentenceModalComponent } from '../../components/ai-sentence-modal/ai-sentence-modal.component';

@Component({
  selector: 'app-sentences-list',
  templateUrl: './sentences-list.page.html',
  styleUrls: ['./sentences-list.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonBadge, IonIcon, IonFab, IonFabButton, IonButtons, IonBackButton, IonNote,
    TranslatePipe
  ]
})
export class SentencesListPage implements OnInit, OnDestroy {
  private router          = inject(Router);
  private sentenceService = inject(SentenceService);
  private modalCtrl       = inject(ModalController);

  sentences: Sentence[] = [];
  private sub?: Subscription;

  constructor() {
    addIcons({ add, chatboxOutline });
  }

  ngOnInit() {
    this.sub = this.sentenceService.sentences$.subscribe(s => this.sentences = s);
    this.sentenceService.load();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AiSentenceModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });
    await modal.present();
  }

  openDetails(id: string) {
    this.router.navigate(['/sentence-details', id]);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
