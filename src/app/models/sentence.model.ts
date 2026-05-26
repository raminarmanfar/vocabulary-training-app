import { WordType } from './vocabulary.model';

export interface SentenceWord {
  word: string;
  lemma?: string;
  type: WordType;
  english: string;
  turkish?: string;
  persian?: string;
  note?: string;
}

export interface SentenceGrammar {
  tense: string;
  sentenceType: string;
  hasModalVerb: boolean;
  modalVerb?: string | null;
  isNegation: boolean;
  isPassive: boolean;
  clauseType?: string;
  notes?: string;
}

export interface Sentence {
  _id: string;
  german: string;
  english: string;
  turkish?: string;
  persian?: string;
  words: SentenceWord[];
  grammar: SentenceGrammar;
  createdAt: string;
  updatedAt: string;
}
