import { Component, OnInit, OnDestroy, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonChip, IonLabel, IonBadge, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonAccordionGroup, IonAccordion,
  IonImg, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { AlertController, ToastController, ViewWillEnter } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { create, trash, volumeHigh, checkmarkCircle, ellipseOutline, imageOutline, sparkles } from 'ionicons/icons';
import { VocabularyService } from '../../services/vocabulary.service';
import { TtsService } from '../../services/tts.service';
import { VocabAiService } from '../../services/vocab-ai.service';
import { Vocabulary, WordType } from '../../models/vocabulary.model';
import { NounDetailComponent } from '../../components/noun-detail/noun-detail.component';
import { VerbDetailComponent } from '../../components/verb-detail/verb-detail.component';
import { AdjectiveDetailComponent } from '../../components/adjective-detail/adjective-detail.component';
import { AiVocabModalComponent } from '../../components/ai-vocab-modal/ai-vocab-modal.component';

@Component({
  selector: 'app-vocabulary-details',
  templateUrl: './vocabulary-details.page.html',
  styleUrls: ['./vocabulary-details.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonChip, IonLabel, IonBadge, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonAccordionGroup, IonAccordion,
    IonImg, IonSpinner,
    NounDetailComponent, VerbDetailComponent, AdjectiveDetailComponent,
    TranslatePipe
  ]
})
export class VocabularyDetailsPage implements OnInit, OnDestroy, ViewWillEnter {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vocabService = inject(VocabularyService);
  private tts = inject(TtsService);
  private aiService = inject(VocabAiService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private translate = inject(TranslateService);
  private modalCtrl = inject(ModalController);

  @ViewChild(IonContent) private content!: IonContent;

  private paramSub?: Subscription;

  vocab = signal<Vocabulary | null>(null);
  regenerating = signal(false);

  constructor() {
    addIcons({ create, trash, volumeHigh, checkmarkCircle, ellipseOutline, imageOutline, sparkles });
  }

  async ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe(async params => {
      const id = params.get('id')!;
      const v = await this.vocabService.getById(id);
      this.vocab.set(v);
      this.content?.scrollToTop(0);
    });
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
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

  async speakText(text: string) {
    await this.tts.speak(text);
  }

  async speakExample(event: Event, text: string) {
    event.stopPropagation();
    await this.tts.speak(text);
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

  async confirmRegenerate() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('detail.regenerate.header'),
      message: this.translate.instant('detail.regenerate.message'),
      buttons: [
        { text: this.translate.instant('detail.regenerate.cancel'), role: 'cancel' },
        {
          text: this.translate.instant('detail.regenerate.confirm'),
          handler: () => this.regenerate()
        }
      ]
    });
    await alert.present();
  }

  private async regenerate() {
    const v = this.vocab();
    if (!v) return;
    this.regenerating.set(true);
    const wordType = (v.wordType === 'unknown' as WordType) ? undefined : v.wordType;
    this.aiService.generate(v.german, wordType).subscribe({
      next: async (response) => {
        const updated: Vocabulary = {
          ...v,
          english:          response.english,
          wordType:         response.wordType,
          level:            response.level as Vocabulary['level'],
          description:      response.description ?? undefined,
          examples:         response.examples ?? [],
          nounDetails:      response.nounDetails ?? undefined,
          verbDetails:      response.verbDetails ?? undefined,
          adjectiveDetails: response.adjectiveDetails ?? undefined,
          synonyms:         response.synonyms ?? [],
          antonyms:         response.antonyms ?? [],
          updatedAt:        new Date().toISOString(),
        };
        await this.vocabService.save(updated);
        this.vocab.set(updated);
        this.regenerating.set(false);
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('detail.regenerate.success'),
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      },
      error: async () => {
        this.regenerating.set(false);
        const toast = await this.toastCtrl.create({
          message: this.translate.instant('detail.regenerate.error'),
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    });
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

  async onWordChipClick(word: string) {
    const vocabs = this.vocabService.vocabsSubject.value;
    const found = vocabs.find(v => v.german.trim().toLowerCase() === word.trim().toLowerCase());
    if (found) {
      this.router.navigate(['/vocabulary-details', found._id]);
      return;
    }
    const modal = await this.modalCtrl.create({
      component: AiVocabModalComponent,
      componentProps: { initialWord: word },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
      handleBehavior: 'cycle',
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data?._id) {
      this.router.navigate(['/vocabulary-details', data._id]);
    }
  }
}
