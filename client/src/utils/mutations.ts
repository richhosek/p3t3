import { gql } from '@apollo/client';

export const ADD_PROFILE = gql`
  mutation addProfile($input: ProfileInput!) {
    addProfile(input: $input) {
      token
      profile {
        _id
        name
      }
    }
  }
`;


export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      profile {
        _id
        name
      }
    }
  }
`;

export const CREATE_FLASHCARD = gql`
  mutation createFlashcard($input: FlashcardInput!) {
    createFlashcard(input: $input) {
      _id
      term
      definition
      example
      deck
      isFavorite
      createdAt
      updatedAt
    }
  }
`;
export const UPDATE_FLASHCARD = gql`
  mutation updateFlashcard($id: ID!, $input: FlashcardInput!) {
    updateFlashcard(id: $id, input: $input) {
      _id
      term
      definition
      example
      deck
      isFavorite
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_FLASHCARD = gql`
  mutation deleteFlashcard($id: ID!) {
    deleteFlashcard(id: $id) 
  }

`;

export const CREATE_DECK = gql`
  mutation createDeck($title: String!, $description: String) {
  createDeck(title: $title, description: $description) {
    _id
    title
    description
    createdByUsername {
    _id
    username
    email
    # any other fields you need from Profile
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
    }
  }
}
`;
export const UPDATE_DECK = gql`
  mutation updateDeck($id: ID!, $input: DeckInput!) {
    updateDeck(id: $id, input: $input) {
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
      }
    }
  }
`;

export const DELETE_DECK = gql`
  mutation deleteDeck($id: ID!) {
    deleteDeck(id: $id)
  }
`;