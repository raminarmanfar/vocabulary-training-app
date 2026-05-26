import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Vocabulary } from '../models/vocabulary.model';

export const QR_TOKEN_PREFIX = 'VT2:';

@Injectable({ providedIn: 'root' })
export class QrShareService {
  private readonly apiBase = environment.apiBaseUrl;
  private readonly apiKey  = environment.bedrockApiKey;

  /** Encode a token for display in a QR code. */
  encodeToken(token: string): string {
    return `${QR_TOKEN_PREFIX}${token}`;
  }

  /** Parse a scanned QR string; returns the token or null if not ours. */
  parseToken(raw: string): string | null {
    if (!raw.startsWith(QR_TOKEN_PREFIX)) return null;
    const token = raw.slice(QR_TOKEN_PREFIX.length).trim();
    return token.length === 32 ? token : null;
  }

  /**
   * Upload vocabs to S3 via Lambda.
   * Returns the one-time token to embed in the QR code.
   */
  async uploadVocabs(vocabs: Vocabulary[]): Promise<string> {
    const stripped = vocabs.map(({ imagePath: _img, learned: _l, ...rest }) => rest);
    const res = await fetch(`${this.apiBase}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
      body: JSON.stringify({ vocabs: stripped }),
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return data.token as string;
  }

  /**
   * Download vocabs from S3 via Lambda using the scanned token.
   * The object is deleted server-side after the first successful fetch.
   */
  async downloadVocabs(token: string): Promise<Vocabulary[]> {
    const res = await fetch(`${this.apiBase}/share/${encodeURIComponent(token)}`);
    if (res.status === 404) throw new Error('EXPIRED');
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const raw: any[] = await res.json();
    const now = new Date().toISOString();
    return raw.map(v => ({
      ...v,
      _id: crypto.randomUUID(),
      learned: false,
      imagePath: undefined,
      updatedAt: now,
    }));
  }
}

