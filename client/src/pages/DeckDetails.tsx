import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { QUERY_SINGLE_DECK, QUERY_FLASHCARDS_BY_DECK } from '../utils/queries';
import { CREATE_FLASHCARD } from '../utils/mutations';
import { Flashcard } from '../interfaces/Flashcard';
import { Deck } from '../interfaces/Deck';
import NewCard from '../components/NewCard';

const DeckDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: deckData, loading: deckLoading, error: deckError } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id },
  });

  const { data: cardsData, loading: cardsLoading, refetch: refetchCards } = useQuery(QUERY_FLASHCARDS_BY_DECK, {
    variables: { deckId: id },
  });

  const [createFlashcard] = useMutation(CREATE_FLASHCARD);

  const handleAddCard = async (newFlashcard: { term: string; definition: string }) => {
    if (!id) return;
    try {
      await createFlashcard({
        variables: {
            input: {
            term: newFlashcard.term,
            definition: newFlashcard.definition,
            deckId: id,
          },
        },
      });
      refetchCards();
    } catch (err) {
      console.error('Failed to add card', err);
    }
  };

  if (deckLoading || cardsLoading) return <p>Loading...</p>;
  if (deckError) return <p>Error loading deck!</p>;

  const deck: Deck = deckData?.getSingleDeck;
  if (!deck) return <p>Deck not found.</p>;

  const flashcards: Flashcard[] = cardsData?.getFlashcardsByDeck || [];

  return (
    <div>
      <h2>{deck.title}</h2>
      <p>{deck.description}</p>

      <h3>Flashcards</h3>
      <ul>
        {flashcards.length === 0 && <p>No flashcards yet.</p>}
        {flashcards.map((card) => (
          <li key={card._id}>
            <strong>{card.term}</strong>: {card.definition}
            {card.example && <em> (Example: {card.example})</em>}
          </li>
        ))}
      </ul>
      <NewCard onAdd={handleAddCard} />
    </div>
  );
};

export default DeckDetail;
