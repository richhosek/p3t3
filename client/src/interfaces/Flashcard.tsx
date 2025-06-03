export interface Flashcard {
  _id: string;
  term: string;
  definition: string;
  example?: string;
  createdByUsername?: {
    username: string;
  };
  isFavorite?: boolean;
}

