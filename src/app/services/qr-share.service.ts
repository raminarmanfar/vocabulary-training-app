import { Injectable } from '@angular/core';
import * as pako from 'pako';
import { Vocabulary } from '../models/vocabulary.model';

const CHUNK_SIZE = 2200;
const PREFIX = 'VT1:';

export interface QrChunk {
  total: number;
  index: number;
  data: string;
}

@Injectable({ providedIn: 'root' })
export class QrShareService {

  /** Serialize + compress + split vocabs into QR-sized string chunks. */
  encode(vocabs: Vocabulary[]): string[] {
    const stripped = vocabs.map(v => ({ ...v, learned: false, imagePath: undefined }));
    const json = JSON.stringify(stripped);
    const deflated = pako.deflate(json, { level: 9 });
    let binary = '';
    for (let i = 0; i < deflated.length; i++) {
      binary += String.fromCharCode(deflated[i]);
    }
    const base64 = btoa(binary);
    const total = Math.ceil(base64.length / CHUNK_SIZE) || 1;
    const result: string[] = [];
    for (let i = 0; i < total; i++) {
      const slice = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      result.push(`${PREFIX}${total}:${i}:${slice}`);
    }
    return result;
  }

  /** Parse a single raw QR string into a chunk descriptor, or null if not ours. */
  parseChunk(raw: string): QrChunk | null {
    if (!raw.startsWith(PREFIX)) return null;
    const rest = raw.slice(PREFIX.length);
    const c1 = rest.indexOf(':');
    const c2 = rest.indexOf(':', c1 + 1);
    if (c1 < 0 || c2 < 0) return null;
    const total = parseInt(rest.slice(0, c1), 10);
    const index = parseInt(rest.slice(c1 + 1, c2), 10);
    const data = rest.slice(c2 + 1);
    if (isNaN(total) || isNaN(index) || !data) return null;
    return { total, index, data };
  }

  /** Reassemble chunks into Vocabulary objects with reset learned/id fields. */
  assemble(chunks: Map<number, string>, total: number): Vocabulary[] {
    let base64 = '';
    for (let i = 0; i < total; i++) {
      base64 += chunks.get(i) ?? '';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = pako.inflate(bytes, { to: 'string' });
    const vocabs: Vocabulary[] = JSON.parse(json);
    const now = new Date().toISOString();
    return vocabs.map(v => ({
      ...v,
      _id: crypto.randomUUID(),
      learned: false,
      imagePath: undefined,
      updatedAt: now,
    }));
  }
}
