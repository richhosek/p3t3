import React from 'react';
import { QUERY_SINGLE_DECK } from '../../utils/queries'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import '../../styles/DeckComponent.css';

interface Flashcard {
  _id: string;
  term: string;
  definition: string;
  example?: string;
}

interface DeckData {
  _id: string;
  title: string;
  description: string;
  flashcards: Flashcard[];
  createdByUsername: {
    username: string;
  };
}

const Deck: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id: id },
    skip: !id, // Don't run query if no ID
  });

  if (loading) {
    return (
      <div className="ui segment">
        <div className="ui active dimmer">
          <div className="ui indeterminate text loader">Loading deck...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui negative message">
        <div className="header">Error loading deck</div>
        <p>{error.message}</p>
      </div>
    );
  }

  // Fixed: Use correct data path
  const deck: DeckData = data?.getSingleDeck;

  if (!deck) {
    return (
      <div className="ui warning message">
        <div className="header">Deck not found</div>
        <p>The requested deck could not be found.</p>
        <button 
          className="ui button" 
          onClick={() => navigate('/game/flashCards/Decks')}
        >
          Back to Decks
        </button>
      </div>
    );
  }
    
  return (
    <main className="deck-container">
      {/* Deck Header */}
      <div className="deck-header">
        <div className="ui huge header">
          <i className="clone outline icon"></i>
          <div className="content">
            {deck.title}
            <div className="sub header">
              {deck.description}
            </div>
          </div>
        </div>
        
        <div className="deck-meta">
          <div className="ui label">
            <i className="user icon"></i>
            Created by {deck.createdByUsername.username}
          </div>
          <div className="ui label">
            <i className="file outline icon"></i>
            {deck.flashcards.length} {deck.flashcards.length === 1 ? 'card' : 'cards'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="deck-actions">
        <div className="ui buttons">
          <button 
            className="ui violet button"
            onClick={() => navigate(`/flashcard/${deck._id}/flashCards`)}
            disabled={deck.flashcards.length === 0}
          >
            <i className="graduation cap icon"></i>
            Study Flashcards
          </button>
          <button 
            className="ui teal button"
            onClick={() => navigate(`/matching/${deck._id}`)}
            disabled={deck.flashcards.length < 2}
          >
            <i className="game icon"></i>
            Memory Game
          </button>
          <button 
            className="ui orange button"
            onClick={() => navigate(`/crossword/${deck._id}`)}
            disabled={deck.flashcards.length < 6}
          >
            <i className="puzzle piece icon"></i>
            Crossword
          </button>
        </div>
        
        <div className="ui buttons">
          <button 
            className="ui blue button"
            onClick={() => navigate(`/deck/${deck._id}/new-card`)}
          >
            <i className="plus icon"></i>
            Add Cards
          </button>
          <button 
            className="ui basic button"
            onClick={() => navigate('/game/flashCards/Decks')}
          >
            <i className="arrow left icon"></i>
            Back to Decks
          </button>
        </div>
      </div>

      {/* Flashcards Preview */}
      <div className="deck-content">
        <h3 className="ui dividing header">
          <i className="cards outline icon"></i>
          Flashcards Preview
        </h3>
        
        {deck.flashcards.length === 0 ? (
          <div className="ui placeholder segment">
            <div className="ui icon header">
              <i className="file outline icon"></i>
              No flashcards in this deck yet
            </div>
            <button 
              className="ui primary button"
              onClick={() => navigate(`/deck/${deck._id}/new-card`)}
            >
              Add Your First Card
            </button>
          </div>
        ) : (
          <div className="ui cards">
            {deck.flashcards.slice(0, 6).map((card) => (
              <div key={card._id} className="card">
                <div className="content">
                  <div className="header flashcard-term-header">
                    TERM
                  </div>
                  <div className="description flashcard-term-content">
                    {card.term}
                  </div>
                  <div className="header flashcard-definition-header">
                    DEFINITION
                  </div>
                  <div className="description">
                    {card.definition}
                  </div>
                  {card.example && (
                    <>
                      <div className="header flashcard-example-header">
                        EXAMPLE
                      </div>
                      <div className="description flashcard-example-content">
                        {card.example}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {deck.flashcards.length > 6 && (
          <div className="cards-preview-more">
            <div className="ui message">
              <p>
                Showing 6 of {deck.flashcards.length} cards. 
                <strong> Start studying to see all cards!</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Study Statistics */}
      {deck.flashcards.length > 0 && (
        <div className="deck-stats">
          <h3 className="ui dividing header">
            <i className="chart bar icon"></i>
            Deck Statistics
          </h3>
          <div className="ui statistics">
            <div className="statistic">
              <div className="value">
                {deck.flashcards.length}
              </div>
              <div className="label">
                Total Cards
              </div>
            </div>
            <div className="statistic">
              <div className="value">
                {Math.ceil(deck.flashcards.length / 5)}
              </div>
              <div className="label">
                Estimated Study Time (min)
              </div>
            </div>
            <div className="statistic">
              <div className="value">
                {deck.flashcards.filter(card => card.example).length}
              </div>
              <div className="label">
                Cards with Examples
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Deck;