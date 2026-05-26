import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonFab, IonFabButton, IonButtons, IonBackButton, IonNote,
  ModalController, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, create, trash, chatboxOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { AlertController, ToastController, ViewWillEnter } from '@ionic/angular';
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
    IonItemSliding, IonItemOptions, IonItemOption,
    TranslatePipe
  ]
})
export class SentencesListPage implements OnInit, ViewWillEnter {
  private router          = inject(Router);
  private sentenceService = inject(SentenceService);
  private modalCtrl       = inject(ModalController);
  private alertCtrl       = inject(AlertController);
  private toastCtrl       = inject(ToastController);
  private translate       = inject(TranslateService);

  readonly sentencesSignal = toSignal(this.sentenceService.sentences$, { initialValue: [] as Sentence[] });

  constructor() {
    addIcons({ add, create, trash, chatboxOutline, chatbubbleEllipsesOutline });
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

  async editSentence(sentence: Sentence, sliding?: any) {
    await sliding?.close();
    const modal = await this.modalCtrl.create({
      component: AiSentenceModalComponent,
      componentProps: { editingSentence: sentence },
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });
    await modal.present();
    const { data } = await modal.onDidDismiss<{ saved?: boolean }>();
    if (data?.saved) {
      await this.sentenceService.load();
    }
  }

  async confirmDelete(sentence: Sentence, sliding?: any) {
    await sliding?.close();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('sentences.details.deleteTitle'),
      message: this.translate.instant('sentences.details.deleteMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('common.delete'),
          role: 'destructive',
          handler: async () => {
            await this.sentenceService.delete(sentence._id);
            const toast = await this.toastCtrl.create({
              message: this.translate.instant('sentences.details.deleted'),
              duration: 1600,
              color: 'success',
              position: 'bottom'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
