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

  filter(vocabs: Vocabulary[], wordType?: WordType | '', level?: CefrLevel | '', searchTerm?: string): Vocabulary[] {
    return vocabs.filter(v => {
      const matchType = !wordType || v.wordType === wordType;
      const matchLevel = !level || v.level === level;
      const term = (searchTerm || '').toLowerCase();
      const matchSearch = !term || v.german.toLowerCase().includes(term) || v.english.toLowerCase().includes(term);
      return matchType && matchLevel && matchSearch;
    });
  }

  async seedSampleData(): Promise<void> {
    const alreadySeeded = await this.db.getSetting('seeded');
    if (alreadySeeded !== 'true') {
      const now = new Date().toISOString();
      const samples: Vocabulary[] = [
      {
        _id: 'vocab_sample_1',
        german: 'der Hund',
        english: 'dog',
        wordType: 'noun',
        level: 'A1',
        description: 'A common domestic animal.',
        examples: [
          { german: 'Der Hund läuft schnell.', english: 'The dog runs fast.' },
          { german: 'Mein Hund heißt Max.', english: 'My dog is called Max.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der',
          plural: 'die Hunde',
          deklinationBestimmt: { nominative: 'der Hund', akkusativ: 'den Hund', genitiv: 'des Hundes', dativ: 'dem Hund' },
          deklinationUnbestimmt: { nominative: 'ein Hund', akkusativ: 'einen Hund', genitiv: 'eines Hundes', dativ: 'einem Hund' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_2',
        german: 'lernen',
        english: 'to learn',
        wordType: 'verb',
        level: 'A1',
        description: 'To acquire knowledge or a skill.',
        examples: [
          { german: 'Ich lerne Deutsch.', english: 'I am learning German.' },
          { german: 'Sie lernt jeden Tag neue Wörter.', english: 'She learns new words every day.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false,
          isRegular: true,
          hilfsverb: 'haben',
          present: { ich: 'lerne', du: 'lernst', erSieEs: 'lernt', wir: 'lernen', ihr: 'lernt', sie: 'lernen' },
          simplePast: { ich: 'lernte', du: 'lerntest', erSieEs: 'lernte', wir: 'lernten', ihr: 'lerntet', sie: 'lernten' },
          pastPerfect: { ich: 'habe gelernt', du: 'hast gelernt', erSieEs: 'hat gelernt', wir: 'haben gelernt', ihr: 'habt gelernt', sie: 'haben gelernt' },
          future: { ich: 'werde lernen', du: 'wirst lernen', erSieEs: 'wird lernen', wir: 'werden lernen', ihr: 'werdet lernen', sie: 'werden lernen' },
          imperative: { du: 'lern!', wir: 'lernen wir!', ihr: 'lernt!', Sie: 'lernen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_3',
        german: 'schön',
        english: 'beautiful / nice',
        wordType: 'adjective',
        level: 'A1',
        description: 'Pleasing to the senses.',
        examples: [
          { german: 'Das Wetter ist schön.', english: 'The weather is nice.' },
          { german: 'Sie hat ein schönes Kleid.', english: 'She has a beautiful dress.' }
        ],
        learned: true,
        adjectiveDetails: {
          komparativ: 'schöner',
          superlativ: 'am schönsten',
          deklinationMaskulin: { nominative: 'schöner', akkusativ: 'schönen', genitiv: 'schönen', dativ: 'schönem' },
          deklinationFeminin: { nominative: 'schöne', akkusativ: 'schöne', genitiv: 'schöner', dativ: 'schöner' },
          deklinationNeutral: { nominative: 'schönes', akkusativ: 'schönes', genitiv: 'schönen', dativ: 'schönem' },
          deklinationPlurar: { nominative: 'schöne', akkusativ: 'schöne', genitiv: 'schöner', dativ: 'schönen' }
        },
        createdAt: now, updatedAt: now
      },
      // ── A1 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_4',
        german: 'die Schule',
        english: 'school',
        wordType: 'noun',
        level: 'A1',
        description: 'A place where children learn.',
        examples: [
          { german: 'Die Schule beginnt um acht Uhr.', english: 'School starts at eight o\'clock.' },
          { german: 'Ich gehe gern in die Schule.', english: 'I like going to school.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die',
          plural: 'die Schulen',
          deklinationBestimmt: { nominative: 'die Schule', akkusativ: 'die Schule', genitiv: 'der Schule', dativ: 'der Schule' },
          deklinationUnbestimmt: { nominative: 'eine Schule', akkusativ: 'eine Schule', genitiv: 'einer Schule', dativ: 'einer Schule' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_5',
        german: 'gehen',
        english: 'to go',
        wordType: 'verb',
        level: 'A1',
        description: 'To move from one place to another on foot.',
        examples: [
          { german: 'Ich gehe in die Stadt.', english: 'I am going to the city.' },
          { german: 'Wir gehen morgen ins Kino.', english: 'We are going to the cinema tomorrow.' }
        ],
        learned: true,
        verbDetails: {
          isSeparable: false,
          isRegular: false,
          hilfsverb: 'sein',
          present: { ich: 'gehe', du: 'gehst', erSieEs: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen' },
          simplePast: { ich: 'ging', du: 'gingst', erSieEs: 'ging', wir: 'gingen', ihr: 'gingt', sie: 'gingen' },
          pastPerfect: { ich: 'bin gegangen', du: 'bist gegangen', erSieEs: 'ist gegangen', wir: 'sind gegangen', ihr: 'seid gegangen', sie: 'sind gegangen' },
          future: { ich: 'werde gehen', du: 'wirst gehen', erSieEs: 'wird gehen', wir: 'werden gehen', ihr: 'werdet gehen', sie: 'werden gehen' },
          imperative: { du: 'geh!', wir: 'gehen wir!', ihr: 'geht!', Sie: 'gehen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_6',
        german: 'schnell',
        english: 'fast / quick',
        wordType: 'adverb',
        level: 'A1',
        description: 'At a high speed.',
        examples: [
          { german: 'Das Auto fährt sehr schnell.', english: 'The car drives very fast.' },
          { german: 'Ich esse schnell, weil ich Hunger habe.', english: 'I eat quickly because I am hungry.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── A2 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_7',
        german: 'das Krankenhaus',
        english: 'hospital',
        wordType: 'noun',
        level: 'A2',
        description: 'A building where sick or injured people receive medical treatment.',
        examples: [
          { german: 'Er liegt im Krankenhaus.', english: 'He is in the hospital.' },
          { german: 'Das Krankenhaus ist in der Stadtmitte.', english: 'The hospital is in the city centre.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das',
          plural: 'die Krankenhäuser',
          deklinationBestimmt: { nominative: 'das Krankenhaus', akkusativ: 'das Krankenhaus', genitiv: 'des Krankenhauses', dativ: 'dem Krankenhaus' },
          deklinationUnbestimmt: { nominative: 'ein Krankenhaus', akkusativ: 'ein Krankenhaus', genitiv: 'eines Krankenhauses', dativ: 'einem Krankenhaus' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_8',
        german: 'kaufen',
        english: 'to buy',
        wordType: 'verb',
        level: 'A2',
        description: 'To obtain something by paying money for it.',
        examples: [
          { german: 'Ich kaufe ein neues Buch.', english: 'I am buying a new book.' },
          { german: 'Sie hat gestern ein Kleid gekauft.', english: 'She bought a dress yesterday.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false,
          isRegular: true,
          hilfsverb: 'haben',
          present: { ich: 'kaufe', du: 'kaufst', erSieEs: 'kauft', wir: 'kaufen', ihr: 'kauft', sie: 'kaufen' },
          simplePast: { ich: 'kaufte', du: 'kauftest', erSieEs: 'kaufte', wir: 'kauften', ihr: 'kauftet', sie: 'kauften' },
          pastPerfect: { ich: 'habe gekauft', du: 'hast gekauft', erSieEs: 'hat gekauft', wir: 'haben gekauft', ihr: 'habt gekauft', sie: 'haben gekauft' },
          future: { ich: 'werde kaufen', du: 'wirst kaufen', erSieEs: 'wird kaufen', wir: 'werden kaufen', ihr: 'werdet kaufen', sie: 'werden kaufen' },
          imperative: { du: 'kauf!', wir: 'kaufen wir!', ihr: 'kauft!', Sie: 'kaufen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_9',
        german: 'müde',
        english: 'tired',
        wordType: 'adjective',
        level: 'A2',
        description: 'In need of sleep or rest; weary.',
        examples: [
          { german: 'Ich bin sehr müde heute.', english: 'I am very tired today.' },
          { german: 'Die müden Kinder gingen früh ins Bett.', english: 'The tired children went to bed early.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'müder',
          superlativ: 'am müdesten',
          deklinationMaskulin: { nominative: 'müder', akkusativ: 'müden', genitiv: 'müden', dativ: 'müdem' },
          deklinationFeminin: { nominative: 'müde', akkusativ: 'müde', genitiv: 'müder', dativ: 'müder' },
          deklinationNeutral: { nominative: 'müdes', akkusativ: 'müdes', genitiv: 'müden', dativ: 'müdem' },
          deklinationPlurar: { nominative: 'müde', akkusativ: 'müde', genitiv: 'müder', dativ: 'müden' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_10',
        german: 'wegen',
        english: 'because of / due to',
        wordType: 'preposition',
        level: 'A2',
        description: 'Used to indicate the cause or reason. Takes genitive.',
        examples: [
          { german: 'Wegen des Regens blieb er zu Hause.', english: 'He stayed at home because of the rain.' },
          { german: 'Sie kam spät wegen des Staus.', english: 'She arrived late due to the traffic jam.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B1 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_11',
        german: 'die Gelegenheit',
        english: 'opportunity / occasion',
        wordType: 'noun',
        level: 'B1',
        description: 'A favourable time or set of circumstances for doing something.',
        examples: [
          { german: 'Das ist eine gute Gelegenheit.', english: 'This is a good opportunity.' },
          { german: 'Er nutzte die Gelegenheit, um Deutsch zu üben.', english: 'He used the opportunity to practise German.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die',
          plural: 'die Gelegenheiten',
          deklinationBestimmt: { nominative: 'die Gelegenheit', akkusativ: 'die Gelegenheit', genitiv: 'der Gelegenheit', dativ: 'der Gelegenheit' },
          deklinationUnbestimmt: { nominative: 'eine Gelegenheit', akkusativ: 'eine Gelegenheit', genitiv: 'einer Gelegenheit', dativ: 'einer Gelegenheit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_12',
        german: 'anrufen',
        english: 'to call (by phone)',
        wordType: 'verb',
        level: 'B1',
        description: 'To contact someone by telephone. Separable verb.',
        examples: [
          { german: 'Ich rufe dich morgen an.', english: 'I will call you tomorrow.' },
          { german: 'Er hat seine Mutter angerufen.', english: 'He called his mother.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true,
          isRegular: true,
          hilfsverb: 'haben',
          present: { ich: 'rufe an', du: 'rufst an', erSieEs: 'ruft an', wir: 'rufen an', ihr: 'ruft an', sie: 'rufen an' },
          simplePast: { ich: 'rief an', du: 'riefst an', erSieEs: 'rief an', wir: 'riefen an', ihr: 'rieft an', sie: 'riefen an' },
          pastPerfect: { ich: 'habe angerufen', du: 'hast angerufen', erSieEs: 'hat angerufen', wir: 'haben angerufen', ihr: 'habt angerufen', sie: 'haben angerufen' },
          future: { ich: 'werde anrufen', du: 'wirst anrufen', erSieEs: 'wird anrufen', wir: 'werden anrufen', ihr: 'werdet anrufen', sie: 'werden anrufen' },
          imperative: { du: 'ruf an!', wir: 'rufen wir an!', ihr: 'ruft an!', Sie: 'rufen Sie an!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_13',
        german: 'neugierig',
        english: 'curious',
        wordType: 'adjective',
        level: 'B1',
        description: 'Eager to know or learn something.',
        examples: [
          { german: 'Das Kind ist sehr neugierig.', english: 'The child is very curious.' },
          { german: 'Ich bin neugierig auf das Ergebnis.', english: 'I am curious about the result.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'neugieriger',
          superlativ: 'am neugierigsten',
          deklinationMaskulin: { nominative: 'neugieriger', akkusativ: 'neugierigen', genitiv: 'neugierigen', dativ: 'neugierigem' },
          deklinationFeminin: { nominative: 'neugierige', akkusativ: 'neugierige', genitiv: 'neugieriger', dativ: 'neugieriger' },
          deklinationNeutral: { nominative: 'neugieriges', akkusativ: 'neugieriges', genitiv: 'neugierigen', dativ: 'neugierigem' },
          deklinationPlurar: { nominative: 'neugierige', akkusativ: 'neugierige', genitiv: 'neugieriger', dativ: 'neugierigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_14',
        german: 'jedoch',
        english: 'however / yet',
        wordType: 'conjunction',
        level: 'B1',
        description: 'Used to introduce a contrasting statement.',
        examples: [
          { german: 'Er ist klug, jedoch faul.', english: 'He is clever, however lazy.' },
          { german: 'Das Essen war gut, jedoch zu teuer.', english: 'The food was good, yet too expensive.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B2 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_15',
        german: 'die Überzeugung',
        english: 'conviction / belief',
        wordType: 'noun',
        level: 'B2',
        description: 'A firmly held belief or opinion.',
        examples: [
          { german: 'Er handelt aus Überzeugung.', english: 'He acts out of conviction.' },
          { german: 'Meine Überzeugung ist, dass Bildung wichtig ist.', english: 'My belief is that education is important.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die',
          plural: 'die Überzeugungen',
          deklinationBestimmt: { nominative: 'die Überzeugung', akkusativ: 'die Überzeugung', genitiv: 'der Überzeugung', dativ: 'der Überzeugung' },
          deklinationUnbestimmt: { nominative: 'eine Überzeugung', akkusativ: 'eine Überzeugung', genitiv: 'einer Überzeugung', dativ: 'einer Überzeugung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_16',
        german: 'behaupten',
        english: 'to claim / assert',
        wordType: 'verb',
        level: 'B2',
        description: 'To state something confidently, especially without proof.',
        examples: [
          { german: 'Er behauptet, die Wahrheit zu sagen.', english: 'He claims to be telling the truth.' },
          { german: 'Sie behauptete, ihn nicht zu kennen.', english: 'She asserted that she did not know him.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false,
          isRegular: true,
          hilfsverb: 'haben',
          present: { ich: 'behaupte', du: 'behauptest', erSieEs: 'behauptet', wir: 'behaupten', ihr: 'behauptet', sie: 'behaupten' },
          simplePast: { ich: 'behauptete', du: 'behauptetest', erSieEs: 'behauptete', wir: 'behaupteten', ihr: 'behauptetet', sie: 'behaupteten' },
          pastPerfect: { ich: 'habe behauptet', du: 'hast behauptet', erSieEs: 'hat behauptet', wir: 'haben behauptet', ihr: 'habt behauptet', sie: 'haben behauptet' },
          future: { ich: 'werde behaupten', du: 'wirst behaupten', erSieEs: 'wird behaupten', wir: 'werden behaupten', ihr: 'werdet behaupten', sie: 'werden behaupten' },
          imperative: { du: 'behaupte!', wir: 'behaupten wir!', ihr: 'behauptet!', Sie: 'behaupten Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_17',
        german: 'nachhaltig',
        english: 'sustainable',
        wordType: 'adjective',
        level: 'B2',
        description: 'Able to be maintained at a certain rate or level; environmentally responsible.',
        examples: [
          { german: 'Wir brauchen nachhaltige Lösungen.', english: 'We need sustainable solutions.' },
          { german: 'Nachhaltiges Wirtschaften ist wichtig.', english: 'Sustainable management is important.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'nachhaltiger',
          superlativ: 'am nachhaltigsten',
          deklinationMaskulin: { nominative: 'nachhaltiger', akkusativ: 'nachhaltigen', genitiv: 'nachhaltigen', dativ: 'nachhaltigem' },
          deklinationFeminin: { nominative: 'nachhaltige', akkusativ: 'nachhaltige', genitiv: 'nachhaltiger', dativ: 'nachhaltiger' },
          deklinationNeutral: { nominative: 'nachhaltiges', akkusativ: 'nachhaltiges', genitiv: 'nachhaltigen', dativ: 'nachhaltigem' },
          deklinationPlurar: { nominative: 'nachhaltige', akkusativ: 'nachhaltige', genitiv: 'nachhaltiger', dativ: 'nachhaltigen' }
        },
        createdAt: now, updatedAt: now
      },
      // ── C1 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_18',
        german: 'die Zweideutigkeit',
        english: 'ambiguity',
        wordType: 'noun',
        level: 'C1',
        description: 'The quality of being open to more than one interpretation.',
        examples: [
          { german: 'Die Zweideutigkeit des Textes macht ihn interessant.', english: 'The ambiguity of the text makes it interesting.' },
          { german: 'Er sprach ohne jede Zweideutigkeit.', english: 'He spoke without any ambiguity.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die',
          plural: 'die Zweideutigkeiten',
          deklinationBestimmt: { nominative: 'die Zweideutigkeit', akkusativ: 'die Zweideutigkeit', genitiv: 'der Zweideutigkeit', dativ: 'der Zweideutigkeit' },
          deklinationUnbestimmt: { nominative: 'eine Zweideutigkeit', akkusativ: 'eine Zweideutigkeit', genitiv: 'einer Zweideutigkeit', dativ: 'einer Zweideutigkeit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_19',
        german: 'voraussetzen',
        english: 'to presuppose / require',
        wordType: 'verb',
        level: 'C1',
        description: 'To require something as a precondition; to take for granted.',
        examples: [
          { german: 'Diese Aufgabe setzt Erfahrung voraus.', english: 'This task presupposes experience.' },
          { german: 'Er setzte voraus, dass alle einverstanden sind.', english: 'He assumed that everyone agrees.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true,
          isRegular: true,
          hilfsverb: 'haben',
          present: { ich: 'setze voraus', du: 'setzt voraus', erSieEs: 'setzt voraus', wir: 'setzen voraus', ihr: 'setzt voraus', sie: 'setzen voraus' },
          simplePast: { ich: 'setzte voraus', du: 'setztest voraus', erSieEs: 'setzte voraus', wir: 'setzten voraus', ihr: 'setztet voraus', sie: 'setzten voraus' },
          pastPerfect: { ich: 'habe vorausgesetzt', du: 'hast vorausgesetzt', erSieEs: 'hat vorausgesetzt', wir: 'haben vorausgesetzt', ihr: 'habt vorausgesetzt', sie: 'haben vorausgesetzt' },
          future: { ich: 'werde voraussetzen', du: 'wirst voraussetzen', erSieEs: 'wird voraussetzen', wir: 'werden voraussetzen', ihr: 'werdet voraussetzen', sie: 'werden voraussetzen' },
          imperative: { du: 'setze voraus!', wir: 'setzen wir voraus!', ihr: 'setzt voraus!', Sie: 'setzen Sie voraus!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── C2 ──────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_20',
        german: 'unerschütterlich',
        english: 'unshakeable / steadfast',
        wordType: 'adjective',
        level: 'C2',
        description: 'Not able to be changed or made less firm; absolutely resolute.',
        examples: [
          { german: 'Sie hat unerschütterliches Vertrauen in ihn.', english: 'She has unshakeable trust in him.' },
          { german: 'Sein unerschütterlicher Glaube half ihm.', english: 'His steadfast faith helped him.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'unerschütterlicher',
          superlativ: 'am unerschütterlichsten',
          deklinationMaskulin: { nominative: 'unerschütterlicher', akkusativ: 'unerschütterlichen', genitiv: 'unerschütterlichen', dativ: 'unerschütterlichem' },
          deklinationFeminin: { nominative: 'unerschütterliche', akkusativ: 'unerschütterliche', genitiv: 'unerschütterlicher', dativ: 'unerschütterlicher' },
          deklinationNeutral: { nominative: 'unerschütterliches', akkusativ: 'unerschütterliches', genitiv: 'unerschütterlichen', dativ: 'unerschütterlichem' },
          deklinationPlurar: { nominative: 'unerschütterliche', akkusativ: 'unerschütterliche', genitiv: 'unerschütterlicher', dativ: 'unerschütterlichen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_21',
        german: 'das Fingerspitzengefühl',
        english: 'tact / sensitivity / finesse',
        wordType: 'noun',
        level: 'C2',
        description: 'The ability to deal with difficult situations sensitively. Literally "fingertip feeling".',
        examples: [
          { german: 'Diese Situation erfordert Fingerspitzengefühl.', english: 'This situation requires tact.' },
          { german: 'Er handelte mit viel Fingerspitzengefühl.', english: 'He acted with great sensitivity.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das',
          plural: '(kein Plural)',
          deklinationBestimmt: { nominative: 'das Fingerspitzengefühl', akkusativ: 'das Fingerspitzengefühl', genitiv: 'des Fingerspitzengefühls', dativ: 'dem Fingerspitzengefühl' },
          deklinationUnbestimmt: { nominative: 'ein Fingerspitzengefühl', akkusativ: 'ein Fingerspitzengefühl', genitiv: 'eines Fingerspitzengefühls', dativ: 'einem Fingerspitzengefühl' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_22',
        german: 'selbst',
        english: 'even / self / oneself',
        wordType: 'pronoun',
        level: 'B1',
        description: 'Used for emphasis ("myself", "yourself", etc.) or as "even".',
        examples: [
          { german: 'Ich mache das selbst.', english: 'I do that myself.' },
          { german: 'Selbst er hat es nicht gewusst.', english: 'Even he did not know it.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_23',
        german: 'trotzdem',
        english: 'nevertheless / still / anyway',
        wordType: 'adverb',
        level: 'B1',
        description: 'In spite of that; all the same.',
        examples: [
          { german: 'Es regnet, aber wir gehen trotzdem spazieren.', english: 'It is raining, but we are going for a walk anyway.' },
          { german: 'Er war krank, trotzdem kam er zur Arbeit.', english: 'He was sick; nevertheless, he came to work.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },

      // ══════════════════════════════════════════════════════════════════════
      // 50 additional vocabularies  A1–B2
      // ══════════════════════════════════════════════════════════════════════

      // ── A1 nouns ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_24',
        german: 'die Katze',
        english: 'cat',
        wordType: 'noun', level: 'A1',
        description: 'A small domesticated carnivorous mammal.',
        examples: [
          { german: 'Die Katze schläft auf dem Sofa.', english: 'The cat is sleeping on the sofa.' },
          { german: 'Meine Katze heißt Luna.', english: 'My cat is called Luna.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Katzen',
          deklinationBestimmt:   { nominative: 'die Katze',   akkusativ: 'die Katze',   genitiv: 'der Katze',   dativ: 'der Katze' },
          deklinationUnbestimmt: { nominative: 'eine Katze',  akkusativ: 'eine Katze',  genitiv: 'einer Katze', dativ: 'einer Katze' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_25',
        german: 'das Buch',
        english: 'book',
        wordType: 'noun', level: 'A1',
        description: 'A written or printed work consisting of pages.',
        examples: [
          { german: 'Ich lese ein Buch.', english: 'I am reading a book.' },
          { german: 'Das Buch ist sehr interessant.', english: 'The book is very interesting.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Bücher',
          deklinationBestimmt:   { nominative: 'das Buch',   akkusativ: 'das Buch',   genitiv: 'des Buches',  dativ: 'dem Buch' },
          deklinationUnbestimmt: { nominative: 'ein Buch',   akkusativ: 'ein Buch',   genitiv: 'eines Buches', dativ: 'einem Buch' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_26',
        german: 'das Wasser',
        english: 'water',
        wordType: 'noun', level: 'A1',
        description: 'A clear liquid that is essential for life.',
        examples: [
          { german: 'Ich trinke ein Glas Wasser.', english: 'I drink a glass of water.' },
          { german: 'Das Wasser ist kalt.', english: 'The water is cold.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: '(kein Plural)',
          deklinationBestimmt:   { nominative: 'das Wasser',  akkusativ: 'das Wasser',  genitiv: 'des Wassers',  dativ: 'dem Wasser' },
          deklinationUnbestimmt: { nominative: 'ein Wasser',  akkusativ: 'ein Wasser',  genitiv: 'eines Wassers', dativ: 'einem Wasser' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_27',
        german: 'der Mann',
        english: 'man',
        wordType: 'noun', level: 'A1',
        description: 'An adult male human being.',
        examples: [
          { german: 'Der Mann liest die Zeitung.', english: 'The man is reading the newspaper.' },
          { german: 'Ein Mann steht vor der Tür.', english: 'A man is standing in front of the door.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Männer',
          deklinationBestimmt:   { nominative: 'der Mann',   akkusativ: 'den Mann',   genitiv: 'des Mannes',  dativ: 'dem Mann' },
          deklinationUnbestimmt: { nominative: 'ein Mann',   akkusativ: 'einen Mann', genitiv: 'eines Mannes', dativ: 'einem Mann' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_28',
        german: 'die Frau',
        english: 'woman / wife',
        wordType: 'noun', level: 'A1',
        description: 'An adult female human being.',
        examples: [
          { german: 'Die Frau arbeitet als Ärztin.', english: 'The woman works as a doctor.' },
          { german: 'Seine Frau heißt Anna.', english: 'His wife is called Anna.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Frauen',
          deklinationBestimmt:   { nominative: 'die Frau',   akkusativ: 'die Frau',   genitiv: 'der Frau',   dativ: 'der Frau' },
          deklinationUnbestimmt: { nominative: 'eine Frau',  akkusativ: 'eine Frau',  genitiv: 'einer Frau', dativ: 'einer Frau' }
        },
        createdAt: now, updatedAt: now
      },
      // ── A1 verbs ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_29',
        german: 'essen',
        english: 'to eat',
        wordType: 'verb', level: 'A1',
        description: 'To put food into the mouth and swallow it.',
        examples: [
          { german: 'Ich esse jeden Morgen Brot.', english: 'I eat bread every morning.' },
          { german: 'Was möchtest du essen?', english: 'What would you like to eat?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'esse',  du: 'isst',    erSieEs: 'isst',  wir: 'essen',  ihr: 'esst',  sie: 'essen' },
          simplePast: { ich: 'aß',    du: 'aßest',   erSieEs: 'aß',    wir: 'aßen',   ihr: 'aßt',   sie: 'aßen' },
          pastPerfect:{ ich: 'habe gegessen', du: 'hast gegessen', erSieEs: 'hat gegessen', wir: 'haben gegessen', ihr: 'habt gegessen', sie: 'haben gegessen' },
          future:     { ich: 'werde essen', du: 'wirst essen', erSieEs: 'wird essen', wir: 'werden essen', ihr: 'werdet essen', sie: 'werden essen' },
          imperative: { du: 'iss!', wir: 'essen wir!', ihr: 'esst!', Sie: 'essen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_30',
        german: 'trinken',
        english: 'to drink',
        wordType: 'verb', level: 'A1',
        description: 'To take liquid into the mouth and swallow it.',
        examples: [
          { german: 'Er trinkt jeden Tag Kaffee.', english: 'He drinks coffee every day.' },
          { german: 'Trink mehr Wasser!', english: 'Drink more water!' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'trinke',  du: 'trinkst',   erSieEs: 'trinkt',  wir: 'trinken',  ihr: 'trinkt',  sie: 'trinken' },
          simplePast: { ich: 'trank',   du: 'trankst',   erSieEs: 'trank',   wir: 'tranken',  ihr: 'trankt',  sie: 'tranken' },
          pastPerfect:{ ich: 'habe getrunken', du: 'hast getrunken', erSieEs: 'hat getrunken', wir: 'haben getrunken', ihr: 'habt getrunken', sie: 'haben getrunken' },
          future:     { ich: 'werde trinken', du: 'wirst trinken', erSieEs: 'wird trinken', wir: 'werden trinken', ihr: 'werdet trinken', sie: 'werden trinken' },
          imperative: { du: 'trink!', wir: 'trinken wir!', ihr: 'trinkt!', Sie: 'trinken Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_31',
        german: 'schlafen',
        english: 'to sleep',
        wordType: 'verb', level: 'A1',
        description: 'To be in a natural state of rest.',
        examples: [
          { german: 'Ich schlafe acht Stunden pro Nacht.', english: 'I sleep eight hours per night.' },
          { german: 'Das Baby schläft tief.', english: 'The baby is sleeping deeply.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'schlafe', du: 'schläfst',  erSieEs: 'schläft', wir: 'schlafen', ihr: 'schlaft', sie: 'schlafen' },
          simplePast: { ich: 'schlief', du: 'schliefst', erSieEs: 'schlief', wir: 'schliefen',ihr: 'schlieft',sie: 'schliefen' },
          pastPerfect:{ ich: 'habe geschlafen', du: 'hast geschlafen', erSieEs: 'hat geschlafen', wir: 'haben geschlafen', ihr: 'habt geschlafen', sie: 'haben geschlafen' },
          future:     { ich: 'werde schlafen', du: 'wirst schlafen', erSieEs: 'wird schlafen', wir: 'werden schlafen', ihr: 'werdet schlafen', sie: 'werden schlafen' },
          imperative: { du: 'schlaf!', wir: 'schlafen wir!', ihr: 'schlaft!', Sie: 'schlafen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── A1 adjectives / adverbs ────────────────────────────────────────────
      {
        _id: 'vocab_sample_32',
        german: 'groß',
        english: 'big / tall',
        wordType: 'adjective', level: 'A1',
        description: 'Of considerable size or extent.',
        examples: [
          { german: 'Er ist sehr groß.', english: 'He is very tall.' },
          { german: 'Das ist ein großes Haus.', english: 'That is a big house.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'größer', superlativ: 'am größten',
          deklinationMaskulin: { nominative: 'großer',  akkusativ: 'großen',  genitiv: 'großen',  dativ: 'großem' },
          deklinationFeminin:  { nominative: 'große',   akkusativ: 'große',   genitiv: 'großer',  dativ: 'großer' },
          deklinationNeutral:  { nominative: 'großes',  akkusativ: 'großes',  genitiv: 'großen',  dativ: 'großem' },
          deklinationPlurar:   { nominative: 'große',   akkusativ: 'große',   genitiv: 'großer',  dativ: 'großen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_33',
        german: 'klein',
        english: 'small / little',
        wordType: 'adjective', level: 'A1',
        description: 'Of a size that is less than normal.',
        examples: [
          { german: 'Das Kind ist noch klein.', english: 'The child is still small.' },
          { german: 'Sie hat eine kleine Tasche.', english: 'She has a small bag.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kleiner', superlativ: 'am kleinsten',
          deklinationMaskulin: { nominative: 'kleiner',  akkusativ: 'kleinen',  genitiv: 'kleinen',  dativ: 'kleinem' },
          deklinationFeminin:  { nominative: 'kleine',   akkusativ: 'kleine',   genitiv: 'kleiner',  dativ: 'kleiner' },
          deklinationNeutral:  { nominative: 'kleines',  akkusativ: 'kleines',  genitiv: 'kleinen',  dativ: 'kleinem' },
          deklinationPlurar:   { nominative: 'kleine',   akkusativ: 'kleine',   genitiv: 'kleiner',  dativ: 'kleinen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_34',
        german: 'heute',
        english: 'today',
        wordType: 'adverb', level: 'A1',
        description: 'On this present day.',
        examples: [
          { german: 'Heute ist Montag.', english: 'Today is Monday.' },
          { german: 'Was machst du heute Abend?', english: 'What are you doing this evening?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_35',
        german: 'hier',
        english: 'here',
        wordType: 'adverb', level: 'A1',
        description: 'In, at, or to this place or position.',
        examples: [
          { german: 'Ich bin hier.', english: 'I am here.' },
          { german: 'Komm bitte hier her!', english: 'Please come here!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── A2 nouns ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_36',
        german: 'der Beruf',
        english: 'job / profession',
        wordType: 'noun', level: 'A2',
        description: 'A person\'s regular occupation or trade.',
        examples: [
          { german: 'Was ist dein Beruf?', english: 'What is your job?' },
          { german: 'Sie hat einen interessanten Beruf.', english: 'She has an interesting profession.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Berufe',
          deklinationBestimmt:   { nominative: 'der Beruf',   akkusativ: 'den Beruf',   genitiv: 'des Berufs',   dativ: 'dem Beruf' },
          deklinationUnbestimmt: { nominative: 'ein Beruf',   akkusativ: 'einen Beruf', genitiv: 'eines Berufs', dativ: 'einem Beruf' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_37',
        german: 'die Reise',
        english: 'journey / trip',
        wordType: 'noun', level: 'A2',
        description: 'An act of travelling from one place to another.',
        examples: [
          { german: 'Die Reise nach Berlin war lang.', english: 'The journey to Berlin was long.' },
          { german: 'Wir planen eine Reise nach Italien.', english: 'We are planning a trip to Italy.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Reisen',
          deklinationBestimmt:   { nominative: 'die Reise',   akkusativ: 'die Reise',   genitiv: 'der Reise',   dativ: 'der Reise' },
          deklinationUnbestimmt: { nominative: 'eine Reise',  akkusativ: 'eine Reise',  genitiv: 'einer Reise', dativ: 'einer Reise' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_38',
        german: 'das Wetter',
        english: 'weather',
        wordType: 'noun', level: 'A2',
        description: 'The state of the atmosphere at a particular place and time.',
        examples: [
          { german: 'Das Wetter heute ist sonnig.', english: 'The weather today is sunny.' },
          { german: 'Wie ist das Wetter bei euch?', english: 'What is the weather like where you are?' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: '(kein Plural)',
          deklinationBestimmt:   { nominative: 'das Wetter',  akkusativ: 'das Wetter',  genitiv: 'des Wetters',  dativ: 'dem Wetter' },
          deklinationUnbestimmt: { nominative: 'ein Wetter',  akkusativ: 'ein Wetter',  genitiv: 'eines Wetters', dativ: 'einem Wetter' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_39',
        german: 'die Sprache',
        english: 'language',
        wordType: 'noun', level: 'A2',
        description: 'A system of communication used by a community.',
        examples: [
          { german: 'Deutsch ist eine schöne Sprache.', english: 'German is a beautiful language.' },
          { german: 'Er spricht drei Sprachen.', english: 'He speaks three languages.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Sprachen',
          deklinationBestimmt:   { nominative: 'die Sprache',   akkusativ: 'die Sprache',   genitiv: 'der Sprache',   dativ: 'der Sprache' },
          deklinationUnbestimmt: { nominative: 'eine Sprache',  akkusativ: 'eine Sprache',  genitiv: 'einer Sprache', dativ: 'einer Sprache' }
        },
        createdAt: now, updatedAt: now
      },
      // ── A2 verbs ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_40',
        german: 'arbeiten',
        english: 'to work',
        wordType: 'verb', level: 'A2',
        description: 'To be engaged in physical or mental activity in order to achieve a result.',
        examples: [
          { german: 'Er arbeitet als Lehrer.', english: 'He works as a teacher.' },
          { german: 'Ich arbeite von neun bis fünf.', english: 'I work from nine to five.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'arbeite',  du: 'arbeitest',  erSieEs: 'arbeitet',  wir: 'arbeiten',  ihr: 'arbeitet',  sie: 'arbeiten' },
          simplePast: { ich: 'arbeitete',du: 'arbeitetest',erSieEs: 'arbeitete', wir: 'arbeiteten',ihr: 'arbeitetet',sie: 'arbeiteten' },
          pastPerfect:{ ich: 'habe gearbeitet', du: 'hast gearbeitet', erSieEs: 'hat gearbeitet', wir: 'haben gearbeitet', ihr: 'habt gearbeitet', sie: 'haben gearbeitet' },
          future:     { ich: 'werde arbeiten', du: 'wirst arbeiten', erSieEs: 'wird arbeiten', wir: 'werden arbeiten', ihr: 'werdet arbeiten', sie: 'werden arbeiten' },
          imperative: { du: 'arbeite!', wir: 'arbeiten wir!', ihr: 'arbeitet!', Sie: 'arbeiten Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_41',
        german: 'fahren',
        english: 'to drive / to travel',
        wordType: 'verb', level: 'A2',
        description: 'To move or travel in a vehicle.',
        examples: [
          { german: 'Ich fahre mit dem Auto zur Arbeit.', english: 'I drive to work by car.' },
          { german: 'Wir fahren nächste Woche in den Urlaub.', english: 'We are going on holiday next week.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'sein',
          present:    { ich: 'fahre',  du: 'fährst',  erSieEs: 'fährt',  wir: 'fahren',  ihr: 'fahrt',  sie: 'fahren' },
          simplePast: { ich: 'fuhr',   du: 'fuhrst',  erSieEs: 'fuhr',   wir: 'fuhren',  ihr: 'fuhrt',  sie: 'fuhren' },
          pastPerfect:{ ich: 'bin gefahren', du: 'bist gefahren', erSieEs: 'ist gefahren', wir: 'sind gefahren', ihr: 'seid gefahren', sie: 'sind gefahren' },
          future:     { ich: 'werde fahren', du: 'wirst fahren', erSieEs: 'wird fahren', wir: 'werden fahren', ihr: 'werdet fahren', sie: 'werden fahren' },
          imperative: { du: 'fahr!', wir: 'fahren wir!', ihr: 'fahrt!', Sie: 'fahren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_42',
        german: 'aufstehen',
        english: 'to get up / to stand up',
        wordType: 'verb', level: 'A2',
        description: 'To rise from bed or from a sitting/lying position. Separable verb.',
        examples: [
          { german: 'Ich stehe um sieben Uhr auf.', english: 'I get up at seven o\'clock.' },
          { german: 'Steh bitte auf!', english: 'Please stand up!' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'sein',
          present:    { ich: 'stehe auf', du: 'stehst auf', erSieEs: 'steht auf', wir: 'stehen auf', ihr: 'steht auf', sie: 'stehen auf' },
          simplePast: { ich: 'stand auf', du: 'standst auf', erSieEs: 'stand auf', wir: 'standen auf', ihr: 'standet auf', sie: 'standen auf' },
          pastPerfect:{ ich: 'bin aufgestanden', du: 'bist aufgestanden', erSieEs: 'ist aufgestanden', wir: 'sind aufgestanden', ihr: 'seid aufgestanden', sie: 'sind aufgestanden' },
          future:     { ich: 'werde aufstehen', du: 'wirst aufstehen', erSieEs: 'wird aufstehen', wir: 'werden aufstehen', ihr: 'werdet aufstehen', sie: 'werden aufstehen' },
          imperative: { du: 'steh auf!', wir: 'stehen wir auf!', ihr: 'steht auf!', Sie: 'stehen Sie auf!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── A2 adjectives / other ──────────────────────────────────────────────
      {
        _id: 'vocab_sample_43',
        german: 'kalt',
        english: 'cold',
        wordType: 'adjective', level: 'A2',
        description: 'Of or at a low temperature.',
        examples: [
          { german: 'Der Winter ist sehr kalt.', english: 'The winter is very cold.' },
          { german: 'Das kalte Wasser erfrischt mich.', english: 'The cold water refreshes me.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kälter', superlativ: 'am kältesten',
          deklinationMaskulin: { nominative: 'kalter',  akkusativ: 'kalten',  genitiv: 'kalten',  dativ: 'kaltem' },
          deklinationFeminin:  { nominative: 'kalte',   akkusativ: 'kalte',   genitiv: 'kalter',  dativ: 'kalter' },
          deklinationNeutral:  { nominative: 'kaltes',  akkusativ: 'kaltes',  genitiv: 'kalten',  dativ: 'kaltem' },
          deklinationPlurar:   { nominative: 'kalte',   akkusativ: 'kalte',   genitiv: 'kalter',  dativ: 'kalten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_44',
        german: 'immer',
        english: 'always',
        wordType: 'adverb', level: 'A2',
        description: 'At all times; on all occasions.',
        examples: [
          { german: 'Sie ist immer pünktlich.', english: 'She is always punctual.' },
          { german: 'Ich trinke immer Kaffee am Morgen.', english: 'I always drink coffee in the morning.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_45',
        german: 'mit',
        english: 'with',
        wordType: 'preposition', level: 'A2',
        description: 'Used to indicate accompaniment or means. Takes dative.',
        examples: [
          { german: 'Ich komme mit dem Bus.', english: 'I come by bus.' },
          { german: 'Sie geht mit ihrem Freund spazieren.', english: 'She goes for a walk with her friend.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B1 nouns ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_46',
        german: 'die Erfahrung',
        english: 'experience',
        wordType: 'noun', level: 'B1',
        description: 'Practical contact with and observation of facts or events.',
        examples: [
          { german: 'Er hat viel Erfahrung im Bereich IT.', english: 'He has a lot of experience in IT.' },
          { german: 'Das war eine interessante Erfahrung.', english: 'That was an interesting experience.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Erfahrungen',
          deklinationBestimmt:   { nominative: 'die Erfahrung',   akkusativ: 'die Erfahrung',   genitiv: 'der Erfahrung',   dativ: 'der Erfahrung' },
          deklinationUnbestimmt: { nominative: 'eine Erfahrung',  akkusativ: 'eine Erfahrung',  genitiv: 'einer Erfahrung', dativ: 'einer Erfahrung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_47',
        german: 'das Ergebnis',
        english: 'result / outcome',
        wordType: 'noun', level: 'B1',
        description: 'A thing that is caused or produced by something else.',
        examples: [
          { german: 'Das Ergebnis des Tests war gut.', english: 'The result of the test was good.' },
          { german: 'Wir warten auf das Ergebnis.', english: 'We are waiting for the outcome.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Ergebnisse',
          deklinationBestimmt:   { nominative: 'das Ergebnis',   akkusativ: 'das Ergebnis',   genitiv: 'des Ergebnisses',  dativ: 'dem Ergebnis' },
          deklinationUnbestimmt: { nominative: 'ein Ergebnis',   akkusativ: 'ein Ergebnis',   genitiv: 'eines Ergebnisses', dativ: 'einem Ergebnis' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_48',
        german: 'die Lösung',
        english: 'solution',
        wordType: 'noun', level: 'B1',
        description: 'A means of solving a problem or dealing with a difficult situation.',
        examples: [
          { german: 'Wir suchen eine Lösung für das Problem.', english: 'We are looking for a solution to the problem.' },
          { german: 'Die beste Lösung ist Kommunikation.', english: 'The best solution is communication.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Lösungen',
          deklinationBestimmt:   { nominative: 'die Lösung',   akkusativ: 'die Lösung',   genitiv: 'der Lösung',   dativ: 'der Lösung' },
          deklinationUnbestimmt: { nominative: 'eine Lösung',  akkusativ: 'eine Lösung',  genitiv: 'einer Lösung', dativ: 'einer Lösung' }
        },
        createdAt: now, updatedAt: now
      },
      // ── B1 verbs ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_49',
        german: 'erklären',
        english: 'to explain',
        wordType: 'verb', level: 'B1',
        description: 'To make something clear by describing it in more detail.',
        examples: [
          { german: 'Kannst du mir das erklären?', english: 'Can you explain that to me?' },
          { german: 'Der Lehrer erklärt die Grammatik.', english: 'The teacher explains the grammar.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'erkläre',  du: 'erklärst',  erSieEs: 'erklärt',  wir: 'erklären',  ihr: 'erklärt',  sie: 'erklären' },
          simplePast: { ich: 'erklärte', du: 'erklärtest', erSieEs: 'erklärte', wir: 'erklärten', ihr: 'erklärtet', sie: 'erklärten' },
          pastPerfect:{ ich: 'habe erklärt', du: 'hast erklärt', erSieEs: 'hat erklärt', wir: 'haben erklärt', ihr: 'habt erklärt', sie: 'haben erklärt' },
          future:     { ich: 'werde erklären', du: 'wirst erklären', erSieEs: 'wird erklären', wir: 'werden erklären', ihr: 'werdet erklären', sie: 'werden erklären' },
          imperative: { du: 'erkläre!', wir: 'erklären wir!', ihr: 'erklärt!', Sie: 'erklären Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_50',
        german: 'entscheiden',
        english: 'to decide',
        wordType: 'verb', level: 'B1',
        description: 'To come to a resolution in the mind as a result of consideration.',
        examples: [
          { german: 'Ich muss mich schnell entscheiden.', english: 'I must decide quickly.' },
          { german: 'Er hat sich für das rote Auto entschieden.', english: 'He decided on the red car.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'entscheide',  du: 'entscheidest', erSieEs: 'entscheidet', wir: 'entscheiden',  ihr: 'entscheidet',  sie: 'entscheiden' },
          simplePast: { ich: 'entschied',   du: 'entschiedst',  erSieEs: 'entschied',   wir: 'entschieden',  ihr: 'entschiedet',  sie: 'entschieden' },
          pastPerfect:{ ich: 'habe entschieden', du: 'hast entschieden', erSieEs: 'hat entschieden', wir: 'haben entschieden', ihr: 'habt entschieden', sie: 'haben entschieden' },
          future:     { ich: 'werde entscheiden', du: 'wirst entscheiden', erSieEs: 'wird entscheiden', wir: 'werden entscheiden', ihr: 'werdet entscheiden', sie: 'werden entscheiden' },
          imperative: { du: 'entscheide!', wir: 'entscheiden wir!', ihr: 'entscheidet!', Sie: 'entscheiden Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_51',
        german: 'verbringen',
        english: 'to spend (time)',
        wordType: 'verb', level: 'B1',
        description: 'To pass time in a specified place or way.',
        examples: [
          { german: 'Wir verbringen den Urlaub am Meer.', english: 'We spend the holiday at the sea.' },
          { german: 'Er verbringt viel Zeit mit seiner Familie.', english: 'He spends a lot of time with his family.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'verbringe',  du: 'verbringst',  erSieEs: 'verbringt',  wir: 'verbringen',  ihr: 'verbringt',  sie: 'verbringen' },
          simplePast: { ich: 'verbrachte', du: 'verbrachtest', erSieEs: 'verbrachte', wir: 'verbrachten', ihr: 'verbrachtet', sie: 'verbrachten' },
          pastPerfect:{ ich: 'habe verbracht', du: 'hast verbracht', erSieEs: 'hat verbracht', wir: 'haben verbracht', ihr: 'habt verbracht', sie: 'haben verbracht' },
          future:     { ich: 'werde verbringen', du: 'wirst verbringen', erSieEs: 'wird verbringen', wir: 'werden verbringen', ihr: 'werdet verbringen', sie: 'werden verbringen' },
          imperative: { du: 'verbringe!', wir: 'verbringen wir!', ihr: 'verbringt!', Sie: 'verbringen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── B1 adjectives / other ──────────────────────────────────────────────
      {
        _id: 'vocab_sample_52',
        german: 'wichtig',
        english: 'important',
        wordType: 'adjective', level: 'B1',
        description: 'Of great significance or value.',
        examples: [
          { german: 'Das ist eine wichtige Frage.', english: 'That is an important question.' },
          { german: 'Es ist wichtig, pünktlich zu sein.', english: 'It is important to be punctual.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'wichtiger', superlativ: 'am wichtigsten',
          deklinationMaskulin: { nominative: 'wichtiger',  akkusativ: 'wichtigen',  genitiv: 'wichtigen',  dativ: 'wichtigem' },
          deklinationFeminin:  { nominative: 'wichtige',   akkusativ: 'wichtige',   genitiv: 'wichtiger',  dativ: 'wichtiger' },
          deklinationNeutral:  { nominative: 'wichtiges',  akkusativ: 'wichtiges',  genitiv: 'wichtigen',  dativ: 'wichtigem' },
          deklinationPlurar:   { nominative: 'wichtige',   akkusativ: 'wichtige',   genitiv: 'wichtiger',  dativ: 'wichtigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_53',
        german: 'möglich',
        english: 'possible',
        wordType: 'adjective', level: 'B1',
        description: 'Able to be done or achieved.',
        examples: [
          { german: 'Ist das möglich?', english: 'Is that possible?' },
          { german: 'Alles ist möglich, wenn man hart arbeitet.', english: 'Everything is possible if you work hard.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'möglicher', superlativ: 'am möglichsten',
          deklinationMaskulin: { nominative: 'möglicher',  akkusativ: 'möglichen',  genitiv: 'möglichen',  dativ: 'möglichem' },
          deklinationFeminin:  { nominative: 'mögliche',   akkusativ: 'mögliche',   genitiv: 'möglicher',  dativ: 'möglicher' },
          deklinationNeutral:  { nominative: 'mögliches',  akkusativ: 'mögliches',  genitiv: 'möglichen',  dativ: 'möglichem' },
          deklinationPlurar:   { nominative: 'mögliche',   akkusativ: 'mögliche',   genitiv: 'möglicher',  dativ: 'möglichen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_54',
        german: 'obwohl',
        english: 'although / even though',
        wordType: 'conjunction', level: 'B1',
        description: 'In spite of the fact that.',
        examples: [
          { german: 'Obwohl es regnet, gehen wir spazieren.', english: 'Although it is raining, we go for a walk.' },
          { german: 'Er kam, obwohl er krank war.', english: 'He came even though he was ill.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_55',
        german: 'deswegen',
        english: 'therefore / that\'s why',
        wordType: 'adverb', level: 'B1',
        description: 'For that reason; because of that.',
        examples: [
          { german: 'Es regnet, deswegen bleibe ich zu Hause.', english: 'It is raining, that\'s why I stay at home.' },
          { german: 'Er war müde, deswegen schlief er früh.', english: 'He was tired, therefore he went to sleep early.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B2 nouns ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_56',
        german: 'der Zusammenhang',
        english: 'context / connection',
        wordType: 'noun', level: 'B2',
        description: 'The circumstances that form the setting for an event or idea.',
        examples: [
          { german: 'Das muss man im Zusammenhang sehen.', english: 'You have to see this in context.' },
          { german: 'Es gibt einen klaren Zusammenhang zwischen beiden Faktoren.', english: 'There is a clear connection between both factors.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Zusammenhänge',
          deklinationBestimmt:   { nominative: 'der Zusammenhang',   akkusativ: 'den Zusammenhang',   genitiv: 'des Zusammenhangs',   dativ: 'dem Zusammenhang' },
          deklinationUnbestimmt: { nominative: 'ein Zusammenhang',   akkusativ: 'einen Zusammenhang', genitiv: 'eines Zusammenhangs', dativ: 'einem Zusammenhang' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_57',
        german: 'die Voraussetzung',
        english: 'prerequisite / requirement',
        wordType: 'noun', level: 'B2',
        description: 'A thing that is required as a prior condition for something else.',
        examples: [
          { german: 'Gute Kenntnisse sind eine Voraussetzung.', english: 'Good knowledge is a prerequisite.' },
          { german: 'Das ist die Voraussetzung für den Job.', english: 'That is the requirement for the job.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Voraussetzungen',
          deklinationBestimmt:   { nominative: 'die Voraussetzung',   akkusativ: 'die Voraussetzung',   genitiv: 'der Voraussetzung',   dativ: 'der Voraussetzung' },
          deklinationUnbestimmt: { nominative: 'eine Voraussetzung',  akkusativ: 'eine Voraussetzung',  genitiv: 'einer Voraussetzung', dativ: 'einer Voraussetzung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_58',
        german: 'der Einfluss',
        english: 'influence',
        wordType: 'noun', level: 'B2',
        description: 'The capacity to have an effect on the character or behaviour of someone.',
        examples: [
          { german: 'Musik hat großen Einfluss auf Emotionen.', english: 'Music has a great influence on emotions.' },
          { german: 'Er steht unter dem Einfluss seiner Eltern.', english: 'He is under the influence of his parents.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Einflüsse',
          deklinationBestimmt:   { nominative: 'der Einfluss',   akkusativ: 'den Einfluss',   genitiv: 'des Einflusses',   dativ: 'dem Einfluss' },
          deklinationUnbestimmt: { nominative: 'ein Einfluss',   akkusativ: 'einen Einfluss', genitiv: 'eines Einflusses', dativ: 'einem Einfluss' }
        },
        createdAt: now, updatedAt: now
      },
      // ── B2 verbs ───────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_59',
        german: 'berücksichtigen',
        english: 'to take into account / to consider',
        wordType: 'verb', level: 'B2',
        description: 'To take something into consideration when making a decision.',
        examples: [
          { german: 'Wir müssen alle Faktoren berücksichtigen.', english: 'We must take all factors into account.' },
          { german: 'Bitte berücksichtigen Sie meine Situation.', english: 'Please consider my situation.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'berücksichtige',  du: 'berücksichtigst',  erSieEs: 'berücksichtigt',  wir: 'berücksichtigen',  ihr: 'berücksichtigt',  sie: 'berücksichtigen' },
          simplePast: { ich: 'berücksichtigte', du: 'berücksichtigtest', erSieEs: 'berücksichtigte', wir: 'berücksichtigten', ihr: 'berücksichtigtet', sie: 'berücksichtigten' },
          pastPerfect:{ ich: 'habe berücksichtigt', du: 'hast berücksichtigt', erSieEs: 'hat berücksichtigt', wir: 'haben berücksichtigt', ihr: 'habt berücksichtigt', sie: 'haben berücksichtigt' },
          future:     { ich: 'werde berücksichtigen', du: 'wirst berücksichtigen', erSieEs: 'wird berücksichtigen', wir: 'werden berücksichtigen', ihr: 'werdet berücksichtigen', sie: 'werden berücksichtigen' },
          imperative: { du: 'berücksichtige!', wir: 'berücksichtigen wir!', ihr: 'berücksichtigt!', Sie: 'berücksichtigen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_60',
        german: 'sich handeln um',
        english: 'to be about / to concern',
        wordType: 'verb', level: 'B2',
        description: 'Used to state what something is about.',
        examples: [
          { german: 'Es handelt sich um ein wichtiges Thema.', english: 'It concerns an important topic.' },
          { german: 'Worum handelt es sich?', english: 'What is it about?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'es handelt sich', du: 'es handelt sich', erSieEs: 'es handelt sich', wir: 'es handelt sich', ihr: 'es handelt sich', sie: 'es handelt sich' },
          simplePast: { ich: 'es handelte sich', du: 'es handelte sich', erSieEs: 'es handelte sich', wir: 'es handelte sich', ihr: 'es handelte sich', sie: 'es handelte sich' },
          pastPerfect:{ ich: 'es hat sich gehandelt', du: 'es hat sich gehandelt', erSieEs: 'es hat sich gehandelt', wir: 'es hat sich gehandelt', ihr: 'es hat sich gehandelt', sie: 'es hat sich gehandelt' },
          future:     { ich: 'es wird sich handeln', du: 'es wird sich handeln', erSieEs: 'es wird sich handeln', wir: 'es wird sich handeln', ihr: 'es wird sich handeln', sie: 'es wird sich handeln' },
          imperative: { du: '-', wir: '-', ihr: '-', Sie: '-' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_61',
        german: 'zweifeln',
        english: 'to doubt',
        wordType: 'verb', level: 'B2',
        description: 'To feel uncertain or undecided about something.',
        examples: [
          { german: 'Ich zweifle an seiner Ehrlichkeit.', english: 'I doubt his honesty.' },
          { german: 'Sie zweifelt nicht an ihrer Entscheidung.', english: 'She does not doubt her decision.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'zweifle',  du: 'zweifelst',  erSieEs: 'zweifelt',  wir: 'zweifeln',  ihr: 'zweifelt',  sie: 'zweifeln' },
          simplePast: { ich: 'zweifelte',du: 'zweifeltest', erSieEs: 'zweifelte', wir: 'zweifelten',ihr: 'zweifeltet',sie: 'zweifelten' },
          pastPerfect:{ ich: 'habe gezweifelt', du: 'hast gezweifelt', erSieEs: 'hat gezweifelt', wir: 'haben gezweifelt', ihr: 'habt gezweifelt', sie: 'haben gezweifelt' },
          future:     { ich: 'werde zweifeln', du: 'wirst zweifeln', erSieEs: 'wird zweifeln', wir: 'werden zweifeln', ihr: 'werdet zweifeln', sie: 'werden zweifeln' },
          imperative: { du: 'zweifle!', wir: 'zweifeln wir!', ihr: 'zweifelt!', Sie: 'zweifeln Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── B2 adjectives / other ──────────────────────────────────────────────
      {
        _id: 'vocab_sample_62',
        german: 'ausreichend',
        english: 'sufficient / adequate',
        wordType: 'adjective', level: 'B2',
        description: 'Enough; as much as is needed.',
        examples: [
          { german: 'Die Zeit ist nicht ausreichend.', english: 'The time is not sufficient.' },
          { german: 'Er hat ausreichende Kenntnisse.', english: 'He has adequate knowledge.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'ausreichender', superlativ: 'am ausreichendsten',
          deklinationMaskulin: { nominative: 'ausreichender',  akkusativ: 'ausreichenden',  genitiv: 'ausreichenden',  dativ: 'ausreichendem' },
          deklinationFeminin:  { nominative: 'ausreichende',   akkusativ: 'ausreichende',   genitiv: 'ausreichender',  dativ: 'ausreichender' },
          deklinationNeutral:  { nominative: 'ausreichendes',  akkusativ: 'ausreichendes',  genitiv: 'ausreichenden',  dativ: 'ausreichendem' },
          deklinationPlurar:   { nominative: 'ausreichende',   akkusativ: 'ausreichende',   genitiv: 'ausreichender',  dativ: 'ausreichenden' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_63',
        german: 'vielmehr',
        english: 'rather / on the contrary',
        wordType: 'adverb', level: 'B2',
        description: 'Used to introduce a contrasting or correcting statement.',
        examples: [
          { german: 'Das ist nicht schwer, vielmehr ist es einfach.', english: 'That is not hard; rather, it is easy.' },
          { german: 'Er ist kein Experte, vielmehr ein Anfänger.', english: 'He is not an expert; on the contrary, a beginner.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_64',
        german: 'sowohl … als auch',
        english: 'both … and',
        wordType: 'conjunction', level: 'B2',
        description: 'Used to link two elements of equal importance.',
        examples: [
          { german: 'Sie spricht sowohl Deutsch als auch Englisch.', english: 'She speaks both German and English.' },
          { german: 'Das gilt sowohl für Kinder als auch für Erwachsene.', english: 'That applies to both children and adults.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_65',
        german: 'trotz',
        english: 'despite / in spite of',
        wordType: 'preposition', level: 'B2',
        description: 'Without being affected by; in spite of. Takes genitive.',
        examples: [
          { german: 'Trotz des Regens spielten die Kinder draußen.', english: 'Despite the rain, the children played outside.' },
          { german: 'Er schaffte es trotz aller Schwierigkeiten.', english: 'He managed it in spite of all difficulties.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_66',
        german: 'der Fortschritt',
        english: 'progress',
        wordType: 'noun', level: 'B2',
        description: 'Forward or onward movement towards a destination or goal.',
        examples: [
          { german: 'Der technische Fortschritt ist beeindruckend.', english: 'Technological progress is impressive.' },
          { german: 'Sie macht große Fortschritte beim Lernen.', english: 'She is making great progress in learning.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Fortschritte',
          deklinationBestimmt:   { nominative: 'der Fortschritt',   akkusativ: 'den Fortschritt',   genitiv: 'des Fortschritts',   dativ: 'dem Fortschritt' },
          deklinationUnbestimmt: { nominative: 'ein Fortschritt',   akkusativ: 'einen Fortschritt', genitiv: 'eines Fortschritts', dativ: 'einem Fortschritt' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_67',
        german: 'die Herausforderung',
        english: 'challenge',
        wordType: 'noun', level: 'B2',
        description: 'A task or situation that tests someone\'s abilities.',
        examples: [
          { german: 'Das ist eine große Herausforderung.', english: 'That is a big challenge.' },
          { german: 'Ich nehme die Herausforderung an.', english: 'I accept the challenge.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Herausforderungen',
          deklinationBestimmt:   { nominative: 'die Herausforderung',   akkusativ: 'die Herausforderung',   genitiv: 'der Herausforderung',   dativ: 'der Herausforderung' },
          deklinationUnbestimmt: { nominative: 'eine Herausforderung',  akkusativ: 'eine Herausforderung',  genitiv: 'einer Herausforderung', dativ: 'einer Herausforderung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_68',
        german: 'sich vorstellen',
        english: 'to introduce oneself / to imagine',
        wordType: 'verb', level: 'B1',
        description: 'To introduce yourself to others, or to picture something in your mind. Separable.',
        examples: [
          { german: 'Darf ich mich vorstellen? Ich heiße Thomas.', english: 'May I introduce myself? My name is Thomas.' },
          { german: 'Ich kann mir das gut vorstellen.', english: 'I can imagine that well.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: true, hilfsverb: 'haben',
          present:    { ich: 'stelle mich vor', du: 'stellst dich vor', erSieEs: 'stellt sich vor', wir: 'stellen uns vor', ihr: 'stellt euch vor', sie: 'stellen sich vor' },
          simplePast: { ich: 'stellte mich vor', du: 'stelltest dich vor', erSieEs: 'stellte sich vor', wir: 'stellten uns vor', ihr: 'stelltet euch vor', sie: 'stellten sich vor' },
          pastPerfect:{ ich: 'habe mich vorgestellt', du: 'hast dich vorgestellt', erSieEs: 'hat sich vorgestellt', wir: 'haben uns vorgestellt', ihr: 'habt euch vorgestellt', sie: 'haben sich vorgestellt' },
          future:     { ich: 'werde mich vorstellen', du: 'wirst dich vorstellen', erSieEs: 'wird sich vorstellen', wir: 'werden uns vorstellen', ihr: 'werdet euch vorstellen', sie: 'werden sich vorstellen' },
          imperative: { du: 'stell dich vor!', wir: 'stellen wir uns vor!', ihr: 'stellt euch vor!', Sie: 'stellen Sie sich vor!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_69',
        german: 'abhängen von',
        english: 'to depend on',
        wordType: 'verb', level: 'B2',
        description: 'To be determined or conditioned by. Separable verb.',
        examples: [
          { german: 'Das hängt von der Situation ab.', english: 'That depends on the situation.' },
          { german: 'Erfolg hängt von harter Arbeit ab.', english: 'Success depends on hard work.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'haben',
          present:    { ich: 'hänge ab',  du: 'hängst ab',  erSieEs: 'hängt ab',  wir: 'hängen ab',  ihr: 'hängt ab',  sie: 'hängen ab' },
          simplePast: { ich: 'hing ab',   du: 'hingst ab',  erSieEs: 'hing ab',   wir: 'hingen ab',  ihr: 'hingt ab',  sie: 'hingen ab' },
          pastPerfect:{ ich: 'habe abgehangen', du: 'hast abgehangen', erSieEs: 'hat abgehangen', wir: 'haben abgehangen', ihr: 'habt abgehangen', sie: 'haben abgehangen' },
          future:     { ich: 'werde abhängen', du: 'wirst abhängen', erSieEs: 'wird abhängen', wir: 'werden abhängen', ihr: 'werdet abhängen', sie: 'werden abhängen' },
          imperative: { du: 'häng ab!', wir: 'hängen wir ab!', ihr: 'hängt ab!', Sie: 'hängen Sie ab!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_70',
        german: 'schwierig',
        english: 'difficult / tricky',
        wordType: 'adjective', level: 'B1',
        description: 'Needing much effort or skill to accomplish.',
        examples: [
          { german: 'Diese Aufgabe ist sehr schwierig.', english: 'This task is very difficult.' },
          { german: 'Es war eine schwierige Entscheidung.', english: 'It was a tricky decision.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schwieriger', superlativ: 'am schwierigsten',
          deklinationMaskulin: { nominative: 'schwieriger',  akkusativ: 'schwierigen',  genitiv: 'schwierigen',  dativ: 'schwierigem' },
          deklinationFeminin:  { nominative: 'schwierige',   akkusativ: 'schwierige',   genitiv: 'schwieriger',  dativ: 'schwieriger' },
          deklinationNeutral:  { nominative: 'schwieriges',  akkusativ: 'schwieriges',  genitiv: 'schwierigen',  dativ: 'schwierigem' },
          deklinationPlurar:   { nominative: 'schwierige',   akkusativ: 'schwierige',   genitiv: 'schwieriger',  dativ: 'schwierigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_71',
        german: 'bereits',
        english: 'already',
        wordType: 'adverb', level: 'B1',
        description: 'Before or by now or the time in question.',
        examples: [
          { german: 'Ich habe das bereits gelesen.', english: 'I have already read that.' },
          { german: 'Das ist bereits bekannt.', english: 'That is already known.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_72',
        german: 'die Gewohnheit',
        english: 'habit / custom',
        wordType: 'noun', level: 'B1',
        description: 'A settled tendency or practice, especially one that is hard to give up.',
        examples: [
          { german: 'Das Laufen ist eine gute Gewohnheit.', english: 'Running is a good habit.' },
          { german: 'Alte Gewohnheiten sind schwer zu ändern.', english: 'Old habits are hard to change.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Gewohnheiten',
          deklinationBestimmt:   { nominative: 'die Gewohnheit',   akkusativ: 'die Gewohnheit',   genitiv: 'der Gewohnheit',   dativ: 'der Gewohnheit' },
          deklinationUnbestimmt: { nominative: 'eine Gewohnheit',  akkusativ: 'eine Gewohnheit',  genitiv: 'einer Gewohnheit', dativ: 'einer Gewohnheit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_73',
        german: 'ungefähr',
        english: 'approximately / about',
        wordType: 'adverb', level: 'A2',
        description: 'Used to show that something is almost, but not completely, accurate.',
        examples: [
          { german: 'Das dauert ungefähr eine Stunde.', english: 'That takes approximately one hour.' },
          { german: 'Er ist ungefähr dreißig Jahre alt.', english: 'He is about thirty years old.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── A1 extras ──────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_74',
        german: 'die Katze',
        english: 'cat',
        wordType: 'noun', level: 'A1',
        description: 'A small domesticated carnivorous mammal.',
        examples: [
          { german: 'Die Katze schläft auf dem Sofa.', english: 'The cat is sleeping on the sofa.' },
          { german: 'Meine Katze heißt Luna.', english: 'My cat is called Luna.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Katzen',
          deklinationBestimmt:   { nominative: 'die Katze',   akkusativ: 'die Katze',   genitiv: 'der Katze',   dativ: 'der Katze' },
          deklinationUnbestimmt: { nominative: 'eine Katze',  akkusativ: 'eine Katze',  genitiv: 'einer Katze', dativ: 'einer Katze' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_75',
        german: 'trinken',
        english: 'to drink',
        wordType: 'verb', level: 'A1',
        description: 'To take liquid into the mouth and swallow it.',
        examples: [
          { german: 'Ich trinke jeden Morgen Kaffee.', english: 'I drink coffee every morning.' },
          { german: 'Die Kinder trinken Milch.', english: 'The children drink milk.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'trinke',  du: 'trinkst',  erSieEs: 'trinkt',  wir: 'trinken',  ihr: 'trinkt',  sie: 'trinken' },
          simplePast:  { ich: 'trank',   du: 'trankst',  erSieEs: 'trank',   wir: 'tranken',  ihr: 'trankt',  sie: 'tranken' },
          pastPerfect: { ich: 'habe getrunken', du: 'hast getrunken', erSieEs: 'hat getrunken', wir: 'haben getrunken', ihr: 'habt getrunken', sie: 'haben getrunken' },
          future:      { ich: 'werde trinken', du: 'wirst trinken', erSieEs: 'wird trinken', wir: 'werden trinken', ihr: 'werdet trinken', sie: 'werden trinken' },
          imperative:  { du: 'trink!', wir: 'trinken wir!', ihr: 'trinkt!', Sie: 'trinken Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_76',
        german: 'groß',
        english: 'big / tall',
        wordType: 'adjective', level: 'A1',
        description: 'Of considerable size or height.',
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
        _id: 'vocab_sample_77',
        german: 'und',
        english: 'and',
        wordType: 'conjunction', level: 'A1',
        description: 'Used to connect words, phrases, or clauses of the same type.',
        examples: [
          { german: 'Ich esse Brot und Käse.', english: 'I eat bread and cheese.' },
          { german: 'Sie singt und tanzt.', english: 'She sings and dances.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_78',
        german: 'hier',
        english: 'here',
        wordType: 'adverb', level: 'A1',
        description: 'In, at, or to this place.',
        examples: [
          { german: 'Ich wohne hier.', english: 'I live here.' },
          { german: 'Komm bitte hier her!', english: 'Please come here!' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_79',
        german: 'ich',
        english: 'I',
        wordType: 'pronoun', level: 'A1',
        description: 'First-person singular personal pronoun.',
        examples: [
          { german: 'Ich bin müde.', english: 'I am tired.' },
          { german: 'Ich heiße Anna.', english: 'My name is Anna.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── A2 extras ──────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_80',
        german: 'der Zug',
        english: 'train',
        wordType: 'noun', level: 'A2',
        description: 'A series of railway carriages or wagons moved by a locomotive.',
        examples: [
          { german: 'Der Zug fährt um 8 Uhr ab.', english: 'The train departs at 8 o\'clock.' },
          { german: 'Ich fahre mit dem Zug nach Berlin.', english: 'I am travelling to Berlin by train.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Züge',
          deklinationBestimmt:   { nominative: 'der Zug',  akkusativ: 'den Zug',  genitiv: 'des Zuges', dativ: 'dem Zug' },
          deklinationUnbestimmt: { nominative: 'ein Zug',  akkusativ: 'einen Zug', genitiv: 'eines Zuges', dativ: 'einem Zug' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_81',
        german: 'schreiben',
        english: 'to write',
        wordType: 'verb', level: 'A2',
        description: 'To mark letters, words, or other symbols on a surface.',
        examples: [
          { german: 'Sie schreibt einen Brief.', english: 'She is writing a letter.' },
          { german: 'Ich habe ihm eine E-Mail geschrieben.', english: 'I wrote him an email.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'schreibe', du: 'schreibst', erSieEs: 'schreibt', wir: 'schreiben', ihr: 'schreibt', sie: 'schreiben' },
          simplePast:  { ich: 'schrieb',  du: 'schriebst', erSieEs: 'schrieb',  wir: 'schrieben', ihr: 'schriebt', sie: 'schrieben' },
          pastPerfect: { ich: 'habe geschrieben', du: 'hast geschrieben', erSieEs: 'hat geschrieben', wir: 'haben geschrieben', ihr: 'habt geschrieben', sie: 'haben geschrieben' },
          future:      { ich: 'werde schreiben', du: 'wirst schreiben', erSieEs: 'wird schreiben', wir: 'werden schreiben', ihr: 'werdet schreiben', sie: 'werden schreiben' },
          imperative:  { du: 'schreib!', wir: 'schreiben wir!', ihr: 'schreibt!', Sie: 'schreiben Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_82',
        german: 'billig',
        english: 'cheap / inexpensive',
        wordType: 'adjective', level: 'A2',
        description: 'Low in price; not expensive.',
        examples: [
          { german: 'Das Ticket ist sehr billig.', english: 'The ticket is very cheap.' },
          { german: 'Ich suche eine billige Wohnung.', english: 'I am looking for a cheap flat.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'billiger', superlativ: 'am billigsten',
          deklinationMaskulin: { nominative: 'billiger', akkusativ: 'billigen', genitiv: 'billigen', dativ: 'billigem' },
          deklinationFeminin:  { nominative: 'billige',  akkusativ: 'billige',  genitiv: 'billiger', dativ: 'billiger' },
          deklinationNeutral:  { nominative: 'billiges', akkusativ: 'billiges', genitiv: 'billigen', dativ: 'billigem' },
          deklinationPlurar:   { nominative: 'billige',  akkusativ: 'billige',  genitiv: 'billiger', dativ: 'billigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_83',
        german: 'ohne',
        english: 'without',
        wordType: 'preposition', level: 'A2',
        description: 'Not having or doing something; lacking.',
        examples: [
          { german: 'Er geht ohne Jacke raus.', english: 'He goes out without a jacket.' },
          { german: 'Kaffee ohne Zucker, bitte.', english: 'Coffee without sugar, please.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_84',
        german: 'deshalb',
        english: 'therefore / that\'s why',
        wordType: 'conjunction', level: 'A2',
        description: 'For that reason; consequently.',
        examples: [
          { german: 'Es regnet, deshalb bleibe ich zu Hause.', english: 'It is raining, that\'s why I stay at home.' },
          { german: 'Ich bin krank, deshalb gehe ich nicht zur Arbeit.', english: 'I am ill, therefore I am not going to work.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B1 ─────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_85',
        german: 'die Umwelt',
        english: 'environment',
        wordType: 'noun', level: 'B1',
        description: 'The natural world, especially as affected by human activity.',
        examples: [
          { german: 'Wir müssen die Umwelt schützen.', english: 'We must protect the environment.' },
          { german: 'Die Umweltverschmutzung ist ein großes Problem.', english: 'Environmental pollution is a big problem.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Umwelten',
          deklinationBestimmt:   { nominative: 'die Umwelt',  akkusativ: 'die Umwelt',  genitiv: 'der Umwelt',  dativ: 'der Umwelt' },
          deklinationUnbestimmt: { nominative: 'eine Umwelt', akkusativ: 'eine Umwelt', genitiv: 'einer Umwelt', dativ: 'einer Umwelt' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_86',
        german: 'entscheiden',
        english: 'to decide',
        wordType: 'verb', level: 'B1',
        description: 'To make a choice or come to a resolution.',
        examples: [
          { german: 'Er hat sich entschieden, ins Ausland zu gehen.', english: 'He has decided to go abroad.' },
          { german: 'Wir müssen schnell entscheiden.', english: 'We must decide quickly.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'entscheide', du: 'entscheidest', erSieEs: 'entscheidet', wir: 'entscheiden', ihr: 'entscheidet', sie: 'entscheiden' },
          simplePast:  { ich: 'entschied',  du: 'entschiedst',  erSieEs: 'entschied',   wir: 'entschieden', ihr: 'entschiedet', sie: 'entschieden' },
          pastPerfect: { ich: 'habe entschieden', du: 'hast entschieden', erSieEs: 'hat entschieden', wir: 'haben entschieden', ihr: 'habt entschieden', sie: 'haben entschieden' },
          future:      { ich: 'werde entscheiden', du: 'wirst entscheiden', erSieEs: 'wird entscheiden', wir: 'werden entscheiden', ihr: 'werdet entscheiden', sie: 'werden entscheiden' },
          imperative:  { du: 'entscheide!', wir: 'entscheiden wir!', ihr: 'entscheidet!', Sie: 'entscheiden Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_87',
        german: 'verantwortlich',
        english: 'responsible',
        wordType: 'adjective', level: 'B1',
        description: 'Having an obligation to do something or being accountable.',
        examples: [
          { german: 'Sie ist für das Projekt verantwortlich.', english: 'She is responsible for the project.' },
          { german: 'Jeder ist für sein Handeln verantwortlich.', english: 'Everyone is responsible for their actions.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'verantwortlicher', superlativ: 'am verantwortlichsten',
          deklinationMaskulin: { nominative: 'verantwortlicher', akkusativ: 'verantwortlichen', genitiv: 'verantwortlichen', dativ: 'verantwortlichem' },
          deklinationFeminin:  { nominative: 'verantwortliche',  akkusativ: 'verantwortliche',  genitiv: 'verantwortlicher', dativ: 'verantwortlicher' },
          deklinationNeutral:  { nominative: 'verantwortliches', akkusativ: 'verantwortliches', genitiv: 'verantwortlichen', dativ: 'verantwortlichem' },
          deklinationPlurar:   { nominative: 'verantwortliche',  akkusativ: 'verantwortliche',  genitiv: 'verantwortlicher', dativ: 'verantwortlichen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_88',
        german: 'trotzdem',
        english: 'nevertheless / still',
        wordType: 'adverb', level: 'B1',
        description: 'In spite of that; nonetheless.',
        examples: [
          { german: 'Es war kalt, trotzdem sind wir spazieren gegangen.', english: 'It was cold; nevertheless we went for a walk.' },
          { german: 'Er hat keine Lust, trotzdem macht er es.', english: 'He has no desire to, but he does it anyway.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_89',
        german: 'obwohl',
        english: 'although / even though',
        wordType: 'conjunction', level: 'B1',
        description: 'In spite of the fact that; even though.',
        examples: [
          { german: 'Obwohl es regnete, gingen wir spazieren.', english: 'Although it was raining, we went for a walk.' },
          { german: 'Er schläft, obwohl es noch früh ist.', english: 'He is sleeping even though it is still early.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_90',
        german: 'die Gewohnheit',
        english: 'habit / custom',
        wordType: 'noun', level: 'B1',
        description: 'A settled tendency or practice that is hard to give up.',
        examples: [
          { german: 'Das Frühsport ist eine gute Gewohnheit.', english: 'Morning exercise is a good habit.' },
          { german: 'Alte Gewohnheiten sind schwer abzulegen.', english: 'Old habits are hard to break.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Gewohnheiten',
          deklinationBestimmt:   { nominative: 'die Gewohnheit',  akkusativ: 'die Gewohnheit',  genitiv: 'der Gewohnheit',  dativ: 'der Gewohnheit' },
          deklinationUnbestimmt: { nominative: 'eine Gewohnheit', akkusativ: 'eine Gewohnheit', genitiv: 'einer Gewohnheit', dativ: 'einer Gewohnheit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_91',
        german: 'vorschlagen',
        english: 'to suggest / to propose',
        wordType: 'verb', level: 'B1',
        description: 'To put forward an idea or plan for consideration.',
        examples: [
          { german: 'Ich schlage vor, morgen früher aufzustehen.', english: 'I suggest getting up earlier tomorrow.' },
          { german: 'Was schlägt er vor?', english: 'What does he suggest?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'schlage vor', du: 'schlägst vor', erSieEs: 'schlägt vor', wir: 'schlagen vor', ihr: 'schlagt vor', sie: 'schlagen vor' },
          simplePast:  { ich: 'schlug vor',  du: 'schlugst vor', erSieEs: 'schlug vor',  wir: 'schlugen vor', ihr: 'schlugt vor', sie: 'schlugen vor' },
          pastPerfect: { ich: 'habe vorgeschlagen', du: 'hast vorgeschlagen', erSieEs: 'hat vorgeschlagen', wir: 'haben vorgeschlagen', ihr: 'habt vorgeschlagen', sie: 'haben vorgeschlagen' },
          future:      { ich: 'werde vorschlagen', du: 'wirst vorschlagen', erSieEs: 'wird vorschlagen', wir: 'werden vorschlagen', ihr: 'werdet vorschlagen', sie: 'werden vorschlagen' },
          imperative:  { du: 'schlag vor!', wir: 'schlagen wir vor!', ihr: 'schlagt vor!', Sie: 'schlagen Sie vor!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_92',
        german: 'hingegen',
        english: 'on the other hand / whereas',
        wordType: 'conjunction', level: 'B1',
        description: 'In contrast; on the contrary.',
        examples: [
          { german: 'Er ist extrovertiert, sie hingegen ist sehr schüchtern.', english: 'He is extroverted, whereas she is very shy.' },
          { german: 'Die Stadt ist teuer, das Dorf hingegen günstig.', english: 'The city is expensive; the village, on the other hand, is affordable.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_93',
        german: 'außerdem',
        english: 'in addition / moreover',
        wordType: 'adverb', level: 'B1',
        description: 'As an additional fact or circumstance.',
        examples: [
          { german: 'Er spricht Deutsch und außerdem noch Französisch.', english: 'He speaks German and moreover French.' },
          { german: 'Das Essen war lecker, außerdem sehr günstig.', english: 'The food was delicious and moreover very affordable.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── B2 ─────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_94',
        german: 'die Behauptung',
        english: 'claim / assertion',
        wordType: 'noun', level: 'B2',
        description: 'A statement that something is true, without providing proof.',
        examples: [
          { german: 'Diese Behauptung ist schwer zu beweisen.', english: 'This claim is difficult to prove.' },
          { german: 'Er stellte eine kühne Behauptung auf.', english: 'He made a bold assertion.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Behauptungen',
          deklinationBestimmt:   { nominative: 'die Behauptung',  akkusativ: 'die Behauptung',  genitiv: 'der Behauptung',  dativ: 'der Behauptung' },
          deklinationUnbestimmt: { nominative: 'eine Behauptung', akkusativ: 'eine Behauptung', genitiv: 'einer Behauptung', dativ: 'einer Behauptung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_95',
        german: 'bewältigen',
        english: 'to cope with / to overcome',
        wordType: 'verb', level: 'B2',
        description: 'To successfully deal with or overcome a difficulty.',
        examples: [
          { german: 'Sie hat die Krise gut bewältigt.', english: 'She coped with the crisis well.' },
          { german: 'Es ist nicht leicht, Stress zu bewältigen.', english: 'It is not easy to cope with stress.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'bewältige', du: 'bewältigst', erSieEs: 'bewältigt', wir: 'bewältigen', ihr: 'bewältigt', sie: 'bewältigen' },
          simplePast:  { ich: 'bewältigte', du: 'bewältigtest', erSieEs: 'bewältigte', wir: 'bewältigten', ihr: 'bewältigtet', sie: 'bewältigten' },
          pastPerfect: { ich: 'habe bewältigt', du: 'hast bewältigt', erSieEs: 'hat bewältigt', wir: 'haben bewältigt', ihr: 'habt bewältigt', sie: 'haben bewältigt' },
          future:      { ich: 'werde bewältigen', du: 'wirst bewältigen', erSieEs: 'wird bewältigen', wir: 'werden bewältigen', ihr: 'werdet bewältigen', sie: 'werden bewältigen' },
          imperative:  { du: 'bewältige!', wir: 'bewältigen wir!', ihr: 'bewältigt!', Sie: 'bewältigen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_96',
        german: 'nachhaltig',
        english: 'sustainable',
        wordType: 'adjective', level: 'B2',
        description: 'Able to be maintained at a certain rate or level without depleting resources.',
        examples: [
          { german: 'Wir brauchen nachhaltigen Konsum.', english: 'We need sustainable consumption.' },
          { german: 'Das Unternehmen verfolgt eine nachhaltige Strategie.', english: 'The company pursues a sustainable strategy.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'nachhaltiger', superlativ: 'am nachhaltigsten',
          deklinationMaskulin: { nominative: 'nachhaltiger', akkusativ: 'nachhaltigen', genitiv: 'nachhaltigen', dativ: 'nachhaltigem' },
          deklinationFeminin:  { nominative: 'nachhaltige',  akkusativ: 'nachhaltige',  genitiv: 'nachhaltiger', dativ: 'nachhaltiger' },
          deklinationNeutral:  { nominative: 'nachhaltiges', akkusativ: 'nachhaltiges', genitiv: 'nachhaltigen', dativ: 'nachhaltigem' },
          deklinationPlurar:   { nominative: 'nachhaltige',  akkusativ: 'nachhaltige',  genitiv: 'nachhaltiger', dativ: 'nachhaltigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_97',
        german: 'angesichts',
        english: 'in view of / given',
        wordType: 'preposition', level: 'B2',
        description: 'Taking into consideration; in light of.',
        examples: [
          { german: 'Angesichts der Lage müssen wir handeln.', english: 'In view of the situation, we must act.' },
          { german: 'Angesichts des schlechten Wetters blieben sie drinnen.', english: 'Given the bad weather, they stayed inside.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_98',
        german: 'sofern',
        english: 'as long as / provided that',
        wordType: 'conjunction', level: 'B2',
        description: 'On condition that; assuming that.',
        examples: [
          { german: 'Sofern du pünktlich kommst, fangen wir an.', english: 'As long as you arrive on time, we will start.' },
          { german: 'Sofern es möglich ist, komme ich mit.', english: 'Provided that it is possible, I will come along.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_99',
        german: 'das Gleichgewicht',
        english: 'balance / equilibrium',
        wordType: 'noun', level: 'B2',
        description: 'A state in which opposing forces or influences are balanced.',
        examples: [
          { german: 'Das ökologische Gleichgewicht ist bedroht.', english: 'The ecological balance is threatened.' },
          { german: 'Sie verlor das Gleichgewicht und fiel hin.', english: 'She lost her balance and fell over.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Gleichgewichte',
          deklinationBestimmt:   { nominative: 'das Gleichgewicht',  akkusativ: 'das Gleichgewicht',  genitiv: 'des Gleichgewichts',  dativ: 'dem Gleichgewicht' },
          deklinationUnbestimmt: { nominative: 'ein Gleichgewicht', akkusativ: 'ein Gleichgewicht', genitiv: 'eines Gleichgewichts', dativ: 'einem Gleichgewicht' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_100',
        german: 'voraussetzen',
        english: 'to presuppose / to require',
        wordType: 'verb', level: 'B2',
        description: 'To require something as a precondition.',
        examples: [
          { german: 'Der Job setzt Erfahrung voraus.', english: 'The job requires experience.' },
          { german: 'Das setzt ein gewisses Vertrauen voraus.', english: 'That presupposes a certain level of trust.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'setze voraus', du: 'setzt voraus', erSieEs: 'setzt voraus', wir: 'setzen voraus', ihr: 'setzt voraus', sie: 'setzen voraus' },
          simplePast:  { ich: 'setzte voraus', du: 'setztest voraus', erSieEs: 'setzte voraus', wir: 'setzten voraus', ihr: 'setztet voraus', sie: 'setzten voraus' },
          pastPerfect: { ich: 'habe vorausgesetzt', du: 'hast vorausgesetzt', erSieEs: 'hat vorausgesetzt', wir: 'haben vorausgesetzt', ihr: 'habt vorausgesetzt', sie: 'haben vorausgesetzt' },
          future:      { ich: 'werde voraussetzen', du: 'wirst voraussetzen', erSieEs: 'wird voraussetzen', wir: 'werden voraussetzen', ihr: 'werdet voraussetzen', sie: 'werden voraussetzen' },
          imperative:  { du: 'setze voraus!', wir: 'setzen wir voraus!', ihr: 'setzt voraus!', Sie: 'setzen Sie voraus!' }
        },
        createdAt: now, updatedAt: now
      },
      // ── C1 ─────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_101',
        german: 'die Ambivalenz',
        english: 'ambivalence',
        wordType: 'noun', level: 'C1',
        description: 'The state of having mixed feelings or contradictory ideas about something.',
        examples: [
          { german: 'Er spürte eine tiefe Ambivalenz gegenüber seiner Entscheidung.', english: 'He felt a deep ambivalence about his decision.' },
          { german: 'Die Ambivalenz der Gefühle macht die Wahl schwierig.', english: 'The ambivalence of feelings makes the choice difficult.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Ambivalenzen',
          deklinationBestimmt:   { nominative: 'die Ambivalenz',  akkusativ: 'die Ambivalenz',  genitiv: 'der Ambivalenz',  dativ: 'der Ambivalenz' },
          deklinationUnbestimmt: { nominative: 'eine Ambivalenz', akkusativ: 'eine Ambivalenz', genitiv: 'einer Ambivalenz', dativ: 'einer Ambivalenz' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_102',
        german: 'veranschaulichen',
        english: 'to illustrate / to demonstrate',
        wordType: 'verb', level: 'C1',
        description: 'To make something clear by using examples, charts, or pictures.',
        examples: [
          { german: 'Das Diagramm veranschaulicht den Trend deutlich.', english: 'The diagram clearly illustrates the trend.' },
          { german: 'Er veranschaulichte seinen Punkt mit einem Beispiel.', english: 'He demonstrated his point with an example.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'veranschauliche', du: 'veranschaulichst', erSieEs: 'veranschaulicht', wir: 'veranschaulichen', ihr: 'veranschaulicht', sie: 'veranschaulichen' },
          simplePast:  { ich: 'veranschaulichte', du: 'veranschaulichtest', erSieEs: 'veranschaulichte', wir: 'veranschaulichten', ihr: 'veranschaulichtet', sie: 'veranschaulichten' },
          pastPerfect: { ich: 'habe veranschaulicht', du: 'hast veranschaulicht', erSieEs: 'hat veranschaulicht', wir: 'haben veranschaulicht', ihr: 'habt veranschaulicht', sie: 'haben veranschaulicht' },
          future:      { ich: 'werde veranschaulichen', du: 'wirst veranschaulichen', erSieEs: 'wird veranschaulichen', wir: 'werden veranschaulichen', ihr: 'werdet veranschaulichen', sie: 'werden veranschaulichen' },
          imperative:  { du: 'veranschauliche!', wir: 'veranschaulichen wir!', ihr: 'veranschaulicht!', Sie: 'veranschaulichen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_103',
        german: 'prägnant',
        english: 'concise / succinct',
        wordType: 'adjective', level: 'C1',
        description: 'Expressing ideas clearly and in few words.',
        examples: [
          { german: 'Seine Antwort war prägnant und überzeugend.', english: 'His answer was concise and convincing.' },
          { german: 'Bitte fassen Sie sich prägnant.', english: 'Please be succinct.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'prägnanter', superlativ: 'am prägnantesten',
          deklinationMaskulin: { nominative: 'prägnanter', akkusativ: 'prägnanten', genitiv: 'prägnanten', dativ: 'prägnaniem' },
          deklinationFeminin:  { nominative: 'prägnante',  akkusativ: 'prägnante',  genitiv: 'prägnanter', dativ: 'prägnanter' },
          deklinationNeutral:  { nominative: 'prägnantes', akkusativ: 'prägnantes', genitiv: 'prägnanten', dativ: 'prägnanten' },
          deklinationPlurar:   { nominative: 'prägnante',  akkusativ: 'prägnante',  genitiv: 'prägnanter', dativ: 'prägnanten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_104',
        german: 'inwiefern',
        english: 'to what extent / in what way',
        wordType: 'adverb', level: 'C1',
        description: 'Used to ask in what respect or to what degree something is the case.',
        examples: [
          { german: 'Inwiefern hat das Auswirkungen auf uns?', english: 'To what extent does this affect us?' },
          { german: 'Ich frage mich, inwiefern das relevant ist.', english: 'I wonder in what way that is relevant.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_105',
        german: 'wenngleich',
        english: 'even though / albeit',
        wordType: 'conjunction', level: 'C1',
        description: 'Although; even if.',
        examples: [
          { german: 'Wenngleich er müde war, arbeitete er weiter.', english: 'Even though he was tired, he kept working.' },
          { german: 'Es ist ein Fortschritt, wenngleich ein kleiner.', english: 'It is progress, albeit a small one.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_106',
        german: 'das Ansehen',
        english: 'reputation / prestige',
        wordType: 'noun', level: 'C1',
        description: 'The general opinion that people have about someone or something.',
        examples: [
          { german: 'Die Firma genießt hohes Ansehen in der Branche.', english: 'The company enjoys a high reputation in the industry.' },
          { german: 'Sein Ansehen hat durch den Skandal gelitten.', english: 'His reputation suffered due to the scandal.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: '(no plural)',
          deklinationBestimmt:   { nominative: 'das Ansehen', akkusativ: 'das Ansehen', genitiv: 'des Ansehens', dativ: 'dem Ansehen' },
          deklinationUnbestimmt: { nominative: 'ein Ansehen', akkusativ: 'ein Ansehen', genitiv: 'eines Ansehens', dativ: 'einem Ansehen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_107',
        german: 'abwägen',
        english: 'to weigh up / to consider carefully',
        wordType: 'verb', level: 'C1',
        description: 'To consider the advantages and disadvantages of something carefully.',
        examples: [
          { german: 'Man muss alle Optionen sorgfältig abwägen.', english: 'One must carefully weigh up all options.' },
          { german: 'Sie wog die Vor- und Nachteile ab.', english: 'She weighed up the pros and cons.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'wäge ab',  du: 'wägst ab',  erSieEs: 'wägt ab',  wir: 'wägen ab',  ihr: 'wägt ab',  sie: 'wägen ab' },
          simplePast:  { ich: 'wog ab',   du: 'wogst ab',  erSieEs: 'wog ab',   wir: 'wogen ab',  ihr: 'wogt ab',  sie: 'wogen ab' },
          pastPerfect: { ich: 'habe abgewogen', du: 'hast abgewogen', erSieEs: 'hat abgewogen', wir: 'haben abgewogen', ihr: 'habt abgewogen', sie: 'haben abgewogen' },
          future:      { ich: 'werde abwägen', du: 'wirst abwägen', erSieEs: 'wird abwägen', wir: 'werden abwägen', ihr: 'werdet abwägen', sie: 'werden abwägen' },
          imperative:  { du: 'wäge ab!', wir: 'wägen wir ab!', ihr: 'wägt ab!', Sie: 'wägen Sie ab!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_108',
        german: 'mittels',
        english: 'by means of / using',
        wordType: 'preposition', level: 'C1',
        description: 'Through the use of; with the help of.',
        examples: [
          { german: 'Das Problem wurde mittels einer neuen Methode gelöst.', english: 'The problem was solved by means of a new method.' },
          { german: 'Mittels moderner Technologie können wir viel erreichen.', english: 'Using modern technology, we can achieve a lot.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── C2 ─────────────────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_109',
        german: 'die Trugschluss',
        english: 'fallacy',
        wordType: 'noun', level: 'C2',
        description: 'A mistaken belief, especially one based on unsound arguments.',
        examples: [
          { german: 'Das ist ein logischer Trugschluss.', english: 'That is a logical fallacy.' },
          { german: 'Sein Argument beruht auf einem Trugschluss.', english: 'His argument rests on a fallacy.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Trugschlüsse',
          deklinationBestimmt:   { nominative: 'der Trugschluss',  akkusativ: 'den Trugschluss',  genitiv: 'des Trugschlusses',  dativ: 'dem Trugschluss' },
          deklinationUnbestimmt: { nominative: 'ein Trugschluss', akkusativ: 'einen Trugschluss', genitiv: 'eines Trugschlusses', dativ: 'einem Trugschluss' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_110',
        german: 'verfälschen',
        english: 'to falsify / to distort',
        wordType: 'verb', level: 'C2',
        description: 'To alter something in order to make it misleading or inaccurate.',
        examples: [
          { german: 'Er hat die Dokumente verfälscht.', english: 'He falsified the documents.' },
          { german: 'Die Medien verfälschen manchmal die Realität.', english: 'The media sometimes distorts reality.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'verfälsche', du: 'verfälschst', erSieEs: 'verfälscht', wir: 'verfälschen', ihr: 'verfälscht', sie: 'verfälschen' },
          simplePast:  { ich: 'verfälschte', du: 'verfälschtest', erSieEs: 'verfälschte', wir: 'verfälschten', ihr: 'verfälschtet', sie: 'verfälschten' },
          pastPerfect: { ich: 'habe verfälscht', du: 'hast verfälscht', erSieEs: 'hat verfälscht', wir: 'haben verfälscht', ihr: 'habt verfälscht', sie: 'haben verfälscht' },
          future:      { ich: 'werde verfälschen', du: 'wirst verfälschen', erSieEs: 'wird verfälschen', wir: 'werden verfälschen', ihr: 'werdet verfälschen', sie: 'werden verfälschen' },
          imperative:  { du: 'verfälsche!', wir: 'verfälschen wir!', ihr: 'verfälscht!', Sie: 'verfälschen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_111',
        german: 'unausweichlich',
        english: 'inevitable / inescapable',
        wordType: 'adjective', level: 'C2',
        description: 'Impossible to avoid or prevent.',
        examples: [
          { german: 'Ein Konflikt schien unausweichlich.', english: 'A conflict seemed inevitable.' },
          { german: 'Der Wandel ist unausweichlich.', english: 'Change is inescapable.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'unausweichlicher', superlativ: 'am unausweichlichsten',
          deklinationMaskulin: { nominative: 'unausweichlicher', akkusativ: 'unausweichlichen', genitiv: 'unausweichlichen', dativ: 'unausweichlichem' },
          deklinationFeminin:  { nominative: 'unausweichliche',  akkusativ: 'unausweichliche',  genitiv: 'unausweichlicher', dativ: 'unausweichlicher' },
          deklinationNeutral:  { nominative: 'unausweichliches', akkusativ: 'unausweichliches', genitiv: 'unausweichlichen', dativ: 'unausweichlichem' },
          deklinationPlurar:   { nominative: 'unausweichliche',  akkusativ: 'unausweichliche',  genitiv: 'unausweichlicher', dativ: 'unausweichlichen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_112',
        german: 'nichtsdestotrotz',
        english: 'nonetheless / nevertheless',
        wordType: 'adverb', level: 'C2',
        description: 'In spite of everything; notwithstanding.',
        examples: [
          { german: 'Die Kritik war berechtigt; nichtsdestotrotz hielt er an seinem Plan fest.', english: 'The criticism was justified; nonetheless he stuck to his plan.' },
          { german: 'Es war schwierig, nichtsdestotrotz haben wir es geschafft.', english: 'It was difficult; nevertheless we managed it.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_113',
        german: 'insofern als',
        english: 'insofar as / to the extent that',
        wordType: 'conjunction', level: 'C2',
        description: 'To the degree or extent that.',
        examples: [
          { german: 'Insofern als das möglich ist, unterstützen wir es.', english: 'Insofar as that is possible, we support it.' },
          { german: 'Das stimmt, insofern als die Daten korrekt sind.', english: 'That is true to the extent that the data is correct.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_114',
        german: 'das Paradigma',
        english: 'paradigm',
        wordType: 'noun', level: 'C2',
        description: 'A typical example or pattern of something; a model.',
        examples: [
          { german: 'Ein Paradigmenwechsel verändert alles.', english: 'A paradigm shift changes everything.' },
          { german: 'Das ist ein Paradigma für modernes Denken.', english: 'This is a paradigm of modern thinking.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Paradigmen',
          deklinationBestimmt:   { nominative: 'das Paradigma',  akkusativ: 'das Paradigma',  genitiv: 'des Paradigmas',  dativ: 'dem Paradigma' },
          deklinationUnbestimmt: { nominative: 'ein Paradigma', akkusativ: 'ein Paradigma', genitiv: 'eines Paradigmas', dativ: 'einem Paradigma' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_115',
        german: 'erschüttern',
        english: 'to shake / to shatter',
        wordType: 'verb', level: 'C2',
        description: 'To disturb or upset someone deeply; to cause to tremble.',
        examples: [
          { german: 'Die Nachricht hat ihn tief erschüttert.', english: 'The news shattered him deeply.' },
          { german: 'Das Erdbeben erschütterte die Stadt.', english: 'The earthquake shook the city.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'erschüttere', du: 'erschütterst', erSieEs: 'erschüttert', wir: 'erschüttern', ihr: 'erschüttert', sie: 'erschüttern' },
          simplePast:  { ich: 'erschütterte', du: 'erschüttertest', erSieEs: 'erschütterte', wir: 'erschütterten', ihr: 'erschüttertet', sie: 'erschütterten' },
          pastPerfect: { ich: 'habe erschüttert', du: 'hast erschüttert', erSieEs: 'hat erschüttert', wir: 'haben erschüttert', ihr: 'habt erschüttert', sie: 'haben erschüttert' },
          future:      { ich: 'werde erschüttern', du: 'wirst erschüttern', erSieEs: 'wird erschüttern', wir: 'werden erschüttern', ihr: 'werdet erschüttern', sie: 'werden erschüttern' },
          imperative:  { du: 'erschüttere!', wir: 'erschüttern wir!', ihr: 'erschüttert!', Sie: 'erschüttern Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_116',
        german: 'kraft',
        english: 'by virtue of / by authority of',
        wordType: 'preposition', level: 'C2',
        description: 'By means of; on the basis of (formal/legal usage).',
        examples: [
          { german: 'Kraft seines Amtes hat er diese Befugnis.', english: 'By virtue of his office he has this authority.' },
          { german: 'Kraft Gesetzes ist das verboten.', english: 'By authority of law this is forbidden.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Mixed extras across levels ─────────────────────────────────────────
      {
        _id: 'vocab_sample_117',
        german: 'der Beruf',
        english: 'profession / occupation',
        wordType: 'noun', level: 'A2',
        description: 'A paid occupation, especially one requiring training.',
        examples: [
          { german: 'Was ist dein Beruf?', english: 'What is your profession?' },
          { german: 'Sie hat ihren Beruf gewechselt.', english: 'She changed her occupation.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Berufe',
          deklinationBestimmt:   { nominative: 'der Beruf',  akkusativ: 'den Beruf',  genitiv: 'des Berufs',  dativ: 'dem Beruf' },
          deklinationUnbestimmt: { nominative: 'ein Beruf', akkusativ: 'einen Beruf', genitiv: 'eines Berufs', dativ: 'einem Beruf' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_118',
        german: 'erklären',
        english: 'to explain',
        wordType: 'verb', level: 'A2',
        description: 'To make something clear by describing it in more detail.',
        examples: [
          { german: 'Kannst du mir das erklären?', english: 'Can you explain that to me?' },
          { german: 'Der Lehrer erklärt die Grammatik.', english: 'The teacher explains the grammar.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'erkläre', du: 'erklärst', erSieEs: 'erklärt', wir: 'erklären', ihr: 'erklärt', sie: 'erklären' },
          simplePast:  { ich: 'erklärte', du: 'erklärtest', erSieEs: 'erklärte', wir: 'erklärten', ihr: 'erklärtet', sie: 'erklärten' },
          pastPerfect: { ich: 'habe erklärt', du: 'hast erklärt', erSieEs: 'hat erklärt', wir: 'haben erklärt', ihr: 'habt erklärt', sie: 'haben erklärt' },
          future:      { ich: 'werde erklären', du: 'wirst erklären', erSieEs: 'wird erklären', wir: 'werden erklären', ihr: 'werdet erklären', sie: 'werden erklären' },
          imperative:  { du: 'erkläre!', wir: 'erklären wir!', ihr: 'erklärt!', Sie: 'erklären Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_119',
        german: 'neugierig',
        english: 'curious',
        wordType: 'adjective', level: 'B1',
        description: 'Eager to know or learn something.',
        examples: [
          { german: 'Die Kinder sind sehr neugierig.', english: 'The children are very curious.' },
          { german: 'Ich bin neugierig, was passiert.', english: 'I am curious about what happens.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'neugieriger', superlativ: 'am neugierigsten',
          deklinationMaskulin: { nominative: 'neugieriger', akkusativ: 'neugierigen', genitiv: 'neugierigen', dativ: 'neugierigem' },
          deklinationFeminin:  { nominative: 'neugierige',  akkusativ: 'neugierige',  genitiv: 'neugieriger', dativ: 'neugieriger' },
          deklinationNeutral:  { nominative: 'neugieriges', akkusativ: 'neugieriges', genitiv: 'neugierigen', dativ: 'neugierigem' },
          deklinationPlurar:   { nominative: 'neugierige',  akkusativ: 'neugierige',  genitiv: 'neugieriger', dativ: 'neugierigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_120',
        german: 'statt',
        english: 'instead of',
        wordType: 'preposition', level: 'B1',
        description: 'As a substitute for something or someone.',
        examples: [
          { german: 'Ich nehme Tee statt Kaffee.', english: 'I will take tea instead of coffee.' },
          { german: 'Statt zu klagen, sollte er handeln.', english: 'Instead of complaining, he should act.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_121',
        german: 'die Fähigkeit',
        english: 'ability / skill',
        wordType: 'noun', level: 'B2',
        description: 'Possession of the means or skill to do something.',
        examples: [
          { german: 'Er hat die Fähigkeit, andere zu überzeugen.', english: 'He has the ability to persuade others.' },
          { german: 'Ihre sprachlichen Fähigkeiten sind beeindruckend.', english: 'Her language skills are impressive.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Fähigkeiten',
          deklinationBestimmt:   { nominative: 'die Fähigkeit',  akkusativ: 'die Fähigkeit',  genitiv: 'der Fähigkeit',  dativ: 'der Fähigkeit' },
          deklinationUnbestimmt: { nominative: 'eine Fähigkeit', akkusativ: 'eine Fähigkeit', genitiv: 'einer Fähigkeit', dativ: 'einer Fähigkeit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_122',
        german: 'dennoch',
        english: 'yet / still / nevertheless',
        wordType: 'adverb', level: 'B2',
        description: 'In spite of that; all the same.',
        examples: [
          { german: 'Es war schwer, dennoch hat sie nicht aufgegeben.', english: 'It was hard; yet she did not give up.' },
          { german: 'Er wusste die Antwort, dennoch schwieg er.', english: 'He knew the answer; still he stayed silent.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_123',
        german: 'wer',
        english: 'who / whoever',
        wordType: 'pronoun', level: 'A1',
        description: 'Interrogative and relative pronoun referring to people.',
        examples: [
          { german: 'Wer ist das?', english: 'Who is that?' },
          { german: 'Wer früh kommt, bekommt einen guten Platz.', english: 'Whoever arrives early gets a good seat.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional A1 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_124',
        german: 'Apfel',
        english: 'apple',
        wordType: 'noun', level: 'A1',
        description: 'A round fruit with red, yellow, or green skin.',
        examples: [
          { german: 'Ich esse einen Apfel.', english: 'I am eating an apple.' },
          { german: 'Der Apfel ist süß und lecker.', english: 'The apple is sweet and delicious.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Äpfel',
          deklinationBestimmt:   { nominative: 'der Apfel',  akkusativ: 'den Apfel',  genitiv: 'des Apfels',  dativ: 'dem Apfel' },
          deklinationUnbestimmt: { nominative: 'ein Apfel',  akkusativ: 'einen Apfel', genitiv: 'eines Apfels', dativ: 'einem Apfel' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_125',
        german: 'schlafen',
        english: 'to sleep',
        wordType: 'verb', level: 'A1',
        description: 'To rest in a state of reduced consciousness.',
        examples: [
          { german: 'Das Baby schläft tief und fest.', english: 'The baby is sleeping soundly.' },
          { german: 'Ich schlafe immer acht Stunden.', english: 'I always sleep eight hours.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'schlafe', du: 'schläfst', erSieEs: 'schläft', wir: 'schlafen', ihr: 'schlaft', sie: 'schlafen' },
          simplePast:  { ich: 'schlief',  du: 'schliefst', erSieEs: 'schlief',  wir: 'schliefen', ihr: 'schlieft', sie: 'schliefen' },
          pastPerfect: { ich: 'habe geschlafen', du: 'hast geschlafen', erSieEs: 'hat geschlafen', wir: 'haben geschlafen', ihr: 'habt geschlafen', sie: 'haben geschlafen' },
          future:      { ich: 'werde schlafen', du: 'wirst schlafen', erSieEs: 'wird schlafen', wir: 'werden schlafen', ihr: 'werdet schlafen', sie: 'werden schlafen' },
          imperative:  { du: 'schlaf!', wir: 'schlafen wir!', ihr: 'schlaft!', Sie: 'schlafen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_126',
        german: 'klein',
        english: 'small / little',
        wordType: 'adjective', level: 'A1',
        description: 'Of a size that is less than normal or usual.',
        examples: [
          { german: 'Das ist ein kleines Kind.', english: 'That is a small child.' },
          { german: 'Meine Wohnung ist sehr klein.', english: 'My flat is very small.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kleiner', superlativ: 'am kleinsten',
          deklinationMaskulin: { nominative: 'kleiner', akkusativ: 'kleinen', genitiv: 'kleinen', dativ: 'kleinem' },
          deklinationFeminin:  { nominative: 'kleine',  akkusativ: 'kleine',  genitiv: 'kleiner', dativ: 'kleiner' },
          deklinationNeutral:  { nominative: 'kleines', akkusativ: 'kleines', genitiv: 'kleinen', dativ: 'kleinem' },
          deklinationPlurar:   { nominative: 'kleine',  akkusativ: 'kleine',  genitiv: 'kleiner', dativ: 'kleinen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_127',
        german: 'aber',
        english: 'but / however',
        wordType: 'conjunction', level: 'A1',
        description: 'Used to introduce a contrast or exception.',
        examples: [
          { german: 'Ich möchte kommen, aber ich bin krank.', english: 'I would like to come, but I am ill.' },
          { german: 'Das Essen ist gut, aber teuer.', english: 'The food is good but expensive.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional A2 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_128',
        german: 'Bibliothek',
        english: 'library',
        wordType: 'noun', level: 'A2',
        description: 'A building or room containing a collection of books.',
        examples: [
          { german: 'Ich gehe heute in die Bibliothek.', english: 'I am going to the library today.' },
          { german: 'Die Bibliothek ist um 20 Uhr geschlossen.', english: 'The library closes at 8 pm.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Bibliotheken',
          deklinationBestimmt:   { nominative: 'die Bibliothek',  akkusativ: 'die Bibliothek',  genitiv: 'der Bibliothek',  dativ: 'der Bibliothek' },
          deklinationUnbestimmt: { nominative: 'eine Bibliothek', akkusativ: 'eine Bibliothek', genitiv: 'einer Bibliothek', dativ: 'einer Bibliothek' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_129',
        german: 'benutzen',
        english: 'to use',
        wordType: 'verb', level: 'A2',
        description: 'To take, hold, or deploy as a means of accomplishing a purpose.',
        examples: [
          { german: 'Darf ich dein Telefon benutzen?', english: 'May I use your phone?' },
          { german: 'Er benutzt täglich den Computer.', english: 'He uses the computer every day.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'benutze', du: 'benutzt', erSieEs: 'benutzt', wir: 'benutzen', ihr: 'benutzt', sie: 'benutzen' },
          simplePast:  { ich: 'benutzte', du: 'benutztest', erSieEs: 'benutzte', wir: 'benutzten', ihr: 'benutztet', sie: 'benutzten' },
          pastPerfect: { ich: 'habe benutzt', du: 'hast benutzt', erSieEs: 'hat benutzt', wir: 'haben benutzt', ihr: 'habt benutzt', sie: 'haben benutzt' },
          future:      { ich: 'werde benutzen', du: 'wirst benutzen', erSieEs: 'wird benutzen', wir: 'werden benutzen', ihr: 'werdet benutzen', sie: 'werden benutzen' },
          imperative:  { du: 'benutze!', wir: 'benutzen wir!', ihr: 'benutzt!', Sie: 'benutzen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_130',
        german: 'laut',
        english: 'loud / noisy',
        wordType: 'adjective', level: 'A2',
        description: 'Making or capable of making a lot of noise.',
        examples: [
          { german: 'Die Musik ist sehr laut.', english: 'The music is very loud.' },
          { german: 'Bitte sei nicht so laut!', english: 'Please do not be so loud!' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'lauter', superlativ: 'am lautesten',
          deklinationMaskulin: { nominative: 'lauter', akkusativ: 'lauten', genitiv: 'lauten', dativ: 'lautem' },
          deklinationFeminin:  { nominative: 'laute',  akkusativ: 'laute',  genitiv: 'lauter', dativ: 'lauter' },
          deklinationNeutral:  { nominative: 'lautes', akkusativ: 'lautes', genitiv: 'lauten', dativ: 'lautem' },
          deklinationPlurar:   { nominative: 'laute',  akkusativ: 'laute',  genitiv: 'lauter', dativ: 'lauten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_131',
        german: 'immer',
        english: 'always',
        wordType: 'adverb', level: 'A2',
        description: 'At all times; on all occasions.',
        examples: [
          { german: 'Sie ist immer pünktlich.', english: 'She is always punctual.' },
          { german: 'Er denkt immer an andere.', english: 'He always thinks of others.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional B1 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_132',
        german: 'Meinung',
        english: 'opinion',
        wordType: 'noun', level: 'B1',
        description: 'A view or judgement not necessarily based on fact.',
        examples: [
          { german: 'Meiner Meinung nach ist das falsch.', english: 'In my opinion that is wrong.' },
          { german: 'Jeder hat das Recht, seine Meinung zu äußern.', english: 'Everyone has the right to express their opinion.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Meinungen',
          deklinationBestimmt:   { nominative: 'die Meinung',  akkusativ: 'die Meinung',  genitiv: 'der Meinung',  dativ: 'der Meinung' },
          deklinationUnbestimmt: { nominative: 'eine Meinung', akkusativ: 'eine Meinung', genitiv: 'einer Meinung', dativ: 'einer Meinung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_133',
        german: 'verbessern',
        english: 'to improve',
        wordType: 'verb', level: 'B1',
        description: 'To make or become better.',
        examples: [
          { german: 'Ich möchte mein Deutsch verbessern.', english: 'I would like to improve my German.' },
          { german: 'Mit Übung verbessert man sich schnell.', english: 'With practice one improves quickly.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'verbessere', du: 'verbesserst', erSieEs: 'verbessert', wir: 'verbessern', ihr: 'verbessert', sie: 'verbessern' },
          simplePast:  { ich: 'verbesserte', du: 'verbessertest', erSieEs: 'verbesserte', wir: 'verbesserten', ihr: 'verbessertet', sie: 'verbesserten' },
          pastPerfect: { ich: 'habe verbessert', du: 'hast verbessert', erSieEs: 'hat verbessert', wir: 'haben verbessert', ihr: 'habt verbessert', sie: 'haben verbessert' },
          future:      { ich: 'werde verbessern', du: 'wirst verbessern', erSieEs: 'wird verbessern', wir: 'werden verbessern', ihr: 'werdet verbessern', sie: 'werden verbessern' },
          imperative:  { du: 'verbessere!', wir: 'verbessern wir!', ihr: 'verbessert!', Sie: 'verbessern Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_134',
        german: 'wichtig',
        english: 'important',
        wordType: 'adjective', level: 'B1',
        description: 'Of great significance or value.',
        examples: [
          { german: 'Das ist eine wichtige Entscheidung.', english: 'That is an important decision.' },
          { german: 'Es ist wichtig, regelmäßig Sport zu treiben.', english: 'It is important to exercise regularly.' }
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
        _id: 'vocab_sample_135',
        german: 'seit',
        english: 'since / for',
        wordType: 'preposition', level: 'B1',
        description: 'From a point in the past until now.',
        examples: [
          { german: 'Ich lerne seit drei Jahren Deutsch.', english: 'I have been learning German for three years.' },
          { german: 'Seit dem Unfall fährt er kein Auto mehr.', english: 'Since the accident he no longer drives.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_136',
        german: 'kaum',
        english: 'hardly / barely',
        wordType: 'adverb', level: 'B1',
        description: 'Almost not; only just.',
        examples: [
          { german: 'Ich kann ihn kaum hören.', english: 'I can hardly hear him.' },
          { german: 'Sie schläft kaum fünf Stunden pro Nacht.', english: 'She barely sleeps five hours a night.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional B2 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_137',
        german: 'Auswirkung',
        english: 'impact / effect',
        wordType: 'noun', level: 'B2',
        description: 'A marked effect or influence.',
        examples: [
          { german: 'Die Entscheidung hat große Auswirkungen.', english: 'The decision has major effects.' },
          { german: 'Die Auswirkungen des Klimawandels sind spürbar.', english: 'The impacts of climate change are noticeable.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Auswirkungen',
          deklinationBestimmt:   { nominative: 'die Auswirkung',  akkusativ: 'die Auswirkung',  genitiv: 'der Auswirkung',  dativ: 'der Auswirkung' },
          deklinationUnbestimmt: { nominative: 'eine Auswirkung', akkusativ: 'eine Auswirkung', genitiv: 'einer Auswirkung', dativ: 'einer Auswirkung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_138',
        german: 'vergleichen',
        english: 'to compare',
        wordType: 'verb', level: 'B2',
        description: 'To examine similarities and differences.',
        examples: [
          { german: 'Vergleich die beiden Texte miteinander.', english: 'Compare the two texts with each other.' },
          { german: 'Man kann die beiden Situationen nicht vergleichen.', english: 'You cannot compare the two situations.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'vergleiche', du: 'vergleichst', erSieEs: 'vergleicht', wir: 'vergleichen', ihr: 'vergleicht', sie: 'vergleichen' },
          simplePast:  { ich: 'verglich',   du: 'verglichst',  erSieEs: 'verglich',   wir: 'verglichen', ihr: 'verglichet', sie: 'verglichen' },
          pastPerfect: { ich: 'habe verglichen', du: 'hast verglichen', erSieEs: 'hat verglichen', wir: 'haben verglichen', ihr: 'habt verglichen', sie: 'haben verglichen' },
          future:      { ich: 'werde vergleichen', du: 'wirst vergleichen', erSieEs: 'wird vergleichen', wir: 'werden vergleichen', ihr: 'werdet vergleichen', sie: 'werden vergleichen' },
          imperative:  { du: 'vergleiche!', wir: 'vergleichen wir!', ihr: 'vergleicht!', Sie: 'vergleichen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_139',
        german: 'eindeutig',
        english: 'clear / unambiguous',
        wordType: 'adjective', level: 'B2',
        description: 'Admitting of no doubt or misunderstanding; having only one meaning.',
        examples: [
          { german: 'Das Ergebnis ist eindeutig.', english: 'The result is clear.' },
          { german: 'Seine Antwort war eindeutig positiv.', english: 'His answer was unambiguously positive.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'eindeutiger', superlativ: 'am eindeutigsten',
          deklinationMaskulin: { nominative: 'eindeutiger', akkusativ: 'eindeutigen', genitiv: 'eindeutigen', dativ: 'eindeutigem' },
          deklinationFeminin:  { nominative: 'eindeutige',  akkusativ: 'eindeutige',  genitiv: 'eindeutiger', dativ: 'eindeutiger' },
          deklinationNeutral:  { nominative: 'eindeutiges', akkusativ: 'eindeutiges', genitiv: 'eindeutigen', dativ: 'eindeutigem' },
          deklinationPlurar:   { nominative: 'eindeutige',  akkusativ: 'eindeutige',  genitiv: 'eindeutiger', dativ: 'eindeutigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_140',
        german: 'aufgrund',
        english: 'due to / because of',
        wordType: 'preposition', level: 'B2',
        description: 'As a result of; on the basis of.',
        examples: [
          { german: 'Aufgrund des Regens fiel das Spiel aus.', english: 'Due to the rain the game was cancelled.' },
          { german: 'Aufgrund seiner Leistung wurde er befördert.', english: 'Because of his performance he was promoted.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional C1 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_141',
        german: 'Diskrepanz',
        english: 'discrepancy',
        wordType: 'noun', level: 'C1',
        description: 'A lack of compatibility or similarity between two or more facts.',
        examples: [
          { german: 'Es gibt eine Diskrepanz zwischen Theorie und Praxis.', english: 'There is a discrepancy between theory and practice.' },
          { german: 'Die Diskrepanz in den Zahlen fiel sofort auf.', english: 'The discrepancy in the numbers was immediately noticeable.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Diskrepanzen',
          deklinationBestimmt:   { nominative: 'die Diskrepanz',  akkusativ: 'die Diskrepanz',  genitiv: 'der Diskrepanz',  dativ: 'der Diskrepanz' },
          deklinationUnbestimmt: { nominative: 'eine Diskrepanz', akkusativ: 'eine Diskrepanz', genitiv: 'einer Diskrepanz', dativ: 'einer Diskrepanz' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_142',
        german: 'differenzieren',
        english: 'to differentiate / to distinguish',
        wordType: 'verb', level: 'C1',
        description: 'To recognize or express a difference.',
        examples: [
          { german: 'Man muss zwischen den beiden Konzepten differenzieren.', english: 'One must differentiate between the two concepts.' },
          { german: 'Er differenziert sehr genau in seiner Argumentation.', english: 'He distinguishes very precisely in his argumentation.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'differenziere', du: 'differenzierst', erSieEs: 'differenziert', wir: 'differenzieren', ihr: 'differenziert', sie: 'differenzieren' },
          simplePast:  { ich: 'differenzierte', du: 'differenziertest', erSieEs: 'differenzierte', wir: 'differenzierten', ihr: 'differenziertet', sie: 'differenzierten' },
          pastPerfect: { ich: 'habe differenziert', du: 'hast differenziert', erSieEs: 'hat differenziert', wir: 'haben differenziert', ihr: 'habt differenziert', sie: 'haben differenziert' },
          future:      { ich: 'werde differenzieren', du: 'wirst differenzieren', erSieEs: 'wird differenzieren', wir: 'werden differenzieren', ihr: 'werdet differenzieren', sie: 'werden differenzieren' },
          imperative:  { du: 'differenziere!', wir: 'differenzieren wir!', ihr: 'differenziert!', Sie: 'differenzieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_143',
        german: 'treffend',
        english: 'apt / pertinent',
        wordType: 'adjective', level: 'C1',
        description: 'Exactly right; appropriate to the subject.',
        examples: [
          { german: 'Das ist eine treffende Beschreibung.', english: 'That is an apt description.' },
          { german: 'Seine Worte waren treffend und klar.', english: 'His words were pertinent and clear.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'treffender', superlativ: 'am treffendsten',
          deklinationMaskulin: { nominative: 'treffender', akkusativ: 'treffenden', genitiv: 'treffenden', dativ: 'treffendem' },
          deklinationFeminin:  { nominative: 'treffende',  akkusativ: 'treffende',  genitiv: 'treffender', dativ: 'treffender' },
          deklinationNeutral:  { nominative: 'treffendes', akkusativ: 'treffendes', genitiv: 'treffenden', dativ: 'treffendem' },
          deklinationPlurar:   { nominative: 'treffende',  akkusativ: 'treffende',  genitiv: 'treffender', dativ: 'treffenden' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_144',
        german: 'gleichwohl',
        english: 'nevertheless / all the same',
        wordType: 'adverb', level: 'C1',
        description: 'Despite what has just been said or referred to.',
        examples: [
          { german: 'Es ist schwierig, gleichwohl versuchen wir es.', english: 'It is difficult; nevertheless we try.' },
          { german: 'Er zweifelt, glaubt gleichwohl an den Erfolg.', english: 'He doubts, but believes all the same in success.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      // ── Additional C2 ──────────────────────────────────────────────────────
      {
        _id: 'vocab_sample_145',
        german: 'Konnotation',
        english: 'connotation',
        wordType: 'noun', level: 'C2',
        description: 'An idea or feeling that a word invokes in addition to its literal meaning.',
        examples: [
          { german: 'Das Wort hat eine negative Konnotation.', english: 'The word has a negative connotation.' },
          { german: 'Konnotationen sind kulturell verschieden.', english: 'Connotations differ across cultures.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Konnotationen',
          deklinationBestimmt:   { nominative: 'die Konnotation',  akkusativ: 'die Konnotation',  genitiv: 'der Konnotation',  dativ: 'der Konnotation' },
          deklinationUnbestimmt: { nominative: 'eine Konnotation', akkusativ: 'eine Konnotation', genitiv: 'einer Konnotation', dativ: 'einer Konnotation' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_146',
        german: 'hinterfragen',
        english: 'to question / to scrutinise',
        wordType: 'verb', level: 'C2',
        description: 'To examine or challenge critically.',
        examples: [
          { german: 'Man sollte bestehende Normen hinterfragen.', english: 'One should question existing norms.' },
          { german: 'Er hinterfragt alles, was ihm gesagt wird.', english: 'He scrutinises everything he is told.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'hinterfrage', du: 'hinterfragst', erSieEs: 'hinterfragt', wir: 'hinterfragen', ihr: 'hinterfragt', sie: 'hinterfragen' },
          simplePast:  { ich: 'hinterfragte', du: 'hinterfragtest', erSieEs: 'hinterfragte', wir: 'hinterfragten', ihr: 'hinterfragtet', sie: 'hinterfragten' },
          pastPerfect: { ich: 'habe hinterfragt', du: 'hast hinterfragt', erSieEs: 'hat hinterfragt', wir: 'haben hinterfragt', ihr: 'habt hinterfragt', sie: 'haben hinterfragt' },
          future:      { ich: 'werde hinterfragen', du: 'wirst hinterfragen', erSieEs: 'wird hinterfragen', wir: 'werden hinterfragen', ihr: 'werdet hinterfragen', sie: 'werden hinterfragen' },
          imperative:  { du: 'hinterfrage!', wir: 'hinterfragen wir!', ihr: 'hinterfragt!', Sie: 'hinterfragen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_147',
        german: 'subtil',
        english: 'subtle',
        wordType: 'adjective', level: 'C2',
        description: 'So delicate or precise as to be difficult to analyse.',
        examples: [
          { german: 'Der Unterschied ist subtil, aber wichtig.', english: 'The difference is subtle but important.' },
          { german: 'Sie bemerkte die subtile Veränderung sofort.', english: 'She noticed the subtle change immediately.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'subtiler', superlativ: 'am subtilsten',
          deklinationMaskulin: { nominative: 'subtiler', akkusativ: 'subtilen', genitiv: 'subtilen', dativ: 'subtilem' },
          deklinationFeminin:  { nominative: 'subtile',  akkusativ: 'subtile',  genitiv: 'subtiler', dativ: 'subtiler' },
          deklinationNeutral:  { nominative: 'subtiles', akkusativ: 'subtiles', genitiv: 'subtilen', dativ: 'subtilem' },
          deklinationPlurar:   { nominative: 'subtile',  akkusativ: 'subtile',  genitiv: 'subtiler', dativ: 'subtilen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_148',
        german: 'wennschon',
        english: 'if at all / if anything',
        wordType: 'conjunction', level: 'C2',
        description: 'Used to indicate that something should be done properly if done at all.',
        examples: [
          { german: 'Wennschon, dennschon – entweder richtig oder gar nicht.', english: 'If it is worth doing, it is worth doing well.' },
          { german: 'Wennschon er kommt, soll er pünktlich sein.', english: 'If anything, when he comes he should be on time.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_149',
        german: 'es',
        english: 'it',
        wordType: 'pronoun', level: 'A1',
        description: 'Third-person singular neuter personal pronoun.',
        examples: [
          { german: 'Es regnet heute.', english: 'It is raining today.' },
          { german: 'Es ist ein schöner Tag.', english: 'It is a beautiful day.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_150',
        german: 'Schlüssel',
        english: 'key',
        wordType: 'noun', level: 'A1',
        description: 'A small piece of shaped metal used to open a lock.',
        examples: [
          { german: 'Ich habe meinen Schlüssel vergessen.', english: 'I forgot my key.' },
          { german: 'Der Schlüssel steckt in der Tür.', english: 'The key is in the door.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Schlüssel',
          deklinationBestimmt:   { nominative: 'der Schlüssel',  akkusativ: 'den Schlüssel',  genitiv: 'des Schlüssels',  dativ: 'dem Schlüssel' },
          deklinationUnbestimmt: { nominative: 'ein Schlüssel', akkusativ: 'einen Schlüssel', genitiv: 'eines Schlüssels', dativ: 'einem Schlüssel' }
        },
        createdAt: now, updatedAt: now
      },
      // ── IT / DevOps / Scrum ────────────────────────────────────────────────
      {
        _id: 'vocab_sample_151',
        german: 'Sprint',
        english: 'sprint',
        wordType: 'noun', level: 'A2',
        description: 'A fixed time-box in Scrum (usually 1–4 weeks) during which a team completes a set of work.',
        examples: [
          { german: 'Der Sprint dauert zwei Wochen.', english: 'The sprint lasts two weeks.' },
          { german: 'Wir planen den nächsten Sprint im Planning-Meeting.', english: 'We plan the next sprint in the planning meeting.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Sprints',
          deklinationBestimmt:   { nominative: 'der Sprint',  akkusativ: 'den Sprint',  genitiv: 'des Sprints',  dativ: 'dem Sprint' },
          deklinationUnbestimmt: { nominative: 'ein Sprint', akkusativ: 'einen Sprint', genitiv: 'eines Sprints', dativ: 'einem Sprint' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_152',
        german: 'schätzen',
        english: 'to estimate',
        wordType: 'verb', level: 'B1',
        description: 'To roughly calculate the effort, size, or duration of a task.',
        examples: [
          { german: 'Wir schätzen die Aufgabe auf drei Story Points.', english: 'We estimate the task at three story points.' },
          { german: 'Kannst du schätzen, wie lange das dauert?', english: 'Can you estimate how long that will take?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'schätze',  du: 'schätzt',  erSieEs: 'schätzt',  wir: 'schätzen',  ihr: 'schätzt',  sie: 'schätzen' },
          simplePast:  { ich: 'schätzte', du: 'schätztest', erSieEs: 'schätzte', wir: 'schätzten', ihr: 'schätztet', sie: 'schätzten' },
          pastPerfect: { ich: 'habe geschätzt', du: 'hast geschätzt', erSieEs: 'hat geschätzt', wir: 'haben geschätzt', ihr: 'habt geschätzt', sie: 'haben geschätzt' },
          future:      { ich: 'werde schätzen', du: 'wirst schätzen', erSieEs: 'wird schätzen', wir: 'werden schätzen', ihr: 'werdet schätzen', sie: 'werden schätzen' },
          imperative:  { du: 'schätze!', wir: 'schätzen wir!', ihr: 'schätzt!', Sie: 'schätzen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_153',
        german: 'zuweisen',
        english: 'to assign',
        wordType: 'verb', level: 'B1',
        description: 'To allocate a task or ticket to a team member.',
        examples: [
          { german: 'Der Scrum Master weist die Aufgabe dem Entwickler zu.', english: 'The Scrum Master assigns the task to the developer.' },
          { german: 'Wurde dir das Ticket schon zugewiesen?', english: 'Has the ticket already been assigned to you?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'weise zu',  du: 'weist zu',  erSieEs: 'weist zu',  wir: 'weisen zu',  ihr: 'weist zu',  sie: 'weisen zu' },
          simplePast:  { ich: 'wies zu',   du: 'wiest zu',  erSieEs: 'wies zu',   wir: 'wiesen zu',  ihr: 'wiest zu',  sie: 'wiesen zu' },
          pastPerfect: { ich: 'habe zugewiesen', du: 'hast zugewiesen', erSieEs: 'hat zugewiesen', wir: 'haben zugewiesen', ihr: 'habt zugewiesen', sie: 'haben zugewiesen' },
          future:      { ich: 'werde zuweisen', du: 'wirst zuweisen', erSieEs: 'wird zuweisen', wir: 'werden zuweisen', ihr: 'werdet zuweisen', sie: 'werden zuweisen' },
          imperative:  { du: 'weise zu!', wir: 'weisen wir zu!', ihr: 'weist zu!', Sie: 'weisen Sie zu!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_154',
        german: 'Aufgabe',
        english: 'task',
        wordType: 'noun', level: 'A2',
        description: 'A piece of work to be done, often tracked in a ticket or board.',
        examples: [
          { german: 'Ich habe heute drei Aufgaben erledigt.', english: 'I completed three tasks today.' },
          { german: 'Die Aufgabe ist im Backlog.', english: 'The task is in the backlog.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Aufgaben',
          deklinationBestimmt:   { nominative: 'die Aufgabe',  akkusativ: 'die Aufgabe',  genitiv: 'der Aufgabe',  dativ: 'der Aufgabe' },
          deklinationUnbestimmt: { nominative: 'eine Aufgabe', akkusativ: 'eine Aufgabe', genitiv: 'einer Aufgabe', dativ: 'einer Aufgabe' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_155',
        german: 'Backlog',
        english: 'backlog',
        wordType: 'noun', level: 'B1',
        description: 'A prioritised list of features, bugs, and tasks waiting to be worked on.',
        examples: [
          { german: 'Das Backlog wird vom Product Owner gepflegt.', english: 'The backlog is maintained by the Product Owner.' },
          { german: 'Wir müssen das Backlog vor dem Sprint aufräumen.', english: 'We need to tidy up the backlog before the sprint.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Backlogs',
          deklinationBestimmt:   { nominative: 'das Backlog',  akkusativ: 'das Backlog',  genitiv: 'des Backlogs',  dativ: 'dem Backlog' },
          deklinationUnbestimmt: { nominative: 'ein Backlog', akkusativ: 'ein Backlog', genitiv: 'eines Backlogs', dativ: 'einem Backlog' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_156',
        german: 'Retrospektive',
        english: 'retrospective',
        wordType: 'noun', level: 'B1',
        description: 'A Scrum ceremony held at the end of a sprint to reflect on what went well and what to improve.',
        examples: [
          { german: 'In der Retrospektive besprechen wir, was gut lief.', english: 'In the retrospective we discuss what went well.' },
          { german: 'Die Retrospektive findet jeden zweiten Freitag statt.', english: 'The retrospective takes place every other Friday.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Retrospektiven',
          deklinationBestimmt:   { nominative: 'die Retrospektive',  akkusativ: 'die Retrospektive',  genitiv: 'der Retrospektive',  dativ: 'der Retrospektive' },
          deklinationUnbestimmt: { nominative: 'eine Retrospektive', akkusativ: 'eine Retrospektive', genitiv: 'einer Retrospektive', dativ: 'einer Retrospektive' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_157',
        german: 'testen',
        english: 'to test',
        wordType: 'verb', level: 'A2',
        description: 'To verify that software behaves as expected.',
        examples: [
          { german: 'Wir müssen den Code gründlich testen.', english: 'We must test the code thoroughly.' },
          { german: 'Hast du den neuen Feature schon getestet?', english: 'Have you already tested the new feature?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'teste',  du: 'testest',  erSieEs: 'testet',  wir: 'testen',  ihr: 'testet',  sie: 'testen' },
          simplePast:  { ich: 'testete', du: 'testetes', erSieEs: 'testete', wir: 'testeten', ihr: 'testetet', sie: 'testeten' },
          pastPerfect: { ich: 'habe getestet', du: 'hast getestet', erSieEs: 'hat getestet', wir: 'haben getestet', ihr: 'habt getestet', sie: 'haben getestet' },
          future:      { ich: 'werde testen', du: 'wirst testen', erSieEs: 'wird testen', wir: 'werden testen', ihr: 'werdet testen', sie: 'werden testen' },
          imperative:  { du: 'teste!', wir: 'testen wir!', ihr: 'testet!', Sie: 'testen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_158',
        german: 'Fehler',
        english: 'bug / error',
        wordType: 'noun', level: 'A2',
        description: 'A defect or mistake in software code causing unexpected behaviour.',
        examples: [
          { german: 'Der Fehler tritt nur in der Produktion auf.', english: 'The bug only occurs in production.' },
          { german: 'Ich habe den Fehler gefunden und behoben.', english: 'I found and fixed the bug.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Fehler',
          deklinationBestimmt:   { nominative: 'der Fehler',  akkusativ: 'den Fehler',  genitiv: 'des Fehlers',  dativ: 'dem Fehler' },
          deklinationUnbestimmt: { nominative: 'ein Fehler', akkusativ: 'einen Fehler', genitiv: 'eines Fehlers', dativ: 'einem Fehler' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_159',
        german: 'überprüfen',
        english: 'to review / to check',
        wordType: 'verb', level: 'B1',
        description: 'To examine something carefully to ensure it is correct or complete.',
        examples: [
          { german: 'Bitte überprüfe meinen Pull Request.', english: 'Please review my pull request.' },
          { german: 'Wir überprüfen den Code vor dem Release.', english: 'We review the code before the release.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'überprüfe',  du: 'überprüfst',  erSieEs: 'überprüft',  wir: 'überprüfen',  ihr: 'überprüft',  sie: 'überprüfen' },
          simplePast:  { ich: 'überprüfte', du: 'überprüftest', erSieEs: 'überprüfte', wir: 'überprüften', ihr: 'überprüftet', sie: 'überprüften' },
          pastPerfect: { ich: 'habe überprüft', du: 'hast überprüft', erSieEs: 'hat überprüft', wir: 'haben überprüft', ihr: 'habt überprüft', sie: 'haben überprüft' },
          future:      { ich: 'werde überprüfen', du: 'wirst überprüfen', erSieEs: 'wird überprüfen', wir: 'werden überprüfen', ihr: 'werdet überprüfen', sie: 'werden überprüfen' },
          imperative:  { du: 'überprüfe!', wir: 'überprüfen wir!', ihr: 'überprüft!', Sie: 'überprüfen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_160',
        german: 'Meilenstein',
        english: 'milestone',
        wordType: 'noun', level: 'B1',
        description: 'A significant point in a project timeline marking a key achievement or deadline.',
        examples: [
          { german: 'Der erste Meilenstein ist die Fertigstellung des MVP.', english: 'The first milestone is the completion of the MVP.' },
          { german: 'Wir haben den Meilenstein pünktlich erreicht.', english: 'We reached the milestone on time.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Meilensteine',
          deklinationBestimmt:   { nominative: 'der Meilenstein',  akkusativ: 'den Meilenstein',  genitiv: 'des Meilensteins',  dativ: 'dem Meilenstein' },
          deklinationUnbestimmt: { nominative: 'ein Meilenstein', akkusativ: 'einen Meilenstein', genitiv: 'eines Meilensteins', dativ: 'einem Meilenstein' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_161',
        german: 'bereitstellen',
        english: 'to deploy / to provide',
        wordType: 'verb', level: 'B1',
        description: 'To make software available in an environment, especially production.',
        examples: [
          { german: 'Wir stellen das Update heute Abend bereit.', english: 'We deploy the update tonight.' },
          { german: 'Die Anwendung wurde erfolgreich bereitgestellt.', english: 'The application was deployed successfully.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'stelle bereit',  du: 'stellst bereit',  erSieEs: 'stellt bereit',  wir: 'stellen bereit',  ihr: 'stellt bereit',  sie: 'stellen bereit' },
          simplePast:  { ich: 'stellte bereit', du: 'stelltest bereit', erSieEs: 'stellte bereit', wir: 'stellten bereit', ihr: 'stelltet bereit', sie: 'stellten bereit' },
          pastPerfect: { ich: 'habe bereitgestellt', du: 'hast bereitgestellt', erSieEs: 'hat bereitgestellt', wir: 'haben bereitgestellt', ihr: 'habt bereitgestellt', sie: 'haben bereitgestellt' },
          future:      { ich: 'werde bereitstellen', du: 'wirst bereitstellen', erSieEs: 'wird bereitstellen', wir: 'werden bereitstellen', ihr: 'werdet bereitstellen', sie: 'werden bereitstellen' },
          imperative:  { du: 'stelle bereit!', wir: 'stellen wir bereit!', ihr: 'stellt bereit!', Sie: 'stellen Sie bereit!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_162',
        german: 'Dokumentation',
        english: 'documentation',
        wordType: 'noun', level: 'B1',
        description: 'Written material explaining how a system or code works.',
        examples: [
          { german: 'Die Dokumentation muss vor dem Release aktualisiert werden.', english: 'The documentation must be updated before the release.' },
          { german: 'Gute Dokumentation erleichtert die Wartung.', english: 'Good documentation makes maintenance easier.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Dokumentationen',
          deklinationBestimmt:   { nominative: 'die Dokumentation',  akkusativ: 'die Dokumentation',  genitiv: 'der Dokumentation',  dativ: 'der Dokumentation' },
          deklinationUnbestimmt: { nominative: 'eine Dokumentation', akkusativ: 'eine Dokumentation', genitiv: 'einer Dokumentation', dativ: 'einer Dokumentation' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_163',
        german: 'implementieren',
        english: 'to implement',
        wordType: 'verb', level: 'B2',
        description: 'To put a plan, feature, or algorithm into code.',
        examples: [
          { german: 'Wir implementieren die neue Funktion im nächsten Sprint.', english: 'We implement the new feature in the next sprint.' },
          { german: 'Der Algorithmus wurde effizient implementiert.', english: 'The algorithm was implemented efficiently.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'implementiere',  du: 'implementierst',  erSieEs: 'implementiert',  wir: 'implementieren',  ihr: 'implementiert',  sie: 'implementieren' },
          simplePast:  { ich: 'implementierte', du: 'implementiertest', erSieEs: 'implementierte', wir: 'implementierten', ihr: 'implementiertet', sie: 'implementierten' },
          pastPerfect: { ich: 'habe implementiert', du: 'hast implementiert', erSieEs: 'hat implementiert', wir: 'haben implementiert', ihr: 'habt implementiert', sie: 'haben implementiert' },
          future:      { ich: 'werde implementieren', du: 'wirst implementieren', erSieEs: 'wird implementieren', wir: 'werden implementieren', ihr: 'werdet implementieren', sie: 'werden implementieren' },
          imperative:  { du: 'implementiere!', wir: 'implementieren wir!', ihr: 'implementiert!', Sie: 'implementieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_164',
        german: 'Schnittstelle',
        english: 'interface / API',
        wordType: 'noun', level: 'B2',
        description: 'A point of interaction between software components or systems.',
        examples: [
          { german: 'Die Schnittstelle zwischen Frontend und Backend muss definiert werden.', english: 'The interface between frontend and backend must be defined.' },
          { german: 'Wir nutzen eine REST-Schnittstelle.', english: 'We use a REST interface.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Schnittstellen',
          deklinationBestimmt:   { nominative: 'die Schnittstelle',  akkusativ: 'die Schnittstelle',  genitiv: 'der Schnittstelle',  dativ: 'der Schnittstelle' },
          deklinationUnbestimmt: { nominative: 'eine Schnittstelle', akkusativ: 'eine Schnittstelle', genitiv: 'einer Schnittstelle', dativ: 'einer Schnittstelle' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_165',
        german: 'agil',
        english: 'agile',
        wordType: 'adjective', level: 'B1',
        description: 'Relating to an iterative software development approach with flexible, collaborative teams.',
        examples: [
          { german: 'Wir arbeiten nach einem agilen Prozess.', english: 'We work according to an agile process.' },
          { german: 'Agile Methoden helfen beim schnellen Reagieren auf Änderungen.', english: 'Agile methods help with responding quickly to changes.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'agiler', superlativ: 'am agilsten',
          deklinationMaskulin: { nominative: 'agiler', akkusativ: 'agilen', genitiv: 'agilen', dativ: 'agilem' },
          deklinationFeminin:  { nominative: 'agile',  akkusativ: 'agile',  genitiv: 'agiler', dativ: 'agiler' },
          deklinationNeutral:  { nominative: 'agiles', akkusativ: 'agiles', genitiv: 'agilen', dativ: 'agilem' },
          deklinationPlurar:   { nominative: 'agile',  akkusativ: 'agile',  genitiv: 'agiler', dativ: 'agilen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_166',
        german: 'priorisieren',
        english: 'to prioritise',
        wordType: 'verb', level: 'B2',
        description: 'To rank tasks or features by importance and urgency.',
        examples: [
          { german: 'Der Product Owner priorisiert das Backlog.', english: 'The Product Owner prioritises the backlog.' },
          { german: 'Wir müssen die Bugs vor neuen Features priorisieren.', english: 'We must prioritise bugs over new features.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'priorisiere',  du: 'priorisierst',  erSieEs: 'priorisiert',  wir: 'priorisieren',  ihr: 'priorisiert',  sie: 'priorisieren' },
          simplePast:  { ich: 'priorisierte', du: 'priorisiertest', erSieEs: 'priorisierte', wir: 'priorisierten', ihr: 'priorisiertet', sie: 'priorisierten' },
          pastPerfect: { ich: 'habe priorisiert', du: 'hast priorisiert', erSieEs: 'hat priorisiert', wir: 'haben priorisiert', ihr: 'habt priorisiert', sie: 'haben priorisiert' },
          future:      { ich: 'werde priorisieren', du: 'wirst priorisieren', erSieEs: 'wird priorisieren', wir: 'werden priorisieren', ihr: 'werdet priorisieren', sie: 'werden priorisieren' },
          imperative:  { du: 'priorisiere!', wir: 'priorisieren wir!', ihr: 'priorisiert!', Sie: 'priorisieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_167',
        german: 'Abhängigkeit',
        english: 'dependency',
        wordType: 'noun', level: 'B2',
        description: 'A relationship where one component or task relies on another.',
        examples: [
          { german: 'Diese Aufgabe hat eine Abhängigkeit von dem anderen Team.', english: 'This task has a dependency on the other team.' },
          { german: 'Wir müssen alle Abhängigkeiten im Backlog markieren.', english: 'We must mark all dependencies in the backlog.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Abhängigkeiten',
          deklinationBestimmt:   { nominative: 'die Abhängigkeit',  akkusativ: 'die Abhängigkeit',  genitiv: 'der Abhängigkeit',  dativ: 'der Abhängigkeit' },
          deklinationUnbestimmt: { nominative: 'eine Abhängigkeit', akkusativ: 'eine Abhängigkeit', genitiv: 'einer Abhängigkeit', dativ: 'einer Abhängigkeit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_168',
        german: 'automatisieren',
        english: 'to automate',
        wordType: 'verb', level: 'B2',
        description: 'To make a process run automatically without manual intervention.',
        examples: [
          { german: 'Wir automatisieren die Tests mit einer CI-Pipeline.', english: 'We automate the tests with a CI pipeline.' },
          { german: 'Repetitive Aufgaben sollten automatisiert werden.', english: 'Repetitive tasks should be automated.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'automatisiere',  du: 'automatisierst',  erSieEs: 'automatisiert',  wir: 'automatisieren',  ihr: 'automatisiert',  sie: 'automatisieren' },
          simplePast:  { ich: 'automatisierte', du: 'automatisiertest', erSieEs: 'automatisierte', wir: 'automatisierten', ihr: 'automatisiertet', sie: 'automatisierten' },
          pastPerfect: { ich: 'habe automatisiert', du: 'hast automatisiert', erSieEs: 'hat automatisiert', wir: 'haben automatisiert', ihr: 'habt automatisiert', sie: 'haben automatisiert' },
          future:      { ich: 'werde automatisieren', du: 'wirst automatisieren', erSieEs: 'wird automatisieren', wir: 'werden automatisieren', ihr: 'werdet automatisieren', sie: 'werden automatisieren' },
          imperative:  { du: 'automatisiere!', wir: 'automatisieren wir!', ihr: 'automatisiert!', Sie: 'automatisieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_169',
        german: 'Ticket',
        english: 'ticket / issue',
        wordType: 'noun', level: 'A2',
        description: 'A tracked unit of work in an issue tracker such as Jira or GitLab.',
        examples: [
          { german: 'Erstelle bitte ein Ticket für diesen Bug.', english: 'Please create a ticket for this bug.' },
          { german: 'Welches Ticket bearbeitest du gerade?', english: 'Which ticket are you currently working on?' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Tickets',
          deklinationBestimmt:   { nominative: 'das Ticket',  akkusativ: 'das Ticket',  genitiv: 'des Tickets',  dativ: 'dem Ticket' },
          deklinationUnbestimmt: { nominative: 'ein Ticket', akkusativ: 'ein Ticket', genitiv: 'eines Tickets', dativ: 'einem Ticket' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_170',
        german: 'aktualisieren',
        english: 'to update',
        wordType: 'verb', level: 'B1',
        description: 'To bring something to the most recent version or state.',
        examples: [
          { german: 'Ich aktualisiere die Abhängigkeiten auf die neueste Version.', english: 'I am updating the dependencies to the latest version.' },
          { german: 'Bitte aktualisiere das Ticket mit dem aktuellen Status.', english: 'Please update the ticket with the current status.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'aktualisiere',  du: 'aktualisierst',  erSieEs: 'aktualisiert',  wir: 'aktualisieren',  ihr: 'aktualisiert',  sie: 'aktualisieren' },
          simplePast:  { ich: 'aktualisierte', du: 'aktualisiertest', erSieEs: 'aktualisierte', wir: 'aktualisierten', ihr: 'aktualisiertet', sie: 'aktualisierten' },
          pastPerfect: { ich: 'habe aktualisiert', du: 'hast aktualisiert', erSieEs: 'hat aktualisiert', wir: 'haben aktualisiert', ihr: 'habt aktualisiert', sie: 'haben aktualisiert' },
          future:      { ich: 'werde aktualisieren', du: 'wirst aktualisieren', erSieEs: 'wird aktualisieren', wir: 'werden aktualisieren', ihr: 'werdet aktualisieren', sie: 'werden aktualisieren' },
          imperative:  { du: 'aktualisiere!', wir: 'aktualisieren wir!', ihr: 'aktualisiert!', Sie: 'aktualisieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_171',
        german: 'Pipeline',
        english: 'pipeline',
        wordType: 'noun', level: 'B2',
        description: 'An automated sequence of stages (build, test, deploy) in CI/CD.',
        examples: [
          { german: 'Die Pipeline schlägt beim Testschritt fehl.', english: 'The pipeline fails at the test step.' },
          { german: 'Ein erfolgreicher Merge löst die Pipeline aus.', english: 'A successful merge triggers the pipeline.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Pipelines',
          deklinationBestimmt:   { nominative: 'die Pipeline',  akkusativ: 'die Pipeline',  genitiv: 'der Pipeline',  dativ: 'der Pipeline' },
          deklinationUnbestimmt: { nominative: 'eine Pipeline', akkusativ: 'eine Pipeline', genitiv: 'einer Pipeline', dativ: 'einer Pipeline' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_172',
        german: 'zusammenführen',
        english: 'to merge',
        wordType: 'verb', level: 'B2',
        description: 'To combine code branches in version control.',
        examples: [
          { german: 'Ich führe den Feature-Branch in den Hauptbranch zusammen.', english: 'I am merging the feature branch into the main branch.' },
          { german: 'Der Code wurde erfolgreich zusammengeführt.', english: 'The code was merged successfully.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'führe zusammen',  du: 'führst zusammen',  erSieEs: 'führt zusammen',  wir: 'führen zusammen',  ihr: 'führt zusammen',  sie: 'führen zusammen' },
          simplePast:  { ich: 'führte zusammen', du: 'führtest zusammen', erSieEs: 'führte zusammen', wir: 'führten zusammen', ihr: 'führtet zusammen', sie: 'führten zusammen' },
          pastPerfect: { ich: 'habe zusammengeführt', du: 'hast zusammengeführt', erSieEs: 'hat zusammengeführt', wir: 'haben zusammengeführt', ihr: 'habt zusammengeführt', sie: 'haben zusammengeführt' },
          future:      { ich: 'werde zusammenführen', du: 'wirst zusammenführen', erSieEs: 'wird zusammenführen', wir: 'werden zusammenführen', ihr: 'werdet zusammenführen', sie: 'werden zusammenführen' },
          imperative:  { du: 'führe zusammen!', wir: 'führen wir zusammen!', ihr: 'führt zusammen!', Sie: 'führen Sie zusammen!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_173',
        german: 'skalierbar',
        english: 'scalable',
        wordType: 'adjective', level: 'B2',
        description: 'Able to handle increased load or users without significant rework.',
        examples: [
          { german: 'Die Architektur muss skalierbar sein.', english: 'The architecture must be scalable.' },
          { german: 'Wir brauchen eine skalierbare Lösung für mehr Nutzer.', english: 'We need a scalable solution for more users.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'skalierbarer', superlativ: 'am skalierbarsten',
          deklinationMaskulin: { nominative: 'skalierbarer', akkusativ: 'skalierbaren', genitiv: 'skalierbaren', dativ: 'skalierbarem' },
          deklinationFeminin:  { nominative: 'skalierbare',  akkusativ: 'skalierbare',  genitiv: 'skalierbarer', dativ: 'skalierbarer' },
          deklinationNeutral:  { nominative: 'skalierbares', akkusativ: 'skalierbares', genitiv: 'skalierbaren', dativ: 'skalierbarem' },
          deklinationPlurar:   { nominative: 'skalierbare',  akkusativ: 'skalierbare',  genitiv: 'skalierbarer', dativ: 'skalierbaren' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_174',
        german: 'Anforderung',
        english: 'requirement',
        wordType: 'noun', level: 'B2',
        description: 'A documented condition or capability that a system or feature must fulfil.',
        examples: [
          { german: 'Die Anforderungen wurden vom Kunden definiert.', english: 'The requirements were defined by the customer.' },
          { german: 'Wir klären die Anforderungen im Refinement-Meeting.', english: 'We clarify the requirements in the refinement meeting.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Anforderungen',
          deklinationBestimmt:   { nominative: 'die Anforderung',  akkusativ: 'die Anforderung',  genitiv: 'der Anforderung',  dativ: 'der Anforderung' },
          deklinationUnbestimmt: { nominative: 'eine Anforderung', akkusativ: 'eine Anforderung', genitiv: 'einer Anforderung', dativ: 'einer Anforderung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_175',
        german: 'konfigurieren',
        english: 'to configure',
        wordType: 'verb', level: 'B2',
        description: 'To set up or adjust system parameters and settings.',
        examples: [
          { german: 'Ich konfiguriere den Webserver neu.', english: 'I am reconfiguring the web server.' },
          { german: 'Die Umgebungsvariablen müssen konfiguriert werden.', english: 'The environment variables must be configured.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'konfiguriere',  du: 'konfigurierst',  erSieEs: 'konfiguriert',  wir: 'konfigurieren',  ihr: 'konfiguriert',  sie: 'konfigurieren' },
          simplePast:  { ich: 'konfigurierte', du: 'konfiguriertest', erSieEs: 'konfigurierte', wir: 'konfigurierten', ihr: 'konfiguriertet', sie: 'konfigurierten' },
          pastPerfect: { ich: 'habe konfiguriert', du: 'hast konfiguriert', erSieEs: 'hat konfiguriert', wir: 'haben konfiguriert', ihr: 'habt konfiguriert', sie: 'haben konfiguriert' },
          future:      { ich: 'werde konfigurieren', du: 'wirst konfigurieren', erSieEs: 'wird konfigurieren', wir: 'werden konfigurieren', ihr: 'werdet konfigurieren', sie: 'werden konfigurieren' },
          imperative:  { du: 'konfiguriere!', wir: 'konfigurieren wir!', ihr: 'konfiguriert!', Sie: 'konfigurieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_176',
        german: 'Hindernis',
        english: 'impediment / blocker',
        wordType: 'noun', level: 'B2',
        description: 'An obstacle preventing a team from progressing, raised in the daily stand-up.',
        examples: [
          { german: 'Gibt es heute ein Hindernis, das ich lösen kann?', english: 'Is there a blocker today that I can resolve?' },
          { german: 'Das Hindernis wurde vom Scrum Master beseitigt.', english: 'The impediment was removed by the Scrum Master.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Hindernisse',
          deklinationBestimmt:   { nominative: 'das Hindernis',  akkusativ: 'das Hindernis',  genitiv: 'des Hindernisses',  dativ: 'dem Hindernis' },
          deklinationUnbestimmt: { nominative: 'ein Hindernis', akkusativ: 'ein Hindernis', genitiv: 'eines Hindernisses', dativ: 'einem Hindernis' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_177',
        german: 'fehlerhaft',
        english: 'buggy / faulty',
        wordType: 'adjective', level: 'B1',
        description: 'Containing errors or defects; not working correctly.',
        examples: [
          { german: 'Der fehlerhafte Code muss sofort behoben werden.', english: 'The buggy code must be fixed immediately.' },
          { german: 'Das Release war fehlerhaft und wurde zurückgezogen.', english: 'The release was faulty and was rolled back.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'fehlerhafter', superlativ: 'am fehlerhaftesten',
          deklinationMaskulin: { nominative: 'fehlerhafter', akkusativ: 'fehlerhaften', genitiv: 'fehlerhaften', dativ: 'fehlerhaftem' },
          deklinationFeminin:  { nominative: 'fehlerhafte',  akkusativ: 'fehlerhafte',  genitiv: 'fehlerhafter', dativ: 'fehlerhafter' },
          deklinationNeutral:  { nominative: 'fehlerhaftes', akkusativ: 'fehlerhaftes', genitiv: 'fehlerhaften', dativ: 'fehlerhaftem' },
          deklinationPlurar:   { nominative: 'fehlerhafte',  akkusativ: 'fehlerhafte',  genitiv: 'fehlerhafter', dativ: 'fehlerhaften' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_178',
        german: 'Repository',
        english: 'repository / repo',
        wordType: 'noun', level: 'B1',
        description: 'A storage location for source code, managed by version control (e.g. Git).',
        examples: [
          { german: 'Bitte klone das Repository auf deinen Rechner.', english: 'Please clone the repository to your machine.' },
          { german: 'Das Repository liegt auf GitHub.', english: 'The repository is hosted on GitHub.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Repositories',
          deklinationBestimmt:   { nominative: 'das Repository',  akkusativ: 'das Repository',  genitiv: 'des Repositorys',  dativ: 'dem Repository' },
          deklinationUnbestimmt: { nominative: 'ein Repository', akkusativ: 'ein Repository', genitiv: 'eines Repositorys', dativ: 'einem Repository' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_179',
        german: 'veröffentlichen',
        english: 'to release / to publish',
        wordType: 'verb', level: 'B1',
        description: 'To make a software version available to users.',
        examples: [
          { german: 'Wir veröffentlichen Version 2.0 nächste Woche.', english: 'We release version 2.0 next week.' },
          { german: 'Das Update wurde erfolgreich veröffentlicht.', english: 'The update was released successfully.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'veröffentliche',  du: 'veröffentlichst',  erSieEs: 'veröffentlicht',  wir: 'veröffentlichen',  ihr: 'veröffentlicht',  sie: 'veröffentlichen' },
          simplePast:  { ich: 'veröffentlichte', du: 'veröffentlichtest', erSieEs: 'veröffentlichte', wir: 'veröffentlichten', ihr: 'veröffentlichtet', sie: 'veröffentlichten' },
          pastPerfect: { ich: 'habe veröffentlicht', du: 'hast veröffentlicht', erSieEs: 'hat veröffentlicht', wir: 'haben veröffentlicht', ihr: 'habt veröffentlicht', sie: 'haben veröffentlicht' },
          future:      { ich: 'werde veröffentlichen', du: 'wirst veröffentlichen', erSieEs: 'wird veröffentlichen', wir: 'werden veröffentlichen', ihr: 'werdet veröffentlichen', sie: 'werden veröffentlichen' },
          imperative:  { du: 'veröffentliche!', wir: 'veröffentlichen wir!', ihr: 'veröffentlicht!', Sie: 'veröffentlichen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_180',
        german: 'Versionsverwaltung',
        english: 'version control',
        wordType: 'noun', level: 'B2',
        description: 'A system that records changes to files over time (e.g. Git).',
        examples: [
          { german: 'Git ist das am weitesten verbreitete Versionsverwaltungssystem.', english: 'Git is the most widely used version control system.' },
          { german: 'Ohne Versionsverwaltung ist die Zusammenarbeit schwierig.', english: 'Without version control, collaboration is difficult.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Versionsverwaltungen',
          deklinationBestimmt:   { nominative: 'die Versionsverwaltung',  akkusativ: 'die Versionsverwaltung',  genitiv: 'der Versionsverwaltung',  dativ: 'der Versionsverwaltung' },
          deklinationUnbestimmt: { nominative: 'eine Versionsverwaltung', akkusativ: 'eine Versionsverwaltung', genitiv: 'einer Versionsverwaltung', dativ: 'einer Versionsverwaltung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_181',
        german: 'integrieren',
        english: 'to integrate',
        wordType: 'verb', level: 'B2',
        description: 'To combine separate code changes or systems into a unified whole.',
        examples: [
          { german: 'Wir integrieren den neuen Service in die bestehende Architektur.', english: 'We integrate the new service into the existing architecture.' },
          { german: 'Änderungen werden täglich integriert.', english: 'Changes are integrated daily.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'integriere',  du: 'integrierst',  erSieEs: 'integriert',  wir: 'integrieren',  ihr: 'integriert',  sie: 'integrieren' },
          simplePast:  { ich: 'integrierte', du: 'integriertest', erSieEs: 'integrierte', wir: 'integrierten', ihr: 'integriertet', sie: 'integrierten' },
          pastPerfect: { ich: 'habe integriert', du: 'hast integriert', erSieEs: 'hat integriert', wir: 'haben integriert', ihr: 'habt integriert', sie: 'haben integriert' },
          future:      { ich: 'werde integrieren', du: 'wirst integrieren', erSieEs: 'wird integrieren', wir: 'werden integrieren', ihr: 'werdet integrieren', sie: 'werden integrieren' },
          imperative:  { du: 'integriere!', wir: 'integrieren wir!', ihr: 'integriert!', Sie: 'integrieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_182',
        german: 'Testabdeckung',
        english: 'test coverage',
        wordType: 'noun', level: 'B2',
        description: 'The percentage of code exercised by automated tests.',
        examples: [
          { german: 'Unsere Testabdeckung liegt bei 85 Prozent.', english: 'Our test coverage is 85 percent.' },
          { german: 'Wir müssen die Testabdeckung für kritische Module erhöhen.', english: 'We need to increase test coverage for critical modules.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Testabdeckungen',
          deklinationBestimmt:   { nominative: 'die Testabdeckung',  akkusativ: 'die Testabdeckung',  genitiv: 'der Testabdeckung',  dativ: 'der Testabdeckung' },
          deklinationUnbestimmt: { nominative: 'eine Testabdeckung', akkusativ: 'eine Testabdeckung', genitiv: 'einer Testabdeckung', dativ: 'einer Testabdeckung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_183',
        german: 'refaktorieren',
        english: 'to refactor',
        wordType: 'verb', level: 'B2',
        description: 'To restructure existing code without changing its external behaviour.',
        examples: [
          { german: 'Wir müssen diesen Bereich refaktorieren, bevor wir fortfahren.', english: 'We need to refactor this area before we continue.' },
          { german: 'Der Code wurde refaktoriert, um die Lesbarkeit zu verbessern.', english: 'The code was refactored to improve readability.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'refaktoriere',  du: 'refaktorierst',  erSieEs: 'refaktoriert',  wir: 'refaktorieren',  ihr: 'refaktoriert',  sie: 'refaktorieren' },
          simplePast:  { ich: 'refaktorierte', du: 'refaktoriertest', erSieEs: 'refaktorierte', wir: 'refaktorierten', ihr: 'refaktoriertet', sie: 'refaktorierten' },
          pastPerfect: { ich: 'habe refaktoriert', du: 'hast refaktoriert', erSieEs: 'hat refaktoriert', wir: 'haben refaktoriert', ihr: 'habt refaktoriert', sie: 'haben refaktoriert' },
          future:      { ich: 'werde refaktorieren', du: 'wirst refaktorieren', erSieEs: 'wird refaktorieren', wir: 'werden refaktorieren', ihr: 'werdet refaktorieren', sie: 'werden refaktorieren' },
          imperative:  { du: 'refaktoriere!', wir: 'refaktorieren wir!', ihr: 'refaktoriert!', Sie: 'refaktorieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_184',
        german: 'Kapazität',
        english: 'capacity',
        wordType: 'noun', level: 'B2',
        description: 'The amount of work a team can handle in a given time period.',
        examples: [
          { german: 'Unsere Kapazität im nächsten Sprint ist reduziert.', english: 'Our capacity in the next sprint is reduced.' },
          { german: 'Wir planen gemäß unserer verfügbaren Kapazität.', english: 'We plan according to our available capacity.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Kapazitäten',
          deklinationBestimmt:   { nominative: 'die Kapazität',  akkusativ: 'die Kapazität',  genitiv: 'der Kapazität',  dativ: 'der Kapazität' },
          deklinationUnbestimmt: { nominative: 'eine Kapazität', akkusativ: 'eine Kapazität', genitiv: 'einer Kapazität', dativ: 'einer Kapazität' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_185',
        german: 'kritisch',
        english: 'critical',
        wordType: 'adjective', level: 'B1',
        description: 'Of the highest importance; a failure would have severe consequences.',
        examples: [
          { german: 'Das ist ein kritischer Bug in der Produktion.', english: 'This is a critical bug in production.' },
          { german: 'Der kritische Pfad bestimmt die Projektdauer.', english: 'The critical path determines the project duration.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kritischer', superlativ: 'am kritischsten',
          deklinationMaskulin: { nominative: 'kritischer', akkusativ: 'kritischen', genitiv: 'kritischen', dativ: 'kritischem' },
          deklinationFeminin:  { nominative: 'kritische',  akkusativ: 'kritische',  genitiv: 'kritischer', dativ: 'kritischer' },
          deklinationNeutral:  { nominative: 'kritisches', akkusativ: 'kritisches', genitiv: 'kritischen', dativ: 'kritischem' },
          deklinationPlurar:   { nominative: 'kritische',  akkusativ: 'kritische',  genitiv: 'kritischer', dativ: 'kritischen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_186',
        german: 'Engpass',
        english: 'bottleneck',
        wordType: 'noun', level: 'B2',
        description: 'A stage in a process that reduces overall throughput or speed.',
        examples: [
          { german: 'Der Engpass liegt beim Code-Review-Prozess.', english: 'The bottleneck is in the code review process.' },
          { german: 'Wir müssen den Engpass in der Pipeline beseitigen.', english: 'We need to eliminate the bottleneck in the pipeline.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Engpässe',
          deklinationBestimmt:   { nominative: 'der Engpass',  akkusativ: 'den Engpass',  genitiv: 'des Engpasses',  dativ: 'dem Engpass' },
          deklinationUnbestimmt: { nominative: 'ein Engpass', akkusativ: 'einen Engpass', genitiv: 'eines Engpasses', dativ: 'einem Engpass' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_187',
        german: 'kontinuierlich',
        english: 'continuous / continuously',
        wordType: 'adverb', level: 'B2',
        description: 'Without interruption; used in CI/CD (Continuous Integration / Continuous Delivery).',
        examples: [
          { german: 'Wir liefern kontinuierlich neue Features aus.', english: 'We continuously deliver new features.' },
          { german: 'Kontinuierliche Integration verhindert Integrationsprobleme.', english: 'Continuous integration prevents integration problems.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_188',
        german: 'dokumentieren',
        english: 'to document',
        wordType: 'verb', level: 'B1',
        description: 'To record information about a system, API, or process in written form.',
        examples: [
          { german: 'Bitte dokumentiere deine Änderungen im Changelog.', english: 'Please document your changes in the changelog.' },
          { german: 'Der Code ist gut dokumentiert.', english: 'The code is well documented.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'dokumentiere',  du: 'dokumentierst',  erSieEs: 'dokumentiert',  wir: 'dokumentieren',  ihr: 'dokumentiert',  sie: 'dokumentieren' },
          simplePast:  { ich: 'dokumentierte', du: 'dokumentiertest', erSieEs: 'dokumentierte', wir: 'dokumentierten', ihr: 'dokumentiertet', sie: 'dokumentierten' },
          pastPerfect: { ich: 'habe dokumentiert', du: 'hast dokumentiert', erSieEs: 'hat dokumentiert', wir: 'haben dokumentiert', ihr: 'habt dokumentiert', sie: 'haben dokumentiert' },
          future:      { ich: 'werde dokumentieren', du: 'wirst dokumentieren', erSieEs: 'wird dokumentieren', wir: 'werden dokumentieren', ihr: 'werdet dokumentieren', sie: 'werden dokumentieren' },
          imperative:  { du: 'dokumentiere!', wir: 'dokumentieren wir!', ihr: 'dokumentiert!', Sie: 'dokumentieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_189',
        german: 'Iteration',
        english: 'iteration',
        wordType: 'noun', level: 'B2',
        description: 'One cycle of a repeating development process; equivalent to a sprint.',
        examples: [
          { german: 'In jeder Iteration liefern wir etwas Funktionierendes aus.', english: 'In every iteration we deliver something working.' },
          { german: 'Die dritte Iteration war die erfolgreichste.', english: 'The third iteration was the most successful.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Iterationen',
          deklinationBestimmt:   { nominative: 'die Iteration',  akkusativ: 'die Iteration',  genitiv: 'der Iteration',  dativ: 'der Iteration' },
          deklinationUnbestimmt: { nominative: 'eine Iteration', akkusativ: 'eine Iteration', genitiv: 'einer Iteration', dativ: 'einer Iteration' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_190',
        german: 'abschließen',
        english: 'to complete / to close',
        wordType: 'verb', level: 'B1',
        description: 'To finish a task or ticket and mark it as done.',
        examples: [
          { german: 'Ich schließe das Ticket nach dem Review ab.', english: 'I close the ticket after the review.' },
          { german: 'Haben wir alle Aufgaben des Sprints abgeschlossen?', english: 'Have we completed all tasks of the sprint?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: true, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'schließe ab',  du: 'schließt ab',  erSieEs: 'schließt ab',  wir: 'schließen ab',  ihr: 'schließt ab',  sie: 'schließen ab' },
          simplePast:  { ich: 'schloss ab',   du: 'schlosst ab',  erSieEs: 'schloss ab',   wir: 'schlossen ab',  ihr: 'schlosst ab',  sie: 'schlossen ab' },
          pastPerfect: { ich: 'habe abgeschlossen', du: 'hast abgeschlossen', erSieEs: 'hat abgeschlossen', wir: 'haben abgeschlossen', ihr: 'habt abgeschlossen', sie: 'haben abgeschlossen' },
          future:      { ich: 'werde abschließen', du: 'wirst abschließen', erSieEs: 'wird abschließen', wir: 'werden abschließen', ihr: 'werdet abschließen', sie: 'werden abschließen' },
          imperative:  { du: 'schließe ab!', wir: 'schließen wir ab!', ihr: 'schließt ab!', Sie: 'schließen Sie ab!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_191',
        german: 'Entwicklungsumgebung',
        english: 'development environment',
        wordType: 'noun', level: 'B2',
        description: 'The set of tools, configurations, and infrastructure used to write and test code locally.',
        examples: [
          { german: 'Meine Entwicklungsumgebung ist Docker-basiert.', english: 'My development environment is Docker-based.' },
          { german: 'Richtet bitte eure Entwicklungsumgebung vor dem Workshop ein.', english: 'Please set up your development environment before the workshop.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Entwicklungsumgebungen',
          deklinationBestimmt:   { nominative: 'die Entwicklungsumgebung',  akkusativ: 'die Entwicklungsumgebung',  genitiv: 'der Entwicklungsumgebung',  dativ: 'der Entwicklungsumgebung' },
          deklinationUnbestimmt: { nominative: 'eine Entwicklungsumgebung', akkusativ: 'eine Entwicklungsumgebung', genitiv: 'einer Entwicklungsumgebung', dativ: 'einer Entwicklungsumgebung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_192',
        german: 'wartbar',
        english: 'maintainable',
        wordType: 'adjective', level: 'B2',
        description: 'Easy to understand, modify, and keep in good working order.',
        examples: [
          { german: 'Sauberer Code ist leicht wartbar.', english: 'Clean code is easily maintainable.' },
          { german: 'Wir schreiben wartbaren Code, damit Änderungen einfach sind.', english: 'We write maintainable code so that changes are easy.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'wartbarer', superlativ: 'am wartbarsten',
          deklinationMaskulin: { nominative: 'wartbarer', akkusativ: 'wartbaren', genitiv: 'wartbaren', dativ: 'wartbarem' },
          deklinationFeminin:  { nominative: 'wartbare',  akkusativ: 'wartbare',  genitiv: 'wartbarer', dativ: 'wartbarer' },
          deklinationNeutral:  { nominative: 'wartbares', akkusativ: 'wartbares', genitiv: 'wartbaren', dativ: 'wartbarem' },
          deklinationPlurar:   { nominative: 'wartbare',  akkusativ: 'wartbare',  genitiv: 'wartbarer', dativ: 'wartbaren' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_193',
        german: 'Abnahme',
        english: 'acceptance / sign-off',
        wordType: 'noun', level: 'B1',
        description: 'Formal confirmation that a feature or deliverable meets the agreed criteria.',
        examples: [
          { german: 'Die Abnahme erfolgt durch den Product Owner.', english: 'The sign-off is done by the Product Owner.' },
          { german: 'Ohne Abnahme kann das Feature nicht deployt werden.', english: 'Without acceptance the feature cannot be deployed.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Abnahmen',
          deklinationBestimmt:   { nominative: 'die Abnahme',  akkusativ: 'die Abnahme',  genitiv: 'der Abnahme',  dativ: 'der Abnahme' },
          deklinationUnbestimmt: { nominative: 'eine Abnahme', akkusativ: 'eine Abnahme', genitiv: 'einer Abnahme', dativ: 'einer Abnahme' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_194',
        german: 'skalieren',
        english: 'to scale',
        wordType: 'verb', level: 'B2',
        description: 'To increase or decrease the capacity of a system to handle load.',
        examples: [
          { german: 'Wir skalieren den Service auf zehn Instanzen.', english: 'We scale the service to ten instances.' },
          { german: 'Die Anwendung skaliert automatisch bei hoher Last.', english: 'The application scales automatically under high load.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'skaliere',  du: 'skalierst',  erSieEs: 'skaliert',  wir: 'skalieren',  ihr: 'skaliert',  sie: 'skalieren' },
          simplePast:  { ich: 'skalierte', du: 'skaliertest', erSieEs: 'skalierte', wir: 'skalierten', ihr: 'skaliertet', sie: 'skalierten' },
          pastPerfect: { ich: 'habe skaliert', du: 'hast skaliert', erSieEs: 'hat skaliert', wir: 'haben skaliert', ihr: 'habt skaliert', sie: 'haben skaliert' },
          future:      { ich: 'werde skalieren', du: 'wirst skalieren', erSieEs: 'wird skalieren', wir: 'werden skalieren', ihr: 'werdet skalieren', sie: 'werden skalieren' },
          imperative:  { du: 'skaliere!', wir: 'skalieren wir!', ihr: 'skaliert!', Sie: 'skalieren Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_195',
        german: 'ausstehend',
        english: 'pending / outstanding',
        wordType: 'adjective', level: 'B1',
        description: 'Not yet done or resolved; waiting to be addressed.',
        examples: [
          { german: 'Es gibt noch drei ausstehende Tickets.', english: 'There are still three pending tickets.' },
          { german: 'Die ausstehenden Aufgaben müssen vor dem Release erledigt sein.', english: 'The outstanding tasks must be completed before the release.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'ausstehender', superlativ: 'am ausstehendsten',
          deklinationMaskulin: { nominative: 'ausstehender', akkusativ: 'ausstehenden', genitiv: 'ausstehenden', dativ: 'ausstehendem' },
          deklinationFeminin:  { nominative: 'ausstehende',  akkusativ: 'ausstehende',  genitiv: 'ausstehender', dativ: 'ausstehender' },
          deklinationNeutral:  { nominative: 'ausstehendes', akkusativ: 'ausstehendes', genitiv: 'ausstehenden', dativ: 'ausstehendem' },
          deklinationPlurar:   { nominative: 'ausstehende',  akkusativ: 'ausstehende',  genitiv: 'ausstehender', dativ: 'ausstehenden' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_196',
        german: 'Protokoll',
        english: 'log / protocol / minutes',
        wordType: 'noun', level: 'B1',
        description: 'A record of events, decisions, or system output (meeting minutes or application log).',
        examples: [
          { german: 'Das Protokoll zeigt den Fehler um 03:42 Uhr.', english: 'The log shows the error at 03:42.' },
          { german: 'Bitte schreibe das Protokoll des Meetings.', english: 'Please write the minutes of the meeting.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Protokolle',
          deklinationBestimmt:   { nominative: 'das Protokoll',  akkusativ: 'das Protokoll',  genitiv: 'des Protokolls',  dativ: 'dem Protokoll' },
          deklinationUnbestimmt: { nominative: 'ein Protokoll', akkusativ: 'ein Protokoll', genitiv: 'eines Protokolls', dativ: 'einem Protokoll' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_197',
        german: 'inkrementell',
        english: 'incremental',
        wordType: 'adverb', level: 'B2',
        description: 'Proceeding step by step, adding small pieces of value each iteration.',
        examples: [
          { german: 'Wir entwickeln das Produkt inkrementell.', english: 'We develop the product incrementally.' },
          { german: 'Inkrementelle Lieferung reduziert das Risiko.', english: 'Incremental delivery reduces risk.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_198',
        german: 'Abweichung',
        english: 'deviation / variance',
        wordType: 'noun', level: 'B2',
        description: 'A difference between the planned and actual state of a project.',
        examples: [
          { german: 'Es gibt eine Abweichung vom ursprünglichen Plan.', english: 'There is a deviation from the original plan.' },
          { german: 'Die Abweichung muss im nächsten Sprint-Review besprochen werden.', english: 'The variance must be discussed in the next sprint review.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Abweichungen',
          deklinationBestimmt:   { nominative: 'die Abweichung',  akkusativ: 'die Abweichung',  genitiv: 'der Abweichung',  dativ: 'der Abweichung' },
          deklinationUnbestimmt: { nominative: 'eine Abweichung', akkusativ: 'eine Abweichung', genitiv: 'einer Abweichung', dativ: 'einer Abweichung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_199',
        german: 'überwachen',
        english: 'to monitor',
        wordType: 'verb', level: 'B2',
        description: 'To observe and check system performance, errors, and metrics in real time.',
        examples: [
          { german: 'Wir überwachen die Server rund um die Uhr.', english: 'We monitor the servers around the clock.' },
          { german: 'Die Pipeline wird automatisch überwacht.', english: 'The pipeline is monitored automatically.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'überwache',  du: 'überwachst',  erSieEs: 'überwacht',  wir: 'überwachen',  ihr: 'überwacht',  sie: 'überwachen' },
          simplePast:  { ich: 'überwachte', du: 'überwachtest', erSieEs: 'überwachte', wir: 'überwachten', ihr: 'überwachtet', sie: 'überwachten' },
          pastPerfect: { ich: 'habe überwacht', du: 'hast überwacht', erSieEs: 'hat überwacht', wir: 'haben überwacht', ihr: 'habt überwacht', sie: 'haben überwacht' },
          future:      { ich: 'werde überwachen', du: 'wirst überwachen', erSieEs: 'wird überwachen', wir: 'werden überwachen', ihr: 'werdet überwachen', sie: 'werden überwachen' },
          imperative:  { du: 'überwache!', wir: 'überwachen wir!', ihr: 'überwacht!', Sie: 'überwachen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_200',
        german: 'Abnahmekriterium',
        english: 'acceptance criterion',
        wordType: 'noun', level: 'B2',
        description: 'A condition a user story must meet to be accepted by the Product Owner.',
        examples: [
          { german: 'Das Abnahmekriterium muss vor dem Sprint definiert werden.', english: 'The acceptance criterion must be defined before the sprint.' },
          { german: 'Alle Abnahmekriterien wurden erfüllt.', english: 'All acceptance criteria have been met.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Abnahmekriterien',
          deklinationBestimmt:   { nominative: 'das Abnahmekriterium',  akkusativ: 'das Abnahmekriterium',  genitiv: 'des Abnahmekriteriums',  dativ: 'dem Abnahmekriterium' },
          deklinationUnbestimmt: { nominative: 'ein Abnahmekriterium', akkusativ: 'ein Abnahmekriterium', genitiv: 'eines Abnahmekriteriums', dativ: 'einem Abnahmekriterium' }
        },
        createdAt: now, updatedAt: now
      },
      // ── General vocabularies 201–250 ────────────────────────────────────────
      {
        _id: 'vocab_sample_201',
        german: 'Fenster',
        english: 'window',
        wordType: 'noun', level: 'A1',
        description: 'An opening in a wall or vehicle fitted with glass to let in light.',
        examples: [
          { german: 'Bitte mach das Fenster auf.', english: 'Please open the window.' },
          { german: 'Das Fenster ist schmutzig.', english: 'The window is dirty.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Fenster',
          deklinationBestimmt:   { nominative: 'das Fenster',  akkusativ: 'das Fenster',  genitiv: 'des Fensters',  dativ: 'dem Fenster' },
          deklinationUnbestimmt: { nominative: 'ein Fenster', akkusativ: 'ein Fenster', genitiv: 'eines Fensters', dativ: 'einem Fenster' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_202',
        german: 'Tür',
        english: 'door',
        wordType: 'noun', level: 'A1',
        description: 'A movable barrier used to open or close an entrance.',
        examples: [
          { german: 'Bitte schließ die Tür.', english: 'Please close the door.' },
          { german: 'Die Tür ist offen.', english: 'The door is open.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Türen',
          deklinationBestimmt:   { nominative: 'die Tür',  akkusativ: 'die Tür',  genitiv: 'der Tür',  dativ: 'der Tür' },
          deklinationUnbestimmt: { nominative: 'eine Tür', akkusativ: 'eine Tür', genitiv: 'einer Tür', dativ: 'einer Tür' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_203',
        german: 'Straße',
        english: 'street / road',
        wordType: 'noun', level: 'A1',
        description: 'A public road in a city or town.',
        examples: [
          { german: 'Die Straße ist sehr laut.', english: 'The street is very loud.' },
          { german: 'Ich wohne in einer ruhigen Straße.', english: 'I live on a quiet street.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Straßen',
          deklinationBestimmt:   { nominative: 'die Straße',  akkusativ: 'die Straße',  genitiv: 'der Straße',  dativ: 'der Straße' },
          deklinationUnbestimmt: { nominative: 'eine Straße', akkusativ: 'eine Straße', genitiv: 'einer Straße', dativ: 'einer Straße' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_204',
        german: 'kaufen',
        english: 'to buy',
        wordType: 'verb', level: 'A1',
        description: 'To obtain something by paying money for it.',
        examples: [
          { german: 'Ich möchte ein neues Buch kaufen.', english: 'I would like to buy a new book.' },
          { german: 'Hast du das schon gekauft?', english: 'Have you already bought that?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'kaufe',  du: 'kaufst',  erSieEs: 'kauft',  wir: 'kaufen',  ihr: 'kauft',  sie: 'kaufen' },
          simplePast:  { ich: 'kaufte', du: 'kauftest', erSieEs: 'kaufte', wir: 'kauften', ihr: 'kauftet', sie: 'kauften' },
          pastPerfect: { ich: 'habe gekauft', du: 'hast gekauft', erSieEs: 'hat gekauft', wir: 'haben gekauft', ihr: 'habt gekauft', sie: 'haben gekauft' },
          future:      { ich: 'werde kaufen', du: 'wirst kaufen', erSieEs: 'wird kaufen', wir: 'werden kaufen', ihr: 'werdet kaufen', sie: 'werden kaufen' },
          imperative:  { du: 'kauf!', wir: 'kaufen wir!', ihr: 'kauft!', Sie: 'kaufen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_205',
        german: 'verkaufen',
        english: 'to sell',
        wordType: 'verb', level: 'A2',
        description: 'To give something to someone in exchange for money.',
        examples: [
          { german: 'Er verkauft sein altes Auto.', english: 'He is selling his old car.' },
          { german: 'Das Haus wurde schnell verkauft.', english: 'The house was sold quickly.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'verkaufe',  du: 'verkaufst',  erSieEs: 'verkauft',  wir: 'verkaufen',  ihr: 'verkauft',  sie: 'verkaufen' },
          simplePast:  { ich: 'verkaufte', du: 'verkauftest', erSieEs: 'verkaufte', wir: 'verkauften', ihr: 'verkauftet', sie: 'verkauften' },
          pastPerfect: { ich: 'habe verkauft', du: 'hast verkauft', erSieEs: 'hat verkauft', wir: 'haben verkauft', ihr: 'habt verkauft', sie: 'haben verkauft' },
          future:      { ich: 'werde verkaufen', du: 'wirst verkaufen', erSieEs: 'wird verkaufen', wir: 'werden verkaufen', ihr: 'werdet verkaufen', sie: 'werden verkaufen' },
          imperative:  { du: 'verkauf!', wir: 'verkaufen wir!', ihr: 'verkauft!', Sie: 'verkaufen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_206',
        german: 'Preis',
        english: 'price',
        wordType: 'noun', level: 'A1',
        description: 'The amount of money required to buy something.',
        examples: [
          { german: 'Was kostet das? Wie ist der Preis?', english: 'What does it cost? What is the price?' },
          { german: 'Der Preis ist zu hoch.', english: 'The price is too high.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Preise',
          deklinationBestimmt:   { nominative: 'der Preis',  akkusativ: 'den Preis',  genitiv: 'des Preises',  dativ: 'dem Preis' },
          deklinationUnbestimmt: { nominative: 'ein Preis', akkusativ: 'einen Preis', genitiv: 'eines Preises', dativ: 'einem Preis' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_207',
        german: 'Geld',
        english: 'money',
        wordType: 'noun', level: 'A1',
        description: 'A medium of exchange used to buy goods and services.',
        examples: [
          { german: 'Ich habe kein Geld dabei.', english: 'I have no money with me.' },
          { german: 'Geld ist nicht alles.', english: 'Money is not everything.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Gelder',
          deklinationBestimmt:   { nominative: 'das Geld',  akkusativ: 'das Geld',  genitiv: 'des Geldes',  dativ: 'dem Geld' },
          deklinationUnbestimmt: { nominative: 'ein Geld', akkusativ: 'ein Geld', genitiv: 'eines Geldes', dativ: 'einem Geld' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_208',
        german: 'Uhr',
        english: 'clock / watch',
        wordType: 'noun', level: 'A1',
        description: 'A device used to measure and display time.',
        examples: [
          { german: 'Die Uhr hängt an der Wand.', english: 'The clock is hanging on the wall.' },
          { german: 'Wie viel Uhr ist es?', english: 'What time is it?' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Uhren',
          deklinationBestimmt:   { nominative: 'die Uhr',  akkusativ: 'die Uhr',  genitiv: 'der Uhr',  dativ: 'der Uhr' },
          deklinationUnbestimmt: { nominative: 'eine Uhr', akkusativ: 'eine Uhr', genitiv: 'einer Uhr', dativ: 'einer Uhr' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_209',
        german: 'beginnen',
        english: 'to begin / to start',
        wordType: 'verb', level: 'A2',
        description: 'To start doing something.',
        examples: [
          { german: 'Die Vorlesung beginnt um neun Uhr.', english: 'The lecture begins at nine o\'clock.' },
          { german: 'Wann beginnst du mit der Arbeit?', english: 'When do you begin work?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'beginne',  du: 'beginnst',  erSieEs: 'beginnt',  wir: 'beginnen',  ihr: 'beginnt',  sie: 'beginnen' },
          simplePast:  { ich: 'begann',   du: 'begannst',  erSieEs: 'begann',   wir: 'begannen',  ihr: 'begannt',  sie: 'begannen' },
          pastPerfect: { ich: 'habe begonnen', du: 'hast begonnen', erSieEs: 'hat begonnen', wir: 'haben begonnen', ihr: 'habt begonnen', sie: 'haben begonnen' },
          future:      { ich: 'werde beginnen', du: 'wirst beginnen', erSieEs: 'wird beginnen', wir: 'werden beginnen', ihr: 'werdet beginnen', sie: 'werden beginnen' },
          imperative:  { du: 'beginne!', wir: 'beginnen wir!', ihr: 'beginnt!', Sie: 'beginnen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_210',
        german: 'enden',
        english: 'to end / to finish',
        wordType: 'verb', level: 'A2',
        description: 'To come to a conclusion or stop.',
        examples: [
          { german: 'Der Film endet um Mitternacht.', english: 'The film ends at midnight.' },
          { german: 'Wann endet die Veranstaltung?', english: 'When does the event end?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'ende',  du: 'endest',  erSieEs: 'endet',  wir: 'enden',  ihr: 'endet',  sie: 'enden' },
          simplePast:  { ich: 'endete', du: 'endetest', erSieEs: 'endete', wir: 'endeten', ihr: 'endetet', sie: 'endeten' },
          pastPerfect: { ich: 'habe geendet', du: 'hast geendet', erSieEs: 'hat geendet', wir: 'haben geendet', ihr: 'habt geendet', sie: 'haben geendet' },
          future:      { ich: 'werde enden', du: 'wirst enden', erSieEs: 'wird enden', wir: 'werden enden', ihr: 'werdet enden', sie: 'werden enden' },
          imperative:  { du: 'ende!', wir: 'enden wir!', ihr: 'endet!', Sie: 'enden Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_211',
        german: 'Ziel',
        english: 'goal / destination',
        wordType: 'noun', level: 'A2',
        description: 'An aim or objective; also a destination when travelling.',
        examples: [
          { german: 'Mein Ziel ist es, Deutsch zu lernen.', english: 'My goal is to learn German.' },
          { german: 'Wir haben unser Ziel erreicht.', english: 'We have reached our goal.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Ziele',
          deklinationBestimmt:   { nominative: 'das Ziel',  akkusativ: 'das Ziel',  genitiv: 'des Ziels',  dativ: 'dem Ziel' },
          deklinationUnbestimmt: { nominative: 'ein Ziel', akkusativ: 'ein Ziel', genitiv: 'eines Ziels', dativ: 'einem Ziel' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_212',
        german: 'Weg',
        english: 'way / path',
        wordType: 'noun', level: 'A1',
        description: 'A route or path from one place to another.',
        examples: [
          { german: 'Kannst du mir den Weg erklären?', english: 'Can you explain the way to me?' },
          { german: 'Der Weg zum Bahnhof ist lang.', english: 'The way to the station is long.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Wege',
          deklinationBestimmt:   { nominative: 'der Weg',  akkusativ: 'den Weg',  genitiv: 'des Weges',  dativ: 'dem Weg' },
          deklinationUnbestimmt: { nominative: 'ein Weg', akkusativ: 'einen Weg', genitiv: 'eines Weges', dativ: 'einem Weg' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_213',
        german: 'stark',
        english: 'strong',
        wordType: 'adjective', level: 'A2',
        description: 'Having great physical power or intensity.',
        examples: [
          { german: 'Er ist sehr stark.', english: 'He is very strong.' },
          { german: 'Der Wind ist heute stark.', english: 'The wind is strong today.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'stärker', superlativ: 'am stärksten',
          deklinationMaskulin: { nominative: 'starker', akkusativ: 'starken', genitiv: 'starken', dativ: 'starkem' },
          deklinationFeminin:  { nominative: 'starke',  akkusativ: 'starke',  genitiv: 'starker', dativ: 'starker' },
          deklinationNeutral:  { nominative: 'starkes', akkusativ: 'starkes', genitiv: 'starken', dativ: 'starkem' },
          deklinationPlurar:   { nominative: 'starke',  akkusativ: 'starke',  genitiv: 'starker', dativ: 'starken' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_214',
        german: 'schwach',
        english: 'weak',
        wordType: 'adjective', level: 'A2',
        description: 'Lacking physical strength or intensity.',
        examples: [
          { german: 'Nach der Krankheit fühlte sie sich schwach.', english: 'After the illness she felt weak.' },
          { german: 'Das Signal ist schwach.', english: 'The signal is weak.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schwächer', superlativ: 'am schwächsten',
          deklinationMaskulin: { nominative: 'schwacher', akkusativ: 'schwachen', genitiv: 'schwachen', dativ: 'schwachem' },
          deklinationFeminin:  { nominative: 'schwache',  akkusativ: 'schwache',  genitiv: 'schwacher', dativ: 'schwacher' },
          deklinationNeutral:  { nominative: 'schwaches', akkusativ: 'schwaches', genitiv: 'schwachen', dativ: 'schwachem' },
          deklinationPlurar:   { nominative: 'schwache',  akkusativ: 'schwache',  genitiv: 'schwacher', dativ: 'schwachen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_215',
        german: 'schnell',
        english: 'fast / quick',
        wordType: 'adjective', level: 'A1',
        description: 'Moving or happening at high speed.',
        examples: [
          { german: 'Der Zug ist sehr schnell.', english: 'The train is very fast.' },
          { german: 'Sie ist eine schnelle Läuferin.', english: 'She is a fast runner.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schneller', superlativ: 'am schnellsten',
          deklinationMaskulin: { nominative: 'schneller', akkusativ: 'schnellen', genitiv: 'schnellen', dativ: 'schnellem' },
          deklinationFeminin:  { nominative: 'schnelle',  akkusativ: 'schnelle',  genitiv: 'schneller', dativ: 'schneller' },
          deklinationNeutral:  { nominative: 'schnelles', akkusativ: 'schnelles', genitiv: 'schnellen', dativ: 'schnellem' },
          deklinationPlurar:   { nominative: 'schnelle',  akkusativ: 'schnelle',  genitiv: 'schneller', dativ: 'schnellen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_216',
        german: 'langsam',
        english: 'slow',
        wordType: 'adjective', level: 'A1',
        description: 'Not moving or happening quickly.',
        examples: [
          { german: 'Das Auto fährt langsam.', english: 'The car is driving slowly.' },
          { german: 'Ich lerne langsam aber sicher.', english: 'I learn slowly but surely.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'langsamer', superlativ: 'am langsamsten',
          deklinationMaskulin: { nominative: 'langsamer', akkusativ: 'langsamen', genitiv: 'langsamen', dativ: 'langsamem' },
          deklinationFeminin:  { nominative: 'langsame',  akkusativ: 'langsame',  genitiv: 'langsamer', dativ: 'langsamer' },
          deklinationNeutral:  { nominative: 'langsames', akkusativ: 'langsames', genitiv: 'langsamen', dativ: 'langsamem' },
          deklinationPlurar:   { nominative: 'langsame',  akkusativ: 'langsame',  genitiv: 'langsamer', dativ: 'langsamen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_217',
        german: 'Freund',
        english: 'friend (male)',
        wordType: 'noun', level: 'A1',
        description: 'A person you know well and like.',
        examples: [
          { german: 'Er ist mein bester Freund.', english: 'He is my best friend.' },
          { german: 'Ich treffe meinen Freund morgen.', english: 'I am meeting my friend tomorrow.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Freunde',
          deklinationBestimmt:   { nominative: 'der Freund',  akkusativ: 'den Freund',  genitiv: 'des Freundes',  dativ: 'dem Freund' },
          deklinationUnbestimmt: { nominative: 'ein Freund', akkusativ: 'einen Freund', genitiv: 'eines Freundes', dativ: 'einem Freund' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_218',
        german: 'Freundin',
        english: 'friend (female) / girlfriend',
        wordType: 'noun', level: 'A1',
        description: 'A female person you know well and like; also used for girlfriend.',
        examples: [
          { german: 'Sie ist meine beste Freundin.', english: 'She is my best friend.' },
          { german: 'Ich rufe meine Freundin an.', english: 'I am calling my friend.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Freundinnen',
          deklinationBestimmt:   { nominative: 'die Freundin',  akkusativ: 'die Freundin',  genitiv: 'der Freundin',  dativ: 'der Freundin' },
          deklinationUnbestimmt: { nominative: 'eine Freundin', akkusativ: 'eine Freundin', genitiv: 'einer Freundin', dativ: 'einer Freundin' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_219',
        german: 'Familie',
        english: 'family',
        wordType: 'noun', level: 'A1',
        description: 'A group of people related by blood or marriage.',
        examples: [
          { german: 'Meine Familie wohnt in München.', english: 'My family lives in Munich.' },
          { german: 'Familie ist sehr wichtig.', english: 'Family is very important.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Familien',
          deklinationBestimmt:   { nominative: 'die Familie',  akkusativ: 'die Familie',  genitiv: 'der Familie',  dativ: 'der Familie' },
          deklinationUnbestimmt: { nominative: 'eine Familie', akkusativ: 'eine Familie', genitiv: 'einer Familie', dativ: 'einer Familie' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_220',
        german: 'Kind',
        english: 'child',
        wordType: 'noun', level: 'A1',
        description: 'A young human being below the age of puberty.',
        examples: [
          { german: 'Das Kind spielt im Garten.', english: 'The child is playing in the garden.' },
          { german: 'Sie hat zwei Kinder.', english: 'She has two children.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Kinder',
          deklinationBestimmt:   { nominative: 'das Kind',  akkusativ: 'das Kind',  genitiv: 'des Kindes',  dativ: 'dem Kind' },
          deklinationUnbestimmt: { nominative: 'ein Kind', akkusativ: 'ein Kind', genitiv: 'eines Kindes', dativ: 'einem Kind' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_221',
        german: 'Eltern',
        english: 'parents',
        wordType: 'noun', level: 'A1',
        description: 'A person\'s mother and father (always plural).',
        examples: [
          { german: 'Meine Eltern wohnen auf dem Land.', english: 'My parents live in the countryside.' },
          { german: 'Die Eltern kommen morgen zu Besuch.', english: 'The parents are coming to visit tomorrow.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Eltern',
          deklinationBestimmt:   { nominative: 'die Eltern',  akkusativ: 'die Eltern',  genitiv: 'der Eltern',  dativ: 'den Eltern' },
          deklinationUnbestimmt: { nominative: 'Eltern', akkusativ: 'Eltern', genitiv: 'von Eltern', dativ: 'Eltern' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_222',
        german: 'Gesundheit',
        english: 'health',
        wordType: 'noun', level: 'A2',
        description: 'The state of being free from illness or injury.',
        examples: [
          { german: 'Gesundheit ist das Wichtigste.', english: 'Health is the most important thing.' },
          { german: 'Er achtet sehr auf seine Gesundheit.', english: 'He pays great attention to his health.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: '',
          deklinationBestimmt:   { nominative: 'die Gesundheit',  akkusativ: 'die Gesundheit',  genitiv: 'der Gesundheit',  dativ: 'der Gesundheit' },
          deklinationUnbestimmt: { nominative: 'eine Gesundheit', akkusativ: 'eine Gesundheit', genitiv: 'einer Gesundheit', dativ: 'einer Gesundheit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_223',
        german: 'krank',
        english: 'sick / ill',
        wordType: 'adjective', level: 'A2',
        description: 'Suffering from an illness; not healthy.',
        examples: [
          { german: 'Ich bin heute krank.', english: 'I am sick today.' },
          { german: 'Sie hat einen kranken Bruder.', english: 'She has a sick brother.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'kränker', superlativ: 'am kränksten',
          deklinationMaskulin: { nominative: 'kranker', akkusativ: 'kranken', genitiv: 'kranken', dativ: 'krankem' },
          deklinationFeminin:  { nominative: 'kranke',  akkusativ: 'kranke',  genitiv: 'kranker', dativ: 'kranker' },
          deklinationNeutral:  { nominative: 'krankes', akkusativ: 'krankes', genitiv: 'kranken', dativ: 'krankem' },
          deklinationPlurar:   { nominative: 'kranke',  akkusativ: 'kranke',  genitiv: 'kranker', dativ: 'kranken' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_224',
        german: 'gesund',
        english: 'healthy',
        wordType: 'adjective', level: 'A2',
        description: 'In good physical or mental condition.',
        examples: [
          { german: 'Sport hält dich gesund.', english: 'Sport keeps you healthy.' },
          { german: 'Sie isst sehr gesund.', english: 'She eats very healthily.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'gesünder', superlativ: 'am gesündesten',
          deklinationMaskulin: { nominative: 'gesunder', akkusativ: 'gesunden', genitiv: 'gesunden', dativ: 'gesundem' },
          deklinationFeminin:  { nominative: 'gesunde',  akkusativ: 'gesunde',  genitiv: 'gesunder', dativ: 'gesunder' },
          deklinationNeutral:  { nominative: 'gesundes', akkusativ: 'gesundes', genitiv: 'gesunden', dativ: 'gesundem' },
          deklinationPlurar:   { nominative: 'gesunde',  akkusativ: 'gesunde',  genitiv: 'gesunder', dativ: 'gesunden' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_225',
        german: 'schreiben',
        english: 'to write',
        wordType: 'verb', level: 'A1',
        description: 'To mark letters or words on a surface.',
        examples: [
          { german: 'Ich schreibe einen Brief.', english: 'I am writing a letter.' },
          { german: 'Kannst du mir eine E-Mail schreiben?', english: 'Can you write me an email?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'schreibe',  du: 'schreibst',  erSieEs: 'schreibt',  wir: 'schreiben',  ihr: 'schreibt',  sie: 'schreiben' },
          simplePast:  { ich: 'schrieb',   du: 'schriebst',  erSieEs: 'schrieb',   wir: 'schrieben',  ihr: 'schriebt',  sie: 'schrieben' },
          pastPerfect: { ich: 'habe geschrieben', du: 'hast geschrieben', erSieEs: 'hat geschrieben', wir: 'haben geschrieben', ihr: 'habt geschrieben', sie: 'haben geschrieben' },
          future:      { ich: 'werde schreiben', du: 'wirst schreiben', erSieEs: 'wird schreiben', wir: 'werden schreiben', ihr: 'werdet schreiben', sie: 'werden schreiben' },
          imperative:  { du: 'schreib!', wir: 'schreiben wir!', ihr: 'schreibt!', Sie: 'schreiben Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_226',
        german: 'lesen',
        english: 'to read',
        wordType: 'verb', level: 'A1',
        description: 'To look at and understand written words.',
        examples: [
          { german: 'Ich lese jeden Abend ein Buch.', english: 'I read a book every evening.' },
          { german: 'Hast du die Zeitung gelesen?', english: 'Have you read the newspaper?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'lese',  du: 'liest',  erSieEs: 'liest',  wir: 'lesen',  ihr: 'lest',  sie: 'lesen' },
          simplePast:  { ich: 'las',   du: 'last',   erSieEs: 'las',    wir: 'lasen',  ihr: 'last',  sie: 'lasen' },
          pastPerfect: { ich: 'habe gelesen', du: 'hast gelesen', erSieEs: 'hat gelesen', wir: 'haben gelesen', ihr: 'habt gelesen', sie: 'haben gelesen' },
          future:      { ich: 'werde lesen', du: 'wirst lesen', erSieEs: 'wird lesen', wir: 'werden lesen', ihr: 'werdet lesen', sie: 'werden lesen' },
          imperative:  { du: 'lies!', wir: 'lesen wir!', ihr: 'lest!', Sie: 'lesen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_227',
        german: 'hören',
        english: 'to hear / to listen',
        wordType: 'verb', level: 'A1',
        description: 'To perceive sound with one\'s ears.',
        examples: [
          { german: 'Ich höre gern Musik.', english: 'I like listening to music.' },
          { german: 'Kannst du das hören?', english: 'Can you hear that?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'höre',  du: 'hörst',  erSieEs: 'hört',  wir: 'hören',  ihr: 'hört',  sie: 'hören' },
          simplePast:  { ich: 'hörte', du: 'hörtest', erSieEs: 'hörte', wir: 'hörten', ihr: 'hörtet', sie: 'hörten' },
          pastPerfect: { ich: 'habe gehört', du: 'hast gehört', erSieEs: 'hat gehört', wir: 'haben gehört', ihr: 'habt gehört', sie: 'haben gehört' },
          future:      { ich: 'werde hören', du: 'wirst hören', erSieEs: 'wird hören', wir: 'werden hören', ihr: 'werdet hören', sie: 'werden hören' },
          imperative:  { du: 'hör!', wir: 'hören wir!', ihr: 'hört!', Sie: 'hören Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_228',
        german: 'sehen',
        english: 'to see',
        wordType: 'verb', level: 'A1',
        description: 'To perceive with the eyes.',
        examples: [
          { german: 'Ich sehe ein schönes Bild.', english: 'I see a beautiful picture.' },
          { german: 'Hast du den Film gesehen?', english: 'Have you seen the film?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'sehe',  du: 'siehst',  erSieEs: 'sieht',  wir: 'sehen',  ihr: 'seht',  sie: 'sehen' },
          simplePast:  { ich: 'sah',   du: 'sahst',   erSieEs: 'sah',    wir: 'sahen',  ihr: 'saht',  sie: 'sahen' },
          pastPerfect: { ich: 'habe gesehen', du: 'hast gesehen', erSieEs: 'hat gesehen', wir: 'haben gesehen', ihr: 'habt gesehen', sie: 'haben gesehen' },
          future:      { ich: 'werde sehen', du: 'wirst sehen', erSieEs: 'wird sehen', wir: 'werden sehen', ihr: 'werdet sehen', sie: 'werden sehen' },
          imperative:  { du: 'sieh!', wir: 'sehen wir!', ihr: 'seht!', Sie: 'sehen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_229',
        german: 'Lebensmittel',
        english: 'groceries / food',
        wordType: 'noun', level: 'A2',
        description: 'Food and other products bought for everyday use.',
        examples: [
          { german: 'Ich kaufe Lebensmittel im Supermarkt.', english: 'I buy groceries at the supermarket.' },
          { german: 'Die Lebensmittelpreise steigen.', english: 'Food prices are rising.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Lebensmittel',
          deklinationBestimmt:   { nominative: 'das Lebensmittel',  akkusativ: 'das Lebensmittel',  genitiv: 'des Lebensmittels',  dativ: 'dem Lebensmittel' },
          deklinationUnbestimmt: { nominative: 'ein Lebensmittel', akkusativ: 'ein Lebensmittel', genitiv: 'eines Lebensmittels', dativ: 'einem Lebensmittel' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_230',
        german: 'Küche',
        english: 'kitchen / cuisine',
        wordType: 'noun', level: 'A1',
        description: 'The room in a home where food is prepared; also a style of cooking.',
        examples: [
          { german: 'Ich koche in der Küche.', english: 'I cook in the kitchen.' },
          { german: 'Die deutsche Küche ist sehr lecker.', english: 'German cuisine is very tasty.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Küchen',
          deklinationBestimmt:   { nominative: 'die Küche',  akkusativ: 'die Küche',  genitiv: 'der Küche',  dativ: 'der Küche' },
          deklinationUnbestimmt: { nominative: 'eine Küche', akkusativ: 'eine Küche', genitiv: 'einer Küche', dativ: 'einer Küche' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_231',
        german: 'kochen',
        english: 'to cook',
        wordType: 'verb', level: 'A1',
        description: 'To prepare food by heating it.',
        examples: [
          { german: 'Sie kocht jeden Abend.', english: 'She cooks every evening.' },
          { german: 'Ich habe heute Abend Pasta gekocht.', english: 'I cooked pasta this evening.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'koche',  du: 'kochst',  erSieEs: 'kocht',  wir: 'kochen',  ihr: 'kocht',  sie: 'kochen' },
          simplePast:  { ich: 'kochte', du: 'kochtest', erSieEs: 'kochte', wir: 'kochten', ihr: 'kochtet', sie: 'kochten' },
          pastPerfect: { ich: 'habe gekocht', du: 'hast gekocht', erSieEs: 'hat gekocht', wir: 'haben gekocht', ihr: 'habt gekocht', sie: 'haben gekocht' },
          future:      { ich: 'werde kochen', du: 'wirst kochen', erSieEs: 'wird kochen', wir: 'werden kochen', ihr: 'werdet kochen', sie: 'werden kochen' },
          imperative:  { du: 'koch!', wir: 'kochen wir!', ihr: 'kocht!', Sie: 'kochen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_232',
        german: 'Wohnung',
        english: 'apartment / flat',
        wordType: 'noun', level: 'A1',
        description: 'A set of rooms forming one residence in a larger building.',
        examples: [
          { german: 'Ich suche eine neue Wohnung.', english: 'I am looking for a new apartment.' },
          { german: 'Die Wohnung hat drei Zimmer.', english: 'The apartment has three rooms.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Wohnungen',
          deklinationBestimmt:   { nominative: 'die Wohnung',  akkusativ: 'die Wohnung',  genitiv: 'der Wohnung',  dativ: 'der Wohnung' },
          deklinationUnbestimmt: { nominative: 'eine Wohnung', akkusativ: 'eine Wohnung', genitiv: 'einer Wohnung', dativ: 'einer Wohnung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_233',
        german: 'Zimmer',
        english: 'room',
        wordType: 'noun', level: 'A1',
        description: 'A separate section of a building enclosed by walls.',
        examples: [
          { german: 'Das Zimmer ist sehr groß.', english: 'The room is very big.' },
          { german: 'Ich räume mein Zimmer auf.', english: 'I am tidying up my room.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Zimmer',
          deklinationBestimmt:   { nominative: 'das Zimmer',  akkusativ: 'das Zimmer',  genitiv: 'des Zimmers',  dativ: 'dem Zimmer' },
          deklinationUnbestimmt: { nominative: 'ein Zimmer', akkusativ: 'ein Zimmer', genitiv: 'eines Zimmers', dativ: 'einem Zimmer' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_234',
        german: 'Frühstück',
        english: 'breakfast',
        wordType: 'noun', level: 'A1',
        description: 'The first meal of the day, eaten in the morning.',
        examples: [
          { german: 'Ich esse immer Frühstück um sieben Uhr.', english: 'I always eat breakfast at seven o\'clock.' },
          { german: 'Was möchtest du zum Frühstück?', english: 'What would you like for breakfast?' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Frühstücke',
          deklinationBestimmt:   { nominative: 'das Frühstück',  akkusativ: 'das Frühstück',  genitiv: 'des Frühstücks',  dativ: 'dem Frühstück' },
          deklinationUnbestimmt: { nominative: 'ein Frühstück', akkusativ: 'ein Frühstück', genitiv: 'eines Frühstücks', dativ: 'einem Frühstück' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_235',
        german: 'Mittagessen',
        english: 'lunch',
        wordType: 'noun', level: 'A1',
        description: 'The meal eaten in the middle of the day.',
        examples: [
          { german: 'Wir essen Mittagessen in der Kantine.', english: 'We eat lunch in the canteen.' },
          { german: 'Zum Mittagessen gibt es Suppe.', english: 'There is soup for lunch.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Mittagessen',
          deklinationBestimmt:   { nominative: 'das Mittagessen',  akkusativ: 'das Mittagessen',  genitiv: 'des Mittagessens',  dativ: 'dem Mittagessen' },
          deklinationUnbestimmt: { nominative: 'ein Mittagessen', akkusativ: 'ein Mittagessen', genitiv: 'eines Mittagessens', dativ: 'einem Mittagessen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_236',
        german: 'Abendessen',
        english: 'dinner / supper',
        wordType: 'noun', level: 'A1',
        description: 'The main meal of the day eaten in the evening.',
        examples: [
          { german: 'Das Abendessen ist fertig.', english: 'Dinner is ready.' },
          { german: 'Was kochst du zum Abendessen?', english: 'What are you cooking for dinner?' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Abendessen',
          deklinationBestimmt:   { nominative: 'das Abendessen',  akkusativ: 'das Abendessen',  genitiv: 'des Abendessens',  dativ: 'dem Abendessen' },
          deklinationUnbestimmt: { nominative: 'ein Abendessen', akkusativ: 'ein Abendessen', genitiv: 'eines Abendessens', dativ: 'einem Abendessen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_237',
        german: 'Flugzeug',
        english: 'airplane',
        wordType: 'noun', level: 'A2',
        description: 'A powered flying vehicle with wings and a fixed structure.',
        examples: [
          { german: 'Das Flugzeug landet in zehn Minuten.', english: 'The airplane lands in ten minutes.' },
          { german: 'Ich fliege lieber mit dem Flugzeug als mit dem Schiff.', english: 'I prefer flying by airplane to travelling by ship.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Flugzeuge',
          deklinationBestimmt:   { nominative: 'das Flugzeug',  akkusativ: 'das Flugzeug',  genitiv: 'des Flugzeugs',  dativ: 'dem Flugzeug' },
          deklinationUnbestimmt: { nominative: 'ein Flugzeug', akkusativ: 'ein Flugzeug', genitiv: 'eines Flugzeugs', dativ: 'einem Flugzeug' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_238',
        german: 'Bahnhof',
        english: 'train station',
        wordType: 'noun', level: 'A1',
        description: 'A building where trains stop to allow passengers to board or leave.',
        examples: [
          { german: 'Der Bahnhof ist fünf Minuten entfernt.', english: 'The train station is five minutes away.' },
          { german: 'Wir treffen uns am Bahnhof.', english: 'We meet at the train station.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Bahnhöfe',
          deklinationBestimmt:   { nominative: 'der Bahnhof',  akkusativ: 'den Bahnhof',  genitiv: 'des Bahnhofs',  dativ: 'dem Bahnhof' },
          deklinationUnbestimmt: { nominative: 'ein Bahnhof', akkusativ: 'einen Bahnhof', genitiv: 'eines Bahnhofs', dativ: 'einem Bahnhof' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_239',
        german: 'Flughafen',
        english: 'airport',
        wordType: 'noun', level: 'A2',
        description: 'A place where aircraft take off and land.',
        examples: [
          { german: 'Der Flughafen ist sehr weit vom Stadtzentrum entfernt.', english: 'The airport is very far from the city centre.' },
          { german: 'Wir müssen früh am Flughafen sein.', english: 'We need to be at the airport early.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Flughäfen',
          deklinationBestimmt:   { nominative: 'der Flughafen',  akkusativ: 'den Flughafen',  genitiv: 'des Flughafens',  dativ: 'dem Flughafen' },
          deklinationUnbestimmt: { nominative: 'ein Flughafen', akkusativ: 'einen Flughafen', genitiv: 'eines Flughafens', dativ: 'einem Flughafen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_240',
        german: 'fragen',
        english: 'to ask',
        wordType: 'verb', level: 'A1',
        description: 'To put a question to someone.',
        examples: [
          { german: 'Ich möchte dich etwas fragen.', english: 'I would like to ask you something.' },
          { german: 'Er fragt immer viele Fragen.', english: 'He always asks many questions.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'frage',  du: 'fragst',  erSieEs: 'fragt',  wir: 'fragen',  ihr: 'fragt',  sie: 'fragen' },
          simplePast:  { ich: 'fragte', du: 'fragtest', erSieEs: 'fragte', wir: 'fragten', ihr: 'fragtet', sie: 'fragten' },
          pastPerfect: { ich: 'habe gefragt', du: 'hast gefragt', erSieEs: 'hat gefragt', wir: 'haben gefragt', ihr: 'habt gefragt', sie: 'haben gefragt' },
          future:      { ich: 'werde fragen', du: 'wirst fragen', erSieEs: 'wird fragen', wir: 'werden fragen', ihr: 'werdet fragen', sie: 'werden fragen' },
          imperative:  { du: 'frag!', wir: 'fragen wir!', ihr: 'fragt!', Sie: 'fragen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_241',
        german: 'antworten',
        english: 'to answer',
        wordType: 'verb', level: 'A1',
        description: 'To say or write something in response to a question.',
        examples: [
          { german: 'Bitte antworte auf meine Frage.', english: 'Please answer my question.' },
          { german: 'Sie hat noch nicht geantwortet.', english: 'She has not answered yet.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'antworte',  du: 'antwortest',  erSieEs: 'antwortet',  wir: 'antworten',  ihr: 'antwortet',  sie: 'antworten' },
          simplePast:  { ich: 'antwortete', du: 'antwortetest', erSieEs: 'antwortete', wir: 'antworteten', ihr: 'antwortetet', sie: 'antworteten' },
          pastPerfect: { ich: 'habe geantwortet', du: 'hast geantwortet', erSieEs: 'hat geantwortet', wir: 'haben geantwortet', ihr: 'habt geantwortet', sie: 'haben geantwortet' },
          future:      { ich: 'werde antworten', du: 'wirst antworten', erSieEs: 'wird antworten', wir: 'werden antworten', ihr: 'werdet antworten', sie: 'werden antworten' },
          imperative:  { du: 'antworte!', wir: 'antworten wir!', ihr: 'antwortet!', Sie: 'antworten Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_242',
        german: 'erklären',
        english: 'to explain',
        wordType: 'verb', level: 'A2',
        description: 'To make something clear or easy to understand.',
        examples: [
          { german: 'Kannst du mir das erklären?', english: 'Can you explain that to me?' },
          { german: 'Der Lehrer erklärt die Grammatik.', english: 'The teacher explains the grammar.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'erkläre',  du: 'erklärst',  erSieEs: 'erklärt',  wir: 'erklären',  ihr: 'erklärt',  sie: 'erklären' },
          simplePast:  { ich: 'erklärte', du: 'erklärtest', erSieEs: 'erklärte', wir: 'erklärten', ihr: 'erklärtet', sie: 'erklärten' },
          pastPerfect: { ich: 'habe erklärt', du: 'hast erklärt', erSieEs: 'hat erklärt', wir: 'haben erklärt', ihr: 'habt erklärt', sie: 'haben erklärt' },
          future:      { ich: 'werde erklären', du: 'wirst erklären', erSieEs: 'wird erklären', wir: 'werden erklären', ihr: 'werdet erklären', sie: 'werden erklären' },
          imperative:  { du: 'erkläre!', wir: 'erklären wir!', ihr: 'erklärt!', Sie: 'erklären Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_243',
        german: 'verstehen',
        english: 'to understand',
        wordType: 'verb', level: 'A1',
        description: 'To grasp the meaning of something.',
        examples: [
          { german: 'Ich verstehe dich nicht.', english: 'I do not understand you.' },
          { german: 'Hast du die Aufgabe verstanden?', english: 'Did you understand the task?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'verstehe',  du: 'verstehst',  erSieEs: 'versteht',  wir: 'verstehen',  ihr: 'versteht',  sie: 'verstehen' },
          simplePast:  { ich: 'verstand',  du: 'verstandst', erSieEs: 'verstand',  wir: 'verstanden', ihr: 'verstandt', sie: 'verstanden' },
          pastPerfect: { ich: 'habe verstanden', du: 'hast verstanden', erSieEs: 'hat verstanden', wir: 'haben verstanden', ihr: 'habt verstanden', sie: 'haben verstanden' },
          future:      { ich: 'werde verstehen', du: 'wirst verstehen', erSieEs: 'wird verstehen', wir: 'werden verstehen', ihr: 'werdet verstehen', sie: 'werden verstehen' },
          imperative:  { du: 'versteh!', wir: 'verstehen wir!', ihr: 'versteht!', Sie: 'verstehen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_244',
        german: 'vergessen',
        english: 'to forget',
        wordType: 'verb', level: 'A2',
        description: 'To fail to remember something.',
        examples: [
          { german: 'Ich habe seinen Namen vergessen.', english: 'I have forgotten his name.' },
          { german: 'Vergiss nicht, die Tür abzuschließen.', english: 'Do not forget to lock the door.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'vergesse',  du: 'vergisst',  erSieEs: 'vergisst',  wir: 'vergessen',  ihr: 'vergesst',  sie: 'vergessen' },
          simplePast:  { ich: 'vergaß',    du: 'vergaßt',   erSieEs: 'vergaß',    wir: 'vergaßen',   ihr: 'vergaßt',   sie: 'vergaßen' },
          pastPerfect: { ich: 'habe vergessen', du: 'hast vergessen', erSieEs: 'hat vergessen', wir: 'haben vergessen', ihr: 'habt vergessen', sie: 'haben vergessen' },
          future:      { ich: 'werde vergessen', du: 'wirst vergessen', erSieEs: 'wird vergessen', wir: 'werden vergessen', ihr: 'werdet vergessen', sie: 'werden vergessen' },
          imperative:  { du: 'vergiss!', wir: 'vergessen wir!', ihr: 'vergesst!', Sie: 'vergessen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_245',
        german: 'denken',
        english: 'to think',
        wordType: 'verb', level: 'A1',
        description: 'To use one\'s mind to consider or reason about something.',
        examples: [
          { german: 'Was denkst du darüber?', english: 'What do you think about it?' },
          { german: 'Ich denke, das ist eine gute Idee.', english: 'I think that is a good idea.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'denke',  du: 'denkst',  erSieEs: 'denkt',  wir: 'denken',  ihr: 'denkt',  sie: 'denken' },
          simplePast:  { ich: 'dachte', du: 'dachtest', erSieEs: 'dachte', wir: 'dachten', ihr: 'dachtet', sie: 'dachten' },
          pastPerfect: { ich: 'habe gedacht', du: 'hast gedacht', erSieEs: 'hat gedacht', wir: 'haben gedacht', ihr: 'habt gedacht', sie: 'haben gedacht' },
          future:      { ich: 'werde denken', du: 'wirst denken', erSieEs: 'wird denken', wir: 'werden denken', ihr: 'werdet denken', sie: 'werden denken' },
          imperative:  { du: 'denk!', wir: 'denken wir!', ihr: 'denkt!', Sie: 'denken Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_246',
        german: 'Idee',
        english: 'idea',
        wordType: 'noun', level: 'A2',
        description: 'A thought or suggestion as to a possible course of action.',
        examples: [
          { german: 'Das ist eine tolle Idee!', english: 'That is a great idea!' },
          { german: 'Hast du eine Idee, wie wir das lösen können?', english: 'Do you have an idea how we can solve this?' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Ideen',
          deklinationBestimmt:   { nominative: 'die Idee',  akkusativ: 'die Idee',  genitiv: 'der Idee',  dativ: 'der Idee' },
          deklinationUnbestimmt: { nominative: 'eine Idee', akkusativ: 'eine Idee', genitiv: 'einer Idee', dativ: 'einer Idee' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_247',
        german: 'Meinung',
        english: 'opinion',
        wordType: 'noun', level: 'B1',
        description: 'A view or judgment formed about something.',
        examples: [
          { german: 'Was ist deine Meinung dazu?', english: 'What is your opinion on this?' },
          { german: 'Meiner Meinung nach ist das falsch.', english: 'In my opinion that is wrong.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Meinungen',
          deklinationBestimmt:   { nominative: 'die Meinung',  akkusativ: 'die Meinung',  genitiv: 'der Meinung',  dativ: 'der Meinung' },
          deklinationUnbestimmt: { nominative: 'eine Meinung', akkusativ: 'eine Meinung', genitiv: 'einer Meinung', dativ: 'einer Meinung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_248',
        german: 'entscheiden',
        english: 'to decide',
        wordType: 'verb', level: 'B1',
        description: 'To make a choice between alternatives.',
        examples: [
          { german: 'Ich kann mich nicht entscheiden.', english: 'I cannot decide.' },
          { german: 'Sie hat entschieden, das Angebot anzunehmen.', english: 'She decided to accept the offer.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'entscheide',  du: 'entscheidest',  erSieEs: 'entscheidet',  wir: 'entscheiden',  ihr: 'entscheidet',  sie: 'entscheiden' },
          simplePast:  { ich: 'entschied',   du: 'entschiedst',   erSieEs: 'entschied',    wir: 'entschieden',  ihr: 'entschiedet',  sie: 'entschieden' },
          pastPerfect: { ich: 'habe entschieden', du: 'hast entschieden', erSieEs: 'hat entschieden', wir: 'haben entschieden', ihr: 'habt entschieden', sie: 'haben entschieden' },
          future:      { ich: 'werde entscheiden', du: 'wirst entscheiden', erSieEs: 'wird entscheiden', wir: 'werden entscheiden', ihr: 'werdet entscheiden', sie: 'werden entscheiden' },
          imperative:  { du: 'entscheide!', wir: 'entscheiden wir!', ihr: 'entscheidet!', Sie: 'entscheiden Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_249',
        german: 'Entscheidung',
        english: 'decision',
        wordType: 'noun', level: 'B1',
        description: 'A conclusion or resolution reached after consideration.',
        examples: [
          { german: 'Das war eine schwierige Entscheidung.', english: 'That was a difficult decision.' },
          { german: 'Ich stehe hinter meiner Entscheidung.', english: 'I stand by my decision.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Entscheidungen',
          deklinationBestimmt:   { nominative: 'die Entscheidung',  akkusativ: 'die Entscheidung',  genitiv: 'der Entscheidung',  dativ: 'der Entscheidung' },
          deklinationUnbestimmt: { nominative: 'eine Entscheidung', akkusativ: 'eine Entscheidung', genitiv: 'einer Entscheidung', dativ: 'einer Entscheidung' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_250',
        german: 'Möglichkeit',
        english: 'possibility / opportunity',
        wordType: 'noun', level: 'B1',
        description: 'A thing that may happen or be achieved; a chance to do something.',
        examples: [
          { german: 'Es gibt viele Möglichkeiten, Deutsch zu lernen.', english: 'There are many possibilities to learn German.' },
          { german: 'Ich nutze jede Möglichkeit, um zu üben.', english: 'I use every opportunity to practise.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Möglichkeiten',
          deklinationBestimmt:   { nominative: 'die Möglichkeit',  akkusativ: 'die Möglichkeit',  genitiv: 'der Möglichkeit',  dativ: 'der Möglichkeit' },
          deklinationUnbestimmt: { nominative: 'eine Möglichkeit', akkusativ: 'eine Möglichkeit', genitiv: 'einer Möglichkeit', dativ: 'einer Möglichkeit' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_251',
        german: 'Berg',
        english: 'mountain',
        wordType: 'noun', level: 'A1',
        description: 'A large natural elevation of earth rising abruptly from the surrounding level.',
        examples: [
          { german: 'Der Berg ist sehr hoch.', english: 'The mountain is very high.' },
          { german: 'Wir wandern auf den Berg.', english: 'We are hiking up the mountain.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Berge',
          deklinationBestimmt:   { nominative: 'der Berg',  akkusativ: 'den Berg',  genitiv: 'des Berges',  dativ: 'dem Berg' },
          deklinationUnbestimmt: { nominative: 'ein Berg',  akkusativ: 'einen Berg', genitiv: 'eines Berges', dativ: 'einem Berg' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_252',
        german: 'Meer',
        english: 'sea / ocean',
        wordType: 'noun', level: 'A1',
        description: 'A large body of salt water.',
        examples: [
          { german: 'Das Meer ist heute ruhig.', english: 'The sea is calm today.' },
          { german: 'Wir fahren ans Meer.', english: 'We are going to the sea.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Meere',
          deklinationBestimmt:   { nominative: 'das Meer',  akkusativ: 'das Meer',  genitiv: 'des Meeres',  dativ: 'dem Meer' },
          deklinationUnbestimmt: { nominative: 'ein Meer',  akkusativ: 'ein Meer',  genitiv: 'eines Meeres', dativ: 'einem Meer' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_253',
        german: 'Nacht',
        english: 'night',
        wordType: 'noun', level: 'A1',
        description: 'The period of darkness between sunset and sunrise.',
        examples: [
          { german: 'In der Nacht schlafen wir.', english: 'At night we sleep.' },
          { german: 'Gute Nacht!', english: 'Good night!' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Nächte',
          deklinationBestimmt:   { nominative: 'die Nacht',  akkusativ: 'die Nacht',  genitiv: 'der Nacht',  dativ: 'der Nacht' },
          deklinationUnbestimmt: { nominative: 'eine Nacht', akkusativ: 'eine Nacht', genitiv: 'einer Nacht', dativ: 'einer Nacht' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_254',
        german: 'Sonne',
        english: 'sun',
        wordType: 'noun', level: 'A1',
        description: 'The star around which the earth orbits; a source of light and warmth.',
        examples: [
          { german: 'Die Sonne scheint heute.', english: 'The sun is shining today.' },
          { german: 'Die Sonne geht im Osten auf.', english: 'The sun rises in the east.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Sonnen',
          deklinationBestimmt:   { nominative: 'die Sonne',  akkusativ: 'die Sonne',  genitiv: 'der Sonne',  dativ: 'der Sonne' },
          deklinationUnbestimmt: { nominative: 'eine Sonne', akkusativ: 'eine Sonne', genitiv: 'einer Sonne', dativ: 'einer Sonne' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_255',
        german: 'Mond',
        english: 'moon',
        wordType: 'noun', level: 'A1',
        description: 'The natural satellite of the earth, visible at night.',
        examples: [
          { german: 'Der Mond leuchtet hell.', english: 'The moon shines brightly.' },
          { german: 'Heute Nacht ist Vollmond.', english: 'Tonight there is a full moon.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Monde',
          deklinationBestimmt:   { nominative: 'der Mond',  akkusativ: 'den Mond',  genitiv: 'des Mondes',  dativ: 'dem Mond' },
          deklinationUnbestimmt: { nominative: 'ein Mond',  akkusativ: 'einen Mond', genitiv: 'eines Mondes', dativ: 'einem Mond' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_256',
        german: 'Blume',
        english: 'flower',
        wordType: 'noun', level: 'A1',
        description: 'The seed-bearing part of a plant; a blossom.',
        examples: [
          { german: 'Er schenkt ihr Blumen.', english: 'He gives her flowers.' },
          { german: 'Die Blume riecht schön.', english: 'The flower smells beautiful.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Blumen',
          deklinationBestimmt:   { nominative: 'die Blume',  akkusativ: 'die Blume',  genitiv: 'der Blume',  dativ: 'der Blume' },
          deklinationUnbestimmt: { nominative: 'eine Blume', akkusativ: 'eine Blume', genitiv: 'einer Blume', dativ: 'einer Blume' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_257',
        german: 'Tisch',
        english: 'table',
        wordType: 'noun', level: 'A1',
        description: 'A piece of furniture with a flat top and legs, used for eating, writing, etc.',
        examples: [
          { german: 'Das Buch liegt auf dem Tisch.', english: 'The book is on the table.' },
          { german: 'Wir essen am Tisch.', english: 'We eat at the table.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Tische',
          deklinationBestimmt:   { nominative: 'der Tisch',  akkusativ: 'den Tisch',  genitiv: 'des Tisches',  dativ: 'dem Tisch' },
          deklinationUnbestimmt: { nominative: 'ein Tisch',  akkusativ: 'einen Tisch', genitiv: 'eines Tisches', dativ: 'einem Tisch' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_258',
        german: 'Stuhl',
        english: 'chair',
        wordType: 'noun', level: 'A1',
        description: 'A separate seat for one person, typically with a back and four legs.',
        examples: [
          { german: 'Setz dich auf den Stuhl.', english: 'Sit down on the chair.' },
          { german: 'Der Stuhl steht am Tisch.', english: 'The chair is by the table.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Stühle',
          deklinationBestimmt:   { nominative: 'der Stuhl',  akkusativ: 'den Stuhl',  genitiv: 'des Stuhles',  dativ: 'dem Stuhl' },
          deklinationUnbestimmt: { nominative: 'ein Stuhl',  akkusativ: 'einen Stuhl', genitiv: 'eines Stuhles', dativ: 'einem Stuhl' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_259',
        german: 'Stadt',
        english: 'city / town',
        wordType: 'noun', level: 'A1',
        description: 'A large and permanent human settlement.',
        examples: [
          { german: 'Ich wohne in einer großen Stadt.', english: 'I live in a large city.' },
          { german: 'Die Stadt ist sehr lebendig.', english: 'The city is very lively.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Städte',
          deklinationBestimmt:   { nominative: 'die Stadt',  akkusativ: 'die Stadt',  genitiv: 'der Stadt',  dativ: 'der Stadt' },
          deklinationUnbestimmt: { nominative: 'eine Stadt', akkusativ: 'eine Stadt', genitiv: 'einer Stadt', dativ: 'einer Stadt' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_260',
        german: 'Herz',
        english: 'heart',
        wordType: 'noun', level: 'A1',
        description: 'A hollow muscular organ that pumps blood; also used to express affection.',
        examples: [
          { german: 'Mein Herz schlägt schnell.', english: 'My heart is beating fast.' },
          { german: 'Sie hat ein gutes Herz.', english: 'She has a good heart.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Herzen',
          deklinationBestimmt:   { nominative: 'das Herz',  akkusativ: 'das Herz',  genitiv: 'des Herzens',  dativ: 'dem Herzen' },
          deklinationUnbestimmt: { nominative: 'ein Herz',  akkusativ: 'ein Herz',  genitiv: 'eines Herzens', dativ: 'einem Herzen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_261',
        german: 'Hand',
        english: 'hand',
        wordType: 'noun', level: 'A1',
        description: 'The end part of a person\'s arm beyond the wrist.',
        examples: [
          { german: 'Gib mir die Hand!', english: 'Give me your hand!' },
          { german: 'Sie wäscht sich die Hände.', english: 'She is washing her hands.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Hände',
          deklinationBestimmt:   { nominative: 'die Hand',  akkusativ: 'die Hand',  genitiv: 'der Hand',  dativ: 'der Hand' },
          deklinationUnbestimmt: { nominative: 'eine Hand', akkusativ: 'eine Hand', genitiv: 'einer Hand', dativ: 'einer Hand' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_262',
        german: 'Kopf',
        english: 'head',
        wordType: 'noun', level: 'A1',
        description: 'The upper part of the human body containing the brain and facial features.',
        examples: [
          { german: 'Mir tut der Kopf weh.', english: 'My head hurts.' },
          { german: 'Er schüttelt den Kopf.', english: 'He shakes his head.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Köpfe',
          deklinationBestimmt:   { nominative: 'der Kopf',  akkusativ: 'den Kopf',  genitiv: 'des Kopfes',  dativ: 'dem Kopf' },
          deklinationUnbestimmt: { nominative: 'ein Kopf',  akkusativ: 'einen Kopf', genitiv: 'eines Kopfes', dativ: 'einem Kopf' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_263',
        german: 'Auge',
        english: 'eye',
        wordType: 'noun', level: 'A1',
        description: 'Each of a pair of globular organs of sight in the head.',
        examples: [
          { german: 'Sie hat blaue Augen.', english: 'She has blue eyes.' },
          { german: 'Das Auge ist gerötet.', english: 'The eye is red.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Augen',
          deklinationBestimmt:   { nominative: 'das Auge',  akkusativ: 'das Auge',  genitiv: 'des Auges',  dativ: 'dem Auge' },
          deklinationUnbestimmt: { nominative: 'ein Auge',  akkusativ: 'ein Auge',  genitiv: 'eines Auges', dativ: 'einem Auge' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_264',
        german: 'Jahr',
        english: 'year',
        wordType: 'noun', level: 'A1',
        description: 'A period of 365 or 366 days.',
        examples: [
          { german: 'Das Jahr hat zwölf Monate.', english: 'The year has twelve months.' },
          { german: 'Ich lebe seit drei Jahren hier.', english: 'I have been living here for three years.' }
        ],
        learned: false,
        nounDetails: {
          article: 'das', plural: 'die Jahre',
          deklinationBestimmt:   { nominative: 'das Jahr',  akkusativ: 'das Jahr',  genitiv: 'des Jahres',  dativ: 'dem Jahr' },
          deklinationUnbestimmt: { nominative: 'ein Jahr',  akkusativ: 'ein Jahr',  genitiv: 'eines Jahres', dativ: 'einem Jahr' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_265',
        german: 'Stunde',
        english: 'hour',
        wordType: 'noun', level: 'A1',
        description: 'A period of time equal to sixty minutes.',
        examples: [
          { german: 'In einer Stunde bin ich fertig.', english: 'I will be done in one hour.' },
          { german: 'Der Unterricht dauert zwei Stunden.', english: 'The lesson lasts two hours.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Stunden',
          deklinationBestimmt:   { nominative: 'die Stunde',  akkusativ: 'die Stunde',  genitiv: 'der Stunde',  dativ: 'der Stunde' },
          deklinationUnbestimmt: { nominative: 'eine Stunde', akkusativ: 'eine Stunde', genitiv: 'einer Stunde', dativ: 'einer Stunde' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_266',
        german: 'Minute',
        english: 'minute',
        wordType: 'noun', level: 'A1',
        description: 'A period of time equal to sixty seconds.',
        examples: [
          { german: 'Warte eine Minute!', english: 'Wait a minute!' },
          { german: 'In zehn Minuten fährt der Bus.', english: 'The bus leaves in ten minutes.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Minuten',
          deklinationBestimmt:   { nominative: 'die Minute',  akkusativ: 'die Minute',  genitiv: 'der Minute',  dativ: 'der Minute' },
          deklinationUnbestimmt: { nominative: 'eine Minute', akkusativ: 'eine Minute', genitiv: 'einer Minute', dativ: 'einer Minute' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_267',
        german: 'Woche',
        english: 'week',
        wordType: 'noun', level: 'A1',
        description: 'A period of seven days.',
        examples: [
          { german: 'Die Woche hat sieben Tage.', english: 'The week has seven days.' },
          { german: 'Nächste Woche habe ich Urlaub.', english: 'Next week I have vacation.' }
        ],
        learned: false,
        nounDetails: {
          article: 'die', plural: 'die Wochen',
          deklinationBestimmt:   { nominative: 'die Woche',  akkusativ: 'die Woche',  genitiv: 'der Woche',  dativ: 'der Woche' },
          deklinationUnbestimmt: { nominative: 'eine Woche', akkusativ: 'eine Woche', genitiv: 'einer Woche', dativ: 'einer Woche' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_268',
        german: 'Monat',
        english: 'month',
        wordType: 'noun', level: 'A1',
        description: 'Each of the twelve named periods into which a year is divided.',
        examples: [
          { german: 'Der Monat Januar ist kalt.', english: 'The month of January is cold.' },
          { german: 'Wir treffen uns jeden Monat.', english: 'We meet every month.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Monate',
          deklinationBestimmt:   { nominative: 'der Monat',  akkusativ: 'den Monat',  genitiv: 'des Monats',  dativ: 'dem Monat' },
          deklinationUnbestimmt: { nominative: 'ein Monat',  akkusativ: 'einen Monat', genitiv: 'eines Monats', dativ: 'einem Monat' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_269',
        german: 'Abend',
        english: 'evening',
        wordType: 'noun', level: 'A1',
        description: 'The period of time at the end of the day, usually from around 6 PM to bedtime.',
        examples: [
          { german: 'Guten Abend!', english: 'Good evening!' },
          { german: 'Am Abend lese ich ein Buch.', english: 'In the evening I read a book.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Abende',
          deklinationBestimmt:   { nominative: 'der Abend',  akkusativ: 'den Abend',  genitiv: 'des Abends',  dativ: 'dem Abend' },
          deklinationUnbestimmt: { nominative: 'ein Abend',  akkusativ: 'einen Abend', genitiv: 'eines Abends', dativ: 'einem Abend' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_270',
        german: 'Morgen',
        english: 'morning',
        wordType: 'noun', level: 'A1',
        description: 'The early part of the day, from dawn or from midnight to noon.',
        examples: [
          { german: 'Guten Morgen!', english: 'Good morning!' },
          { german: 'Am Morgen trinke ich Kaffee.', english: 'In the morning I drink coffee.' }
        ],
        learned: false,
        nounDetails: {
          article: 'der', plural: 'die Morgen',
          deklinationBestimmt:   { nominative: 'der Morgen',  akkusativ: 'den Morgen',  genitiv: 'des Morgens',  dativ: 'dem Morgen' },
          deklinationUnbestimmt: { nominative: 'ein Morgen',  akkusativ: 'einen Morgen', genitiv: 'eines Morgens', dativ: 'einem Morgen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_271',
        german: 'kommen',
        english: 'to come',
        wordType: 'verb', level: 'A1',
        description: 'To move or travel toward or into a place thought of as near or familiar to the speaker.',
        examples: [
          { german: 'Kannst du bitte kommen?', english: 'Can you please come?' },
          { german: 'Der Zug kommt um 8 Uhr an.', english: 'The train arrives at 8 o\'clock.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'sein',
          present:     { ich: 'komme', du: 'kommst', erSieEs: 'kommt', wir: 'kommen', ihr: 'kommt', sie: 'kommen' },
          simplePast:  { ich: 'kam', du: 'kamst', erSieEs: 'kam', wir: 'kamen', ihr: 'kamt', sie: 'kamen' },
          pastPerfect: { ich: 'bin gekommen', du: 'bist gekommen', erSieEs: 'ist gekommen', wir: 'sind gekommen', ihr: 'seid gekommen', sie: 'sind gekommen' },
          future:      { ich: 'werde kommen', du: 'wirst kommen', erSieEs: 'wird kommen', wir: 'werden kommen', ihr: 'werdet kommen', sie: 'werden kommen' },
          imperative:  { du: 'komm!', wir: 'kommen wir!', ihr: 'kommt!', Sie: 'kommen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_272',
        german: 'machen',
        english: 'to make / to do',
        wordType: 'verb', level: 'A1',
        description: 'To create, produce, or carry out an action.',
        examples: [
          { german: 'Was machst du gerade?', english: 'What are you doing right now?' },
          { german: 'Ich mache meine Hausaufgaben.', english: 'I am doing my homework.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'mache', du: 'machst', erSieEs: 'macht', wir: 'machen', ihr: 'macht', sie: 'machen' },
          simplePast:  { ich: 'machte', du: 'machtest', erSieEs: 'machte', wir: 'machten', ihr: 'machtet', sie: 'machten' },
          pastPerfect: { ich: 'habe gemacht', du: 'hast gemacht', erSieEs: 'hat gemacht', wir: 'haben gemacht', ihr: 'habt gemacht', sie: 'haben gemacht' },
          future:      { ich: 'werde machen', du: 'wirst machen', erSieEs: 'wird machen', wir: 'werden machen', ihr: 'werdet machen', sie: 'werden machen' },
          imperative:  { du: 'mach!', wir: 'machen wir!', ihr: 'macht!', Sie: 'machen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_273',
        german: 'sagen',
        english: 'to say / to tell',
        wordType: 'verb', level: 'A1',
        description: 'To utter words so as to convey information, an opinion, or a feeling.',
        examples: [
          { german: 'Was willst du sagen?', english: 'What do you want to say?' },
          { german: 'Er sagt, er kommt morgen.', english: 'He says he is coming tomorrow.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'sage', du: 'sagst', erSieEs: 'sagt', wir: 'sagen', ihr: 'sagt', sie: 'sagen' },
          simplePast:  { ich: 'sagte', du: 'sagtest', erSieEs: 'sagte', wir: 'sagten', ihr: 'sagtet', sie: 'sagten' },
          pastPerfect: { ich: 'habe gesagt', du: 'hast gesagt', erSieEs: 'hat gesagt', wir: 'haben gesagt', ihr: 'habt gesagt', sie: 'haben gesagt' },
          future:      { ich: 'werde sagen', du: 'wirst sagen', erSieEs: 'wird sagen', wir: 'werden sagen', ihr: 'werdet sagen', sie: 'werden sagen' },
          imperative:  { du: 'sag!', wir: 'sagen wir!', ihr: 'sagt!', Sie: 'sagen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_274',
        german: 'wissen',
        english: 'to know (a fact)',
        wordType: 'verb', level: 'A1',
        description: 'To be aware of through observation, inquiry, or information.',
        examples: [
          { german: 'Ich weiß es nicht.', english: 'I do not know.' },
          { german: 'Weißt du, wie spät es ist?', english: 'Do you know what time it is?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'weiß', du: 'weißt', erSieEs: 'weiß', wir: 'wissen', ihr: 'wisst', sie: 'wissen' },
          simplePast:  { ich: 'wusste', du: 'wusstest', erSieEs: 'wusste', wir: 'wussten', ihr: 'wusstet', sie: 'wussten' },
          pastPerfect: { ich: 'habe gewusst', du: 'hast gewusst', erSieEs: 'hat gewusst', wir: 'haben gewusst', ihr: 'habt gewusst', sie: 'haben gewusst' },
          future:      { ich: 'werde wissen', du: 'wirst wissen', erSieEs: 'wird wissen', wir: 'werden wissen', ihr: 'werdet wissen', sie: 'werden wissen' },
          imperative:  { du: 'wisse!', wir: 'wissen wir!', ihr: 'wisst!', Sie: 'wissen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_275',
        german: 'werden',
        english: 'to become / will',
        wordType: 'verb', level: 'A2',
        description: 'To come into a specified state; also used as an auxiliary to form the future tense.',
        examples: [
          { german: 'Er will Arzt werden.', english: 'He wants to become a doctor.' },
          { german: 'Es wird morgen regnen.', english: 'It will rain tomorrow.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'sein',
          present:     { ich: 'werde', du: 'wirst', erSieEs: 'wird', wir: 'werden', ihr: 'werdet', sie: 'werden' },
          simplePast:  { ich: 'wurde', du: 'wurdest', erSieEs: 'wurde', wir: 'wurden', ihr: 'wurdet', sie: 'wurden' },
          pastPerfect: { ich: 'bin geworden', du: 'bist geworden', erSieEs: 'ist geworden', wir: 'sind geworden', ihr: 'seid geworden', sie: 'sind geworden' },
          future:      { ich: 'werde werden', du: 'wirst werden', erSieEs: 'wird werden', wir: 'werden werden', ihr: 'werdet werden', sie: 'werden werden' },
          imperative:  { du: 'werde!', wir: 'werden wir!', ihr: 'werdet!', Sie: 'werden Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_276',
        german: 'leben',
        english: 'to live',
        wordType: 'verb', level: 'A1',
        description: 'To be alive; to reside in a particular place.',
        examples: [
          { german: 'Ich lebe in Berlin.', english: 'I live in Berlin.' },
          { german: 'Er lebt sehr gesund.', english: 'He lives very healthily.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'lebe', du: 'lebst', erSieEs: 'lebt', wir: 'leben', ihr: 'lebt', sie: 'leben' },
          simplePast:  { ich: 'lebte', du: 'lebtest', erSieEs: 'lebte', wir: 'lebten', ihr: 'lebtet', sie: 'lebten' },
          pastPerfect: { ich: 'habe gelebt', du: 'hast gelebt', erSieEs: 'hat gelebt', wir: 'haben gelebt', ihr: 'habt gelebt', sie: 'haben gelebt' },
          future:      { ich: 'werde leben', du: 'wirst leben', erSieEs: 'wird leben', wir: 'werden leben', ihr: 'werdet leben', sie: 'werden leben' },
          imperative:  { du: 'lebe!', wir: 'leben wir!', ihr: 'lebt!', Sie: 'leben Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_277',
        german: 'spielen',
        english: 'to play',
        wordType: 'verb', level: 'A1',
        description: 'To engage in activity for enjoyment; to take part in a sport or game.',
        examples: [
          { german: 'Die Kinder spielen draußen.', english: 'The children are playing outside.' },
          { german: 'Ich spiele gern Gitarre.', english: 'I like playing the guitar.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'spiele', du: 'spielst', erSieEs: 'spielt', wir: 'spielen', ihr: 'spielt', sie: 'spielen' },
          simplePast:  { ich: 'spielte', du: 'spieltest', erSieEs: 'spielte', wir: 'spielten', ihr: 'spieltet', sie: 'spielten' },
          pastPerfect: { ich: 'habe gespielt', du: 'hast gespielt', erSieEs: 'hat gespielt', wir: 'haben gespielt', ihr: 'habt gespielt', sie: 'haben gespielt' },
          future:      { ich: 'werde spielen', du: 'wirst spielen', erSieEs: 'wird spielen', wir: 'werden spielen', ihr: 'werdet spielen', sie: 'werden spielen' },
          imperative:  { du: 'spiel!', wir: 'spielen wir!', ihr: 'spielt!', Sie: 'spielen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_278',
        german: 'laufen',
        english: 'to run / to walk',
        wordType: 'verb', level: 'A1',
        description: 'To move swiftly on foot; also used informally to mean walking.',
        examples: [
          { german: 'Er läuft jeden Morgen.', english: 'He runs every morning.' },
          { german: 'Wir laufen in den Park.', english: 'We walk to the park.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'sein',
          present:     { ich: 'laufe', du: 'läufst', erSieEs: 'läuft', wir: 'laufen', ihr: 'lauft', sie: 'laufen' },
          simplePast:  { ich: 'lief', du: 'liefst', erSieEs: 'lief', wir: 'liefen', ihr: 'lieft', sie: 'liefen' },
          pastPerfect: { ich: 'bin gelaufen', du: 'bist gelaufen', erSieEs: 'ist gelaufen', wir: 'sind gelaufen', ihr: 'seid gelaufen', sie: 'sind gelaufen' },
          future:      { ich: 'werde laufen', du: 'wirst laufen', erSieEs: 'wird laufen', wir: 'werden laufen', ihr: 'werdet laufen', sie: 'werden laufen' },
          imperative:  { du: 'lauf!', wir: 'laufen wir!', ihr: 'lauft!', Sie: 'laufen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_279',
        german: 'reisen',
        english: 'to travel',
        wordType: 'verb', level: 'A2',
        description: 'To go from one place to another, typically over a long distance.',
        examples: [
          { german: 'Ich reise gern ins Ausland.', english: 'I like to travel abroad.' },
          { german: 'Wir reisen nächstes Jahr nach Japan.', english: 'We are travelling to Japan next year.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'sein',
          present:     { ich: 'reise', du: 'reist', erSieEs: 'reist', wir: 'reisen', ihr: 'reist', sie: 'reisen' },
          simplePast:  { ich: 'reiste', du: 'reistest', erSieEs: 'reiste', wir: 'reisten', ihr: 'reistet', sie: 'reisten' },
          pastPerfect: { ich: 'bin gereist', du: 'bist gereist', erSieEs: 'ist gereist', wir: 'sind gereist', ihr: 'seid gereist', sie: 'sind gereist' },
          future:      { ich: 'werde reisen', du: 'wirst reisen', erSieEs: 'wird reisen', wir: 'werden reisen', ihr: 'werdet reisen', sie: 'werden reisen' },
          imperative:  { du: 'reise!', wir: 'reisen wir!', ihr: 'reist!', Sie: 'reisen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_280',
        german: 'mögen',
        english: 'to like',
        wordType: 'verb', level: 'A1',
        description: 'To find pleasant or attractive; to be fond of.',
        examples: [
          { german: 'Ich mag Musik sehr.', english: 'I like music very much.' },
          { german: 'Magst du Pizza?', english: 'Do you like pizza?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'mag', du: 'magst', erSieEs: 'mag', wir: 'mögen', ihr: 'mögt', sie: 'mögen' },
          simplePast:  { ich: 'mochte', du: 'mochtest', erSieEs: 'mochte', wir: 'mochten', ihr: 'mochtet', sie: 'mochten' },
          pastPerfect: { ich: 'habe gemocht', du: 'hast gemocht', erSieEs: 'hat gemocht', wir: 'haben gemocht', ihr: 'habt gemocht', sie: 'haben gemocht' },
          future:      { ich: 'werde mögen', du: 'wirst mögen', erSieEs: 'wird mögen', wir: 'werden mögen', ihr: 'werdet mögen', sie: 'werden mögen' },
          imperative:  { du: 'mag!', wir: 'mögen wir!', ihr: 'mögt!', Sie: 'mögen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_281',
        german: 'wollen',
        english: 'to want',
        wordType: 'verb', level: 'A1',
        description: 'To have a desire or wish to do or have something.',
        examples: [
          { german: 'Ich will Deutsch lernen.', english: 'I want to learn German.' },
          { german: 'Was willst du trinken?', english: 'What do you want to drink?' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'will', du: 'willst', erSieEs: 'will', wir: 'wollen', ihr: 'wollt', sie: 'wollen' },
          simplePast:  { ich: 'wollte', du: 'wolltest', erSieEs: 'wollte', wir: 'wollten', ihr: 'wolltet', sie: 'wollten' },
          pastPerfect: { ich: 'habe gewollt', du: 'hast gewollt', erSieEs: 'hat gewollt', wir: 'haben gewollt', ihr: 'habt gewollt', sie: 'haben gewollt' },
          future:      { ich: 'werde wollen', du: 'wirst wollen', erSieEs: 'wird wollen', wir: 'werden wollen', ihr: 'werdet wollen', sie: 'werden wollen' },
          imperative:  { du: 'wolle!', wir: 'wollen wir!', ihr: 'wollt!', Sie: 'wollen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_282',
        german: 'müssen',
        english: 'must / to have to',
        wordType: 'verb', level: 'A1',
        description: 'To be obliged or compelled to do something; an expression of necessity.',
        examples: [
          { german: 'Ich muss jetzt gehen.', english: 'I have to go now.' },
          { german: 'Du musst mehr schlafen.', english: 'You must sleep more.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'muss', du: 'musst', erSieEs: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen' },
          simplePast:  { ich: 'musste', du: 'musstest', erSieEs: 'musste', wir: 'mussten', ihr: 'musstet', sie: 'mussten' },
          pastPerfect: { ich: 'habe gemusst', du: 'hast gemusst', erSieEs: 'hat gemusst', wir: 'haben gemusst', ihr: 'habt gemusst', sie: 'haben gemusst' },
          future:      { ich: 'werde müssen', du: 'wirst müssen', erSieEs: 'wird müssen', wir: 'werden müssen', ihr: 'werdet müssen', sie: 'werden müssen' },
          imperative:  { du: '', wir: '', ihr: '', Sie: '' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_283',
        german: 'können',
        english: 'can / to be able to',
        wordType: 'verb', level: 'A1',
        description: 'To be able to do something; to have the ability or permission.',
        examples: [
          { german: 'Kannst du mir helfen?', english: 'Can you help me?' },
          { german: 'Ich kann Deutsch sprechen.', english: 'I can speak German.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'kann', du: 'kannst', erSieEs: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' },
          simplePast:  { ich: 'konnte', du: 'konntest', erSieEs: 'konnte', wir: 'konnten', ihr: 'konntet', sie: 'konnten' },
          pastPerfect: { ich: 'habe gekonnt', du: 'hast gekonnt', erSieEs: 'hat gekonnt', wir: 'haben gekonnt', ihr: 'habt gekonnt', sie: 'haben gekonnt' },
          future:      { ich: 'werde können', du: 'wirst können', erSieEs: 'wird können', wir: 'werden können', ihr: 'werdet können', sie: 'werden können' },
          imperative:  { du: '', wir: '', ihr: '', Sie: '' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_284',
        german: 'wohnen',
        english: 'to live (reside)',
        wordType: 'verb', level: 'A1',
        description: 'To have one\'s home in a particular place.',
        examples: [
          { german: 'Wo wohnst du?', english: 'Where do you live?' },
          { german: 'Wir wohnen in einer kleinen Wohnung.', english: 'We live in a small apartment.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: true, hilfsverb: 'haben',
          present:     { ich: 'wohne', du: 'wohnst', erSieEs: 'wohnt', wir: 'wohnen', ihr: 'wohnt', sie: 'wohnen' },
          simplePast:  { ich: 'wohnte', du: 'wohntest', erSieEs: 'wohnte', wir: 'wohnten', ihr: 'wohntet', sie: 'wohnten' },
          pastPerfect: { ich: 'habe gewohnt', du: 'hast gewohnt', erSieEs: 'hat gewohnt', wir: 'haben gewohnt', ihr: 'habt gewohnt', sie: 'haben gewohnt' },
          future:      { ich: 'werde wohnen', du: 'wirst wohnen', erSieEs: 'wird wohnen', wir: 'werden wohnen', ihr: 'werdet wohnen', sie: 'werden wohnen' },
          imperative:  { du: 'wohne!', wir: 'wohnen wir!', ihr: 'wohnt!', Sie: 'wohnen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_285',
        german: 'treffen',
        english: 'to meet',
        wordType: 'verb', level: 'A2',
        description: 'To come together with someone by arrangement or by chance.',
        examples: [
          { german: 'Wir treffen uns um 18 Uhr.', english: 'We are meeting at 6 PM.' },
          { german: 'Ich treffe heute meinen Freund.', english: 'I am meeting my friend today.' }
        ],
        learned: false,
        verbDetails: {
          isSeparable: false, isRegular: false, hilfsverb: 'haben',
          present:     { ich: 'treffe', du: 'triffst', erSieEs: 'trifft', wir: 'treffen', ihr: 'trefft', sie: 'treffen' },
          simplePast:  { ich: 'traf', du: 'trafst', erSieEs: 'traf', wir: 'trafen', ihr: 'traft', sie: 'trafen' },
          pastPerfect: { ich: 'habe getroffen', du: 'hast getroffen', erSieEs: 'hat getroffen', wir: 'haben getroffen', ihr: 'habt getroffen', sie: 'haben getroffen' },
          future:      { ich: 'werde treffen', du: 'wirst treffen', erSieEs: 'wird treffen', wir: 'werden treffen', ihr: 'werdet treffen', sie: 'werden treffen' },
          imperative:  { du: 'triff!', wir: 'treffen wir!', ihr: 'trefft!', Sie: 'treffen Sie!' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_286',
        german: 'neu',
        english: 'new',
        wordType: 'adjective', level: 'A1',
        description: 'Not existing before; made, introduced, or discovered recently.',
        examples: [
          { german: 'Das ist ein neues Buch.', english: 'That is a new book.' },
          { german: 'Ich habe ein neues Auto.', english: 'I have a new car.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'neuer', superlativ: 'am neusten',
          deklinationMaskulin: { nominative: 'neuer', akkusativ: 'neuen', genitiv: 'neuen', dativ: 'neuem' },
          deklinationFeminin:  { nominative: 'neue',  akkusativ: 'neue',  genitiv: 'neuer', dativ: 'neuer' },
          deklinationNeutral:  { nominative: 'neues', akkusativ: 'neues', genitiv: 'neuen', dativ: 'neuem' },
          deklinationPlurar:   { nominative: 'neue',  akkusativ: 'neue',  genitiv: 'neuer', dativ: 'neuen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_287',
        german: 'alt',
        english: 'old',
        wordType: 'adjective', level: 'A1',
        description: 'Having lived for a long time; no longer young.',
        examples: [
          { german: 'Das Haus ist sehr alt.', english: 'The house is very old.' },
          { german: 'Wie alt bist du?', english: 'How old are you?' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'älter', superlativ: 'am ältesten',
          deklinationMaskulin: { nominative: 'alter', akkusativ: 'alten', genitiv: 'alten', dativ: 'altem' },
          deklinationFeminin:  { nominative: 'alte',  akkusativ: 'alte',  genitiv: 'alter', dativ: 'alter' },
          deklinationNeutral:  { nominative: 'altes', akkusativ: 'altes', genitiv: 'alten', dativ: 'altem' },
          deklinationPlurar:   { nominative: 'alte',  akkusativ: 'alte',  genitiv: 'alter', dativ: 'alten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_288',
        german: 'jung',
        english: 'young',
        wordType: 'adjective', level: 'A1',
        description: 'Having lived or existed for only a short time; not old.',
        examples: [
          { german: 'Sie ist noch sehr jung.', english: 'She is still very young.' },
          { german: 'Junge Menschen haben viele Ideen.', english: 'Young people have many ideas.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'jünger', superlativ: 'am jüngsten',
          deklinationMaskulin: { nominative: 'junger', akkusativ: 'jungen', genitiv: 'jungen', dativ: 'jungem' },
          deklinationFeminin:  { nominative: 'junge',  akkusativ: 'junge',  genitiv: 'junger', dativ: 'junger' },
          deklinationNeutral:  { nominative: 'junges', akkusativ: 'junges', genitiv: 'jungen', dativ: 'jungem' },
          deklinationPlurar:   { nominative: 'junge',  akkusativ: 'junge',  genitiv: 'junger', dativ: 'jungen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_289',
        german: 'gut',
        english: 'good',
        wordType: 'adjective', level: 'A1',
        description: 'To be desired or approved of; of high quality.',
        examples: [
          { german: 'Das Essen ist sehr gut.', english: 'The food is very good.' },
          { german: 'Er ist ein guter Freund.', english: 'He is a good friend.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'besser', superlativ: 'am besten',
          deklinationMaskulin: { nominative: 'guter', akkusativ: 'guten', genitiv: 'guten', dativ: 'gutem' },
          deklinationFeminin:  { nominative: 'gute',  akkusativ: 'gute',  genitiv: 'guter', dativ: 'guter' },
          deklinationNeutral:  { nominative: 'gutes', akkusativ: 'gutes', genitiv: 'guten', dativ: 'gutem' },
          deklinationPlurar:   { nominative: 'gute',  akkusativ: 'gute',  genitiv: 'guter', dativ: 'guten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_290',
        german: 'schlecht',
        english: 'bad / poor',
        wordType: 'adjective', level: 'A1',
        description: 'Of poor quality; not good.',
        examples: [
          { german: 'Das Wetter ist heute schlecht.', english: 'The weather is bad today.' },
          { german: 'Mir ist schlecht.', english: 'I feel sick / nauseous.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'schlechter', superlativ: 'am schlechtesten',
          deklinationMaskulin: { nominative: 'schlechter', akkusativ: 'schlechten', genitiv: 'schlechten', dativ: 'schlechtem' },
          deklinationFeminin:  { nominative: 'schlechte',  akkusativ: 'schlechte',  genitiv: 'schlechter', dativ: 'schlechter' },
          deklinationNeutral:  { nominative: 'schlechtes', akkusativ: 'schlechtes', genitiv: 'schlechten', dativ: 'schlechtem' },
          deklinationPlurar:   { nominative: 'schlechte',  akkusativ: 'schlechte',  genitiv: 'schlechter', dativ: 'schlechten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_291',
        german: 'heiß',
        english: 'hot',
        wordType: 'adjective', level: 'A1',
        description: 'Having a high degree of heat or a high temperature.',
        examples: [
          { german: 'Der Kaffee ist sehr heiß.', english: 'The coffee is very hot.' },
          { german: 'Im Sommer ist es oft heiß.', english: 'In summer it is often hot.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'heißer', superlativ: 'am heißesten',
          deklinationMaskulin: { nominative: 'heißer', akkusativ: 'heißen', genitiv: 'heißen', dativ: 'heißem' },
          deklinationFeminin:  { nominative: 'heiße',  akkusativ: 'heiße',  genitiv: 'heißer', dativ: 'heißer' },
          deklinationNeutral:  { nominative: 'heißes', akkusativ: 'heißes', genitiv: 'heißen', dativ: 'heißem' },
          deklinationPlurar:   { nominative: 'heiße',  akkusativ: 'heiße',  genitiv: 'heißer', dativ: 'heißen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_292',
        german: 'warm',
        english: 'warm',
        wordType: 'adjective', level: 'A1',
        description: 'Of or at a fairly or comfortably high temperature.',
        examples: [
          { german: 'Heute ist es warm draußen.', english: 'It is warm outside today.' },
          { german: 'Zieh dich warm an!', english: 'Dress warmly!' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'wärmer', superlativ: 'am wärmsten',
          deklinationMaskulin: { nominative: 'warmer', akkusativ: 'warmen', genitiv: 'warmen', dativ: 'warmem' },
          deklinationFeminin:  { nominative: 'warme',  akkusativ: 'warme',  genitiv: 'warmer', dativ: 'warmer' },
          deklinationNeutral:  { nominative: 'warmes', akkusativ: 'warmes', genitiv: 'warmen', dativ: 'warmem' },
          deklinationPlurar:   { nominative: 'warme',  akkusativ: 'warme',  genitiv: 'warmer', dativ: 'warmen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_293',
        german: 'glücklich',
        english: 'happy',
        wordType: 'adjective', level: 'A2',
        description: 'Feeling or showing pleasure, contentment, or joy.',
        examples: [
          { german: 'Sie ist sehr glücklich.', english: 'She is very happy.' },
          { german: 'Er macht mich glücklich.', english: 'He makes me happy.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'glücklicher', superlativ: 'am glücklichsten',
          deklinationMaskulin: { nominative: 'glücklicher', akkusativ: 'glücklichen', genitiv: 'glücklichen', dativ: 'glücklichem' },
          deklinationFeminin:  { nominative: 'glückliche',  akkusativ: 'glückliche',  genitiv: 'glücklicher', dativ: 'glücklicher' },
          deklinationNeutral:  { nominative: 'glückliches', akkusativ: 'glückliches', genitiv: 'glücklichen', dativ: 'glücklichem' },
          deklinationPlurar:   { nominative: 'glückliche',  akkusativ: 'glückliche',  genitiv: 'glücklicher', dativ: 'glücklichen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_294',
        german: 'traurig',
        english: 'sad',
        wordType: 'adjective', level: 'A2',
        description: 'Feeling or showing sorrow; unhappy.',
        examples: [
          { german: 'Er ist heute sehr traurig.', english: 'He is very sad today.' },
          { german: 'Das ist eine traurige Geschichte.', english: 'That is a sad story.' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'trauriger', superlativ: 'am traurigsten',
          deklinationMaskulin: { nominative: 'trauriger', akkusativ: 'traurigen', genitiv: 'traurigen', dativ: 'traurigem' },
          deklinationFeminin:  { nominative: 'traurige',  akkusativ: 'traurige',  genitiv: 'trauriger', dativ: 'trauriger' },
          deklinationNeutral:  { nominative: 'trauriges', akkusativ: 'trauriges', genitiv: 'traurigen', dativ: 'traurigem' },
          deklinationPlurar:   { nominative: 'traurige',  akkusativ: 'traurige',  genitiv: 'trauriger', dativ: 'traurigen' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_295',
        german: 'laut',
        english: 'loud / noisy',
        wordType: 'adjective', level: 'A2',
        description: 'Making or capable of making a great deal of noise.',
        examples: [
          { german: 'Die Musik ist zu laut.', english: 'The music is too loud.' },
          { german: 'Sprich bitte nicht so laut!', english: 'Please do not speak so loudly!' }
        ],
        learned: false,
        adjectiveDetails: {
          komparativ: 'lauter', superlativ: 'am lautesten',
          deklinationMaskulin: { nominative: 'lauter', akkusativ: 'lauten', genitiv: 'lauten', dativ: 'lautem' },
          deklinationFeminin:  { nominative: 'laute',  akkusativ: 'laute',  genitiv: 'lauter', dativ: 'lauter' },
          deklinationNeutral:  { nominative: 'lautes', akkusativ: 'lautes', genitiv: 'lauten', dativ: 'lautem' },
          deklinationPlurar:   { nominative: 'laute',  akkusativ: 'laute',  genitiv: 'lauter', dativ: 'lauten' }
        },
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_296',
        german: 'vielleicht',
        english: 'maybe / perhaps',
        wordType: 'adverb', level: 'A2',
        description: 'Used to indicate uncertainty or possibility.',
        examples: [
          { german: 'Vielleicht komme ich morgen.', english: 'Maybe I will come tomorrow.' },
          { german: 'Das ist vielleicht möglich.', english: 'That is perhaps possible.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_297',
        german: 'natürlich',
        english: 'of course / naturally',
        wordType: 'adverb', level: 'A2',
        description: 'As expected; used to express that something is obvious or certain.',
        examples: [
          { german: 'Natürlich helfe ich dir!', english: 'Of course I will help you!' },
          { german: 'Das ist natürlich richtig.', english: 'That is of course correct.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_298',
        german: 'wahrscheinlich',
        english: 'probably',
        wordType: 'adverb', level: 'B1',
        description: 'Used to indicate that something is likely to happen or be the case.',
        examples: [
          { german: 'Er kommt wahrscheinlich zu spät.', english: 'He will probably be late.' },
          { german: 'Das wird wahrscheinlich klappen.', english: 'That will probably work out.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_299',
        german: 'schon',
        english: 'already / yet',
        wordType: 'adverb', level: 'A2',
        description: 'Used to indicate that something has happened earlier than expected.',
        examples: [
          { german: 'Bist du schon fertig?', english: 'Are you already done?' },
          { german: 'Ich habe das schon gemacht.', english: 'I have already done that.' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      },
      {
        _id: 'vocab_sample_300',
        german: 'noch',
        english: 'still / yet / another',
        wordType: 'adverb', level: 'A2',
        description: 'Continuing to happen or be the case; used to indicate something additional.',
        examples: [
          { german: 'Ich bin noch nicht fertig.', english: 'I am not done yet.' },
          { german: 'Möchtest du noch einen Kaffee?', english: 'Would you like another coffee?' }
        ],
        learned: false,
        createdAt: now, updatedAt: now
      }
    ];
    await this.db.bulkSave(samples);
    await this.db.saveSetting('seeded', 'true');
    }

    // v2 daily-use vocabs
    const seededV2 = await this.db.getSetting('seeded_v2');
    if (seededV2 !== 'true') {
      const now = new Date().toISOString();
      const samplesV2: Vocabulary[] = [
      { _id: 'vocab_sample_301', german: 'erfassen', english: 'to capture / to record / to grasp', wordType: 'verb', level: 'B1', description: 'To record or capture data; to understand something fully.', examples: [{ german: 'Wir müssen die Daten erfassen.', english: 'We need to capture the data.' }, { german: 'Ich habe das Problem sofort erfasst.', english: 'I grasped the problem immediately.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_302', german: 'ersetzen', english: 'to replace / to substitute', wordType: 'verb', level: 'B1', description: 'To put something new in place of something else.', examples: [{ german: 'Kannst du die Batterie ersetzen?', english: 'Can you replace the battery?' }, { german: 'Er wurde durch einen Kollegen ersetzt.', english: 'He was replaced by a colleague.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_303', german: 'Zusammenfassung', english: 'summary / abstract', wordType: 'noun', level: 'B1', description: 'A brief account giving the main points of something.', examples: [{ german: 'Schreib bitte eine kurze Zusammenfassung.', english: 'Please write a short summary.' }, { german: 'Die Zusammenfassung des Berichts war hilfreich.', english: 'The summary of the report was helpful.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Zusammenfassungen', deklinationBestimmt: { nominative: 'die Zusammenfassung', akkusativ: 'die Zusammenfassung', genitiv: 'der Zusammenfassung', dativ: 'der Zusammenfassung' }, deklinationUnbestimmt: { nominative: 'eine Zusammenfassung', akkusativ: 'eine Zusammenfassung', genitiv: 'einer Zusammenfassung', dativ: 'einer Zusammenfassung' } } },
      { _id: 'vocab_sample_304', german: 'überprüfen', english: 'to check / to verify / to review', wordType: 'verb', level: 'B1', description: 'To examine something to make sure it is correct or satisfactory.', examples: [{ german: 'Bitte überprüf deine E-Mails.', english: 'Please check your emails.' }, { german: 'Wir müssen die Ergebnisse überprüfen.', english: 'We need to verify the results.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_305', german: 'vorhaben', english: 'to plan / to intend', wordType: 'verb', level: 'A2', description: 'To have something planned for the future.', examples: [{ german: 'Was hast du heute vor?', english: 'What do you plan to do today?' }, { german: 'Ich habe vor, morgen früh aufzustehen.', english: 'I intend to get up early tomorrow.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_306', german: 'Aufwand', english: 'effort / expenditure / cost', wordType: 'noun', level: 'B2', description: 'The time, energy or resources needed to do something.', examples: [{ german: 'Das lohnt den Aufwand nicht.', english: 'It\'s not worth the effort.' }, { german: 'Der Aufwand war enorm.', english: 'The effort was enormous.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Aufwände', deklinationBestimmt: { nominative: 'der Aufwand', akkusativ: 'den Aufwand', genitiv: 'des Aufwands', dativ: 'dem Aufwand' }, deklinationUnbestimmt: { nominative: 'ein Aufwand', akkusativ: 'einen Aufwand', genitiv: 'eines Aufwands', dativ: 'einem Aufwand' } } },
      { _id: 'vocab_sample_307', german: 'beschreiben', english: 'to describe', wordType: 'verb', level: 'A2', description: 'To give an account of something in words.', examples: [{ german: 'Kannst du mir den Weg beschreiben?', english: 'Can you describe the way to me?' }, { german: 'Beschreib mir dein Problem.', english: 'Describe your problem to me.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_308', german: 'feststellen', english: 'to determine / to find out / to notice', wordType: 'verb', level: 'B1', description: 'To establish something as a fact; to notice or discover.', examples: [{ german: 'Ich habe festgestellt, dass er fehlt.', english: 'I noticed that he is missing.' }, { german: 'Es wurde festgestellt, dass die Daten falsch sind.', english: 'It was determined that the data is wrong.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_309', german: 'vermeiden', english: 'to avoid', wordType: 'verb', level: 'B1', description: 'To keep away from or stop oneself from doing something.', examples: [{ german: 'Ich versuche Zucker zu vermeiden.', english: 'I try to avoid sugar.' }, { german: 'Fehler lassen sich nicht immer vermeiden.', english: 'Mistakes cannot always be avoided.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_310', german: 'eintragen', english: 'to enter / to register / to record', wordType: 'verb', level: 'B1', description: 'To write or enter something into a list, form or register.', examples: [{ german: 'Bitte trag deinen Namen ein.', english: 'Please enter your name.' }, { german: 'Der Termin wurde eingetragen.', english: 'The appointment was recorded.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_311', german: 'Fortschritt', english: 'progress / advance', wordType: 'noun', level: 'B1', description: 'Forward movement towards a goal.', examples: [{ german: 'Du machst große Fortschritte.', english: 'You are making great progress.' }, { german: 'Der technische Fortschritt ist beeindruckend.', english: 'Technological progress is impressive.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Fortschritte', deklinationBestimmt: { nominative: 'der Fortschritt', akkusativ: 'den Fortschritt', genitiv: 'des Fortschritts', dativ: 'dem Fortschritt' }, deklinationUnbestimmt: { nominative: 'ein Fortschritt', akkusativ: 'einen Fortschritt', genitiv: 'eines Fortschritts', dativ: 'einem Fortschritt' } } },
      { _id: 'vocab_sample_312', german: 'verwalten', english: 'to manage / to administer', wordType: 'verb', level: 'B2', description: 'To be responsible for controlling or organising something.', examples: [{ german: 'Er verwaltet das Budget.', english: 'He manages the budget.' }, { german: 'Die Dateien werden zentral verwaltet.', english: 'The files are managed centrally.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_313', german: 'Gelegenheit', english: 'opportunity / occasion', wordType: 'noun', level: 'B1', description: 'A set of circumstances that makes something possible.', examples: [{ german: 'Nutze die Gelegenheit!', english: 'Take the opportunity!' }, { german: 'Ich hatte keine Gelegenheit, ihn anzurufen.', english: 'I had no opportunity to call him.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Gelegenheiten', deklinationBestimmt: { nominative: 'die Gelegenheit', akkusativ: 'die Gelegenheit', genitiv: 'der Gelegenheit', dativ: 'der Gelegenheit' }, deklinationUnbestimmt: { nominative: 'eine Gelegenheit', akkusativ: 'eine Gelegenheit', genitiv: 'einer Gelegenheit', dativ: 'einer Gelegenheit' } } },
      { _id: 'vocab_sample_314', german: 'sich kümmern um', english: 'to take care of / to look after', wordType: 'verb', level: 'A2', description: 'To be responsible for someone or something.', examples: [{ german: 'Ich kümmere mich darum.', english: 'I will take care of it.' }, { german: 'Sie kümmert sich um die Kinder.', english: 'She looks after the children.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_315', german: 'hinweisen auf', english: 'to point out / to refer to', wordType: 'verb', level: 'B2', description: 'To draw attention to something.', examples: [{ german: 'Er hat auf den Fehler hingewiesen.', english: 'He pointed out the mistake.' }, { german: 'Darf ich auf ein Problem hinweisen?', english: 'May I point out a problem?' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_316', german: 'Voraussetzung', english: 'requirement / prerequisite / condition', wordType: 'noun', level: 'B2', description: 'Something that must exist before something else is possible.', examples: [{ german: 'Was sind die Voraussetzungen?', english: 'What are the requirements?' }, { german: 'Gute Sprachkenntnisse sind eine Voraussetzung.', english: 'Good language skills are a prerequisite.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Voraussetzungen', deklinationBestimmt: { nominative: 'die Voraussetzung', akkusativ: 'die Voraussetzung', genitiv: 'der Voraussetzung', dativ: 'der Voraussetzung' }, deklinationUnbestimmt: { nominative: 'eine Voraussetzung', akkusativ: 'eine Voraussetzung', genitiv: 'einer Voraussetzung', dativ: 'einer Voraussetzung' } } },
      { _id: 'vocab_sample_317', german: 'anpassen', english: 'to adapt / to adjust', wordType: 'verb', level: 'B1', description: 'To change something to fit a new situation.', examples: [{ german: 'Wir müssen uns anpassen.', english: 'We need to adapt.' }, { german: 'Die Einstellungen können angepasst werden.', english: 'The settings can be adjusted.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_318', german: 'berücksichtigen', english: 'to consider / to take into account', wordType: 'verb', level: 'B2', description: 'To take something into consideration when making a decision.', examples: [{ german: 'Das müssen wir berücksichtigen.', english: 'We must take that into account.' }, { german: 'Alle Faktoren wurden berücksichtigt.', english: 'All factors were considered.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_319', german: 'Zusammenhang', english: 'context / connection / relationship', wordType: 'noun', level: 'B2', description: 'The circumstances or setting in which something occurs; a logical connection.', examples: [{ german: 'In welchem Zusammenhang steht das?', english: 'In what context does that stand?' }, { german: 'Es gibt einen klaren Zusammenhang.', english: 'There is a clear connection.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Zusammenhänge', deklinationBestimmt: { nominative: 'der Zusammenhang', akkusativ: 'den Zusammenhang', genitiv: 'des Zusammenhangs', dativ: 'dem Zusammenhang' }, deklinationUnbestimmt: { nominative: 'ein Zusammenhang', akkusativ: 'einen Zusammenhang', genitiv: 'eines Zusammenhangs', dativ: 'einem Zusammenhang' } } },
      { _id: 'vocab_sample_320', german: 'durchführen', english: 'to carry out / to conduct / to implement', wordType: 'verb', level: 'B1', description: 'To carry out a plan, task or activity.', examples: [{ german: 'Wir führen einen Test durch.', english: 'We are conducting a test.' }, { german: 'Das Projekt wurde erfolgreich durchgeführt.', english: 'The project was successfully carried out.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_321', german: 'aufmerksam', english: 'attentive / alert / mindful', wordType: 'adjective', level: 'B1', description: 'Paying close attention; considerate towards others.', examples: [{ german: 'Sei aufmerksam im Unterricht.', english: 'Be attentive in class.' }, { german: 'Er ist ein aufmerksamer Zuhörer.', english: 'He is an attentive listener.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_322', german: 'Ablauf', english: 'process / sequence / procedure', wordType: 'noun', level: 'B1', description: 'The way in which something happens or is done; a sequence of steps.', examples: [{ german: 'Wie ist der Ablauf?', english: 'What is the process?' }, { german: 'Der Ablauf des Meetings war gut.', english: 'The sequence of the meeting was good.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Abläufe', deklinationBestimmt: { nominative: 'der Ablauf', akkusativ: 'den Ablauf', genitiv: 'des Ablaufs', dativ: 'dem Ablauf' }, deklinationUnbestimmt: { nominative: 'ein Ablauf', akkusativ: 'einen Ablauf', genitiv: 'eines Ablaufs', dativ: 'einem Ablauf' } } },
      { _id: 'vocab_sample_323', german: 'vorbereiten', english: 'to prepare', wordType: 'verb', level: 'A2', description: 'To make something or someone ready in advance.', examples: [{ german: 'Ich bereite das Essen vor.', english: 'I am preparing the food.' }, { german: 'Hast du dich auf das Gespräch vorbereitet?', english: 'Did you prepare for the conversation?' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_324', german: 'beantragen', english: 'to apply for / to request', wordType: 'verb', level: 'B1', description: 'To formally request something, especially from an authority.', examples: [{ german: 'Ich muss einen Ausweis beantragen.', english: 'I need to apply for an ID.' }, { german: 'Er hat Urlaub beantragt.', english: 'He applied for leave.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_325', german: 'Unterlagen', english: 'documents / paperwork / files', wordType: 'noun', level: 'B1', description: 'Papers or documents needed for a particular purpose.', examples: [{ german: 'Bitte schick mir die Unterlagen.', english: 'Please send me the documents.' }, { german: 'Alle Unterlagen müssen eingereicht werden.', english: 'All paperwork must be submitted.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Unterlagen', deklinationBestimmt: { nominative: 'die Unterlagen', akkusativ: 'die Unterlagen', genitiv: 'der Unterlagen', dativ: 'den Unterlagen' }, deklinationUnbestimmt: { nominative: 'Unterlagen', akkusativ: 'Unterlagen', genitiv: 'von Unterlagen', dativ: 'Unterlagen' } } },
      { _id: 'vocab_sample_326', german: 'ausfüllen', english: 'to fill in / to fill out / to complete', wordType: 'verb', level: 'A2', description: 'To write the required information in a form or document.', examples: [{ german: 'Füll bitte das Formular aus.', english: 'Please fill out the form.' }, { german: 'Alle Felder müssen ausgefüllt werden.', english: 'All fields must be filled in.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_327', german: 'klären', english: 'to clarify / to resolve / to settle', wordType: 'verb', level: 'B1', description: 'To make a matter clear or to resolve a disagreement.', examples: [{ german: 'Das müssen wir noch klären.', english: 'We still need to clarify that.' }, { german: 'Das Missverständnis wurde geklärt.', english: 'The misunderstanding was resolved.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_328', german: 'zustimmen', english: 'to agree / to consent / to approve', wordType: 'verb', level: 'B1', description: 'To express agreement or approval.', examples: [{ german: 'Ich stimme dir zu.', english: 'I agree with you.' }, { german: 'Er hat dem Vorschlag zugestimmt.', english: 'He approved the proposal.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_329', german: 'ablehnen', english: 'to reject / to refuse / to decline', wordType: 'verb', level: 'B1', description: 'To say no to an offer, request or proposal.', examples: [{ german: 'Ich muss das Angebot ablehnen.', english: 'I have to decline the offer.' }, { german: 'Der Antrag wurde abgelehnt.', english: 'The application was rejected.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_330', german: 'verschieben', english: 'to postpone / to move / to shift', wordType: 'verb', level: 'B1', description: 'To change something to a later time; to move something physically.', examples: [{ german: 'Das Meeting wurde verschoben.', english: 'The meeting was postponed.' }, { german: 'Können wir den Termin verschieben?', english: 'Can we shift the appointment?' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_331', german: 'Rückmeldung', english: 'feedback / response / reply', wordType: 'noun', level: 'B1', description: 'Information given in response to a product, service or action.', examples: [{ german: 'Ich warte auf deine Rückmeldung.', english: 'I am waiting for your feedback.' }, { german: 'Bitte gib mir eine kurze Rückmeldung.', english: 'Please give me a brief response.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Rückmeldungen', deklinationBestimmt: { nominative: 'die Rückmeldung', akkusativ: 'die Rückmeldung', genitiv: 'der Rückmeldung', dativ: 'der Rückmeldung' }, deklinationUnbestimmt: { nominative: 'eine Rückmeldung', akkusativ: 'eine Rückmeldung', genitiv: 'einer Rückmeldung', dativ: 'einer Rückmeldung' } } },
      { _id: 'vocab_sample_332', german: 'einhalten', english: 'to keep / to comply with / to observe', wordType: 'verb', level: 'B2', description: 'To stick to a rule, deadline or promise.', examples: [{ german: 'Bitte halte die Frist ein.', english: 'Please keep the deadline.' }, { german: 'Die Regeln müssen eingehalten werden.', english: 'The rules must be complied with.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_333', german: 'Bedarf', english: 'need / demand / requirement', wordType: 'noun', level: 'B2', description: 'The need or demand for something.', examples: [{ german: 'Es besteht Bedarf an Fachkräften.', english: 'There is a need for skilled workers.' }, { german: 'Je nach Bedarf.', english: 'As required / depending on demand.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Bedarfe', deklinationBestimmt: { nominative: 'der Bedarf', akkusativ: 'den Bedarf', genitiv: 'des Bedarfs', dativ: 'dem Bedarf' }, deklinationUnbestimmt: { nominative: 'ein Bedarf', akkusativ: 'einen Bedarf', genitiv: 'eines Bedarfs', dativ: 'einem Bedarf' } } },
      { _id: 'vocab_sample_334', german: 'mitteilen', english: 'to inform / to notify / to communicate', wordType: 'verb', level: 'B1', description: 'To tell someone something; to pass on information.', examples: [{ german: 'Ich teile dir das Ergebnis mit.', english: 'I will inform you of the result.' }, { german: 'Bitte teil uns deine Adresse mit.', english: 'Please communicate your address to us.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_335', german: 'nachfragen', english: 'to follow up / to enquire / to ask again', wordType: 'verb', level: 'B1', description: 'To ask for more information or to check on something.', examples: [{ german: 'Ich frage noch mal nach.', english: 'I will follow up again.' }, { german: 'Er hat beim Arzt nachgefragt.', english: 'He enquired with the doctor.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_336', german: 'gewährleisten', english: 'to ensure / to guarantee', wordType: 'verb', level: 'C1', description: 'To make certain that something will happen or be the case.', examples: [{ german: 'Wir müssen die Qualität gewährleisten.', english: 'We must ensure the quality.' }, { german: 'Das System gewährleistet die Sicherheit.', english: 'The system guarantees security.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_337', german: 'Anforderung', english: 'requirement / demand', wordType: 'noun', level: 'B2', description: 'Something that is needed or obligatory.', examples: [{ german: 'Welche Anforderungen gibt es?', english: 'What are the requirements?' }, { german: 'Er erfüllt alle Anforderungen.', english: 'He meets all the requirements.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Anforderungen', deklinationBestimmt: { nominative: 'die Anforderung', akkusativ: 'die Anforderung', genitiv: 'der Anforderung', dativ: 'der Anforderung' }, deklinationUnbestimmt: { nominative: 'eine Anforderung', akkusativ: 'eine Anforderung', genitiv: 'einer Anforderung', dativ: 'einer Anforderung' } } },
      { _id: 'vocab_sample_338', german: 'verbessern', english: 'to improve / to enhance', wordType: 'verb', level: 'A2', description: 'To make something better than it was before.', examples: [{ german: 'Ich möchte mein Deutsch verbessern.', english: 'I want to improve my German.' }, { german: 'Das Produkt wurde stark verbessert.', english: 'The product was greatly enhanced.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_339', german: 'vergleichen', english: 'to compare', wordType: 'verb', level: 'B1', description: 'To examine the differences and similarities between things.', examples: [{ german: 'Lass uns die Preise vergleichen.', english: 'Let us compare the prices.' }, { german: 'Man kann die beiden nicht vergleichen.', english: 'The two cannot be compared.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_340', german: 'erwähnen', english: 'to mention', wordType: 'verb', level: 'B1', description: 'To refer to something briefly.', examples: [{ german: 'Er hat das kurz erwähnt.', english: 'He briefly mentioned it.' }, { german: 'Das wurde im Bericht erwähnt.', english: 'That was mentioned in the report.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_341', german: 'begründen', english: 'to justify / to give reasons for / to found', wordType: 'verb', level: 'B2', description: 'To give reasons for a decision or action.', examples: [{ german: 'Kannst du deine Meinung begründen?', english: 'Can you justify your opinion?' }, { german: 'Die Entscheidung wurde nicht begründet.', english: 'The decision was not justified.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_342', german: 'ausdrücken', english: 'to express / to squeeze out', wordType: 'verb', level: 'B1', description: 'To convey a thought or feeling in words.', examples: [{ german: 'Ich kann mich kaum ausdrücken.', english: 'I can hardly express myself.' }, { german: 'Sie drückte ihre Dankbarkeit aus.', english: 'She expressed her gratitude.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_343', german: 'beachten', english: 'to pay attention to / to observe / to note', wordType: 'verb', level: 'B1', description: 'To take notice of; to comply with a rule or instruction.', examples: [{ german: 'Bitte beachte die Hinweise.', english: 'Please pay attention to the instructions.' }, { german: 'Das muss beachtet werden.', english: 'This must be observed.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_344', german: 'umsetzen', english: 'to implement / to put into practice / to convert', wordType: 'verb', level: 'B2', description: 'To put a plan or idea into action.', examples: [{ german: 'Wir setzen den Plan jetzt um.', english: 'We are now implementing the plan.' }, { german: 'Die Ideen wurden gut umgesetzt.', english: 'The ideas were well put into practice.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_345', german: 'abschließen', english: 'to complete / to conclude / to lock', wordType: 'verb', level: 'B1', description: 'To bring something to an end; also to lock something.', examples: [{ german: 'Wann schließt du das Projekt ab?', english: 'When will you complete the project?' }, { german: 'Der Vertrag wurde abgeschlossen.', english: 'The contract was concluded.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_346', german: 'Lösung', english: 'solution / answer', wordType: 'noun', level: 'A2', description: 'A way of solving a problem or dealing with a difficult situation.', examples: [{ german: 'Wir brauchen eine Lösung.', english: 'We need a solution.' }, { german: 'Hast du die Lösung gefunden?', english: 'Did you find the answer?' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Lösungen', deklinationBestimmt: { nominative: 'die Lösung', akkusativ: 'die Lösung', genitiv: 'der Lösung', dativ: 'der Lösung' }, deklinationUnbestimmt: { nominative: 'eine Lösung', akkusativ: 'eine Lösung', genitiv: 'einer Lösung', dativ: 'einer Lösung' } } },
      { _id: 'vocab_sample_347', german: 'aufgreifen', english: 'to pick up / to take up / to address', wordType: 'verb', level: 'C1', description: 'To adopt or deal with an idea, topic or problem.', examples: [{ german: 'Darf ich diesen Punkt aufgreifen?', english: 'May I pick up on this point?' }, { german: 'Das Thema wurde im Meeting aufgegriffen.', english: 'The topic was addressed in the meeting.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_348', german: 'nachvollziehen', english: 'to understand / to follow / to retrace', wordType: 'verb', level: 'B2', description: 'To understand someone\'s reasoning or to follow a line of thought.', examples: [{ german: 'Das kann ich gut nachvollziehen.', english: 'I can well understand that.' }, { german: 'Ich kann deine Entscheidung nicht nachvollziehen.', english: 'I cannot follow your decision.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_349', german: 'zuständig', english: 'responsible / in charge / competent', wordType: 'adjective', level: 'B1', description: 'Being the person or authority responsible for something.', examples: [{ german: 'Wer ist dafür zuständig?', english: 'Who is responsible for that?' }, { german: 'Ich bin nicht zuständig.', english: 'I am not in charge of that.' }], learned: false, createdAt: now, updatedAt: now },
      { _id: 'vocab_sample_350', german: 'Zeitraum', english: 'period of time / timeframe', wordType: 'noun', level: 'B1', description: 'A specific length of time.', examples: [{ german: 'In welchem Zeitraum soll das passieren?', english: 'In which timeframe should that happen?' }, { german: 'Über einen langen Zeitraum hinweg.', english: 'Over a long period of time.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Zeiträume', deklinationBestimmt: { nominative: 'der Zeitraum', akkusativ: 'den Zeitraum', genitiv: 'des Zeitraums', dativ: 'dem Zeitraum' }, deklinationUnbestimmt: { nominative: 'ein Zeitraum', akkusativ: 'einen Zeitraum', genitiv: 'eines Zeitraums', dativ: 'einem Zeitraum' } } },
    ];
    await this.db.bulkSave(samplesV2);
    await this.db.saveSetting('seeded_v2', 'true');
    }

    // Migration: strip article prefix from german field for all nouns (runs once)
    const articleFix = await this.db.getSetting('noun_german_article_fix');
    if (articleFix !== 'true') {
      const allVocabs = await this.db.getAll();
      const toFix = allVocabs.filter(v =>
        v.wordType === 'noun' &&
        v.nounDetails?.article &&
        v.german.startsWith(v.nounDetails.article + ' ')
      );
      for (const v of toFix) {
        await this.db.save({ ...v, german: v.german.slice((v.nounDetails!.article + ' ').length) });
      }
      await this.db.saveSetting('noun_german_article_fix', 'true');
    }

    // v3 — animals, daily verbs, adjectives, adverbs
    const seededV3 = await this.db.getSetting('seeded_v3');
    if (seededV3 !== 'true') {
      const now = new Date().toISOString();
      const samplesV3: Vocabulary[] = [
        // ── Animals ────────────────────────────────────────────────────────────
        { _id: 'vocab_sample_351', german: 'Vogel', english: 'bird', wordType: 'noun', level: 'A1', description: 'A warm-blooded vertebrate with feathers and wings.', examples: [{ german: 'Der Vogel singt schön.', english: 'The bird sings beautifully.' }, { german: 'Vögel fliegen südlich im Winter.', english: 'Birds fly south in winter.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Vögel', deklinationBestimmt: { nominative: 'der Vogel', akkusativ: 'den Vogel', genitiv: 'des Vogels', dativ: 'dem Vogel' }, deklinationUnbestimmt: { nominative: 'ein Vogel', akkusativ: 'einen Vogel', genitiv: 'eines Vogels', dativ: 'einem Vogel' } } },
        { _id: 'vocab_sample_352', german: 'Pferd', english: 'horse', wordType: 'noun', level: 'A1', description: 'A large four-legged animal used for riding or work.', examples: [{ german: 'Das Pferd läuft schnell.', english: 'The horse runs fast.' }, { german: 'Sie reitet jeden Tag auf ihrem Pferd.', english: 'She rides her horse every day.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'das', plural: 'Pferde', deklinationBestimmt: { nominative: 'das Pferd', akkusativ: 'das Pferd', genitiv: 'des Pferdes', dativ: 'dem Pferd' }, deklinationUnbestimmt: { nominative: 'ein Pferd', akkusativ: 'ein Pferd', genitiv: 'eines Pferdes', dativ: 'einem Pferd' } } },
        { _id: 'vocab_sample_353', german: 'Kuh', english: 'cow', wordType: 'noun', level: 'A1', description: 'A female bovine animal kept for milk or beef.', examples: [{ german: 'Die Kuh gibt Milch.', english: 'The cow gives milk.' }, { german: 'Auf dem Bauernhof leben viele Kühe.', english: 'Many cows live on the farm.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Kühe', deklinationBestimmt: { nominative: 'die Kuh', akkusativ: 'die Kuh', genitiv: 'der Kuh', dativ: 'der Kuh' }, deklinationUnbestimmt: { nominative: 'eine Kuh', akkusativ: 'eine Kuh', genitiv: 'einer Kuh', dativ: 'einer Kuh' } } },
        { _id: 'vocab_sample_354', german: 'Schwein', english: 'pig', wordType: 'noun', level: 'A1', description: 'A domestic mammal with a round snout and short legs.', examples: [{ german: 'Das Schwein grunzt laut.', english: 'The pig grunts loudly.' }, { german: 'Schweine sind sehr intelligent.', english: 'Pigs are very intelligent.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'das', plural: 'Schweine', deklinationBestimmt: { nominative: 'das Schwein', akkusativ: 'das Schwein', genitiv: 'des Schweins', dativ: 'dem Schwein' }, deklinationUnbestimmt: { nominative: 'ein Schwein', akkusativ: 'ein Schwein', genitiv: 'eines Schweins', dativ: 'einem Schwein' } } },
        { _id: 'vocab_sample_355', german: 'Fisch', english: 'fish', wordType: 'noun', level: 'A1', description: 'A cold-blooded aquatic vertebrate with fins and gills.', examples: [{ german: 'Der Fisch schwimmt im Teich.', english: 'The fish swims in the pond.' }, { german: 'Wir essen freitags oft Fisch.', english: 'We often eat fish on Fridays.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Fische', deklinationBestimmt: { nominative: 'der Fisch', akkusativ: 'den Fisch', genitiv: 'des Fisches', dativ: 'dem Fisch' }, deklinationUnbestimmt: { nominative: 'ein Fisch', akkusativ: 'einen Fisch', genitiv: 'eines Fisches', dativ: 'einem Fisch' } } },
        { _id: 'vocab_sample_356', german: 'Bär', english: 'bear', wordType: 'noun', level: 'A2', description: 'A large, heavy mammal with thick fur.', examples: [{ german: 'Der Bär schläft im Winter.', english: 'The bear sleeps in winter.' }, { german: 'Im Wald gibt es Bären.', english: 'There are bears in the forest.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Bären', deklinationBestimmt: { nominative: 'der Bär', akkusativ: 'den Bären', genitiv: 'des Bären', dativ: 'dem Bären' }, deklinationUnbestimmt: { nominative: 'ein Bär', akkusativ: 'einen Bären', genitiv: 'eines Bären', dativ: 'einem Bären' } } },
        { _id: 'vocab_sample_357', german: 'Wolf', english: 'wolf', wordType: 'noun', level: 'A2', description: 'A wild carnivorous mammal that lives and hunts in packs.', examples: [{ german: 'Der Wolf heult in der Nacht.', english: 'The wolf howls at night.' }, { german: 'Wölfe leben in Rudeln.', english: 'Wolves live in packs.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Wölfe', deklinationBestimmt: { nominative: 'der Wolf', akkusativ: 'den Wolf', genitiv: 'des Wolfes', dativ: 'dem Wolf' }, deklinationUnbestimmt: { nominative: 'ein Wolf', akkusativ: 'einen Wolf', genitiv: 'eines Wolfes', dativ: 'einem Wolf' } } },
        { _id: 'vocab_sample_358', german: 'Maus', english: 'mouse', wordType: 'noun', level: 'A1', description: 'A small rodent with a pointed snout and long tail.', examples: [{ german: 'Die Maus läuft schnell weg.', english: 'The mouse runs away quickly.' }, { german: 'Die Katze jagt die Maus.', english: 'The cat chases the mouse.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Mäuse', deklinationBestimmt: { nominative: 'die Maus', akkusativ: 'die Maus', genitiv: 'der Maus', dativ: 'der Maus' }, deklinationUnbestimmt: { nominative: 'eine Maus', akkusativ: 'eine Maus', genitiv: 'einer Maus', dativ: 'einer Maus' } } },
        { _id: 'vocab_sample_359', german: 'Ente', english: 'duck', wordType: 'noun', level: 'A1', description: 'A water bird with a broad flat bill.', examples: [{ german: 'Die Ente schwimmt auf dem See.', english: 'The duck swims on the lake.' }, { german: 'Die Kinder füttern die Enten.', english: 'The children feed the ducks.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'die', plural: 'Enten', deklinationBestimmt: { nominative: 'die Ente', akkusativ: 'die Ente', genitiv: 'der Ente', dativ: 'der Ente' }, deklinationUnbestimmt: { nominative: 'eine Ente', akkusativ: 'eine Ente', genitiv: 'einer Ente', dativ: 'einer Ente' } } },
        { _id: 'vocab_sample_360', german: 'Löwe', english: 'lion', wordType: 'noun', level: 'A2', description: 'A large wild cat native to Africa, known as the king of animals.', examples: [{ german: 'Der Löwe ist der König der Tiere.', english: 'The lion is the king of animals.' }, { german: 'Löwen leben in der Savanne.', english: 'Lions live in the savanna.' }], learned: false, createdAt: now, updatedAt: now, nounDetails: { article: 'der', plural: 'Löwen', deklinationBestimmt: { nominative: 'der Löwe', akkusativ: 'den Löwen', genitiv: 'des Löwen', dativ: 'dem Löwen' }, deklinationUnbestimmt: { nominative: 'ein Löwe', akkusativ: 'einen Löwen', genitiv: 'eines Löwen', dativ: 'einem Löwen' } } },
        // ── Daily verbs ─────────────────────────────────────────────────────────
        { _id: 'vocab_sample_361', german: 'brauchen', english: 'to need / to require', wordType: 'verb', level: 'A1', description: 'To have a need for something.', examples: [{ german: 'Ich brauche Hilfe.', english: 'I need help.' }, { german: 'Du brauchst keine Angst zu haben.', english: 'You don\'t need to be afraid.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_362', german: 'bleiben', english: 'to stay / to remain', wordType: 'verb', level: 'A1', description: 'To continue to be somewhere or in a certain state.', examples: [{ german: 'Bleib bitte hier.', english: 'Please stay here.' }, { german: 'Er bleibt ruhig.', english: 'He remains calm.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_363', german: 'heißen', english: 'to be called / to mean', wordType: 'verb', level: 'A1', description: 'To have a particular name; to mean something.', examples: [{ german: 'Ich heiße Maria.', english: 'My name is Maria.' }, { german: 'Was heißt das auf Deutsch?', english: 'What does that mean in German?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_364', german: 'lassen', english: 'to let / to allow / to leave', wordType: 'verb', level: 'A2', description: 'To permit someone to do something; to leave something.', examples: [{ german: 'Lass mich in Ruhe.', english: 'Leave me alone.' }, { german: 'Sie lässt ihn gehen.', english: 'She lets him go.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_365', german: 'scheinen', english: 'to seem / to appear / to shine', wordType: 'verb', level: 'A2', description: 'To give the impression of being; to shine (for the sun).', examples: [{ german: 'Die Sonne scheint heute.', english: 'The sun is shining today.' }, { german: 'Es scheint einfach zu sein.', english: 'It seems to be easy.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_366', german: 'glauben', english: 'to believe / to think', wordType: 'verb', level: 'A2', description: 'To accept something as true; to think or suppose.', examples: [{ german: 'Ich glaube dir.', english: 'I believe you.' }, { german: 'Glaubst du, dass es regnet?', english: 'Do you think it will rain?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_367', german: 'meinen', english: 'to mean / to think / to reckon', wordType: 'verb', level: 'A2', description: 'To intend a particular meaning; to have an opinion.', examples: [{ german: 'Was meinst du damit?', english: 'What do you mean by that?' }, { german: 'Ich meine, das ist eine gute Idee.', english: 'I think that is a good idea.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_368', german: 'fragen', english: 'to ask', wordType: 'verb', level: 'A1', description: 'To put a question to someone.', examples: [{ german: 'Darf ich dich etwas fragen?', english: 'May I ask you something?' }, { german: 'Er fragte nach dem Weg.', english: 'He asked for directions.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_369', german: 'erzählen', english: 'to tell / to narrate', wordType: 'verb', level: 'A2', description: 'To give an account of a story or event.', examples: [{ german: 'Erzähl mir eine Geschichte.', english: 'Tell me a story.' }, { german: 'Er erzählte von seiner Reise.', english: 'He told about his trip.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_370', german: 'zeigen', english: 'to show / to point', wordType: 'verb', level: 'A1', description: 'To make something visible; to point at something.', examples: [{ german: 'Zeig mir dein Foto.', english: 'Show me your photo.' }, { german: 'Er zeigte auf die Karte.', english: 'He pointed at the map.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_371', german: 'hören', english: 'to hear / to listen', wordType: 'verb', level: 'A1', description: 'To perceive sound with the ears; to listen to.', examples: [{ german: 'Ich höre Musik.', english: 'I am listening to music.' }, { german: 'Hörst du das?', english: 'Do you hear that?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_372', german: 'fühlen', english: 'to feel / to sense', wordType: 'verb', level: 'A2', description: 'To be aware of a physical or emotional sensation.', examples: [{ german: 'Ich fühle mich müde.', english: 'I feel tired.' }, { german: 'Wie fühlst du dich?', english: 'How do you feel?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_373', german: 'öffnen', english: 'to open', wordType: 'verb', level: 'A1', description: 'To move something to allow access or passage.', examples: [{ german: 'Öffne bitte die Tür.', english: 'Please open the door.' }, { german: 'Das Geschäft öffnet um neun.', english: 'The shop opens at nine.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_374', german: 'schließen', english: 'to close / to shut', wordType: 'verb', level: 'A1', description: 'To move something to cover an opening; to end.', examples: [{ german: 'Schließ bitte das Fenster.', english: 'Please close the window.' }, { german: 'Das Museum schließt um 18 Uhr.', english: 'The museum closes at 6 p.m.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_375', german: 'schreiben', english: 'to write', wordType: 'verb', level: 'A1', description: 'To mark letters or words on a surface.', examples: [{ german: 'Ich schreibe eine E-Mail.', english: 'I am writing an email.' }, { german: 'Schreib deinen Namen hier.', english: 'Write your name here.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_376', german: 'lesen', english: 'to read', wordType: 'verb', level: 'A1', description: 'To look at and understand written or printed text.', examples: [{ german: 'Ich lese ein Buch.', english: 'I am reading a book.' }, { german: 'Kannst du das lesen?', english: 'Can you read that?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_377', german: 'fahren', english: 'to drive / to travel / to go (by vehicle)', wordType: 'verb', level: 'A1', description: 'To travel in a vehicle; to drive.', examples: [{ german: 'Ich fahre mit dem Auto.', english: 'I am travelling by car.' }, { german: 'Wir fahren in den Urlaub.', english: 'We are going on holiday.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_378', german: 'laufen', english: 'to run / to walk', wordType: 'verb', level: 'A1', description: 'To move quickly on foot; also to walk in some dialects.', examples: [{ german: 'Ich laufe jeden Morgen.', english: 'I run every morning.' }, { german: 'Das Kind läuft zur Schule.', english: 'The child walks to school.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_379', german: 'schlafen', english: 'to sleep', wordType: 'verb', level: 'A1', description: 'To rest with eyes closed in a natural state of unconsciousness.', examples: [{ german: 'Ich schlafe acht Stunden.', english: 'I sleep eight hours.' }, { german: 'Das Baby schläft fest.', english: 'The baby is sleeping soundly.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_380', german: 'kochen', english: 'to cook', wordType: 'verb', level: 'A1', description: 'To prepare food by heating.', examples: [{ german: 'Ich koche heute Abend.', english: 'I am cooking tonight.' }, { german: 'Sie kocht sehr gut.', english: 'She cooks very well.' }], learned: false, createdAt: now, updatedAt: now },
        // ── Adjectives ──────────────────────────────────────────────────────────
        { _id: 'vocab_sample_381', german: 'groß', english: 'big / tall / large', wordType: 'adjective', level: 'A1', description: 'Of considerable size, height, or extent.', examples: [{ german: 'Das ist ein großes Haus.', english: 'That is a big house.' }, { german: 'Er ist sehr groß.', english: 'He is very tall.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_382', german: 'klein', english: 'small / little / short', wordType: 'adjective', level: 'A1', description: 'Of less than average size or height.', examples: [{ german: 'Sie hat eine kleine Wohnung.', english: 'She has a small apartment.' }, { german: 'Das Kind ist noch klein.', english: 'The child is still small.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_383', german: 'alt', english: 'old / aged', wordType: 'adjective', level: 'A1', description: 'Having lived for a long time; not new.', examples: [{ german: 'Mein Großvater ist sehr alt.', english: 'My grandfather is very old.' }, { german: 'Das ist ein altes Buch.', english: 'That is an old book.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_384', german: 'jung', english: 'young', wordType: 'adjective', level: 'A1', description: 'Having lived for only a short time; not old.', examples: [{ german: 'Sie ist noch sehr jung.', english: 'She is still very young.' }, { german: 'Junge Menschen haben viel Energie.', english: 'Young people have a lot of energy.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_385', german: 'schnell', english: 'fast / quick / rapid', wordType: 'adjective', level: 'A1', description: 'Moving or able to move at high speed.', examples: [{ german: 'Das Auto ist sehr schnell.', english: 'The car is very fast.' }, { german: 'Er ist ein schneller Läufer.', english: 'He is a fast runner.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_386', german: 'langsam', english: 'slow / slowly', wordType: 'adjective', level: 'A1', description: 'Not moving or happening quickly.', examples: [{ german: 'Die Schildkröte ist langsam.', english: 'The turtle is slow.' }, { german: 'Bitte sprich langsamer.', english: 'Please speak more slowly.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_387', german: 'einfach', english: 'simple / easy / just', wordType: 'adjective', level: 'A1', description: 'Not complicated; easy to do or understand.', examples: [{ german: 'Die Aufgabe ist einfach.', english: 'The task is easy.' }, { german: 'Das ist ganz einfach.', english: 'That is quite simple.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_388', german: 'schwierig', english: 'difficult / hard / tricky', wordType: 'adjective', level: 'A2', description: 'Needing much effort or skill to do.', examples: [{ german: 'Die Prüfung war sehr schwierig.', english: 'The exam was very difficult.' }, { german: 'Das ist eine schwierige Frage.', english: 'That is a tricky question.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_389', german: 'wichtig', english: 'important / significant', wordType: 'adjective', level: 'A2', description: 'Of great significance or value.', examples: [{ german: 'Das ist sehr wichtig.', english: 'That is very important.' }, { german: 'Eine wichtige Entscheidung.', english: 'An important decision.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_390', german: 'möglich', english: 'possible', wordType: 'adjective', level: 'A2', description: 'Able to be done or achieved.', examples: [{ german: 'Ist das möglich?', english: 'Is that possible?' }, { german: 'So schnell wie möglich.', english: 'As fast as possible.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_391', german: 'schön', english: 'beautiful / nice / lovely', wordType: 'adjective', level: 'A1', description: 'Pleasing to the senses or aesthetically attractive.', examples: [{ german: 'Das Wetter ist heute schön.', english: 'The weather is nice today.' }, { german: 'Sie hat ein schönes Lächeln.', english: 'She has a beautiful smile.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_392', german: 'müde', english: 'tired / sleepy / weary', wordType: 'adjective', level: 'A1', description: 'In need of sleep or rest; lacking energy.', examples: [{ german: 'Ich bin sehr müde.', english: 'I am very tired.' }, { german: 'Nach der Arbeit bin ich immer müde.', english: 'After work I am always tired.' }], learned: false, createdAt: now, updatedAt: now },
        // ── Adverbs ─────────────────────────────────────────────────────────────
        { _id: 'vocab_sample_393', german: 'immer', english: 'always / all the time', wordType: 'adverb', level: 'A1', description: 'At all times; on every occasion.', examples: [{ german: 'Er ist immer pünktlich.', english: 'He is always punctual.' }, { german: 'Das macht sie immer so.', english: 'She always does it this way.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_394', german: 'nie', english: 'never', wordType: 'adverb', level: 'A1', description: 'At no time in the past or future.', examples: [{ german: 'Ich war nie in Japan.', english: 'I have never been to Japan.' }, { german: 'Das werde ich nie vergessen.', english: 'I will never forget that.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_395', german: 'manchmal', english: 'sometimes / occasionally', wordType: 'adverb', level: 'A1', description: 'On some occasions but not always.', examples: [{ german: 'Manchmal gehe ich joggen.', english: 'Sometimes I go jogging.' }, { german: 'Das passiert manchmal.', english: 'That happens sometimes.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_396', german: 'oft', english: 'often / frequently', wordType: 'adverb', level: 'A1', description: 'Many times; on many occasions.', examples: [{ german: 'Ich esse oft Pizza.', english: 'I often eat pizza.' }, { german: 'Wie oft gehst du ins Fitnessstudio?', english: 'How often do you go to the gym?' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_397', german: 'sofort', english: 'immediately / at once / right away', wordType: 'adverb', level: 'A2', description: 'Without any delay; instantly.', examples: [{ german: 'Komm sofort her!', english: 'Come here immediately!' }, { german: 'Ich erledige das sofort.', english: 'I will take care of that right away.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_398', german: 'bereits', english: 'already / by now', wordType: 'adverb', level: 'B1', description: 'Before the present time; sooner than expected.', examples: [{ german: 'Ich habe bereits gegessen.', english: 'I have already eaten.' }, { german: 'Er ist bereits angekommen.', english: 'He has already arrived.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_399', german: 'trotzdem', english: 'nevertheless / still / even so', wordType: 'adverb', level: 'B1', description: 'In spite of what has just been said or done.', examples: [{ german: 'Es regnet, aber ich gehe trotzdem spazieren.', english: 'It is raining, but I go for a walk nevertheless.' }, { german: 'Das war schwer, trotzdem hat er es geschafft.', english: 'It was hard; still, he managed it.' }], learned: false, createdAt: now, updatedAt: now },
        { _id: 'vocab_sample_400', german: 'leider', english: 'unfortunately / sadly / I\'m afraid', wordType: 'adverb', level: 'A2', description: 'Used to express regret or sorrow.', examples: [{ german: 'Leider kann ich nicht kommen.', english: 'Unfortunately I cannot come.' }, { german: 'Das ist leider nicht möglich.', english: 'I\'m afraid that is not possible.' }], learned: false, createdAt: now, updatedAt: now },
      ];
      await this.db.bulkSave(samplesV3);
      await this.db.saveSetting('seeded_v3', 'true');
    }

    await this.load();
  }
}
