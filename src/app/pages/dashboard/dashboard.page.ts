import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardContent, IonIcon, IonRippleEffect
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { bookOutline, helpCircleOutline, personOutline, settingsOutline, barbellOutline } from 'ionicons/icons';

interface Tile {
  labelKey: string;
  icon: string;
  color: string;
  route: string;
  descKey: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardContent, IonIcon, IonRippleEffect,
    TranslatePipe
  ]
})
export class DashboardPage {
  tiles: Tile[] = [
    { labelKey: 'dashboard.tiles.vocabularies.label', icon: 'book-outline',         color: 'primary',  route: '/vocabularies', descKey: 'dashboard.tiles.vocabularies.description' },
    { labelKey: 'dashboard.tiles.train.label',        icon: 'barbell-outline',       color: 'success',  route: '/train',        descKey: 'dashboard.tiles.train.description' },
    { labelKey: 'dashboard.tiles.quiz.label',         icon: 'help-circle-outline',  color: 'warning',  route: '/quiz',         descKey: 'dashboard.tiles.quiz.description' },
    { labelKey: 'dashboard.tiles.about.label',        icon: 'person-outline',       color: 'tertiary', route: '/about',        descKey: 'dashboard.tiles.about.description' },
    { labelKey: 'dashboard.tiles.settings.label',     icon: 'settings-outline',     color: 'medium',   route: '/settings',     descKey: 'dashboard.tiles.settings.description' }
  ];

  constructor(private router: Router, private translate: TranslateService) {
    addIcons({ bookOutline, helpCircleOutline, personOutline, settingsOutline, barbellOutline });
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
