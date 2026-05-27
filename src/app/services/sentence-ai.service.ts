import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sentence, SentenceWord, SentenceGrammar } from '../models/sentence.model';

export interface AiSentenceResponse {
  german: string;
  english: string;
  turkish?: string;
  persian?: string;
  words: SentenceWord[];
  grammar: SentenceGrammar;
}

export interface SentenceGenerateOptions {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  sentenceType: 'simple' | 'compound' | 'complex' | 'any';
  tense: 'Präsens' | 'Präteritum' | 'Perfekt' | 'Plusquamperfekt' | 'Futur I' | 'Futur II' | 'any';
  modalVerb: 'required' | 'forbidden' | 'optional';
  length: 'short' | 'medium' | 'long';
  negation: 'required' | 'forbidden' | 'optional';
  passiveVoice: 'required' | 'forbidden' | 'optional';
  connectors?: string[];
  topic?: string;
}

@Injectable({ providedIn: 'root' })
export class SentenceAiService {
  private http = inject(HttpClient);

  analyze(sentence: string): Observable<AiSentenceResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const url = `${environment.apiBaseUrl}/analyze-sentence`;
    return this.http.post<AiSentenceResponse>(url, { sentence: sentence.trim() }, { headers });
  }

  generateRandom(options: SentenceGenerateOptions): Observable<AiSentenceResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const url = `${environment.apiBaseUrl}/generate-sentence`;
    return this.http.post<AiSentenceResponse>(url, options, { headers });
  }

  toSentence(response: AiSentenceResponse): Sentence {
    const now = new Date().toISOString();
    return {
      _id: '',
      german: response.german,
      english: response.english,
      turkish: response.turkish,
      persian: response.persian,
      words: response.words ?? [],
      grammar: response.grammar,
      createdAt: now,
      updatedAt: now,
    };
  }
}
