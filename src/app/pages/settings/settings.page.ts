import { Component, effect, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AlertController } from '@ionic/angular';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToast,
  IonToggle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  chevronForward,
  cloudUploadOutline,
  downloadOutline,
  languageOutline,
  moonOutline,
  qrCodeOutline,
  sparklesOutline,
  statsChartOutline,
  trashOutline,
} from 'ionicons/icons';
import { QrShareModalComponent } from '../../components/qr-share-modal/qr-share-modal.component';
import { DatabaseService } from '../../services/database.service';
import { EnrichmentService } from '../../services/enrichment.service';
import { AppLanguage, LanguageService } from '../../services/language.service';
import { QuizSetService } from '../../services/quiz-set.service';
import { SentenceService } from '../../services/sentence.service';
import { ThemeService } from '../../services/theme.service';
import { VocabularyService } from '../../services/vocabulary.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonToast,
    IonToggle,
    IonProgressBar,
    TranslatePipe,
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
            style="max-width:120px"
          >
            <ion-select-option value="en">{{
              'settings.language.en' | translate
            }}</ion-select-option>
            <ion-select-option value="de">{{
              'settings.language.de' | translate
            }}</ion-select-option>
            <ion-select-option value="tr">{{
              'settings.language.tr' | translate
            }}</ion-select-option>
            <ion-select-option value="fa">{{
              'settings.language.fa' | translate
            }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-icon name="moon-outline" slot="start" color="tertiary"></ion-icon>
          <ion-label>{{ 'settings.theme.label' | translate }}</ion-label>
          <ion-toggle
            slot="end"
            [checked]="themeService.isDark()"
            (ionChange)="themeService.setTheme($any($event).detail.checked)"
          >
          </ion-toggle>
        </ion-item>
      </ion-list>

      <!-- Data -->
      <ion-list inset="true">
        <ion-item button (click)="openQrShare()">
          <ion-icon name="qr-code-outline" slot="start" color="success"></ion-icon>
          <ion-label>{{ 'qr.title' | translate }}</ion-label>
          <ion-icon name="chevron-forward" slot="end" color="medium"></ion-icon>
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
              <p style="font-size:0.78rem;margin-top:2px">
                {{ enrichmentService.enrichCount() }} / {{ enrichmentService.enrichTotal() }}
              </p>
            }
          </ion-label>
          @if (enrichmentService.enriching()) {
            <ion-button
              slot="end"
              fill="outline"
              color="danger"
              (click)="enrichmentService.cancel()"
            >
              {{ 'common.cancel' | translate }}
            </ion-button>
          } @else {
            <ion-button slot="end" fill="outline" color="secondary" (click)="enrichVocabs()">
              {{ 'settings.data.enrich' | translate }}
            </ion-button>
          }
        </ion-item>
        @if (enrichmentService.enriching()) {
          <ion-progress-bar
            [value]="
              enrichmentService.enrichTotal()
                ? enrichmentService.enrichCount() / enrichmentService.enrichTotal()
                : 0
            "
            color="secondary"
            style="height:3px"
          >
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
        <ion-item>
          <ion-icon name="alert-circle-outline" slot="start" color="danger"></ion-icon>
          <ion-label>{{ 'settings.data.resetApp' | translate }}</ion-label>
          <ion-button slot="end" fill="solid" color="danger" (click)="confirmResetAppData()">
            {{ 'settings.data.reset' | translate }}
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        accept=".json"
        style="display:none"
        (change)="importData($event)"
      />

      <!-- Toast -->
      <ion-toast
        [isOpen]="toast().open"
        [message]="toast().message"
        [color]="toast().color"
        [duration]="2500"
        (didDismiss)="toast.set({ open: false, message: '', color: 'success' })"
      >
      </ion-toast>
    </ion-content>
  `,
})
export class SettingsPage {
  langService = inject(LanguageService);
  themeService = inject(ThemeService);
  readonly enrichmentService = inject(EnrichmentService);
  private vocabService = inject(VocabularyService);
  private quizSetService = inject(QuizSetService);
  private sentenceService = inject(SentenceService);
  private dbService = inject(DatabaseService);
  private translate = inject(TranslateService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);

  toast = signal<{ open: boolean; message: string; color: string }>({
    open: false,
    message: '',
    color: 'success',
  });

  constructor() {
    addIcons({
      languageOutline,
      downloadOutline,
      cloudUploadOutline,
      moonOutline,
      trashOutline,
      statsChartOutline,
      sparklesOutline,
      alertCircleOutline,
      qrCodeOutline,
      chevronForward,
    });
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

  async openQrShare(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: QrShareModalComponent,
      breakpoints: [0, 0.92, 1],
      initialBreakpoint: 0.92,
      handleBehavior: 'cycle',
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  async confirmEraseSummary() {
    await this.presentDangerConfirm({
      headerKey: 'settings.data.eraseSummaryTitle',
      messageKey: 'settings.data.eraseSummaryMsg',
      confirmKey: 'settings.data.erase',
      successMessageKey: 'settings.data.eraseSummaryDone',
      onConfirm: async () => {
        await this.dbService.clearAllTrainSessions();
        await this.vocabService.resetAllLearned();
      },
    });
  }

  async confirmEraseVocabs() {
    await this.presentDangerConfirm({
      headerKey: 'settings.data.eraseVocabsTitle',
      messageKey: 'settings.data.eraseVocabsMsg',
      confirmKey: 'settings.data.erase',
      successMessageKey: 'settings.data.eraseVocabsDone',
      onConfirm: async () => {
        await this.vocabService.deleteAll();
      },
      postRefresh: async () => {
        await this.vocabService.load();
      },
    });
  }

  async confirmEraseQuizzes() {
    await this.presentDangerConfirm({
      headerKey: 'settings.data.eraseQuizzesTitle',
      messageKey: 'settings.data.eraseQuizzesMsg',
      confirmKey: 'settings.data.erase',
      successMessageKey: 'settings.data.eraseQuizzesDone',
      onConfirm: async () => {
        await this.quizSetService.deleteAll();
      },
      postRefresh: async () => {
        await this.quizSetService.load();
      },
    });
  }

  async confirmResetAppData() {
    await this.presentDangerConfirm({
      headerKey: 'settings.data.resetAppTitle',
      messageKey: 'settings.data.resetAppMsg',
      confirmKey: 'settings.data.reset',
      successMessageKey: 'settings.data.resetAppDone',
      onConfirm: async () => {
        await this.dbService.resetAllAppData();
        localStorage.removeItem('filter_types');
        localStorage.removeItem('filter_levels');
        localStorage.removeItem('filter_learned');
        localStorage.removeItem('sort_field');
        localStorage.removeItem('sort_dir');
        localStorage.removeItem('sentence_generate_options_v1');
        this.themeService.resetToDefault();
        this.langService.resetToDefault();
      },
      postRefresh: async () => {
        await Promise.all([
          this.vocabService.load(),
          this.quizSetService.load(),
          this.sentenceService.load(),
        ]);
      },
    });
  }

  private async presentDangerConfirm(options: {
    headerKey: string;
    messageKey: string;
    confirmKey: string;
    successMessageKey: string;
    onConfirm: () => Promise<void>;
    postRefresh?: () => Promise<void>;
  }): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(options.headerKey),
      message: this.translate.instant(options.messageKey),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        {
          text: this.translate.instant(options.confirmKey),
          role: 'destructive',
          cssClass: 'ion-color-danger',
          handler: async () => {
            try {
              await options.onConfirm();
              if (options.postRefresh) {
                await options.postRefresh();
              }
              this.toast.set({
                open: true,
                message: this.translate.instant(options.successMessageKey),
                color: 'success',
              });
            } catch {
              this.toast.set({
                open: true,
                message: this.translate.instant('common.error.unknown'),
                color: 'danger',
              });
              return false;
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async exportData() {
    const vocabs = await this.vocabService.exportAll();
    const json = JSON.stringify(vocabs, null, 2);
    const fileName = `vocab-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (Capacitor.isNativePlatform()) {
      // Write to cache dir then open native share sheet
      await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: 'utf8' as any,
      });
      const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
      await Share.share({
        title: fileName,
        url: uri,
        dialogTitle: this.translate.instant('settings.data.exportShareTitle'),
      });
    } else {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }

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
      this.toast.set({
        open: true,
        message: this.translate.instant('settings.data.importError'),
        color: 'danger',
      });
      input.value = '';
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.importModeTitle'),
      message: this.translate.instant('settings.data.importModeMsg', { count: vocabs.length }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.importMerge'), role: 'merge' },
        { text: this.translate.instant('settings.data.importReplace'), role: 'replace' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();

    if (role === 'merge') {
      const dupCount = this.vocabService.countDuplicates(vocabs);
      let dupStrategy: 'replace' | 'keep' = 'replace';
      if (dupCount > 0) {
        const dupAlert = await this.alertCtrl.create({
          header: this.translate.instant('settings.data.importDupTitle'),
          message: this.translate.instant('settings.data.importDupMsg', { count: dupCount }),
          buttons: [
            { text: this.translate.instant('settings.data.importDupKeep'), role: 'keep' },
            { text: this.translate.instant('settings.data.importDupReplace'), role: 'replace' },
          ],
        });
        await dupAlert.present();
        const { role: dupRole } = await dupAlert.onDidDismiss();
        if (dupRole === 'backdrop') {
          input.value = '';
          return;
        }
        dupStrategy = dupRole === 'keep' ? 'keep' : 'replace';
      }
      const count = await this.vocabService.importAll(vocabs, dupStrategy);
      this.toast.set({
        open: true,
        message: this.translate.instant('settings.data.importSuccess', { count }),
        color: 'success',
      });
    } else if (role === 'replace') {
      await this.vocabService.deleteAll();
      const count = await this.vocabService.importAll(vocabs);
      this.toast.set({
        open: true,
        message: this.translate.instant('settings.data.importSuccess', { count }),
        color: 'success',
      });
    }

    input.value = '';
  }

  async enrichVocabs() {
    const vocabs = await this.vocabService.exportAll();

    // Step 1: ask scope
    const scopeAlert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.enrichScopeTitle'),
      message: this.translate.instant('settings.data.enrichScopeMsg'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.enrichScopeNew'), role: 'new' },
        { text: this.translate.instant('settings.data.enrichScopeAll'), role: 'all' },
      ],
    });
    await scopeAlert.present();
    const { role: scopeRole } = await scopeAlert.onDidDismiss();
    if (scopeRole === 'cancel' || scopeRole === 'backdrop') return;

    const toEnrich =
      scopeRole === 'all'
        ? vocabs
        : vocabs.filter(
            (v) =>
              !v.aiGenerated &&
              !v.aiEnriched &&
              (!v.turkish ||
                !v.persian ||
                !v.synonyms?.length ||
                !v.antonyms?.length ||
                v.examples?.some((ex) => !ex.turkish || !ex.persian)),
          );

    if (!toEnrich.length) {
      this.toast.set({
        open: true,
        message: this.translate.instant('settings.data.enrichNone'),
        color: 'primary',
      });
      return;
    }

    // Step 2: confirm count
    const confirmAlert = await this.alertCtrl.create({
      header: this.translate.instant('settings.data.enrichTitle'),
      message: this.translate.instant('settings.data.enrichMsg', { count: toEnrich.length }),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('settings.data.enrich'), role: 'confirm' },
      ],
    });
    await confirmAlert.present();
    const { role } = await confirmAlert.onDidDismiss();
    if (role !== 'confirm') return;

    this.toast.set({
      open: true,
      message: this.translate.instant('settings.data.enrichStarted', { count: toEnrich.length }),
      color: 'secondary',
    });
    // Fire-and-forget — the singleton service keeps state alive across navigation
    this.enrichmentService.start(toEnrich);
  }
}
