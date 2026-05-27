import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Vocabulary } from '../models/vocabulary.model';
import { QuizSet } from '../models/quiz-set.model';
import { TrainSession } from '../models/train-session.model';
import { Sentence } from '../models/sentence.model';

interface AppSetting { key: string; value: string; }

class VocabDatabase extends Dexie {
  vocabularies!: Table<Vocabulary, string>;
  settings!: Table<AppSetting, string>;
  quizSets!: Table<QuizSet, string>;
  trainSessions!: Table<TrainSession, string>;
  sentences!: Table<Sentence, string>;

  constructor() {
    super('VocabTrainer');
    this.version(1).stores({
      vocabularies: '_id, wordType, level, learned, german, english'
    });
    this.version(2).stores({
      vocabularies: '_id, wordType, level, learned, german, english',
      settings: 'key'
    });
    this.version(3).stores({
      vocabularies: '_id, wordType, level, learned, german, english',
      settings: 'key',
      quizSets: '_id, status, createdAt'
    });
    this.version(4).stores({
      vocabularies: '_id, wordType, level, learned, german, english',
      settings: 'key',
      quizSets: '_id, status, createdAt',
      trainSessions: '_id, startedAt'
    });
    this.version(5).stores({
      vocabularies: '_id, wordType, level, learned, german, english',
      settings: 'key',
      quizSets: '_id, status, createdAt',
      trainSessions: '_id, startedAt',
      sentences: '_id, createdAt'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db = new VocabDatabase();

  async getAll(): Promise<Vocabulary[]> {
    return this.db.vocabularies.toArray();
  }

  async getById(id: string): Promise<Vocabulary> {
    const item = await this.db.vocabularies.get(id);
    if (!item) throw new Error(`Vocabulary ${id} not found`);
    return item;
  }

  async save(vocab: Vocabulary): Promise<Vocabulary> {
    vocab.updatedAt = new Date().toISOString();
    if (!vocab._id) {
      vocab._id = `vocab_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      vocab.createdAt = vocab.updatedAt;
    }
    await this.db.vocabularies.put(vocab);
    return vocab;
  }

  async delete(vocab: Vocabulary): Promise<void> {
    await this.db.vocabularies.delete(vocab._id);
  }

  async bulkSave(vocabs: Vocabulary[]): Promise<void> {
    await this.db.vocabularies.bulkPut(vocabs);
  }

  async getSetting(key: string): Promise<string | null> {
    const item = await this.db.settings.get(key);
    return item?.value ?? null;
  }

  async saveSetting(key: string, value: string): Promise<void> {
    await this.db.settings.put({ key, value });
  }

  async getAllQuizSets(): Promise<QuizSet[]> {
    return this.db.quizSets.orderBy('createdAt').reverse().toArray();
  }

  async getQuizSetById(id: string): Promise<QuizSet | undefined> {
    return this.db.quizSets.get(id);
  }

  async saveQuizSet(qs: QuizSet): Promise<void> {
    await this.db.quizSets.put(qs);
  }

  async deleteQuizSet(id: string): Promise<void> {
    await this.db.quizSets.delete(id);
  }

  async clearAllVocabularies(): Promise<void> {
    await this.db.vocabularies.clear();
  }

  async clearAllQuizSets(): Promise<void> {
    await this.db.quizSets.clear();
  }

  async clearAllAppData(): Promise<void> {
    await Promise.all([
      this.db.vocabularies.clear(),
      this.db.quizSets.clear(),
      this.db.trainSessions.clear(),
      this.db.sentences.clear(),
      this.db.settings.clear(),
    ]);
  }

  async getAllTrainSessions(): Promise<TrainSession[]> {
    return this.db.trainSessions.orderBy('startedAt').reverse().toArray();
  }

  async getTrainSessionById(id: string): Promise<TrainSession | undefined> {
    return this.db.trainSessions.get(id);
  }

  async saveTrainSession(session: TrainSession): Promise<void> {
    await this.db.trainSessions.put(session);
  }

  async deleteTrainSession(id: string): Promise<void> {
    await this.db.trainSessions.delete(id);
  }

  async clearAllTrainSessions(): Promise<void> {
    await this.db.trainSessions.clear();
  }

  async clearAllSettings(): Promise<void> {
    await this.db.settings.clear();
  }

  async getAllSentences(): Promise<Sentence[]> {
    return this.db.sentences.orderBy('createdAt').reverse().toArray();
  }

  async getSentenceById(id: string): Promise<Sentence | undefined> {
    return this.db.sentences.get(id);
  }

  async saveSentence(sentence: Sentence): Promise<Sentence> {
    sentence.updatedAt = new Date().toISOString();
    if (!sentence._id) {
      sentence._id = `sentence_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sentence.createdAt = sentence.updatedAt;
    }
    await this.db.sentences.put(sentence);
    return sentence;
  }

  async deleteSentence(id: string): Promise<void> {
    await this.db.sentences.delete(id);
  }
}
