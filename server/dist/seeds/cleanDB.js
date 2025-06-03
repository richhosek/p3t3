import { Profile, Deck, Flashcard } from '../models/index.js';
const cleanDB = async () => {
    try {
        await Profile.deleteMany({});
        await Deck.deleteMany({});
        await Flashcard.deleteMany({});
        console.log('Profile, Deck, and Flashcard collection cleaned.');
    }
    catch (err) {
        console.error('Error cleaning collections:', err);
        process.exit(1);
    }
};
export default cleanDB;
