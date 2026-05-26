import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { Sentence } from '../models/sentence.model';

@Injectable({ providedIn: 'root' })
export class SentenceService {
  private db = inject(DatabaseService);
  readonly sentencesSubject = new BehaviorSubject<Sentence[]>([]);
  sentences$ = this.sentencesSubject.asObservable();

  async load(): Promise<void> {
    const all = await this.db.getAllSentences();
    this.sentencesSubject.next(all);
  }

  async getById(id: string): Promise<Sentence | undefined> {
    return this.db.getSentenceById(id);
  }

  async save(sentence: Sentence): Promise<Sentence> {
    const saved = await this.db.saveSentence(sentence);
    await this.load();
    return saved;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteSentence(id);
    await this.load();
  }
}
