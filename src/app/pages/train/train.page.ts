import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { constructOutline } from 'ionicons/icons';

@Component({
  selector: 'app-train',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonIcon, IonCard, IonCardContent,
    TranslatePipe
  ],
  template: `
    <ion-header>
      <ion-toolbar color="success">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'train.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-card style="margin-top:40px">
        <ion-card-content>
          <ion-icon name="construct-outline" style="font-size:64px;color:var(--ion-color-medium)"></ion-icon>
          <p>{{ 'train.comingSoon' | translate }}</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class TrainPage {
  constructor() { addIcons({ constructOutline }); }
}
