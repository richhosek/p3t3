import mongoose, { Schema } from 'mongoose';
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
const Deck = mongoose.model('Deck', deckSchema);
export default Deck;
