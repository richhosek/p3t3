
import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { QUERY_SINGLE_DECK, QUERY_ALL_DECKS } from "../../utils/queries";
import { UPDATE_DECK, DELETE_DECK } from "../../utils/mutations";
import { Modal, Button, Form, Message, Confirm } from "semantic-ui-react";

interface Deck {
  _id: string;
  title: string;
  description: string;
  createdByUsername?: { username: string };
}

interface EditDeckProps {
  selectedDeck?: Deck | null;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  refetch?: () => void;
  deckId?: string;
}

const EditDeck: React.FC<EditDeckProps> = ({ 
  modalOpen, 
  setModalOpen, 
  selectedDeck, 
  deckId, 
  refetch 
}) => {
  const navigate = useNavigate();
  
  // Form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form validation
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Get the actual deck ID to use
  const actualDeckId = deckId || selectedDeck?._id;

  const [updateDeck] = useMutation(UPDATE_DECK, {
    // FIXED: Remove variables from refetchQueries to refetch all
    refetchQueries: [
      { query: QUERY_ALL_DECKS },
      ...(actualDeckId ? [{ query: QUERY_SINGLE_DECK, variables: { id: actualDeckId } }] : [])
    ],
    onCompleted: (data) => {
      console.log("✅ Deck update completed:", data);
      if (refetch) {
        refetch();
      }
      setShowSuccess(true);
      setIsEditing(false);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("❌ Update mutation error:", error);
      console.error("Error details:", error.graphQLErrors);
      console.error("Network error:", error.networkError);
      setError(`Failed to update deck: ${error.message}`);
      setIsLoading(false);
    }
  });

  const [deleteDeck] = useMutation(DELETE_DECK, {
    refetchQueries: [{ query: QUERY_ALL_DECKS }],
    onCompleted: () => {
      console.log("✅ Deck deleted successfully");
      navigate("/game/flashCards/Decks");
      setModalOpen(false);
    },
    onError: (error) => {
      console.error("❌ Delete error:", error);
      setError(`Failed to delete deck: ${error.message}`);
      setIsLoading(false);
    }
  });

  // Initialize form when selectedDeck changes or modal opens
  useEffect(() => {
    if (modalOpen && selectedDeck) {
      console.log("🔄 Initializing form with deck:", selectedDeck);
      setEditTitle(selectedDeck.title || "");
      setEditDescription(selectedDeck.description || "");
      setIsEditing(false);
      setShowSuccess(false);
      setError(null);
      setFormErrors({});
    }
  }, [selectedDeck, modalOpen]);

  const validateForm = (): boolean => {
    const errors: { title?: string; description?: string } = {};
    
    if (!editTitle.trim()) {
      errors.title = "Title is required";
    } else if (editTitle.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long";
    }
    
    if (!editDescription.trim()) {
      errors.description = "Description is required";
    } else if (editDescription.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitDeckEdit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    console.log("🚀 Attempting to save deck update...");
    console.log("📝 Current values:", { 
      editTitle: editTitle.trim(), 
      editDescription: editDescription.trim() 
    });
    console.log("🆔 Deck ID:", actualDeckId);
    
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      return;
    }

    if (!actualDeckId) {
      console.log("❌ No deck ID found");
      setError("No deck ID found. Cannot update deck.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("📤 Calling updateDeck mutation with variables:", {
        id: actualDeckId,
        input: {
          title: editTitle.trim(),
          description: editDescription.trim(),
        }
      });

      const result = await updateDeck({
        variables: {
          id: actualDeckId,
          input: {
            title: editTitle.trim(),
            description: editDescription.trim(),
          },
        },
      });
      
      console.log("📥 Update result:", result);
      
      // Success handling is now in onCompleted
      setTimeout(() => {
        setShowSuccess(false);
        setModalOpen(false);
      }, 2000);
      
    } catch (err: any) {
      console.error("💥 Error in handleSubmitDeckEdit:", err);
      setError(err.message || "Failed to update deck. Please try again.");
      setIsLoading(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!actualDeckId) {
      setError("No deck ID found. Cannot delete deck.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🗑️ Deleting deck with ID:", actualDeckId);
      // FIXED: Use 'id' instead of 'deckId' to match the mutation
      await deleteDeck({ 
        variables: { 
          id: actualDeckId 
        } 
      });
    } catch (err: any) {
      console.error("💥 Error deleting deck:", err);
      setError(err.message || "Failed to delete deck. Please try again.");
      setIsLoading(false);
    }
  };

  const handleStartEdit = () => {
    console.log("✏️ Starting edit mode");
    setIsEditing(true);
    setError(null);
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    console.log("❌ Canceling edit");
    setIsEditing(false);
    setFormErrors({});
    setError(null);
    // Reset to original values
    if (selectedDeck) {
      setEditTitle(selectedDeck.title || "");
      setEditDescription(selectedDeck.description || "");
    }
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      console.log("🚪 Closing modal");
      setModalOpen(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("🔍 EditDeck component state:", {
      selectedDeck: selectedDeck ? {
        _id: selectedDeck._id,
        title: selectedDeck.title,
        description: selectedDeck.description
      } : null,
      modalOpen,
      deckId,
      actualDeckId,
      editTitle,
      editDescription,
      isEditing,
      isLoading
    });
  }, [selectedDeck, modalOpen, deckId, actualDeckId, editTitle, editDescription, isEditing, isLoading]);

  if (!selectedDeck) {
    console.log("⚠️ No selectedDeck provided");
    return null;
  }

  return (
    <>
      <Modal 
        open={modalOpen} 
        onClose={handleCloseModal} 
        size="small"
        closeOnDimmerClick={!isLoading}
        closeIcon={!isLoading}
      >
        <Modal.Header>
          {isEditing ? "Edit Deck" : "Deck Details"}
        </Modal.Header>
        
        <Modal.Content>
          {showSuccess && (
            <Message success>
              <Message.Header>Success!</Message.Header>
              <p>Deck updated successfully.</p>
            </Message>
          )}
          
          {error && (
            <Message error>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {!isEditing ? (
            <div>
              <h3>{selectedDeck.title}</h3>
              <p>
                <strong>Description:</strong> {selectedDeck.description}
              </p>
              {selectedDeck.createdByUsername && (
                <p>
                  <strong>Created by:</strong> {selectedDeck.createdByUsername.username}
                </p>
              )}
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                <strong>ID:</strong> {actualDeckId}
              </p>
            </div>
          ) : (
            <Form onSubmit={handleSubmitDeckEdit} loading={isLoading}>
              <Form.Field error={!!formErrors.title}>
                <label>Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter deck title..."
                  disabled={isLoading}
                />
                {formErrors.title && (
                  <div className="ui pointing red basic label">
                    {formErrors.title}
                  </div>
                )}
              </Form.Field>
              
              <Form.Field error={!!formErrors.description}>
                <label>Description *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter deck description..."
                  rows={4}
                  disabled={isLoading}
                />
                {formErrors.description && (
                  <div className="ui pointing red basic label">
                    {formErrors.description}
                  </div>
                )}
              </Form.Field>
            </Form>
          )}
        </Modal.Content>

        <Modal.Actions>
          {!isEditing ? (
            <>
              <Button 
                primary 
                onClick={handleStartEdit}
                disabled={isLoading}
                icon="edit"
                content="Edit"
              />
              <Button 
                color="red" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                icon="trash"
                content="Delete"
              />
            </>
          ) : (
            <>
              <Button 
                positive 
                onClick={handleSubmitDeckEdit}
                loading={isLoading}
                disabled={isLoading || !editTitle.trim() || !editDescription.trim()}
                icon="save"
                content="Save Changes"
              />
              <Button 
                onClick={handleCancelEdit}
                disabled={isLoading}
                icon="cancel"
                content="Cancel"
              />
            </>
          )}
          
          <Button 
            onClick={handleCloseModal}
            disabled={isLoading}
            icon="close"
            content="Close"
          />
        </Modal.Actions>
      </Modal>

      <Confirm
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteDeck();
        }}
        header="Delete Deck"
        content="Are you sure you want to delete this deck? This action cannot be undone and will delete all flashcards in this deck."
        confirmButton="Delete"
        cancelButton="Cancel"
      />
    </>
  );
};

export default EditDeck;