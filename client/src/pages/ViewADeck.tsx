import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { QUERY_SINGLE_DECK, QUERY_FLASHCARDS_BY_DECK } from '../utils/queries';
import { useNavigate } from 'react-router-dom';
import { DELETE_DECK } from '../utils/mutations';
import { Flashcard } from '../interfaces/Flashcard';
import FlashcardEdit from '../components/Deck/editCard';
import EditDeck from '../components/Deck/editdeck'



interface Deck {
  _id: string;
  title: string;
  description: string;
  createdByUsername?: {
    username: string;
  };
}



const DeckDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null);
const handleCardClick = (cardId: string) => {
  setExpandedCardId(expandedCardId === cardId ? null : cardId);
};



const handleDelete = (cardId: string) => {
  if (window.confirm("Are you sure you want to delete this flashcard?")) {
    // add mutation logic here
    console.log(`Deleting flashcard with ID: ${cardId}`);

  }
};

const [selectedCard, setSelectedCard] = React.useState<Flashcard | null>(null);
const [modalOpen, setModalOpen] = React.useState(false);
const [deckModalOpen, setDeckModalOpen] = React.useState(false);
// const deckId = id; // Assuming id is the deck ID
const { data: deckData, loading: deckLoading, error: deckError, refetch: refetchDeck } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id },
  });

  const { data: cardsData, loading: cardsLoading, refetch: refetchCards } = useQuery(QUERY_FLASHCARDS_BY_DECK, {
    variables: { deckId: id },
  });

const [deleteDeck, { loading: deleting, error: deleteError }] = useMutation(DELETE_DECK, {
  onCompleted: () => {
    navigate('/game/flashCards/Decks');
  },
  onError: (error) => {
    console.error("Error deleting deck:", error);
  }
});

  const handleAddNewCardClick = () => {
    navigate(`/deck/${id}/new-card`);
  };

const handleDeleteDeck = () => {
  if(window.confirm('Are you sure you want to delete this deck?')) {
    deleteDeck({ variables: { id } });
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
      {flashcards.length === 0 ? (
        <p>No flashcards yet.</p>
      ) : (
        <div className="ui cards">
          {flashcards.map((card) => (
            <div
              className={`card ${expandedCardId === card._id ? "expanded-card" : ""}`}
              key={card._id}
              onClick={() => handleCardClick(card._id)}
            >
              <div className="content">
                <div className="header">
                  {card.term}
                  <button
                    className="mini ui right floated basic grey button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCard(card);
                      setModalOpen(true);
                    }}
                  >
                    Expand
                  </button>
                </div>
                <div className="description">
                  <p><strong>Definition:</strong> {card.definition}</p>
                  {expandedCardId === card._id && (
                    <p><strong>Example:</strong> {card.example || "No example provided."}</p>
                  )}
                </div>
                <div className="meta">
                  Created By: {card.createdByUsername?.username || "Unknown"}
                </div>
              </div>

              {expandedCardId === card._id && (
                <div className="extra content">
                  <div className="ui three buttons">
                    <div className="ui basic green button">
                      {card.isFavorite ? "★ Favorite" : "☆ Add to Favorites"}
                    </div>
                    <div
                      className="ui basic blue button"
                       onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCard(card);
                          setModalOpen(true);
                        }}
                      >
                      <i className="pencil alternate icon"></i> Edit
                    </div>
                    <div
                      className="ui basic red button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(card._id);
                      }}
                    >
                      <i className="trash alternate icon"></i> Delete
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedCard && (
        <FlashcardEdit
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          selectedCard={selectedCard}
          deckId={deck._id}
          refetch={refetchCards}
        />
      )}  
      {deckModalOpen && (
        <EditDeck
        modalOpen={deckModalOpen}
        setModalOpen={setDeckModalOpen}
        selectedDeck={deck || undefined}
        deckId= {deck._id}
        refetch={refetchDeck}
      />
      )}

      <button onClick={handleAddNewCardClick} className="ui blue button">
        Add New Flashcard
      </button>
      <button onClick={handleDeleteDeck} className="ui red button" disabled={deleting}>
        {deleting ? 'Deleting...' : 'Delete Deck'}
      </button>
      {deleteError && <p style={{ color: 'red' }}>Error deleting deck: {deleteError.message}</p>}
        <button onClick={() => setDeckModalOpen(true)} className="ui pink button">
  Edit Deck
</button>
    </div>
  );
};

export default DeckDetail;