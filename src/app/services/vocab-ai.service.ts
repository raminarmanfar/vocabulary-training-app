import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdjectiveDetails,
  CefrLevel,
  NounDetails,
  VerbDetails,
  Vocabulary,
  WordType,
} from '../models/vocabulary.model';

/** Shape of the JSON object returned by the Lambda/Bedrock endpoint. */
export interface AiVocabResponse {
  german: string;
  english: string;
  turkish?: string | null;
  persian?: string | null;
  wordType: WordType;
  level: string;
  description?: string | null;
  examples: Array<{ german: string; english: string; turkish?: string; persian?: string }>;
  nounDetails?: NounDetails | null;
  verbDetails?: VerbDetails | null;
  adjectiveDetails?: AdjectiveDetails | null;
  synonyms?: string[];
  antonyms?: string[];
}

export interface GenerateVocabOptions {
  wordType?: WordType;
  level?: CefrLevel;
  random?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VocabAiService {
  private http = inject(HttpClient);

  generate(word: string, options?: GenerateVocabOptions): Observable<AiVocabResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const body: Record<string, string | boolean> = {};

    const normalizedWord = word.trim();
    if (normalizedWord.length > 0) {
      body['word'] = normalizedWord;
    }
    if (options?.wordType) body['wordType'] = options.wordType;
    if (options?.level) body['level'] = options.level;
    if (options?.random) body['random'] = true;

    return this.http.post<AiVocabResponse>(environment.bedrockApiUrl, body, { headers });
  }

  /**
   * Converts the raw API response into a Vocabulary object ready to be
   * saved via VocabularyService.save().
   */
  toVocabulary(response: AiVocabResponse): Vocabulary {
    const now = new Date().toISOString();
    return {
      _id: '', // assigned by DatabaseService on first save
      german: response.german,
      english: response.english,
      wordType: response.wordType,
      level: response.level as Vocabulary['level'],
      description: response.description ?? undefined,
      examples: response.examples ?? [],
      turkish: response.turkish ?? undefined,
      persian: response.persian ?? undefined,
      learned: false,
      nounDetails: response.nounDetails ?? undefined,
      verbDetails: response.verbDetails ?? undefined,
      adjectiveDetails: response.adjectiveDetails ?? undefined,
      synonyms: response.synonyms?.length ? response.synonyms : undefined,
      antonyms: response.antonyms?.length ? response.antonyms : undefined,
      aiGenerated: true,
      createdAt: now,
      updatedAt: now,
    };
  }
}
