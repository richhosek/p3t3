const typeDefs = `
  type Profile {
    _id: ID
    name: String
    username: String
    email: String
    password: String
    decks: [Deck]
    flashcards: [Flashcard]
  }

  type Auth {
    token: ID!
    profile: Profile
  }
  
  input ProfileInput {
    name: String!
    username:String!
    email: String!
    password: String!
  }

input FlashcardInput {
  term: String!
  definition: String!
  example: String
  deckId: ID
  isFavorite: Boolean
}

  type Flashcard {
    _id: ID!
    term: String
    definition: String
    example: String
    deck: ID
    isFavorite: Boolean
    createdByUsername: Profile
    createdAt: String
    updatedAt: String
  }

 type Deck {
    _id: ID!
    title: String!
    description: String
    createdByUsername: Profile!
    isPublic: Boolean
    flashcards: [Flashcard]
    createdAt: String
    updatedAt: String
  }

  type Query {
    profiles: [Profile]!
    profile(profileId: ID!): Profile
    me: Profile

    getFlashcard(id: ID!): Flashcard
    getAllDecks: [Deck]
    getSingleDeck(id: ID!): Deck
    getFlashcardsByDeck(deckId: ID!): [Flashcard!]!
  }

  input DeckInput {
    title: String!
    description: String!
    isPublic: Boolean
  }

  type Mutation {
    addProfile(input: ProfileInput!): Auth
    login(email: String!, password: String!): Auth
    removeProfile: Profile

    createDeck(title: String!, description: String): Deck
    updateDeck(id: ID!, input: DeckInput!): Deck
    deleteDeck(id: ID!): Boolean

    createFlashcard(input: FlashcardInput!): Flashcard!
    updateFlashcard(id: ID!, input: FlashcardInput!): Flashcard
    deleteFlashcard(id: ID!): Boolean!
    toggleFavorite(id: ID!): Flashcard!
  }
`;

export default typeDefs;
