import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, ModalController
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { close, sparkles } from 'ionicons/icons';
import { SentenceGenerateOptions } from '../../services/sentence-ai.service';

@Component({
  selector: 'app-sentence-generate-modal',
  templateUrl: './sentence-generate-modal.component.html',
  styleUrls: ['./sentence-generate-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput,
    TranslatePipe
  ]
})
export class SentenceGenerateModalComponent {
  private modalCtrl = inject(ModalController);
  private readonly storageKey = 'sentence_generate_options_v1';

  private loadSavedOptions(): Partial<SentenceGenerateOptions & { topic: string; requiredWords: string }> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  private saved = this.loadSavedOptions();

  private legacyRequiredWords = Array.isArray((this.saved as any).connectors) ? (this.saved as any).connectors.join(', ') : '';

  level = signal<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>(this.saved.level ?? 'A2');
  sentenceType = signal<'simple' | 'compound' | 'complex' | 'any'>(this.saved.sentenceType ?? 'any');
  tense = signal<'Präsens' | 'Präteritum' | 'Perfekt' | 'Plusquamperfekt' | 'Futur I' | 'Futur II' | 'any'>(this.saved.tense ?? 'any');
  modalVerb = signal<'required' | 'forbidden' | 'optional'>(this.saved.modalVerb ?? 'optional');
  length = signal<'short' | 'medium' | 'long'>(this.saved.length ?? 'medium');
  negation = signal<'required' | 'forbidden' | 'optional'>(this.saved.negation ?? 'optional');
  passiveVoice = signal<'required' | 'forbidden' | 'optional'>(this.saved.passiveVoice ?? 'optional');
  caseFocus = signal<'nominative' | 'accusative' | 'dative' | 'genitive' | 'any'>(this.saved.caseFocus ?? 'any');
  requiredWords = signal(this.saved.requiredWords ?? this.legacyRequiredWords);
  topic = signal(this.saved.topic ?? '');

  constructor() {
    addIcons({ close, sparkles });
    effect(() => {
      const payload = {
        level: this.level(),
        sentenceType: this.sentenceType(),
        tense: this.tense(),
        modalVerb: this.modalVerb(),
        length: this.length(),
        negation: this.negation(),
        passiveVoice: this.passiveVoice(),
        caseFocus: this.caseFocus(),
        requiredWords: this.requiredWords(),
        topic: this.topic(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    });
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  generate() {
    const options: SentenceGenerateOptions = {
      level: this.level(),
      sentenceType: this.sentenceType(),
      tense: this.tense(),
      modalVerb: this.modalVerb(),
      length: this.length(),
      negation: this.negation(),
      passiveVoice: this.passiveVoice(),
      caseFocus: this.caseFocus(),
      requiredWords: this.requiredWords().trim() || undefined,
      topic: this.topic().trim() || undefined,
    };
    this.modalCtrl.dismiss(options, 'generate');
  }
}
