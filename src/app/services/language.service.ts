import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from './database.service';

export type AppLanguage = 'en' | 'de' | 'tr' | 'fa';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private db = inject(DatabaseService);
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);
  readonly currentLang = signal<AppLanguage>('de');

  constructor() {
    this.translate.addLangs(['en', 'de', 'tr', 'fa']);
    this.translate.setDefaultLang('de');
    // Apply default immediately so the translate pipe works before init completes
    this.translate.use('de');
  }

  async init(): Promise<void> {
    const saved = await this.db.getSetting('language');
    const lang: AppLanguage = saved === 'en' ? 'en' : saved === 'tr' ? 'tr' : saved === 'fa' ? 'fa' : 'de';
    this.currentLang.set(lang);
    this.translate.use(lang);
    this.document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    this.db.saveSetting('language', lang);
    this.document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
  }
}
