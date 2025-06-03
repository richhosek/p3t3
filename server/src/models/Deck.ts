import mongoose, { Document, Schema } from 'mongoose';

// Define the TypeScript interface
export interface IDeck extends Document {
  _id: string;
  title: string;
  description?: string;
  createdByUsername: mongoose.Types.ObjectId | any; // Can be ObjectId or populated Profile
  isPublic: boolean;
  flashcards: mongoose.Types.ObjectId[] | any[]; // Can be ObjectIds or populated Flashcards
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const deckSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  createdByUsername: {
    type: Schema.Types.ObjectId,
    ref: 'Profile', // Make sure this matches your Profile model name
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  flashcards: [{
    type: Schema.Types.ObjectId,
    ref: 'Flashcard'
  }]
}, {
  timestamps: true
});

// Create and export the model
const Deck = mongoose.model<IDeck>('Deck', deckSchema);

export default Deck;
