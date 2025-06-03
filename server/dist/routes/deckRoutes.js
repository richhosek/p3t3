import express from "express";
import { createDeck, updateDeck, getDeckById } from "../controllers/deckcontrollers";
const router = express.Router();
router.post("/", createDeck);
router.put("/:id", updateDeck);
router.get("/:id", getDeckById);
export default router;
