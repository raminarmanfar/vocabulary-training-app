import { Injectable, signal, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DatabaseService } from './database.service';

export type AppLanguage = 'en' | 'de';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private db = inject(DatabaseService);
  private translate = inject(TranslateService);
  readonly currentLang = signal<AppLanguage>('de');

  constructor() {
    this.translate.addLangs(['en', 'de']);
    this.translate.setDefaultLang('de');
    // Apply default immediately so the translate pipe works before init completes
    this.translate.use('de');
  }

  async init(): Promise<void> {
    const saved = await this.db.getSetting('language');
    const lang: AppLanguage = saved === 'en' ? 'en' : 'de';
    this.currentLang.set(lang);
    this.translate.use(lang);
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    this.db.saveSetting('language', lang);
  }
}
