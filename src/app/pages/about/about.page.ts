import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { personCircleOutline, logoGithub, schoolOutline } from 'ionicons/icons';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel,
    TranslatePipe
  ],
  template: `
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ 'about.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-card style="margin-top:16px;text-align:center">
        <ion-card-content>
          <img
            src="assets/images/me-formal.webp"
            alt="Ramin Armanfar"
            style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid var(--ion-color-tertiary);margin-bottom:12px"
          />
          <h1 style="font-weight:700">{{ 'app.title' | translate }}</h1>
          <p style="color:var(--ion-color-medium)">{{ 'about.subtitle' | translate }}</p>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header><ion-card-title>{{ 'about.features.title' | translate }}</ion-card-title></ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-icon name="school-outline" slot="start" color="primary"></ion-icon>
            <ion-label>{{ 'about.features.grammar' | translate }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon name="school-outline" slot="start" color="success"></ion-icon>
            <ion-label>{{ 'about.features.cefr' | translate }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon name="school-outline" slot="start" color="warning"></ion-icon>
            <ion-label>{{ 'about.features.tts' | translate }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon name="school-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label>{{ 'about.features.offline' | translate }}</ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class AboutPage {
  constructor() { addIcons({ personCircleOutline, logoGithub, schoolOutline }); }
}
