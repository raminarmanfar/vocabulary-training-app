import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { QuizSet } from '../models/quiz-set.model';

@Injectable({ providedIn: 'root' })
export class QuizSetService {
  private db = inject(DatabaseService);

  private quizSetsSubject = new BehaviorSubject<QuizSet[]>([]);
  quizSets$ = this.quizSetsSubject.asObservable();

  async load(): Promise<void> {
    const all = await this.db.getAllQuizSets();
    this.quizSetsSubject.next(all);
  }

  async create(data: Omit<QuizSet, '_id' | 'createdAt'>): Promise<QuizSet> {
    const qs: QuizSet = {
      ...data,
      _id: `quiz_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    await this.db.saveQuizSet(qs);
    await this.load();
    return qs;
  }

  async update(qs: QuizSet): Promise<QuizSet> {
    await this.db.saveQuizSet(qs);
    await this.load();
    return qs;
  }

  async getById(id: string): Promise<QuizSet | undefined> {
    return this.db.getQuizSetById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteQuizSet(id);
    await this.load();
  }

  async deleteAll(): Promise<void> {
    await this.db.clearAllQuizSets();
    await this.load();
  }
}
