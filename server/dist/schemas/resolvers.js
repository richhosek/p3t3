import FlashcardModel from '../models/flashcard.js';
import Deck from '../models/Deck.js';
import { Profile } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
const resolvers = {
    Query: {
        profiles: async () => {
            return await Profile.find();
        },
        profile: async (_parent, { profileId }) => {
            return await Profile.findOne({ _id: profileId });
        },
        me: async (_parent, _args, context) => {
            if (context.user) {
                return await Profile.findById(context.user._id);
            }
            throw new AuthenticationError('Invalid credentials');
        },
        getFlashcard: async (_parent, { id }, _context) => {
            return FlashcardModel.findById(id).populate('createdByUsername').populate('deck');
        },
        getAllDecks: async () => {
            return Deck.find().populate('flashcards').populate('createdByUsername');
        },
        getSingleDeck: async (_parent, { id }, _context) => {
            return Deck.findById(id).populate('flashcards').populate('createdByUsername');
        },
        getFlashcardsByDeck: async (_parent, { deckId }) => {
            return await FlashcardModel.find({ deck: deckId }).populate('createdByUsername');
        },
    },
    Mutation: {
        addProfile: async (_parent, { input }) => {
            const profile = await Profile.create({ ...input });
            const token = signToken(profile.name, profile.email, profile._id);
            return { token, profile };
        },
        login: async (_parent, { email, password }) => {
            const profile = await Profile.findOne({ email });
            if (!profile) {
                console.log("Login failed: user not found", email);
                throw new AuthenticationError('Invalid credentials');
            }
            const correctPw = await profile.isCorrectPassword(password);
            if (!correctPw) {
                console.log("Login failed: incorrect password", password);
                throw new AuthenticationError('Invalid credentials');
            }
            const token = signToken(profile.name, profile.email, profile._id);
            return { token, profile };
        },
        removeProfile: async (_parent, _args, context) => {
            if (context.user) {
                return await Profile.findByIdAndDelete(context.user._id);
            }
            throw new AuthenticationError('Invalid credentials');
        },
        createFlashcard: async (_parent, { input }, context) => {
            if (!context.user)
                throw new AuthenticationError('You must be logged in to create a flashcard');
            const { term, definition, example, deckId } = input;
            const flashcardDoc = await FlashcardModel.create({
                term,
                definition,
                example,
                deck: deckId,
                createdByUsername: context.user._id,
            });
            await Deck.findByIdAndUpdate(deckId, { $push: { flashcards: flashcardDoc._id } });
            return flashcardDoc;
        },
        updateFlashcard: async (_parent, { id, input }, context) => {
            if (!context.user)
                throw new AuthenticationError('Unauthorized');
            const { term, definition, isFavorite } = input;
            const flashcardDoc = await FlashcardModel.findById(id);
            if (!flashcardDoc)
                throw new Error('Flashcard not found.');
            if (flashcardDoc.createdByUsername.toString() !== context.user._id)
                throw new AuthenticationError('You can only update your own flashcards');
            const updated = await FlashcardModel.findByIdAndUpdate(id, { $set: { term, definition, isFavorite } }, { new: true, runValidators: true });
            return updated;
        },
        deleteFlashcard: async (_parent, { id }, context) => {
            if (!context.user)
                throw new AuthenticationError('Unauthorized');
            const flashcardDoc = await FlashcardModel.findById(id);
            if (!flashcardDoc)
                throw new Error('Flashcard not found.');
            if (flashcardDoc.createdByUsername.toString() !== context.user._id)
                throw new AuthenticationError('You can only delete your own flashcards');
            await flashcardDoc.deleteOne();
            await Deck.updateOne({ flashcards: id }, { $pull: { flashcards: id } });
            return true;
        },
        toggleFavorite: async (_parent, { id }, context) => {
            if (!context.user)
                throw new AuthenticationError('Unauthorized');
            const card = await FlashcardModel.findById(id);
            if (!card)
                throw new Error('Not found');
            if (card.createdByUsername.toString() !== context.user._id)
                throw new AuthenticationError('You can only toggle your own flashcards');
            card.isFavorite = !card.isFavorite;
            await card.save();
            return card;
        },
        createDeck: async (_parent, { title, description }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You must be logged in to create a deck');
            }
            if (!title || title.trim() === '') {
                throw new Error('Title is required');
            }
            try {
                // Find user by email instead of ID (temporary fix)
                const user = await Profile.findOne({ email: context.user.email });
                if (!user) {
                    throw new Error('User not found in database');
                }
                console.log('Using user from database:', user._id.toString());
                // Create the deck using the correct user ID from database
                const deck = await Deck.create({
                    title: title.trim(),
                    description: description?.trim() || '',
                    createdByUsername: user._id, // Use the correct ID from database
                    isPublic: false,
                    flashcards: [],
                });
                // Return populated deck
                const populatedDeck = await Deck.findById(deck._id)
                    .populate('createdByUsername')
                    .populate('flashcards');
                if (!populatedDeck) {
                    throw new Error('Failed to retrieve created deck');
                }
                return populatedDeck;
            }
            catch (error) {
                if (error.code === 11000 && error.keyPattern?.title) {
                    throw new Error(`A deck with the title "${title.trim()}" already exists. Please choose a different title.`);
                }
                throw error;
            }
        },
        updateDeck: async (_parent, { id, input }, context) => {
            if (!context.user)
                throw new AuthenticationError('Unauthorized');
            const deck = await Deck.findById(id);
            if (!deck)
                throw new Error('Deck not found.');
            if (deck.createdByUsername.toString() !== context.user._id)
                throw new AuthenticationError('You can only update your own decks');
            // Use the input object for updates
            const updateFields = {};
            if (input.title !== undefined)
                updateFields.title = input.title;
            if (input.description !== undefined)
                updateFields.description = input.description;
            const updated = await Deck.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
            return updated;
        },
        deleteDeck: async (_parent, { id }, context) => {
            const userId = context.user?._id;
            if (!userId)
                throw new AuthenticationError('You must be logged in to delete a deck');
            const deck = await Deck.findById(id);
            if (!deck)
                throw new Error('Deck not found');
            if (deck.createdByUsername.toString() !== userId)
                throw new AuthenticationError('You can only delete your own decks');
            await deck.deleteOne();
            await FlashcardModel.deleteMany({ deck: id });
            return true;
        },
    },
    Flashcard: {
        createdByUsername: async (flashcardDoc) => {
            return await Profile.findById(flashcardDoc.createdByUsername);
        },
    },
    Deck: {
        createdByUsername: async (deck) => {
            return await Profile.findById(deck.createdByUsername);
        },
        flashcards: async (deck) => {
            return await FlashcardModel.find({ deck: deck._id });
        },
    },
};
export default resolvers;
