import { Injectable, signal, inject } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private db = inject(DatabaseService);
  readonly isDark = signal<boolean>(false); // default: light

  async init(): Promise<void> {
    const saved = await this.db.getSetting('theme');
    // null = first launch → default to light
    const dark = saved === 'dark';
    this.isDark.set(dark);
    this.applyTheme(dark);
  }

  setTheme(dark: boolean): void {
    this.isDark.set(dark);
    this.applyTheme(dark);
    this.db.saveSetting('theme', dark ? 'dark' : 'light');
  }

  toggleTheme(): void {
    this.setTheme(!this.isDark());
  }

  private applyTheme(dark: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', dark);
  }
}
