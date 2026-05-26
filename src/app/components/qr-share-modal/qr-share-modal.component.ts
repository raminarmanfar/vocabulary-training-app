import {
  Component, inject, signal, computed, Input, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonProgressBar, IonSpinner, IonChip,
  ModalController, ToastController
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeOutline, qrCodeOutline, scanOutline,
  chevronBackOutline, chevronForwardOutline,
  pauseOutline, playOutline, checkmarkCircle, downloadOutline
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
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonProgressBar, IonSpinner, IonChip,
    TranslatePipe
  ]
})
export class QrShareModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('qrCanvas')   qrCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('videoEl')    videoElRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('scanCanvas') scanCanvasRef!: ElementRef<HTMLCanvasElement>;

  private modalCtrl    = inject(ModalController);
  private toastCtrl    = inject(ToastController);
  private translate    = inject(TranslateService);
  private qrService    = inject(QrShareService);
  private vocabService = inject(VocabularyService);

  /** Optionally supply vocabs to share; defaults to full database. */
  @Input() vocabs?: Vocabulary[];

  // ── Share state ──────────────────────────────────────────────────────────
  activeTab        = signal<'share' | 'scan'>('share');
  shareStatus      = signal<'idle' | 'encoding' | 'ready' | 'empty'>('idle');
  shareChunks      = signal<string[]>([]);
  shareIndex       = signal(0);
  autoAdvance      = signal(true);
  shareVocabCount  = signal(0);

  shareProgress = computed(() => {
    const len = this.shareChunks().length;
    return len === 0 ? 0 : (this.shareIndex() + 1) / len;
  });

  // ── Scan state ───────────────────────────────────────────────────────────
  scanStatus   = signal<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  scanProgress = signal(0);
  scanTotal    = signal(0);

  private scannedChunks = new Map<number, string>();
  private autoInterval: ReturnType<typeof setInterval> | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private viewReady = false;

  constructor() {
    addIcons({
      closeOutline, qrCodeOutline, scanOutline,
      chevronBackOutline, chevronForwardOutline,
      pauseOutline, playOutline, checkmarkCircle, downloadOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.encodeVocabs();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.shareStatus() === 'ready' && this.activeTab() === 'share') {
      this.renderQr().then(() => this.startAutoAdvance());
    }
  }

  ngOnDestroy(): void {
    this.stopAutoAdvance();
    this.stopCamera();
  }

  // ── Share tab ─────────────────────────────────────────────────────────────

  private async encodeVocabs(): Promise<void> {
    this.shareStatus.set('encoding');
    try {
      const vocabs = this.vocabs ?? await this.vocabService.exportAll();
      if (!vocabs.length) { this.shareStatus.set('empty'); return; }
      this.shareVocabCount.set(vocabs.length);
      this.shareChunks.set(this.qrService.encode(vocabs));
      this.shareIndex.set(0);
      this.shareStatus.set('ready');
      if (this.viewReady && this.activeTab() === 'share') {
        await this.renderQr();
        this.startAutoAdvance();
      }
    } catch {
      this.shareStatus.set('idle');
    }
  }

  private async renderQr(): Promise<void> {
    const chunks = this.shareChunks();
    if (!chunks.length || !this.qrCanvasRef?.nativeElement) return;
    await QRCode.toCanvas(this.qrCanvasRef.nativeElement, chunks[this.shareIndex()], {
      width: 280, margin: 1, errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' }
    });
  }

  async prevChunk(): Promise<void> {
    const len = this.shareChunks().length;
    this.shareIndex.set((this.shareIndex() - 1 + len) % len);
    await this.renderQr();
  }

  async nextChunk(): Promise<void> {
    const len = this.shareChunks().length;
    this.shareIndex.set((this.shareIndex() + 1) % len);
    await this.renderQr();
  }

  private startAutoAdvance(): void {
    if (!this.autoAdvance() || this.shareChunks().length <= 1) return;
    this.stopAutoAdvance();
    this.autoInterval = setInterval(() => {
      const len = this.shareChunks().length;
      this.shareIndex.update(i => (i + 1) % len);
      this.renderQr();
    }, 3000);
  }

  private stopAutoAdvance(): void {
    if (this.autoInterval) { clearInterval(this.autoInterval); this.autoInterval = null; }
  }

  toggleAutoAdvance(): void {
    this.autoAdvance.update(v => !v);
    if (this.autoAdvance()) this.startAutoAdvance(); else this.stopAutoAdvance();
  }

  // ── Scan tab ──────────────────────────────────────────────────────────────

  async startCamera(): Promise<void> {
    this.scanStatus.set('scanning');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.videoElRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.scanLoop();
    } catch {
      this.scanStatus.set('error');
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('qr.cameraError'),
        duration: 3000, color: 'danger', position: 'bottom'
      });
      await toast.present();
    }
  }

  private stopCamera(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
  }

  private scanLoop(): void {
    const tick = () => {
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
        if (code?.data) this.processQrCode(code.data);
      }
      if (this.scanStatus() === 'scanning') this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private processQrCode(raw: string): void {
    const chunk = this.qrService.parseChunk(raw);
    if (!chunk) return;
    if (this.scanTotal() === 0) this.scanTotal.set(chunk.total);
    if (!this.scannedChunks.has(chunk.index)) {
      this.scannedChunks.set(chunk.index, chunk.data);
      this.scanProgress.set(this.scannedChunks.size);
      if (navigator.vibrate) navigator.vibrate(50);
      if (this.scannedChunks.size === this.scanTotal()) {
        this.scanStatus.set('complete');
        this.stopCamera();
      }
    }
  }

  async importVocabs(): Promise<void> {
    try {
      const vocabs = this.qrService.assemble(this.scannedChunks, this.scanTotal());
      await this.vocabService.importAll(vocabs);
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('qr.importSuccess', { count: vocabs.length }),
        duration: 2000, color: 'success', position: 'bottom'
      });
      await toast.present();
      this.modalCtrl.dismiss({ imported: vocabs.length }, 'imported');
    } catch {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('qr.importError'),
        duration: 3000, color: 'danger', position: 'bottom'
      });
      await toast.present();
    }
  }

  onSegmentChange(event: any): void {
    const tab = event.detail.value as 'share' | 'scan';
    this.activeTab.set(tab);
    if (tab === 'scan') {
      this.stopAutoAdvance();
    } else {
      this.stopCamera();
      if (this.shareStatus() === 'ready' && this.viewReady) {
        this.renderQr().then(() => this.startAutoAdvance());
      }
    }
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
