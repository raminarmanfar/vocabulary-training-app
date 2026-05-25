import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonChip, IonLabel, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonAccordionGroup, IonAccordion,
  IonImg
} from '@ionic/angular/standalone';
import { AlertController, ViewWillEnter } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, trash, volumeHigh, checkmarkCircle, ellipseOutline, imageOutline } from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { TtsService } from '../../services/tts.service';
import { Vocabulary } from '../../models/vocabulary.model';
import { NounDetailComponent } from '../../components/noun-detail/noun-detail.component';
import { VerbDetailComponent } from '../../components/verb-detail/verb-detail.component';
import { AdjectiveDetailComponent } from '../../components/adjective-detail/adjective-detail.component';

@Component({
  selector: 'app-vocabulary-details',
  templateUrl: './vocabulary-details.page.html',
  styleUrls: ['./vocabulary-details.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonChip, IonLabel, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonAccordionGroup, IonAccordion,
    IonImg,
    NounDetailComponent, VerbDetailComponent, AdjectiveDetailComponent,
    TranslatePipe
  ]
})
export class VocabularyDetailsPage implements OnInit, ViewWillEnter {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vocabService = inject(VocabularyService);
  private tts = inject(TtsService);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);

  vocab = signal<Vocabulary | null>(null);

  constructor() {
    addIcons({ create, trash, volumeHigh, checkmarkCircle, ellipseOutline, imageOutline });
  }

  async ngOnInit() {
    await this.loadVocab();
  }

  async ionViewWillEnter() {
    await this.loadVocab();
  }

  private async loadVocab() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const v = await this.vocabService.getById(id);
    this.vocab.set(v);
  }

  async speak() {
    const v = this.vocab();
    if (v) await this.tts.speak(v.german);
  }

  async toggleLearned() {
    const v = this.vocab();
    if (!v) return;
    await this.vocabService.toggleLearned(v);
    const updated = await this.vocabService.getById(v._id);
    this.vocab.set(updated);
  }

  edit() {
    const v = this.vocab();
    if (v) this.router.navigate(['/edit-vocabulary', v._id]);
  }

  async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('detail.delete.header'),
      message: this.translate.instant('detail.delete.message'),
      buttons: [
        { text: this.translate.instant('detail.delete.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('detail.delete.confirm'),
          role: 'destructive',
          handler: () => this.deleteVocab()
        }
      ]
    });
    await alert.present();
  }

  async deleteVocab() {
    const v = this.vocab();
    if (!v) return;
    await this.vocabService.delete(v);
    this.router.navigate(['/vocabularies']);
  }

  ttsSupported(): boolean {
    return this.tts.isSupported();
  }

  wordTypeColor(type: string): string {
    const map: Record<string, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', preposition: 'medium', conjunction: 'dark',
      pronoun: 'secondary', other: 'light'
    };
    return map[type] || 'medium';
  }
}
