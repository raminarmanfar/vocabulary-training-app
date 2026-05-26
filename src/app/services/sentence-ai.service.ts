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

@Injectable({ providedIn: 'root' })
export class SentenceAiService {
  private http = inject(HttpClient);

  analyze(sentence: string): Observable<AiSentenceResponse> {
    const headers = new HttpHeaders({ 'x-api-key': environment.bedrockApiKey });
    const url = `${environment.apiBaseUrl}/analyze-sentence`;
    return this.http.post<AiSentenceResponse>(url, { sentence: sentence.trim() }, { headers });
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
