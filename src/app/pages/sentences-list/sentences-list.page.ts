import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonButtons, IonBackButton, IonNote,
  ModalController
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, chatboxOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { ViewWillEnter } from '@ionic/angular';
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
export class SentencesListPage implements OnInit, ViewWillEnter {
  private router          = inject(Router);
  private sentenceService = inject(SentenceService);
  private modalCtrl       = inject(ModalController);

  readonly sentencesSignal = toSignal(this.sentenceService.sentences$, { initialValue: [] as Sentence[] });

  constructor() {
    addIcons({ add, chatboxOutline, chatbubbleEllipsesOutline });
  }

  ngOnInit() {
    this.sentenceService.load();
  }

  async ionViewWillEnter() {
    await this.sentenceService.load();
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AiSentenceModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ saved?: boolean }>();
    if (data?.saved) {
      await this.sentenceService.load();
    }
  }

  openDetails(id: string) {
    this.router.navigate(['/sentence-details', id]);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
