import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
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

export interface GenerateRandomVocabOptions {
  wordType?: WordType;
  level?: CefrLevel;
}

@Injectable({ providedIn: 'root' })
export class VocabAiService {
  private http = inject(HttpClient);
  private readonly cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  generate(word: string, options?: GenerateVocabOptions): Observable<AiVocabResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const body: Record<string, string | boolean> = {};

    const normalizedWord = word.trim();
    if (normalizedWord.length > 0) {
      body['word'] = normalizedWord;
    } else if (options?.random) {
      // Keep compatibility with older backend versions that still require a non-empty word.
      body['word'] = '__RANDOM__';
    }
    if (options?.wordType) body['wordType'] = options.wordType;
    if (options?.level) body['level'] = options.level;
    if (options?.random) body['random'] = true;

    return this.http.post<AiVocabResponse>(environment.bedrockApiUrl, body, { headers });
  }

  generateRandom(options?: GenerateRandomVocabOptions): Observable<AiVocabResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const body: Record<string, string> = {};

    if (options?.wordType) body['wordType'] = options.wordType;
    if (options?.level) body['level'] = options.level;
    body['requestId'] = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return this.http.post<AiVocabResponse>(environment.bedrockRandomApiUrl, body, { headers }).pipe(
      // Backward-compatible fallback in case /generate-random is not deployed yet.
      catchError(() =>
        this.generate('', {
          random: true,
          wordType: options?.wordType,
          level: options?.level,
        }).pipe(
          // Legacy compatibility: some backends accept random only with an explicit placeholder word.
          catchError(() =>
            this.generate('__RANDOM__', {
              random: true,
              wordType: options?.wordType,
              level: options?.level,
            }).pipe(
              // Last-resort backend fallback: relax constraints to return any random vocabulary.
              catchError(() =>
                this.generate('__RANDOM__', { random: true }).pipe(
                  // Absolute last resort: keep UX functional even if all network calls fail.
                  catchError(() => of(this.buildOfflineRandomResponse(options))),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  generateLocalRandom(
    options?: GenerateRandomVocabOptions,
    excludedGermanWords: string[] = [],
  ): AiVocabResponse {
    return this.buildOfflineRandomResponse(options, excludedGermanWords);
  }

  private buildOfflineRandomResponse(
    options?: GenerateRandomVocabOptions,
    excludedGermanWords: string[] = [],
  ): AiVocabResponse {
    type Entry = {
      german: string;
      english: string;
      wordType: Exclude<WordType, 'unknown'>;
      description: string;
    };

    const level = options?.level ?? this.pickOne(this.cefrLevels);
    const entriesByLevel: Record<CefrLevel, Entry[]> = {
      A1: [
        {
          german: 'gehen',
          english: 'to go',
          wordType: 'verb',
          description: 'to move from one place to another',
        },
        {
          german: 'das Buch',
          english: 'book',
          wordType: 'noun',
          description: 'a written or printed work',
        },
        { german: 'klein', english: 'small', wordType: 'adjective', description: 'of little size' },
      ],
      A2: [
        {
          german: 'besuchen',
          english: 'to visit',
          wordType: 'verb',
          description: 'to go to see someone or somewhere',
        },
        {
          german: 'die Einladung',
          english: 'invitation',
          wordType: 'noun',
          description: 'a request to attend something',
        },
        {
          german: 'schnell',
          english: 'quick',
          wordType: 'adjective',
          description: 'moving with high speed',
        },
      ],
      B1: [
        {
          german: 'entwickeln',
          english: 'to develop',
          wordType: 'verb',
          description: 'to grow or improve over time',
        },
        {
          german: 'die Erfahrung',
          english: 'experience',
          wordType: 'noun',
          description: 'knowledge from practice',
        },
        {
          german: 'zuverlaessig',
          english: 'reliable',
          wordType: 'adjective',
          description: 'consistently good or dependable',
        },
      ],
      B2: [
        {
          german: 'verhandeln',
          english: 'to negotiate',
          wordType: 'verb',
          description: 'to discuss to reach agreement',
        },
        {
          german: 'die Herausforderung',
          english: 'challenge',
          wordType: 'noun',
          description: 'a demanding task or situation',
        },
        {
          german: 'wesentlich',
          english: 'essential',
          wordType: 'adjective',
          description: 'absolutely necessary and important',
        },
      ],
      C1: [
        {
          german: 'erlaeutern',
          english: 'to elaborate',
          wordType: 'verb',
          description: 'to explain in detail',
        },
        {
          german: 'die Rahmenbedingung',
          english: 'framework condition',
          wordType: 'noun',
          description: 'a structural constraint or condition',
        },
        {
          german: 'praezise',
          english: 'precise',
          wordType: 'adjective',
          description: 'exact and accurate',
        },
      ],
      C2: [
        {
          german: 'antizipieren',
          english: 'to anticipate',
          wordType: 'verb',
          description: 'to expect and act in advance',
        },
        {
          german: 'die Ambivalenz',
          english: 'ambivalence',
          wordType: 'noun',
          description: 'mixed feelings or contradictory ideas',
        },
        {
          german: 'differenziert',
          english: 'nuanced',
          wordType: 'adjective',
          description: 'showing subtle distinctions',
        },
      ],
    };

    const selectedType = options?.wordType;
    const levelEntries = entriesByLevel[level];
    const typedLevelEntries = selectedType
      ? levelEntries.filter((entry) => entry.wordType === selectedType)
      : levelEntries;

    const allEntries = Object.values(entriesByLevel).flat();
    const typedAllEntries = selectedType
      ? allEntries.filter((entry) => entry.wordType === selectedType)
      : allEntries;

    const excludedSet = new Set(
      excludedGermanWords.map((word) => word.trim().toLowerCase()).filter(Boolean),
    );
    const allowedTypedLevelEntries = typedLevelEntries.filter(
      (entry) => !excludedSet.has(entry.german.trim().toLowerCase()),
    );
    const allowedTypedAllEntries = typedAllEntries.filter(
      (entry) => !excludedSet.has(entry.german.trim().toLowerCase()),
    );
    const allowedLevelEntries = levelEntries.filter(
      (entry) => !excludedSet.has(entry.german.trim().toLowerCase()),
    );

    const selectedEntry =
      (allowedTypedLevelEntries.length > 0 ? this.pickOne(allowedTypedLevelEntries) : undefined) ??
      (allowedTypedAllEntries.length > 0 ? this.pickOne(allowedTypedAllEntries) : undefined) ??
      (allowedLevelEntries.length > 0 ? this.pickOne(allowedLevelEntries) : undefined) ??
      (typedLevelEntries.length > 0 ? this.pickOne(typedLevelEntries) : undefined) ??
      (typedAllEntries.length > 0 ? this.pickOne(typedAllEntries) : this.pickOne(levelEntries));

    return {
      german: selectedEntry.german,
      english: selectedEntry.english,
      wordType: selectedEntry.wordType,
      level,
      description: `${selectedEntry.description} (offline fallback)`,
      examples: [
        {
          german: `Beispiel: ${selectedEntry.german} ist heute wichtig.`,
          english: `Example: ${selectedEntry.english} is important today.`,
        },
      ],
    };
  }

  private pickOne<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
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
