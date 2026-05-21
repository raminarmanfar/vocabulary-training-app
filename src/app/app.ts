import { Component, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { App as CapApp } from '@capacitor/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>',
})
export class App implements OnInit {
  private platform = inject(Platform);
  private router = inject(Router);
  private location = inject(Location);

  ngOnInit() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      const currentUrl = this.router.url;
      if (currentUrl === '/dashboard' || currentUrl === '/') {
        CapApp.exitApp();
      } else {
        this.location.back();
      }
    });
  }
}
