import { Component, inject, signal, effect } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonIcon, IonSelect, IonSelectOption,
  IonButton, IonToast, IonToggle, IonProgressBar
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { languageOutline, downloadOutline, cloudUploadOutline, moonOutline, trashOutline, statsChartOutline, sparklesOutline } from 'ionicons/icons';
import { LanguageService, AppLanguage } from '../../services/language.service';
import { VocabularyService } from '../../services/vocabulary.service';
import { QuizSetService } from '../../services/quiz-set.service';
import { ThemeService } from '../../services/theme.service';
import { DatabaseService } from '../../services/database.service';
import { EnrichmentService } from '../../services/enrichment.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonIcon, IonSelect, IonSelectOption,
    IonButton, IonToast, IonToggle, IonProgressBar,
    TranslatePipe
  ],
  template: `
    <ion-header>
      <ion-toolbar color="medium">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'settings.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>

      <!-- Language -->
      <ion-list inset="true" style="margin-top:16px">
        <ion-item>
          <ion-icon name="language-outline" slot="start" color="primary"></ion-icon>
          <ion-label>{{ 'settings.language.label' | translate }}</ion-label>
          <ion-select
            slot="end"
            [value]="langService.currentLang()"
            (ionChange)="onLangChange($any($event).detail.value)"
            interface="popover"
            style="max-width:120px">
            <ion-select-option value="en">{{ 'settings.language.en' | translate }}</ion-select-option>
            <ion-select-option value="de">{{ 'settings.language.de' | translate }}</ion-select-option>
            <ion-select-option value="tr">{{ 'settings.language.tr' | translate }}</ion-select-option>
            <ion-select-option value="fa">{{ 'settings.language.fa' | translate }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-icon name="moon-outline" slot="start" color="tertiary"></ion-icon>
          <ion-label>{{ 'settings.theme.label' | translate }}</ion-label>
          <ion-toggle
            slot="end"
            [checked]="themeService.isDark()"
            (ionChange)="themeService.setTheme($any($event).detail.checked)">
          </ion-toggle>
        </ion-item>
      </ion-list>

      <!-- Data -->
      <ion-list inset="true">
        <ion-item>
          <ion-icon name="download-outline" slot="start" color="success"></ion-icon>
          <ion-label>{{ 'settings.data.export' | translate }}</ion-label>
          <ion-button slot="end" fill="outline" color="success" (click)="exportData()">
            {{ 'settings.data.export' | translate }}
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-icon name="cloud-upload-outline" slot="start" color="warning"></ion-icon>
          <ion-label>{{ 'settings.data.import' | translate }}</ion-label>
          <ion-button slot="end" fill="outline" color="warning" (click)="fileInput.click()">
            {{ 'settings.data.import' | translate }}
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-icon name="sparkles-outline" slot="start" color="secondary"></ion-icon>
          <ion-label>
            {{ 'settings.data.enrichVocabs' | translate }}
            @if (enrichmentService.enriching()) {
              <p style="font-size:0.78rem;margin-top:2px">{{ enrichmentService.enrichCount() }} / {{ enrichmentService.enrichTotal() }}</p>
            }
          </ion-label>
          <ion-button slot="end" fill="outline" color="secondary" [disabled]="enrichmentService.enriching()" (click)="enrichVocabs()">
            {{ 'settings.data.enrich' | translate }}
          </ion-button>
          @if (enrichmentService.enriching()) {
            <ion-button slot="end" fill="clear" color="danger" (click)="enrichmentService.cancel()">
              {{ 'common.cancel' | translate }}
            </ion-button>
          }
        </ion-item>
        @if (enrichmentService.enriching()) {
          <ion-progress-bar
            [value]="enrichmentService.enrichTotal() ? enrichmentService.enrichCount() / enrichmentService.enrichTotal() : 0"
            color="secondary"
            style="height:3px">
          </ion-progress-bar>
        }
      </ion-list>

      <!-- Danger zone -->
      <ion-list inset="true">
        <ion-item>
          <ion-icon name="stats-chart-outline" slot="start" color="danger"></ion-icon>
          <ion-label>{{ 'settings.data.eraseSummary' | translate }}</ion-label>
          <ion-button slot="end" fill="outline" color="danger" (click)="confirmEraseSummary()">
            {{ 'settings.data.erase' | translate }}
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
          <ion-label>{{ 'settings.data.eraseVocabs' | translate }}</ion-label>
          <ion-button slot="end" fill="outline" color="danger" (click)="confirmEraseVocabs()">
            {{ 'settings.data.erase' | translate }}
          </ion-button>
        </ion-item>
        <ion-item>
          <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
          <ion-label>{{ 'settings.data.eraseQuizzes' | translate }}</ion-label>
          <ion-button slot="end" fill="outline" color="danger" (click)="confirmEraseQuizzes()">
            {{ 'settings.data.erase' | translate }}
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Hidden file input -->
      <input #fileInput type="file" accept=".json" style="display:none" (change)="importData($event)" />

      <!-- Toast -->
      <ion-toast
        [isOpen]="toast().open"
        [message]="toast().message"
        [color]="toast().color"
        [duration]="2500"
        (didDismiss)="toast.set({ open: false, message: '', color: 'success' })">
      </ion-toast>

    </ion-content>
  `
})
export class SettingsPage {
  langService = inject(LanguageService);
  themeService = inject(ThemeService);
  readonly enrichmentService = inject(EnrichmentService);
  private vocabService = inject(VocabularyService);
  private quizSetService = inject(QuizSetService);
  private dbService = inject(DatabaseService);
  private translate = inject(TranslateService);
  private alertCtrl = inject(AlertController);

  toast = signal<{ open: boolean; message: string; color: string }>({ open: false, message: '', color: 'success' });

  constructor() {
    addIcons({ languageOutline, downloadOutline, cloudUploadOutline, moonOutline, trashOutline, statsChartOutline, sparklesOutline });
    // Surface the done-toast from the background service when the page is active
    effect(() => {
      const pending = this.enrichmentService.pendingToast();
      if (pending) {
        this.toast.set(pending);
        this.enrichmentService.pendingToast.set(null);
      }
    });
  }

  onLangChange(lang: AppLanguage) {
    this.langService.setLanguage(lang);
  }

  async confirmEraseSummary() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.eraseSummaryTitle'),
      message: this.translate.instant('settings.data.eraseSummaryMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.erase'), role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      await this.dbService.clearAllTrainSessions();
      this.toast.set({ open: true, message: this.translate.instant('settings.data.eraseSummaryDone'), color: 'success' });
    }
  }

  async confirmEraseVocabs() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.eraseVocabsTitle'),
      message: this.translate.instant('settings.data.eraseVocabsMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.erase'), role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      await this.vocabService.deleteAll();
      this.toast.set({ open: true, message: this.translate.instant('settings.data.eraseVocabsDone'), color: 'success' });
    }
  }

  async confirmEraseQuizzes() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.eraseQuizzesTitle'),
      message: this.translate.instant('settings.data.eraseQuizzesMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.erase'), role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      await this.quizSetService.deleteAll();
      this.toast.set({ open: true, message: this.translate.instant('settings.data.eraseQuizzesDone'), color: 'success' });
    }
  }

  async exportData() {
    const vocabs = await this.vocabService.exportAll();
    const json = JSON.stringify(vocabs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const msg = this.translate.instant('settings.data.exportSuccess', { count: vocabs.length });
    this.toast.set({ open: true, message: msg, color: 'success' });
  }

  async importData(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    let vocabs: any[];
    try {
      const text = await file.text();
      vocabs = JSON.parse(text);
      if (!Array.isArray(vocabs)) throw new Error('not an array');
    } catch {
      this.toast.set({ open: true, message: this.translate.instant('settings.data.importError'), color: 'danger' });
      input.value = '';
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.importModeTitle'),
      message: this.translate.instant('settings.data.importModeMsg', { count: vocabs.length }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.importMerge'), role: 'merge' },
        { text: this.translate.instant('settings.data.importReplace'), role: 'replace' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role === 'merge') {
      const count = await this.vocabService.importAll(vocabs);
      this.toast.set({ open: true, message: this.translate.instant('settings.data.importSuccess', { count }), color: 'success' });
    } else if (role === 'replace') {
      await this.vocabService.deleteAll();
      const count = await this.vocabService.importAll(vocabs);
      this.toast.set({ open: true, message: this.translate.instant('settings.data.importSuccess', { count }), color: 'success' });
    }

    input.value = '';
  }

  async enrichVocabs() {
    const vocabs = await this.vocabService.exportAll();
    const toEnrich = vocabs.filter(v =>
      !v.aiGenerated && !v.aiEnriched && (
        !v.turkish || !v.persian || !v.synonyms?.length || !v.antonyms?.length ||
        v.examples?.some(ex => !ex.turkish || !ex.persian)
      )
    );

    if (!toEnrich.length) {
      this.toast.set({ open: true, message: this.translate.instant('settings.data.enrichNone'), color: 'primary' });
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.enrichTitle'),
      message: this.translate.instant('settings.data.enrichMsg', { count: toEnrich.length }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.enrich'), role: 'confirm' }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    this.toast.set({
      open: true,
      message: this.translate.instant('settings.data.enrichStarted', { count: toEnrich.length }),
      color: 'secondary'
    });
    // Fire-and-forget — the singleton service keeps state alive across navigation
    this.enrichmentService.start(toEnrich);
  }
}
