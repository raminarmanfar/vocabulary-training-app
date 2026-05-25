import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { VocabularyService } from './vocabulary.service';
import { DatabaseService } from './database.service';
import { VocabAiService } from './vocab-ai.service';
import { Vocabulary } from '../models/vocabulary.model';

@Injectable({ providedIn: 'root' })
export class EnrichmentService {
  private vocabService = inject(VocabularyService);
  private dbService   = inject(DatabaseService);
  private aiService   = inject(VocabAiService);
  private translate   = inject(TranslateService);

  readonly enriching   = signal(false);
  readonly enrichCount = signal(0);
  readonly enrichTotal = signal(0);
  /** Toast notification to show — consumed by the settings page. */
  readonly pendingToast = signal<{ open: boolean; message: string; color: string } | null>(null);

  async start(toEnrich: Vocabulary[]): Promise<void> {
    if (this.enriching()) return; // already running
    this.enriching.set(true);
    this.enrichCount.set(0);
    this.enrichTotal.set(toEnrich.length);
    let enrichedCount = 0;

    for (let i = 0; i < toEnrich.length; i++) {
      const vocab = toEnrich[i];
      this.enrichCount.set(i + 1);
      try {
        const response = await firstValueFrom(
          this.aiService.generate(vocab.german, vocab.wordType !== 'unknown' ? vocab.wordType : undefined)
        );
        const updated: Vocabulary = { ...vocab };
        if (!updated.turkish && response.turkish) updated.turkish = response.turkish;
        if (!updated.persian && response.persian) updated.persian = response.persian;
        if (!updated.synonyms?.length && response.synonyms?.length) updated.synonyms = response.synonyms;
        if (!updated.antonyms?.length && response.antonyms?.length) updated.antonyms = response.antonyms;
        if (updated.examples?.length && response.examples?.length) {
          updated.examples = updated.examples.map((ex, idx) => {
            const aiEx = response.examples[idx];
            if (!aiEx) return ex;
            return { ...ex, turkish: ex.turkish ?? aiEx.turkish, persian: ex.persian ?? aiEx.persian };
          });
        }
        await this.dbService.bulkSave([{ ...updated, aiEnriched: true }]);
        enrichedCount++;
      } catch { /* skip failed */ }
      await new Promise(r => setTimeout(r, 100));
    }

    await this.vocabService.load();
    this.enriching.set(false);
    this.enrichCount.set(0);
    this.enrichTotal.set(0);
    this.pendingToast.set({
      open: true,
      message: this.translate.instant('settings.data.enrichDone', { count: enrichedCount }),
      color: 'success'
    });
  }
}
