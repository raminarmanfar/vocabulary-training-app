import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DatabaseService } from './database.service';
import { Vocabulary, WordType, CefrLevel } from '../models/vocabulary.model';

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private db = inject(DatabaseService);
  readonly vocabsSubject = new BehaviorSubject<Vocabulary[]>([]);
  vocabs$ = this.vocabsSubject.asObservable();

  async load(): Promise<void> {
    const all = await this.db.getAll();
    this.vocabsSubject.next(all);
  }

  async getById(id: string): Promise<Vocabulary> {
    return this.db.getById(id);
  }

  async save(vocab: Vocabulary): Promise<Vocabulary> {
    const saved = await this.db.save(vocab);
    await this.load();
    return saved;
  }

  async delete(vocab: Vocabulary): Promise<void> {
    await this.db.delete(vocab);
    await this.load();
  }

  async deleteAll(): Promise<void> {
    await this.db.clearAllVocabularies();
    await this.load();
  }

  async toggleLearned(vocab: Vocabulary): Promise<void> {
    const updated = { ...vocab, learned: !vocab.learned };
    await this.db.save(updated);
    await this.load();
  }

  async exportAll(): Promise<Vocabulary[]> {
    return this.db.getAll();
  }

  async resetAllLearned(): Promise<void> {
    const vocabs = await this.db.getAll();
    const reset = vocabs.map(v => ({ ...v, learned: false }));
    await this.db.bulkSave(reset);
    await this.load();
  }

  findDuplicate(german: string, wordType: WordType, excludeId: string = ''): Vocabulary | undefined {
    const term = german.trim().toLowerCase();
    return this.vocabsSubject.value.find(v =>
      v._id !== excludeId &&
      v.german.trim().toLowerCase() === term &&
      v.wordType === wordType
    );
  }

  async importAll(vocabs: Vocabulary[]): Promise<number> {
    for (const vocab of vocabs) {
      await this.db.save(vocab);
    }
    await this.load();
    return vocabs.length;
  }

  filter(vocabs: Vocabulary[], wordTypes?: WordType[], levels?: CefrLevel[], searchTerm?: string): Vocabulary[] {
    return vocabs.filter(v => {
      const matchType = !wordTypes?.length || wordTypes.includes(v.wordType);
      const matchLevel = !levels?.length || levels.includes(v.level as CefrLevel);
      const term = (searchTerm || '').toLowerCase();
      const matchSearch = !term || v.german.toLowerCase().includes(term) || v.english.toLowerCase().includes(term);
      return matchType && matchLevel && matchSearch;
    });
  }


  async seedSampleData(): Promise<void> {
    const seeded = await this.db.getSetting('seeded_fresh_v1');
    if (seeded === 'true') {
      await this.load();
      return;
    }
    // Clear all existing data before re-seeding
    await this.db.clearAllVocabularies();
    await this.db.clearAllQuizSets();
    await this.db.clearAllTrainSessions();

    const now = new Date().toISOString();
    const samples: Vocabulary[] = [

      // ── Nouns (5 × A1-B1) ─────────────────────────────────────────────────
      {
        _id: 'seed_noun_1', german: 'Hund', english: 'dog', wordType: 'noun', level: 'A1',
        description: 'A common domestic animal kept as a pet or for work.',
        examples: [
          { german: 'Der Hund läuft schnell.', english: 'The dog runs fast.' },
          { german: 'Mein Hund heißt Max.', english: 'My dog is called Max.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'Hunde',
          deklinationBestimmt:   { nominative: 'der Hund',  akkusativ: 'den Hund',  genitiv: 'des Hundes', dativ: 'dem Hund' },
          deklinationUnbestimmt: { nominative: 'ein Hund',  akkusativ: 'einen Hund', genitiv: 'eines Hundes', dativ: 'einem Hund' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_noun_2', german: 'Schule', english: 'school', wordType: 'noun', level: 'A1',
        description: 'A place where children go to learn.',
        examples: [
          { german: 'Die Schule beginnt um acht Uhr.', english: 'School starts at eight o\'clock.' },
          { german: 'Ich gehe gern in die Schule.', english: 'I like going to school.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'Schulen',
          deklinationBestimmt:   { nominative: 'die Schule',   akkusativ: 'die Schule',   genitiv: 'der Schule',   dativ: 'der Schule' },
          deklinationUnbestimmt: { nominative: 'eine Schule',  akkusativ: 'eine Schule',  genitiv: 'einer Schule', dativ: 'einer Schule' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_noun_3', german: 'Wetter', english: 'weather', wordType: 'noun', level: 'A2',
        description: 'The state of the atmosphere at a place and time.',
        examples: [
          { german: 'Das Wetter heute ist sonnig.', english: 'The weather today is sunny.' },
          { german: 'Wie ist das Wetter bei euch?', english: 'What is the weather like where you are?' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: '(kein Plural)',
          deklinationBestimmt:   { nominative: 'das Wetter',  akkusativ: 'das Wetter',  genitiv: 'des Wetters',   dativ: 'dem Wetter' },
          deklinationUnbestimmt: { nominative: 'ein Wetter',  akkusativ: 'ein Wetter',  genitiv: 'eines Wetters', dativ: 'einem Wetter' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_noun_4', german: 'Sprache', english: 'language', wordType: 'noun', level: 'A2',
        description: 'A system of communication used by a community.',
        examples: [
          { german: 'Deutsch ist eine schöne Sprache.', english: 'German is a beautiful language.' },
          { german: 'Er spricht drei Sprachen.', english: 'He speaks three languages.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'Sprachen',
          deklinationBestimmt:   { nominative: 'die Sprache',   akkusativ: 'die Sprache',   genitiv: 'der Sprache',   dativ: 'der Sprache' },
          deklinationUnbestimmt: { nominative: 'eine Sprache',  akkusativ: 'eine Sprache',  genitiv: 'einer Sprache', dativ: 'einer Sprache' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_noun_5', german: 'Lösung', english: 'solution', wordType: 'noun', level: 'B1',
        description: 'A means of solving a problem or dealing with a difficult situation.',
        examples: [
          { german: 'Wir suchen eine Lösung für das Problem.', english: 'We are looking for a solution to the problem.' },
          { german: 'Die beste Lösung ist Kommunikation.', english: 'The best solution is communication.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'Lösungen',
          deklinationBestimmt:   { nominative: 'die Lösung',   akkusativ: 'die Lösung',   genitiv: 'der Lösung',   dativ: 'der Lösung' },
          deklinationUnbestimmt: { nominative: 'eine Lösung',  akkusativ: 'eine Lösung',  genitiv: 'einer Lösung', dativ: 'einer Lösung' }
        },
        createdAt: now, updatedAt: now
      },

      // ── Verbs (5 × A1-B1) ─────────────────────────────────────────────────
      {
        _id: 'seed_verb_1', german: 'lernen', english: 'to learn', wordType: 'verb', level: 'A1',
        description: 'To acquire knowledge or a skill.',
        examples: [
          { german: 'Ich lerne Deutsch.', english: 'I am learning German.' },
          { german: 'Sie lernt jeden Tag neue Wörter.', english: 'She learns new words every day.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, isReflexive: false, hilfsverb: 'haben',
          present:    { ich: 'lerne',   du: 'lernst',    erSieEs: 'lernt',   wir: 'lernen',   ihr: 'lernt',   sie: 'lernen' },
          simplePast: { ich: 'lernte',  du: 'lerntest',  erSieEs: 'lernte',  wir: 'lernten',  ihr: 'lerntet', sie: 'lernten' },
          pastPerfect:{ ich: 'habe gelernt', du: 'hast gelernt', erSieEs: 'hat gelernt', wir: 'haben gelernt', ihr: 'habt gelernt', sie: 'haben gelernt' },
          future:     { ich: 'werde lernen', du: 'wirst lernen', erSieEs: 'wird lernen', wir: 'werden lernen', ihr: 'werdet lernen', sie: 'werden lernen' },
          imperative: { du: 'lern!', wir: 'lernen wir!', ihr: 'lernt!', Sie: 'lernen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_verb_2', german: 'gehen', english: 'to go', wordType: 'verb', level: 'A1',
        description: 'To move from one place to another on foot.',
        examples: [
          { german: 'Ich gehe in die Stadt.', english: 'I am going to the city.' },
          { german: 'Wir gehen morgen ins Kino.', english: 'We are going to the cinema tomorrow.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, isReflexive: false, hilfsverb: 'sein',
          present:    { ich: 'gehe',  du: 'gehst',  erSieEs: 'geht',  wir: 'gehen',  ihr: 'geht',  sie: 'gehen' },
          simplePast: { ich: 'ging',  du: 'gingst', erSieEs: 'ging',  wir: 'gingen', ihr: 'gingt', sie: 'gingen' },
          pastPerfect:{ ich: 'bin gegangen', du: 'bist gegangen', erSieEs: 'ist gegangen', wir: 'sind gegangen', ihr: 'seid gegangen', sie: 'sind gegangen' },
          future:     { ich: 'werde gehen', du: 'wirst gehen', erSieEs: 'wird gehen', wir: 'werden gehen', ihr: 'werdet gehen', sie: 'werden gehen' },
          imperative: { du: 'geh!', wir: 'gehen wir!', ihr: 'geht!', Sie: 'gehen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_verb_3', german: 'kaufen', english: 'to buy', wordType: 'verb', level: 'A2',
        description: 'To obtain something by paying money for it.',
        examples: [
          { german: 'Ich kaufe ein neues Buch.', english: 'I am buying a new book.' },
          { german: 'Sie hat gestern ein Kleid gekauft.', english: 'She bought a dress yesterday.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, isReflexive: false, hilfsverb: 'haben',
          present:    { ich: 'kaufe',  du: 'kaufst',   erSieEs: 'kauft',  wir: 'kaufen',  ihr: 'kauft',   sie: 'kaufen' },
          simplePast: { ich: 'kaufte', du: 'kauftest', erSieEs: 'kaufte', wir: 'kauften', ihr: 'kauftet', sie: 'kauften' },
          pastPerfect:{ ich: 'habe gekauft', du: 'hast gekauft', erSieEs: 'hat gekauft', wir: 'haben gekauft', ihr: 'habt gekauft', sie: 'haben gekauft' },
          future:     { ich: 'werde kaufen', du: 'wirst kaufen', erSieEs: 'wird kaufen', wir: 'werden kaufen', ihr: 'werdet kaufen', sie: 'werden kaufen' },
          imperative: { du: 'kauf!', wir: 'kaufen wir!', ihr: 'kauft!', Sie: 'kaufen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_verb_4', german: 'erklären', english: 'to explain', wordType: 'verb', level: 'B1',
        description: 'To make something clear by describing it in more detail.',
        examples: [
          { german: 'Kannst du mir das erklären?', english: 'Can you explain that to me?' },
          { german: 'Der Lehrer erklärt die Grammatik.', english: 'The teacher explains the grammar.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, isReflexive: false, hilfsverb: 'haben',
          present:    { ich: 'erkläre',  du: 'erklärst',  erSieEs: 'erklärt',  wir: 'erklären',  ihr: 'erklärt',  sie: 'erklären' },
          simplePast: { ich: 'erklärte', du: 'erklärtest', erSieEs: 'erklärte', wir: 'erklärten', ihr: 'erklärtet', sie: 'erklärten' },
          pastPerfect:{ ich: 'habe erklärt', du: 'hast erklärt', erSieEs: 'hat erklärt', wir: 'haben erklärt', ihr: 'habt erklärt', sie: 'haben erklärt' },
          future:     { ich: 'werde erklären', du: 'wirst erklären', erSieEs: 'wird erklären', wir: 'werden erklären', ihr: 'werdet erklären', sie: 'werden erklären' },
          imperative: { du: 'erkläre!', wir: 'erklären wir!', ihr: 'erklärt!', Sie: 'erklären Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_verb_5', german: 'sich vorstellen', english: 'to introduce oneself / to imagine', wordType: 'verb', level: 'B1',
        description: 'To introduce yourself to others, or to picture something in your mind.',
        examples: [
          { german: 'Darf ich mich vorstellen? Ich heiße Thomas.', english: 'May I introduce myself? My name is Thomas.' },
          { german: 'Ich kann mir das gut vorstellen.', english: 'I can imagine that well.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: true, isReflexive: true, hilfsverb: 'haben',
          present:    { ich: 'stelle mich vor', du: 'stellst dich vor', erSieEs: 'stellt sich vor', wir: 'stellen uns vor', ihr: 'stellt euch vor', sie: 'stellen sich vor' },
          simplePast: { ich: 'stellte mich vor', du: 'stelltest dich vor', erSieEs: 'stellte sich vor', wir: 'stellten uns vor', ihr: 'stelltet euch vor', sie: 'stellten sich vor' },
          pastPerfect:{ ich: 'habe mich vorgestellt', du: 'hast dich vorgestellt', erSieEs: 'hat sich vorgestellt', wir: 'haben uns vorgestellt', ihr: 'habt euch vorgestellt', sie: 'haben sich vorgestellt' },
          future:     { ich: 'werde mich vorstellen', du: 'wirst dich vorstellen', erSieEs: 'wird sich vorstellen', wir: 'werden uns vorstellen', ihr: 'werdet euch vorstellen', sie: 'werden sich vorstellen' },
          imperative: { du: 'stell dich vor!', wir: 'stellen wir uns vor!', ihr: 'stellt euch vor!', Sie: 'stellen Sie sich vor!' }
        },
        createdAt: now, updatedAt: now
      },

      // ── Adjectives (5 × A1-B1) ────────────────────────────────────────────
      {
        _id: 'seed_adj_1', german: 'schön', english: 'beautiful / nice', wordType: 'adjective', level: 'A1',
        description: 'Pleasing to the senses; attractive.',
        examples: [
          { german: 'Das Wetter ist heute schön.', english: 'The weather is nice today.' },
          { german: 'Sie hat ein schönes Kleid.', english: 'She has a beautiful dress.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schöner', superlativ: 'am schönsten',
          deklinationMaskulin: { nominative: 'schöner', akkusativ: 'schönen', genitiv: 'schönen', dativ: 'schönem' },
          deklinationFeminin:  { nominative: 'schöne',  akkusativ: 'schöne',  genitiv: 'schöner', dativ: 'schöner' },
          deklinationNeutral:  { nominative: 'schönes', akkusativ: 'schönes', genitiv: 'schönen', dativ: 'schönem' },
          deklinationPlurar:   { nominative: 'schöne',  akkusativ: 'schöne',  genitiv: 'schöner', dativ: 'schönen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adj_2', german: 'groß', english: 'big / tall', wordType: 'adjective', level: 'A1',
        description: 'Of considerable size or extent.',
        examples: [
          { german: 'Er ist sehr groß.', english: 'He is very tall.' },
          { german: 'Das ist ein großes Haus.', english: 'That is a big house.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'größer', superlativ: 'am größten',
          deklinationMaskulin: { nominative: 'großer', akkusativ: 'großen', genitiv: 'großen', dativ: 'großem' },
          deklinationFeminin:  { nominative: 'große',  akkusativ: 'große',  genitiv: 'großer', dativ: 'großer' },
          deklinationNeutral:  { nominative: 'großes', akkusativ: 'großes', genitiv: 'großen', dativ: 'großem' },
          deklinationPlurar:   { nominative: 'große',  akkusativ: 'große',  genitiv: 'großer', dativ: 'großen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adj_3', german: 'kalt', english: 'cold', wordType: 'adjective', level: 'A2',
        description: 'Of or at a low temperature.',
        examples: [
          { german: 'Der Winter ist sehr kalt.', english: 'The winter is very cold.' },
          { german: 'Das kalte Wasser erfrischt mich.', english: 'The cold water refreshes me.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kälter', superlativ: 'am kältesten',
          deklinationMaskulin: { nominative: 'kalter', akkusativ: 'kalten', genitiv: 'kalten', dativ: 'kaltem' },
          deklinationFeminin:  { nominative: 'kalte',  akkusativ: 'kalte',  genitiv: 'kalter', dativ: 'kalter' },
          deklinationNeutral:  { nominative: 'kaltes', akkusativ: 'kaltes', genitiv: 'kalten', dativ: 'kaltem' },
          deklinationPlurar:   { nominative: 'kalte',  akkusativ: 'kalte',  genitiv: 'kalter', dativ: 'kalten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adj_4', german: 'wichtig', english: 'important', wordType: 'adjective', level: 'B1',
        description: 'Of great significance or value.',
        examples: [
          { german: 'Das ist eine wichtige Frage.', english: 'That is an important question.' },
          { german: 'Es ist wichtig, pünktlich zu sein.', english: 'It is important to be punctual.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'wichtiger', superlativ: 'am wichtigsten',
          deklinationMaskulin: { nominative: 'wichtiger', akkusativ: 'wichtigen', genitiv: 'wichtigen', dativ: 'wichtigem' },
          deklinationFeminin:  { nominative: 'wichtige',  akkusativ: 'wichtige',  genitiv: 'wichtiger', dativ: 'wichtiger' },
          deklinationNeutral:  { nominative: 'wichtiges', akkusativ: 'wichtiges', genitiv: 'wichtigen', dativ: 'wichtigem' },
          deklinationPlurar:   { nominative: 'wichtige',  akkusativ: 'wichtige',  genitiv: 'wichtiger', dativ: 'wichtigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adj_5', german: 'schwierig', english: 'difficult', wordType: 'adjective', level: 'B1',
        description: 'Needing much effort or skill to accomplish.',
        examples: [
          { german: 'Diese Aufgabe ist sehr schwierig.', english: 'This task is very difficult.' },
          { german: 'Es war eine schwierige Entscheidung.', english: 'It was a difficult decision.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schwieriger', superlativ: 'am schwierigsten',
          deklinationMaskulin: { nominative: 'schwieriger', akkusativ: 'schwierigen', genitiv: 'schwierigen', dativ: 'schwierigem' },
          deklinationFeminin:  { nominative: 'schwierige',  akkusativ: 'schwierige',  genitiv: 'schwieriger', dativ: 'schwieriger' },
          deklinationNeutral:  { nominative: 'schwieriges', akkusativ: 'schwieriges', genitiv: 'schwierigen', dativ: 'schwierigem' },
          deklinationPlurar:   { nominative: 'schwierige',  akkusativ: 'schwierige',  genitiv: 'schwieriger', dativ: 'schwierigen' }
        },
        createdAt: now, updatedAt: now
      },

      // ── Adverbs (5 × A1-B1) ───────────────────────────────────────────────
      {
        _id: 'seed_adv_1', german: 'schnell', english: 'fast / quickly', wordType: 'adverb', level: 'A1',
        description: 'At a high speed.',
        examples: [
          { german: 'Das Auto fährt sehr schnell.', english: 'The car drives very fast.' },
          { german: 'Bitte sprich nicht so schnell.', english: 'Please don\'t speak so quickly.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adv_2', german: 'heute', english: 'today', wordType: 'adverb', level: 'A1',
        description: 'On this present day.',
        examples: [
          { german: 'Heute ist Montag.', english: 'Today is Monday.' },
          { german: 'Was machst du heute Abend?', english: 'What are you doing this evening?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adv_3', german: 'immer', english: 'always', wordType: 'adverb', level: 'A2',
        description: 'At all times; on all occasions.',
        examples: [
          { german: 'Sie ist immer pünktlich.', english: 'She is always punctual.' },
          { german: 'Ich trinke immer Kaffee am Morgen.', english: 'I always drink coffee in the morning.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adv_4', german: 'leider', english: 'unfortunately', wordType: 'adverb', level: 'A2',
        description: 'Used to express regret or sorrow.',
        examples: [
          { german: 'Leider kann ich nicht kommen.', english: 'Unfortunately I cannot come.' },
          { german: 'Das ist leider nicht möglich.', english: 'I\'m afraid that is not possible.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_adv_5', german: 'trotzdem', english: 'nevertheless / anyway', wordType: 'adverb', level: 'B1',
        description: 'In spite of that; all the same.',
        examples: [
          { german: 'Es regnet, aber wir gehen trotzdem spazieren.', english: 'It is raining, but we go for a walk anyway.' },
          { german: 'Er war krank, trotzdem kam er zur Arbeit.', english: 'He was sick; nevertheless, he came to work.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },

      // ── Prepositions (5 × A1-B1) ──────────────────────────────────────────
      {
        _id: 'seed_prep_1', german: 'in', english: 'in / into', wordType: 'preposition', level: 'A1',
        description: 'Expressing location inside something. Takes dative (location) or accusative (movement).',
        examples: [
          { german: 'Ich bin in der Schule.', english: 'I am in school.' },
          { german: 'Er geht in die Stadt.', english: 'He goes into the city.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_prep_2', german: 'auf', english: 'on / onto', wordType: 'preposition', level: 'A1',
        description: 'On a surface. Takes dative (location) or accusative (movement).',
        examples: [
          { german: 'Das Buch liegt auf dem Tisch.', english: 'The book is on the table.' },
          { german: 'Er legt das Buch auf den Tisch.', english: 'He puts the book onto the table.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_prep_3', german: 'mit', english: 'with', wordType: 'preposition', level: 'A1',
        description: 'Indicating accompaniment or means. Always takes dative.',
        examples: [
          { german: 'Ich komme mit dem Bus.', english: 'I come by bus.' },
          { german: 'Sie geht mit ihrem Freund spazieren.', english: 'She goes for a walk with her friend.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_prep_4', german: 'für', english: 'for', wordType: 'preposition', level: 'A1',
        description: 'Indicating purpose, recipient, or duration. Always takes accusative.',
        examples: [
          { german: 'Das ist ein Geschenk für dich.', english: 'This is a gift for you.' },
          { german: 'Ich lerne für die Prüfung.', english: 'I am studying for the exam.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_prep_5', german: 'wegen', english: 'because of / due to', wordType: 'preposition', level: 'A2',
        description: 'Indicating cause or reason. Takes genitive.',
        examples: [
          { german: 'Wegen des Regens blieb er zu Hause.', english: 'He stayed at home because of the rain.' },
          { german: 'Sie kam spät wegen des Staus.', english: 'She arrived late due to the traffic jam.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },

      // ── Conjunctions (5 × A1-B1) ──────────────────────────────────────────
      {
        _id: 'seed_conj_1', german: 'und', english: 'and', wordType: 'conjunction', level: 'A1',
        description: 'Connects words, phrases, or clauses of the same type (coordinating).',
        examples: [
          { german: 'Ich esse Brot und Käse.', english: 'I eat bread and cheese.' },
          { german: 'Sie singt und tanzt.', english: 'She sings and dances.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_conj_2', german: 'oder', english: 'or', wordType: 'conjunction', level: 'A1',
        description: 'Introduces an alternative (coordinating).',
        examples: [
          { german: 'Möchtest du Tee oder Kaffee?', english: 'Would you like tea or coffee?' },
          { german: 'Kommst du oder bleibst du?', english: 'Are you coming or staying?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_conj_3', german: 'aber', english: 'but / however', wordType: 'conjunction', level: 'A1',
        description: 'Introduces a contrast or exception (coordinating).',
        examples: [
          { german: 'Ich mag Kaffee, aber keinen Tee.', english: 'I like coffee but not tea.' },
          { german: 'Er ist müde, aber er arbeitet weiter.', english: 'He is tired but he keeps working.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_conj_4', german: 'weil', english: 'because', wordType: 'conjunction', level: 'A1',
        description: 'Gives a reason (subordinating — verb goes to the end).',
        examples: [
          { german: 'Ich bleibe zu Hause, weil ich krank bin.', english: 'I am staying at home because I am sick.' },
          { german: 'Er lernt Deutsch, weil er nach Deutschland will.', english: 'He is learning German because he wants to go to Germany.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_conj_5', german: 'obwohl', english: 'although / even though', wordType: 'conjunction', level: 'B1',
        description: 'Introduces a concession (subordinating — verb goes to the end).',
        examples: [
          { german: 'Obwohl es regnet, gehen wir spazieren.', english: 'Although it is raining, we go for a walk.' },
          { german: 'Er kam, obwohl er krank war.', english: 'He came even though he was ill.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },

      // ── Pronouns (5 × A1-B1) ──────────────────────────────────────────────
      {
        _id: 'seed_pron_1', german: 'ich', english: 'I', wordType: 'pronoun', level: 'A1',
        description: 'First-person singular personal pronoun.',
        examples: [
          { german: 'Ich bin müde.', english: 'I am tired.' },
          { german: 'Ich heiße Anna.', english: 'My name is Anna.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_pron_2', german: 'du', english: 'you (informal)', wordType: 'pronoun', level: 'A1',
        description: 'Second-person singular personal pronoun (informal address).',
        examples: [
          { german: 'Du bist mein Freund.', english: 'You are my friend.' },
          { german: 'Wie heißt du?', english: 'What is your name?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_pron_3', german: 'wer', english: 'who', wordType: 'pronoun', level: 'A1',
        description: 'Interrogative pronoun asking for a person.',
        examples: [
          { german: 'Wer ist das?', english: 'Who is that?' },
          { german: 'Wer kommt zur Party?', english: 'Who is coming to the party?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_pron_4', german: 'jemand', english: 'someone / somebody', wordType: 'pronoun', level: 'A2',
        description: 'Indefinite pronoun referring to an unspecified person.',
        examples: [
          { german: 'Jemand hat an die Tür geklopft.', english: 'Someone knocked at the door.' },
          { german: 'Gibt es jemanden, der helfen kann?', english: 'Is there someone who can help?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_pron_5', german: 'niemand', english: 'nobody / no one', wordType: 'pronoun', level: 'A2',
        description: 'Indefinite pronoun meaning not a single person.',
        examples: [
          { german: 'Niemand war zu Hause.', english: 'Nobody was at home.' },
          { german: 'Ich kenne hier niemanden.', english: 'I don\'t know anyone here.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },

      // ── Other (5 × A1-B1) ─────────────────────────────────────────────────
      {
        _id: 'seed_other_1', german: 'bitte', english: 'please / you\'re welcome', wordType: 'other', level: 'A1',
        description: 'Used to make a request politely; also used to say "you\'re welcome".',
        examples: [
          { german: 'Können Sie mir bitte helfen?', english: 'Can you please help me?' },
          { german: 'Danke! – Bitte!', english: 'Thank you! – You\'re welcome!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_other_2', german: 'danke', english: 'thank you', wordType: 'other', level: 'A1',
        description: 'An expression of gratitude.',
        examples: [
          { german: 'Danke für deine Hilfe.', english: 'Thank you for your help.' },
          { german: 'Vielen Dank!', english: 'Many thanks!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_other_3', german: 'hallo', english: 'hello / hi', wordType: 'other', level: 'A1',
        description: 'A common informal greeting.',
        examples: [
          { german: 'Hallo, wie geht\'s?', english: 'Hello, how are you?' },
          { german: 'Hallo! Schön dich zu sehen.', english: 'Hi! Nice to see you.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_other_4', german: 'tschüss', english: 'bye / goodbye', wordType: 'other', level: 'A1',
        description: 'An informal farewell expression.',
        examples: [
          { german: 'Tschüss, bis morgen!', english: 'Bye, see you tomorrow!' },
          { german: 'Ich gehe jetzt. Tschüss!', english: 'I\'m going now. Bye!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'seed_other_5', german: 'gerne', english: 'gladly / with pleasure', wordType: 'other', level: 'A1',
        description: 'Expressing willingness or pleasure. Also used to say "you\'re welcome".',
        examples: [
          { german: 'Ich helfe dir gerne.', english: 'I am happy to help you.' },
          { german: 'Danke! – Gerne!', english: 'Thank you! – My pleasure!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
    ];

    await this.db.bulkSave(samples);
    await this.db.saveSetting('seeded_fresh_v1', 'true');
    await this.load();
  }
}
