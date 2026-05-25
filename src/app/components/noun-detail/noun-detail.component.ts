import { Component, inject, Input } from '@angular/core';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonBadge, IonGrid, IonRow, IonCol,
  IonAccordionGroup, IonAccordion, IonButton, IonIcon
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { volumeHighOutline } from 'ionicons/icons';
import { NounDetails } from '../../models/vocabulary.model';
import { TtsService } from '../../services/tts.service';

@Component({
  selector: 'app-noun-detail',
  templateUrl: './noun-detail.component.html',
  styleUrls: ['./noun-detail.component.scss'],
  standalone: true,
  imports: [
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonBadge, IonGrid, IonRow, IonCol,
    IonAccordionGroup, IonAccordion, IonButton, IonIcon,
    TranslatePipe
  ]
})
export class NounDetailComponent {
  @Input() details!: NounDetails;

  private tts = inject(TtsService);

  constructor() {
    addIcons({ volumeHighOutline });
  }

  async speakPlural(event: Event) {
    event.stopPropagation();
    await this.tts.speak(this.details.plural);
  }

  cases = ['nominative', 'akkusativ', 'genitiv', 'dativ'] as const;
  caseKeys: Record<string, string> = {
    nominative: 'grammar.nominativ', akkusativ: 'grammar.akkusativ', genitiv: 'grammar.genitiv', dativ: 'grammar.dativ'
  };
}
