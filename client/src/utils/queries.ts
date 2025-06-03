import { gql } from '@apollo/client';

export const QUERY_PROFILES = gql`
  query allProfiles {
    profiles {
      _id
      name
      username
      email
      flashcards {
        _id
        term
        definition
        example
        deck
        isFavorite
        createdAt
        updatedAt
        createdByUsername {
          username
        }
      }
    }
  }
`;

export const QUERY_SINGLE_PROFILE = gql`
  query singleProfile($profileId: ID!) {
    profile(profileId: $profileId) {
      _id
      name
      username
      email
      flashcards {
        _id
        term
        definition
        example
        deck
        isFavorite
        createdAt
        updatedAt
        createdByUsername {
          username
        }
      }
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
      _id
      name
      username
      email
    }
  }
`;

export const QUERY_FLASHCARD = gql`
  query getFlashcard($id: ID!) {
    getFlashcard(id: $id) {
      _id
      term
      definition
      example
      deck
      isFavorite
      createdAt
      updatedAt
      createdByUsername {
        username
      }
    }
  }
`;


export const QUERY_ALL_DECKS = gql`
  query getAllDecks {
    getAllDecks {
      _id
      title
      description
      isPublic
      createdByUsername {
        _id
        username
        email
      }
      flashcards {
        _id
        term
        definition
        example
        isFavorite
        createdByUsername {
          username
        }
      }
    }
  }
`;


export const QUERY_SINGLE_DECK = gql`
  query getSingleDeck($id: ID!) {
    getSingleDeck(id: $id) {
      _id
      title
      description
      createdByUsername {
        _id
        username
        email
      }
      isPublic
      flashcards {
        _id
        term
        definition
        example
        deck
        isFavorite
        createdAt
        updatedAt
        createdByUsername {
          username
        }
      }
    }
  }
`;

export const QUERY_FLASHCARDS_BY_DECK = gql`
  query getFlashcardsByDeck($deckId: ID!) {
    getFlashcardsByDeck(deckId: $deckId) {
      _id
      term
      definition
      example
      isFavorite
      createdByUsername {
        username
      }
    }
  }
`;

