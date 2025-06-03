// import Flashcard from "../models/flashcard.js";
import Deck from "../models/Deck.js";
// import mongoose from 'mongoose';
export const createDeck = async (req, res) => {
    try {
        const { title, description, isPublic } = req.body;
        // Create the deck
        const newDeck = await Deck.create({
            title,
            description,
            isPublic: isPublic || false,
        });
        return res.status(201).json(newDeck);
    }
    catch (err) {
        console.error("Create Deck Error:", err.message);
        return res.status(500).json({ message: "Failed to create Deck", error: err.message });
    }
};
export const updateDeck = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isPublic } = req.body;
        const updateDeck = await Deck.findByIdAndUpdate(id, {
            ...(title && { title }),
            ...(description && { description }),
            ...(typeof isPublic !== "undefined" && { isPublic }),
        }, { new: true, runValidators: true });
        if (!updateDeck) {
            return res.status(404).json({ message: "Deck not found" });
        }
        return res.status(200).json(updateDeck);
    }
    catch (err) {
        console.error("Update Deck Error:", err.message);
        return res.status(500).json({ message: "Failed to update Deck", error: err.message });
    }
};
export const getDeckById = async (req, res) => {
    try {
        const deck = await Deck.findById(req.params.id);
        if (!deck) {
            return res.status(404).json({ message: "Deck not found" });
        }
        return res.json(deck);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching deck", error });
    }
};
