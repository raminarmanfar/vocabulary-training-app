export interface TrainSessionItem {
  vocabId: string;
  german: string;
  english: string;
  learnedInSession: boolean;
  timeSpentMs: number;
}

export interface TrainSession {
  _id: string;
  startedAt: string;
  finishedAt: string;
  totalTimeMs: number;
  learnedCount: number;
  notLearnedCount: number;
  items: TrainSessionItem[];
}
