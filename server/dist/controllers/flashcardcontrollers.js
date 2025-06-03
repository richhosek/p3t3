import Flashcard from "../models/flashcard.js";
import Deck from "../models/Deck.js";
import { toObjectId } from "../utils/objectId.js";
import mongoose from 'mongoose';
export const createFlashcard = async (req, res) => {
    try {
        const { term, definition, isFavorite, deck } = req.body;
        // Optional: check if deck exists
        const existingDeck = await Deck.findById(deck);
        if (!existingDeck) {
            return res.status(404).json({ message: "Deck not found" });
        }
        // Create the flashcard
        const newFlashcard = await Flashcard.create({
            term,
            definition,
            isFavorite: isFavorite || false,
            deck: toObjectId(deck),
        });
        // Push flashcard to deck
        existingDeck.flashcards.push(new mongoose.Types.ObjectId(newFlashcard._id));
        await existingDeck.save();
        return res.status(201).json(newFlashcard);
    }
    catch (err) {
        console.error("Create Flashcard Error:", err.message);
        return res.status(500).json({ message: "Failed to create flashcard", error: err.message });
    }
};
export const updateFlashcard = async (req, res) => {
    try {
        const { id } = req.params;
        const { term, definition, isFavorite } = req.body;
        const updated = await Flashcard.findByIdAndUpdate(id, {
            ...(term && { term }),
            ...(definition && { definition }),
            ...(typeof isFavorite !== "undefined" && { isFavorite }),
        }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ message: "Flashcard not found" });
        }
        return res.status(200).json(updated);
    }
    catch (err) {
        console.error("Update Flashcard Error:", err.message);
        return res.status(500).json({ message: "Failed to update flashcard", error: err.message });
    }
};
export const createFlashcardForDeck = async (req, res) => {
    const { deckId } = req.params;
    const { term, definition } = req.body;
    try {
        const deck = await Deck.findById(deckId);
        if (!deck)
            return res.status(404).json({ message: "Deck not found" });
        const flashcard = new Flashcard({ term, definition, deck: deck._id });
        await flashcard.save();
        return res.status(201).json(flashcard);
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating flashcard", error });
    }
};
// GET /api/flashcards/deck/:deckId
export const getFlashcardsByDeck = async (req, res) => {
    const { deckId } = req.params;
    try {
        const flashcards = await Flashcard.find({ deck: deckId });
        res.status(200).json(flashcards);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching flashcards", error });
    }
};
