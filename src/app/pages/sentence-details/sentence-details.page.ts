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
import { trash, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SentenceService } from '../../services/sentence.service';
import { LanguageService } from '../../services/language.service';
import { Sentence } from '../../models/sentence.model';

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
export class SentenceDetailsPage implements OnInit, OnDestroy {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private sentenceService = inject(SentenceService);
  private alertCtrl       = inject(AlertController);
  private toastCtrl       = inject(ToastController);
  private translate       = inject(TranslateService);
  private langService     = inject(LanguageService);

  sentence = signal<Sentence | null>(null);
  private paramSub?: Subscription;

  constructor() {
    addIcons({ trash, checkmarkCircle, closeCircle });
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

  get nativeTranslation(): string | null {
    const s = this.sentence();
    if (!s) return null;
    const lang = this.langService.currentLang();
    if (lang === 'tr') return s.turkish ?? null;
    if (lang === 'fa') return s.persian ?? null;
    return null;
  }

  wordTypeColor(type: string): string {
    const map: Record<string, string> = {
      noun: 'primary', verb: 'success', adjective: 'warning',
      adverb: 'tertiary', other: 'medium'
    };
    return map[type] ?? 'medium';
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
