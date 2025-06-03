import React, { useState } from 'react';
import { CardFront } from "../CardFront";
import { CardBack } from "../CardBack";
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_SINGLE_DECK } from '../../utils/queries';  // Fixed import
import { CREATE_FLASHCARD } from '../../utils/mutations';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Flashcard } from '../../interfaces/Flashcard';
import { Deck } from '../../interfaces/Deck';
import '../../styles/AddFlashcard.css';  // Assuming you have a CSS file for styles



interface NewCardProps {
  onAdd: (newFlashcard: { term: string; definition: string }) => void;
}

const NewCard: React.FC<NewCardProps> = ({ onAdd }) => {
  const { id } = useParams<{ id: string }>();
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {  // Fixed query name
    variables: { id: id },
    skip: !id,
  });

const [createFlashcard] = useMutation(CREATE_FLASHCARD, {
  onCompleted: (data) => {
    console.log('Flashcard created, server returned:', data);
    setTerm('');
    setDefinition('');
    setExample('');
    setIsCreating(false);
    setShowPreview(false);
  },
  onError: (error) => {
    console.error('Error creating flashcard:', error);
    setIsCreating(false);
  }
});

const handleCreate = async () => {
  if (!term.trim() || !definition.trim()) {
    alert('Please fill in both term and definition');
    return;
  }

  setIsCreating(true);
  try {
    await createFlashcard({
      variables: {
        input: {
          term,
          definition,
          example,
      deckId: id, 
        }
      },
      refetchQueries: [{ query: QUERY_SINGLE_DECK, variables: { id } }],
    });

    // Notify parent component
    onAdd({ term: term.trim(), definition: definition.trim() });

    // Reset form
    setTerm('');
    setDefinition('');
    setIsCreating(false);
    setShowPreview(false);
  } catch (error) {
    console.error('Failed to create flashcard:', error);
    setIsCreating(false);
  }
};

  const handlePreview = () => {
    if (!term.trim() || !definition.trim()) {
      alert('Please fill in both term and definition to preview');
      return;
    }
    setShowPreview(true);
    setPreviewFlipped(false);
  };

  const handleClearForm = () => {
    setTerm('');
    setDefinition('');
    setShowPreview(false);
  };

 const handleDone = () => {
    navigate(`/deck/${id}`);  // Navigate back to the deck details page
  };

  if (loading) return <div className="flex justify-center p-8"><p>Loading deck...</p></div>;
  if (error) return <div className="flex justify-center p-8 text-red-600"><p>Error loading deck: {error.message}</p></div>;
  if (!data?.getSingleDeck) return <div className="flex justify-center p-8"><p>Deck not found</p></div>;

  const deck: Deck = data.getSingleDeck;  // Fixed data access

  return (
    <div className="bigform-container">
      {/* Header */}
      <div className="form-header">
        <h1 className="form-title">Add Flashcards to "{deck.title}"</h1>
        <p className="form-subtitle">
          Current cards in deck: {deck.flashcards.length}
        </p>
      </div>

      {/* New Card Form */}
      <form className="form">
        <div className="form-fields">
          <h3 className="form-create">Create New Flashcard:</h3>
          
          <div className="form-field">
            {/* Term Input */}
            <div className="field">
              <label className="label">Term or Question: </label>
              <textarea
                className="form-textarea"
                name="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Enter the term, question, or prompt..."
                rows={4}
                maxLength={500}
              />
            </div>
            
            {/* Definition Input */}
            <div className="field">
              <label className='label'>
                Definition or Answer: 
              </label>
              <textarea
                className="form-textarea"
                name="definition"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="Enter the definition, answer, or explanation..."
                rows={4}
                maxLength={500}
              />
            </div>
  
            {/* Example Input */}
            <div className="field">
              <label className='label'>
                Example: 
              </label>
              <textarea
                className="form-textarea"
                name="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Enter an example..."
                rows={4}
                maxLength={500}
              />
            </div>
  
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleCreate}
              disabled={isCreating || !term.trim() || !definition.trim()}
              className="ui blue button"
            >
              {isCreating ? 'Creating...' : 'Add Flashcard'}
            </button>
            
            <button
              onClick={handlePreview}
              disabled={!term.trim() || !definition.trim()}
              className="ui pink button"
            >
              Preview Card
            </button>
            
            <button
              onClick={handleClearForm}
              className="ui grey button"
            >
              Clear Form
            </button>
            <button onClick={handleDone} className="ui red button">Done</button>
  
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Card Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div 
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 min-h-32 flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-blue-100"
              onClick={() => setPreviewFlipped(!previewFlipped)}
            >
              {previewFlipped ? (
                <CardBack definition={definition} />
              ) : (
                <CardFront term={term} />
              )}
            </div>
            
            <p className="text-sm text-gray-600 text-center mt-3">
              Click card to flip • Currently showing: {previewFlipped ? 'Back' : 'Front'}
            </p>
          </div>
        </div>
      )}

      {/* Existing Cards List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="form-create">
          Cards in "{deck.title}" ({deck.flashcards.length})
        </h3>
        
        {deck.flashcards.length === 0 ? (
          <div className="text-center">
            <p>No cards in this deck yet. Add your first card above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deck.flashcards.map((card: Flashcard) => (
             <div
              key={card._id}
              className="flashcard-item"
            >
              <div className="flashcard-header">
                <div>
                  <label className="flashcard-label">Term</label>
                  <p className="flashcard-text">{card.term}</p>
                </div>
                <div>
                  <label className="flashcard-label">Definition</label>
                  <p className="flashcard-text">{card.definition}</p>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewCard;