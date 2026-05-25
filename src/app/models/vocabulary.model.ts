export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'other' | 'unknown';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type GrammaticalCase = 'nominative' | 'akkusativ' | 'genitiv' | 'dativ';

export interface ExampleSentence {
  german: string;
  english: string;
  turkish?: string;
  persian?: string;
}

export interface NounDeklination {
  nominative: string;
  akkusativ: string;
  genitiv: string;
  dativ: string;
}

export interface NounDetails {
  article: 'der' | 'die' | 'das';
  plural: string;
  deklinationBestimmt: NounDeklination;
  deklinationUnbestimmt: NounDeklination;
}

export interface VerbConjugation {
  ich: string;
  du: string;
  erSieEs: string;
  wir: string;
  ihr: string;
  sie: string;
}

export interface VerbImperative {
  du: string;
  wir: string;
  ihr: string;
  Sie: string;
}

export interface VerbDetails {
  isSeparable: boolean;
  isRegular: boolean;
  hilfsverb: 'haben' | 'sein';
  present: VerbConjugation;
  simplePast: VerbConjugation;
  pastPerfect: VerbConjugation;
  future: VerbConjugation;
  imperative: VerbImperative;
}

export interface AdjectiveDeklination {
  nominative: string;
  akkusativ: string;
  genitiv: string;
  dativ: string;
}

export interface AdjectiveDetails {
  komparativ: string;
  superlativ: string;
  deklinationMaskulin: AdjectiveDeklination;
  deklinationFeminin: AdjectiveDeklination;
  deklinationNeutral: AdjectiveDeklination;
  deklinationPlurar: AdjectiveDeklination;
}

export interface Vocabulary {
  _id: string;
  german: string;
  english: string;
  wordType: WordType;
  level: CefrLevel;
  description?: string;
  examples: ExampleSentence[];
  imagePath?: string;
  learned: boolean;
  nounDetails?: NounDetails;
  verbDetails?: VerbDetails;
  adjectiveDetails?: AdjectiveDetails;
  turkish?: string;
  persian?: string;
  synonyms?: string[];
  antonyms?: string[];
  createdAt: string;
  updatedAt: string;
}
