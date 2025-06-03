// routes/flashcardRoutes.ts
import express from "express";
import { createFlashcard, updateFlashcard, createFlashcardForDeck, getFlashcardsByDeck, } from "../controllers/flashcardcontrollers";
const router = express.Router();
router.post("/", createFlashcard);
router.put("/:id", updateFlashcard);
// ✳️ New routes:
router.post("/deck/:deckId", createFlashcardForDeck);
router.get("/deck/:deckId", getFlashcardsByDeck);
export default router;
