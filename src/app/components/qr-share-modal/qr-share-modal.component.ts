import {
  Component, inject, signal, Input, OnDestroy, AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonSpinner,
  ModalController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeOutline, qrCodeOutline, scanOutline,
  cloudUploadOutline, checkmarkCircle, alertCircleOutline, refreshOutline
} from 'ionicons/icons';
import * as QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QrShareService } from '../../services/qr-share.service';
import { VocabularyService } from '../../services/vocabulary.service';
import { Vocabulary } from '../../models/vocabulary.model';

@Component({
  selector: 'app-qr-share-modal',
  templateUrl: './qr-share-modal.component.html',
  styleUrls: ['./qr-share-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    TranslatePipe
  ]
})
export class QrShareModalComponent implements AfterViewInit, OnDestroy {
  @ViewChild('qrCanvas')   qrCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('videoEl')    videoElRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('scanCanvas') scanCanvasRef!: ElementRef<HTMLCanvasElement>;

  private modalCtrl    = inject(ModalController);
  private toastCtrl    = inject(ToastController);
  private alertCtrl    = inject(AlertController);
  private translate    = inject(TranslateService);
  private qrService    = inject(QrShareService);
  private vocabService = inject(VocabularyService);

  @Input() vocabs?: Vocabulary[];

  // ── Shared ────────────────────────────────────────────────────────────────
  activeTab = signal<'share' | 'scan'>('share');

  // ── Share tab state ───────────────────────────────────────────────────────
  shareStatus     = signal<'idle' | 'uploading' | 'ready' | 'error'>('idle');
  shareVocabCount = signal(0);
  private shareToken = '';

  // ── Scan tab state ────────────────────────────────────────────────────────
  scanStatus     = signal<'idle' | 'scanning' | 'downloading' | 'imported' | 'error'>('idle');
  scanImportCount = signal(0);
  scanErrorKey    = signal('qr.downloadError');

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private tokenFound = false;

  constructor() {
    addIcons({ closeOutline, qrCodeOutline, scanOutline, cloudUploadOutline, checkmarkCircle, alertCircleOutline, refreshOutline });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  // ── Share tab ─────────────────────────────────────────────────────────────

  async generateQr(): Promise<void> {
    this.shareStatus.set('uploading');
    try {
      const vocabs = this.vocabs ?? await this.vocabService.exportAll();
      if (!vocabs.length) { this.shareStatus.set('idle'); return; }
      this.shareVocabCount.set(vocabs.length);
      this.shareToken = await this.qrService.uploadVocabs(vocabs);
      this.shareStatus.set('ready');
      await this.renderQr();
    } catch {
      this.shareStatus.set('error');
    }
  }

  private async renderQr(): Promise<void> {
    const canvas = this.qrCanvasRef?.nativeElement;
    if (!canvas || !this.shareToken) return;
    await QRCode.toCanvas(canvas, this.qrService.encodeToken(this.shareToken), {
      width: 280, margin: 2, errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' }
    });
  }

  // ── Scan tab ──────────────────────────────────────────────────────────────

  async startCamera(): Promise<void> {
    this.tokenFound = false;
    this.scanStatus.set('scanning');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.videoElRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.scanLoop();
    } catch {
      this.scanStatus.set('error');
      this.scanErrorKey.set('qr.cameraError');
    }
  }

  private stopCamera(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
  }

  private scanLoop(): void {
    const tick = () => {
      if (this.tokenFound) return;
      const video  = this.videoElRef?.nativeElement;
      const canvas = this.scanCanvasRef?.nativeElement;
      if (!video || !canvas) { this.rafId = requestAnimationFrame(tick); return; }
      if (video.readyState >= video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(video, 0, 0);
        const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          const token = this.qrService.parseToken(code.data);
          if (token) {
            this.tokenFound = true;
            this.stopCamera();
            this.downloadAndImport(token);
            return;
          }
        }
      }
      if (this.scanStatus() === 'scanning') this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private async downloadAndImport(token: string): Promise<void> {
    this.scanStatus.set('downloading');
    try {
      const vocabs = await this.qrService.downloadVocabs(token);

      const dupCount = this.vocabService.countDuplicates(vocabs);
      let dupStrategy: 'replace' | 'keep' = 'replace';
      if (dupCount > 0) {
        const dupAlert = await this.alertCtrl.create({
          header: this.translate.instant('settings.data.importDupTitle'),
          message: this.translate.instant('settings.data.importDupMsg', { count: dupCount }),
          buttons: [
            { text: this.translate.instant('settings.data.importDupKeep'), role: 'keep' },
            { text: this.translate.instant('settings.data.importDupReplace'), role: 'replace' }
          ]
        });
        await dupAlert.present();
        const { role: dupRole } = await dupAlert.onDidDismiss();
        dupStrategy = dupRole === 'keep' ? 'keep' : 'replace';
      }

      const importedCount = await this.vocabService.importAll(vocabs, dupStrategy);
      this.scanImportCount.set(importedCount);
      this.scanStatus.set('imported');
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('qr.importSuccess', { count: vocabs.length }),
        duration: 2500, color: 'success', position: 'bottom'
      });
      await toast.present();
      setTimeout(() => this.modalCtrl.dismiss({ imported: vocabs.length }, 'imported'), 2600);
    } catch (err: any) {
      this.scanStatus.set('error');
      this.scanErrorKey.set(err?.message === 'EXPIRED' ? 'qr.expiredError' : 'qr.downloadError');
    }
  }

  retryScan(): void {
    this.tokenFound = false;
    this.startCamera();
  }

  onSegmentChange(event: any): void {
    const tab = event.detail.value as 'share' | 'scan';
    this.activeTab.set(tab);
    if (tab === 'share') {
      this.stopCamera();
    }
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}

