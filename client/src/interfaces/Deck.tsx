import { Key, ReactNode } from 'react';
import { Flashcard } from './Flashcard';

 export interface Deck {
  _id: Key | null | undefined;
  title: ReactNode;
  flashcards: any;
  id: string;
  name: string;
  description: string;
  createdByUsername?: { username: string };
  cards: Flashcard[];
  createdAt: Date;
}
