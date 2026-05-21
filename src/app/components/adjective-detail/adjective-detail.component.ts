import { Component, Input } from '@angular/core';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonAccordionGroup, IonAccordion,
  IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { AdjectiveDetails } from '../../models/vocabulary.model';

@Component({
  selector: 'app-adjective-detail',
  templateUrl: './adjective-detail.component.html',
  styleUrls: ['./adjective-detail.component.scss'],
  standalone: true,
  imports: [
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonAccordionGroup, IonAccordion,
    IonGrid, IonRow, IonCol,
    TranslatePipe
  ]
})
export class AdjectiveDetailComponent {
  @Input() details!: AdjectiveDetails;

  cases = ['nominative', 'akkusativ', 'genitiv', 'dativ'] as const;
  caseKeys: Record<string, string> = {
    nominative: 'grammar.nominativ', akkusativ: 'grammar.akkusativ', genitiv: 'grammar.genitiv', dativ: 'grammar.dativ'
  };

  genders: Array<{ key: keyof AdjectiveDetails; labelKey: string }> = [
    { key: 'deklinationMaskulin', labelKey: 'grammar.maskulin' },
    { key: 'deklinationFeminin',  labelKey: 'grammar.feminin' },
    { key: 'deklinationNeutral',  labelKey: 'grammar.neutral' },
    { key: 'deklinationPlurar',   labelKey: 'grammar.plural' }
  ];
}
