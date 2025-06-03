import React, { useState } from "react";
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_DECK } from '../utils/mutations';
import '../styles/CreateDeck.css'; // Assuming you have a CSS file for styles

const CreateDeck = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [createDeckMutation, { loading }] = useMutation(CREATE_DECK, {
  onCompleted: (data) => {
    const newDeck = data.createDeck;  // note: 'createDeck', lowercase 'c'
    console.log('Deck created:', newDeck);
    navigate(`/deck/${newDeck._id}/new-card`);
  },
  onError: (error) => {
  console.error('Error creating deck:', error.message, error.graphQLErrors, error.networkError);
  if (error.graphQLErrors) {
  error.graphQLErrors.forEach(({ message }) => {
    console.error('GraphQL error message:', message);
  });
}
  setErrorMessage('Failed to create deck. Please try again.');
},
});
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!title.trim()) {
    setErrorMessage('Title is required');
    return;
  }

  const variables: { title: string; description?: string } = { title: title.trim() };
  if (description.trim()) {
    variables.description = description.trim();
  }

  try {
    await createDeckMutation({ variables });
  } catch (err) {
    // Optional additional error handling here
  }
};


  return (
    <div className="create-deck">
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className=" form">
        <h1 className="title">Create a New Deck</h1>
           <div className="form-field">
        <label className="form-label">Deck Title</label>
        <input
          className="form-input"
          name="deckTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title"
          maxLength={100}
        />
      </div>
  
          <div className="form-field">
    <label className="form-label">Description</label>
    <textarea
      className="form-textarea"
      name="deckDescription"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Enter a brief description (optional)"
      rows={4}
      maxLength={500}
    />
  </div>
  
          {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
  
          <div className="buttonfield">
            <button type="submit" className="ui yellow button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Deck'}
            </button>
            <button type="button" className='ui red button' onClick={() => navigate('/home')} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDeck;
