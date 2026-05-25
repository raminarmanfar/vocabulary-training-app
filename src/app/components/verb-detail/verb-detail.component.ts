import { Component, Input, inject } from '@angular/core';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonChip, IonLabel, IonAccordionGroup, IonAccordion, IonItem,
  IonGrid, IonRow, IonCol, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { volumeHighOutline } from 'ionicons/icons';
import { VerbDetails } from '../../models/vocabulary.model';
import { TtsService } from '../../services/tts.service';

@Component({
  selector: 'app-verb-detail',
  templateUrl: './verb-detail.component.html',
  styleUrls: ['./verb-detail.component.scss'],
  standalone: true,
  imports: [
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonChip, IonLabel, IonAccordionGroup, IonAccordion, IonItem,
    IonGrid, IonRow, IonCol, IonButton, IonIcon,
    TranslatePipe
  ]
})
export class VerbDetailComponent {
  @Input() details!: VerbDetails;
  private tts = inject(TtsService);

  pronouns = ['ich', 'du', 'erSieEs', 'wir', 'ihr', 'sie'] as const;
  pronounLabels: Record<string, string> = {
    ich: 'ich', du: 'du', erSieEs: 'er/sie/es', wir: 'wir', ihr: 'ihr', sie: 'sie/Sie'
  };

  imperativePronouns = ['du', 'wir', 'ihr', 'Sie'] as const;

  constructor() { addIcons({ volumeHighOutline }); }

  speak(text: string) {
    if (text) this.tts.speak(text);
  }
}
