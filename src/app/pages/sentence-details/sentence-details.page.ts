import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonBadge, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trash, checkmarkCircle, closeCircle, volumeHigh, volumeHighOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SentenceService } from '../../services/sentence.service';
import { LanguageService } from '../../services/language.service';
import { TtsService } from '../../services/tts.service';
import { Sentence } from '../../models/sentence.model';
import { VocabularyService } from '../../services/vocabulary.service';
import { ModalController } from '@ionic/angular/standalone';
import { AiVocabModalComponent } from '../../components/ai-vocab-modal/ai-vocab-modal.component';
import { ViewWillEnter } from '@ionic/angular';
import { WordType } from '../../models/vocabulary.model';

@Component({
  selector: 'app-sentence-details',
  templateUrl: './sentence-details.page.html',
  styleUrls: ['./sentence-details.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonBadge, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent,
    TranslatePipe
  ]
})
export class SentenceDetailsPage implements OnInit, OnDestroy, ViewWillEnter {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private sentenceService = inject(SentenceService);
  private vocabService    = inject(VocabularyService);
  private ttsService      = inject(TtsService);
  private alertCtrl       = inject(AlertController);
  private toastCtrl       = inject(ToastController);
  private translate       = inject(TranslateService);
  private langService     = inject(LanguageService);
  private modalCtrl       = inject(ModalController);

  sentence = signal<Sentence | null>(null);
  private paramSub?: Subscription;

  constructor() {
    addIcons({ trash, checkmarkCircle, closeCircle, volumeHigh, volumeHighOutline });
  }

  ngOnInit() {
    this.paramSub = this.route.paramMap.subscribe(async params => {
      const id = params.get('id')!;
      const s = await this.sentenceService.getById(id);
      this.sentence.set(s ?? null);
    });
  }

  ngOnDestroy() {
    this.paramSub?.unsubscribe();
  }

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const s = await this.sentenceService.getById(id);
    this.sentence.set(s ?? null);
  }

  get nativeTranslation(): string | null {
    const s = this.sentence();
    if (!s) return null;
    const lang = this.langService.currentLang();
    if (lang === 'tr') return s.turkish ?? null;
    if (lang === 'fa') return s.persian ?? null;
    return null;
  }

  get showTurkishTranslation(): boolean {
    return this.langService.currentLang() === 'tr';
  }

  get showPersianTranslation(): boolean {
    return this.langService.currentLang() === 'fa';
  }

  wordTypeColor(type: string): string {
    const map: Record<string, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', other: 'medium'
    };
    return map[type] ?? 'medium';
  }

  ttsSupported(): boolean {
    return this.ttsService.isSupported();
  }

  async speakSentence() {
    const s = this.sentence();
    if (!s?.german) return;
    await this.ttsService.speak(s.german);
  }

  async speakWord(event: Event, word: string) {
    event.stopPropagation();
    const term = (word || '').trim();
    if (!term) return;
    await this.ttsService.speak(term);
  }

  async openWord(word: string, type: WordType) {
    const term = word.trim();
    if (!term) return;

    const existing = await this.vocabService.findByGerman(term, type);
    if (existing) {
      await this.router.navigate(['/vocabulary-details', existing._id]);
      return;
    }

    const modal = await this.modalCtrl.create({
      component: AiVocabModalComponent,
      componentProps: { initialWord: term, initialWordType: type },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
      handleBehavior: 'cycle',
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'saved' && data?._id) {
      await this.router.navigate(['/vocabulary-details', data._id]);
    }
  }

  async confirmDelete() {
    const s = this.sentence();
    if (!s) return;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('sentences.details.deleteTitle'),
      message: this.translate.instant('sentences.details.deleteMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('common.delete'), role: 'destructive',
          handler: async () => {
            await this.sentenceService.delete(s._id);
            const toast = await this.toastCtrl.create({
              message: this.translate.instant('sentences.details.deleted'),
              duration: 1800, color: 'success', position: 'bottom'
            });
            await toast.present();
            this.router.navigate(['/sentences'], { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }
}
