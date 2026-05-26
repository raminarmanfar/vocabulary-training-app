import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'vocabularies', loadComponent: () => import('./pages/vocabularies-list/vocabularies-list.page').then(m => m.VocabulariesListPage) },
  { path: 'vocabulary-details/:id', loadComponent: () => import('./pages/vocabulary-details/vocabulary-details.page').then(m => m.VocabularyDetailsPage) },
  { path: 'edit-vocabulary/:id', loadComponent: () => import('./pages/edit-vocabulary/edit-vocabulary.page').then(m => m.EditVocabularyPage) },
  { path: 'train', loadComponent: () => import('./pages/train/train.page').then(m => m.TrainPage) },
  { path: 'train-summary', loadComponent: () => import('./pages/train-summary/train-summary.page').then(m => m.TrainSummaryPage) },
  { path: 'train-summary/:id', loadComponent: () => import('./pages/train-summary/train-summary.page').then(m => m.TrainSummaryPage) },
  { path: 'quiz', loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage) },
  { path: 'quiz/new', loadComponent: () => import('./pages/quiz-new/quiz-new.page').then(m => m.QuizNewPage) },
  { path: 'about', loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },
  { path: 'sentences', loadComponent: () => import('./pages/sentences-list/sentences-list.page').then(m => m.SentencesListPage) },
  { path: 'sentence-details/:id', loadComponent: () => import('./pages/sentence-details/sentence-details.page').then(m => m.SentenceDetailsPage) },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes),
    provideHttpClient(),
    provideTranslateService({ defaultLanguage: 'de' }),
    ...provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService, lang: LanguageService) =>
        () => Promise.all([theme.init(), lang.init()]),
      deps: [ThemeService, LanguageService],
      multi: true
    }
  ],
};
