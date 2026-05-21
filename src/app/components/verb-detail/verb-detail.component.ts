import { Component, Input } from '@angular/core';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonChip, IonLabel, IonAccordionGroup, IonAccordion, IonItem,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { VerbDetails } from '../../models/vocabulary.model';

@Component({
  selector: 'app-verb-detail',
  templateUrl: './verb-detail.component.html',
  styleUrls: ['./verb-detail.component.scss'],
  standalone: true,
  imports: [
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonChip, IonLabel, IonAccordionGroup, IonAccordion, IonItem,
    IonGrid, IonRow, IonCol,
    TranslatePipe
  ]
})
export class VerbDetailComponent {
  @Input() details!: VerbDetails;

  pronouns = ['ich', 'du', 'erSieEs', 'wir', 'ihr', 'sie'] as const;
  pronounLabels: Record<string, string> = {
    ich: 'ich', du: 'du', erSieEs: 'er/sie/es', wir: 'wir', ihr: 'ihr', sie: 'sie/Sie'
  };

  imperativePronouns = ['du', 'wir', 'ihr', 'Sie'] as const;
}
