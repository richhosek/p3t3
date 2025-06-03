import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { QUERY_ALL_DECKS, QUERY_SINGLE_DECK } from "../../utils/queries";
import { UPDATE_FLASHCARD, DELETE_FLASHCARD } from "../../utils/mutations";
import { Modal, Button } from "semantic-ui-react";
import { Flashcard } from "../../interfaces/Flashcard";
interface FlashcardEditProps {
    selectedCard: Flashcard;
    deckId: string;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    refetch?: () => void;
}

const FlashcardEdit: React.FC<FlashcardEditProps> = ({ 
  selectedCard, 
  deckId, 
  modalOpen, 
  setModalOpen,
  refetch 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTerm, setEditTerm] = useState("");
  const [editDefinition, setEditDefinition] = useState("");
  const [editExample, setEditExample] = useState("");

  // Reset state when modal opens or selectedCard changes
  useEffect(() => {
    if (modalOpen && selectedCard) {
      setEditTerm(selectedCard.term || "");
      setEditDefinition(selectedCard.definition || "");
      setEditExample(selectedCard.example || "");
      setIsEditing(false);
    }
  }, [modalOpen, selectedCard]);

  const [updateFlashcard, { loading: updateLoading }] = useMutation(UPDATE_FLASHCARD, {
    refetchQueries: [
      { query: QUERY_SINGLE_DECK, variables: { id: deckId } },
      { query: QUERY_ALL_DECKS },
    ],
    onCompleted: () => {
      if (refetch) refetch();
    }
  });

  const [deleteFlashcard, { loading: deleteLoading }] = useMutation(DELETE_FLASHCARD, {
    refetchQueries: [
      { query: QUERY_SINGLE_DECK, variables: { id: deckId } },
      { query: QUERY_ALL_DECKS }
    ],
    onCompleted: () => {
      if (refetch) refetch();
    }
  });

  const handleEditSubmit = async () => {
    if (!editTerm.trim() || !editDefinition.trim()) {
      alert("Term and definition are required!");
      return;
    }

    try {
      await updateFlashcard({
        variables: {
          id: selectedCard._id,
          input: {
            term: editTerm.trim(),
            definition: editDefinition.trim(),
            example: editExample.trim(),
            isFavorite: selectedCard.isFavorite || false,
          },
        },
      });
      setIsEditing(false);
      setModalOpen(false);
    } catch (err) {
      console.error("Error updating flashcard:", err);
      alert("Failed to update flashcard. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) {
      return;
    }

    try {
      await deleteFlashcard({ 
        variables: { id: selectedCard._id } 
      });
      setModalOpen(false);
    } catch (err) {
      console.error("Error deleting flashcard:", err);
      alert("Failed to delete flashcard. Please try again.");
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditTerm(selectedCard.term || "");
    setEditDefinition(selectedCard.definition || "");
    setEditExample(selectedCard.example || "");
    setIsEditing(false);
  };

  const handleToggleFavorite = async () => {
    try {
      await updateFlashcard({
        variables: {
          id: selectedCard._id,
          input: {
            term: selectedCard.term,
            definition: selectedCard.definition,
            example: selectedCard.example || "",
            isFavorite: !selectedCard.isFavorite,
          },
        },
      });
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert("Failed to update favorite status.");
    }
  };

  // Don't render if no selected card
  if (!selectedCard) {
    return null;
  }

  return (
    <Modal 
      open={modalOpen} 
      onClose={() => setModalOpen(false)} 
      size="tiny"
      closeIcon
    >
      <Modal.Header>
        {isEditing ? "Edit Flashcard" : "Flashcard Details"}
      </Modal.Header>

      <Modal.Content>
        {!isEditing ? (
          <div>
            <h3 style={{ marginBottom: '10px' }}>{selectedCard.term}</h3>
            <p><strong>Definition:</strong> {selectedCard.definition}</p>
            {selectedCard.example && (
              <p><strong>Example:</strong> {selectedCard.example}</p>
            )}
            {selectedCard.createdByUsername && (
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Created by: {selectedCard.createdByUsername.username}
              </p>
            )}
          </div>
        ) : (
          <div className="ui form" style={{ width: "100%" }}>
            <div className="field">
              <label>Term *</label>
              <input
                type="text"
                value={editTerm}
                onChange={(e) => setEditTerm(e.target.value)}
                placeholder="Enter term"
                required
              />
            </div>
            <div className="field">
              <label>Definition *</label>
              <textarea
                value={editDefinition}
                onChange={(e) => setEditDefinition(e.target.value)}
                placeholder="Enter definition"
                rows={3}
                required
              />
            </div>
            <div className="field">
              <label>Example (Optional)</label>
              <textarea
                value={editExample}
                onChange={(e) => setEditExample(e.target.value)}
                placeholder="Enter example (optional)"
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal.Content>

      <Modal.Actions>
        {!isEditing ? (
          <>
            <Button 
              color="yellow" 
              basic 
              onClick={handleToggleFavorite}
              disabled={updateLoading}
            >
              {selectedCard.isFavorite ? "★ Favorite" : "☆ Add to Favorites"}
            </Button>
            <Button 
              color="blue" 
              basic 
              onClick={() => setIsEditing(true)}
            >
              <i className="edit outline icon"></i> Edit
            </Button>
            <Button
              color="red"
              basic
              onClick={handleDelete}
              loading={deleteLoading}
              disabled={deleteLoading}
            >
              <i className="trash alternate icon"></i> Delete
            </Button>
          </>
        ) : (
          <>
            <Button
              color="green"
              onClick={handleEditSubmit}
              loading={updateLoading}
              disabled={updateLoading || !editTerm.trim() || !editDefinition.trim()}
            >
              <i className="save icon"></i> Save Changes
            </Button>
            <Button 
              basic 
              onClick={handleCancel}
              disabled={updateLoading}
            >
              Cancel
            </Button>
          </>
        )}
        <Button onClick={() => setModalOpen(false)}>Close</Button>
      </Modal.Actions>
    </Modal>
  );
};

export default FlashcardEdit;