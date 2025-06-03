import db from '../config/connection.js';
import { Profile } from '../models/index.js';
import { Deck } from '../models/index.js';
import { Flashcard } from '../models/index.js';
import profileSeeds from './profileData.json' with { type: "json" };
import deckSeeds from './deckData.json' with { type: "json" };
import flashcardSeeds from './flashcardData.json' with { type: "json" };
import cleanDB from './cleanDB.js';
import { IProfile } from '../models/Profile';
import  { IDeck } from '../models/Deck';
import { IFlashcard } from '../models/flashcard';
import { toObjectId } from '../utils/objectId.js';
// import bcrypt from 'bcrypt';



const seedDatabase = async (): Promise<void> => {
  try {
    await db();
    await cleanDB();

   const createdProfiles: IProfile[] = [];

for (const seed of profileSeeds) {
  const profile = new Profile(seed);
  await profile.save(); // ✅ pre-save hook will hash the password
  createdProfiles.push(profile);
}

    const createdDecks: IDeck[] = [];
  

    for (const deck of deckSeeds) {
      const user = createdProfiles.find(
        (profile) => profile.username === deck.createdByUsername
      );
      if (!user) {
        console.error(`User ${deck.createdByUsername} not found for deck ${deck.title}`)
        continue;
      }
      const createdDeck = await Deck.create({
        ...deck,
        createdByUsername: toObjectId(user._id)
      });

      user.decks.push(toObjectId(createdDeck._id));
      await user.save();
      createdDecks.push(createdDeck);
      console.log(`Deck created: ${createdDeck.title}`)

    

    if (user.username === "Admin") {
    for (const profile of createdProfiles) {
      if (profile.username !== "Admin" && !profile.decks.includes(toObjectId(createdDeck._id))) {
          profile.decks.push(toObjectId(createdDeck._id));
          await profile.save();
        }
      }
      }
    }

      const createdFlashcards: IFlashcard[] = [];
      for (const flashcard of flashcardSeeds) {
        const deck = createdDecks.find(
          (deck) => deck.title === flashcard.deck
        );
        if (!deck) {
          console.error(`Flashcard ${flashcard.term} not found in deck ${flashcard.deck}`);
          continue;
        }
        const user = createdProfiles.find(
          (profile) => profile.username === flashcard.createdByUsername
        );
        if (!user) {
          console.error(`User ${flashcard.createdByUsername} not found for flashcard ${flashcard.term}`);
          continue;
        }

        const createdFlashcard = await Flashcard.create({
          ...flashcard,
          deck: toObjectId(deck._id),
          createdByUsername: toObjectId(user._id)
        });

        deck.flashcards.push(toObjectId(createdFlashcard._id));
        await deck.save();
        createdFlashcards.push(createdFlashcard);
        console.log(`Flashcard created: ${createdFlashcard.term}`)
      }

      // After all flashcards are created, randomly assign some favorites
      for (const profile of createdProfiles) {
        if (profile.username !== "Admin") {
          // Randomly pick 2-3 flashcards as favorites
          const randomFlashcards = createdFlashcards
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 3) + 1);

          profile.favorites = randomFlashcards.map(fc => toObjectId(fc._id));
          await profile.save();
        }
      }

      console.log('Seeding completed successfully!');
      process.exit(0);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error seeding database:', error.message);
    } else {
      console.error('Unknown error seeding database');
    }
    process.exit(1);
  }
};
seedDatabase()