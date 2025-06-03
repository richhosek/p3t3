import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_SINGLE_DECK } from '../utils/queries';
import { StatsManager } from '../utils/StatsManager';
import { Flashcard } from '../interfaces/Flashcard';
import '../styles/MatchingGame.css';


interface MemoryCard {
  id: string;
  content: string;
  type: 'term' | 'definition';
  flashcardId: string;
  isFlipped: boolean;
  isMatched: boolean;
  isMismatch: boolean;
}

interface GameStats {
  moves: number;
  matches: number;
  timeElapsed: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  startTime: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const Matching: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id: id },
    skip: !id,
  });

  // Game state
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameStats, setGameStats] = useState<GameStats>({
    moves: 0,
    matches: 0,
    timeElapsed: 0,
    gameStarted: false,
    gameCompleted: false,
    startTime: 0
  });
  const [showComplete, setShowComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Difficulty settings
  const difficultySettings = {
    easy: { pairs: 4, timeBonus: 1.5 },
    medium: { pairs: 6, timeBonus: 1.2 },
    hard: { pairs: 8, timeBonus: 1.0 }
  };

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (gameStats.gameStarted && !gameStats.gameCompleted) {
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          timeElapsed: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStats.gameStarted, gameStats.gameCompleted]);


  useEffect(() => {
    if (data?.getSingleDeck?.flashcards && data.getSingleDeck.flashcards.length > 0) {
      initializeGame();
    }
  }, [data, difficulty]);

  // Check for matches when two cards are flipped
  useEffect(() => {
    if (flippedCards.length === 2 && !isProcessing) {
      setIsProcessing(true);
      checkForMatch();
    }
  }, [flippedCards, isProcessing]);

  // Initialize or restart the game
  const initializeGame = useCallback(() => {
    if (!data?.getSingleDeck?.flashcards) return;

    const flashcards: Flashcard[] = data.getSingleDeck.flashcards;
    const pairCount = Math.min(difficultySettings[difficulty].pairs, flashcards.length);
    const selectedFlashcards = [...flashcards]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairCount);

    // Create pairs of cards (term + definition)
    const gameCards: MemoryCard[] = [];
    
    selectedFlashcards.forEach((flashcard) => {
      // Term card
      gameCards.push({
        id: `${flashcard._id}-term`,
        content: flashcard.term,
        type: 'term',
        flashcardId: flashcard._id,
        isFlipped: false,
        isMatched: false,
        isMismatch: false
      });
      
      // Definition card
      gameCards.push({
        id: `${flashcard._id}-definition`,
        content: flashcard.definition,
        type: 'definition',
        flashcardId: flashcard._id,
        isFlipped: false,
        isMatched: false,
        isMismatch: false
      });
    });

    // Shuffle the cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setGameStats({
      moves: 0,
      matches: 0,
      timeElapsed: 0,
      gameStarted: false,
      gameCompleted: false,
      startTime: 0
    });
    setShowComplete(false);
    setIsProcessing(false);
  }, [data, difficulty]);

  // Handle card click
  const handleCardClick = useCallback((clickedCard: MemoryCard) => {
    if (
      
      clickedCard.isFlipped || 
      clickedCard.isMatched || 
      flippedCards.length >= 2 || 
      isProcessing
    ) {
      return;
    }

    // Start game on first click
    if (!gameStats.gameStarted) {
      setGameStats(prev => ({
        ...prev,
        gameStarted: true,
        startTime: Date.now()
      }));
    }

    // Flip the card
    setCards(prev => prev.map(card => 
      card.id === clickedCard.id 
        ? { ...card, isFlipped: true, isMismatch: false }
        : card
    ));
    
    setFlippedCards(prev => [...prev, { ...clickedCard, isFlipped: true }]);
  }, [flippedCards, gameStats.gameStarted, isProcessing]);

  // Check if two flipped cards match
  const checkForMatch = useCallback(() => {
    const [card1, card2] = flippedCards;
    
    setTimeout(() => {
      const isMatch = card1.flashcardId === card2.flashcardId;
      
      setCards(prev => prev.map(card => {
        if (card.id === card1.id || card.id === card2.id) {
          return {
            ...card,
            isMatched: isMatch,
            isFlipped: isMatch,
            isMismatch: !isMatch
          };
        }
        return { ...card, isMismatch: false };
      }));

      if (isMatch) {
        // Match found
        setGameStats(prev => ({
          ...prev,
          moves: prev.moves + 1,
          matches: prev.matches + 1
        }));
        
        // Check if game is complete
        
        const totalPairs = difficultySettings[difficulty].pairs;
        if (gameStats.matches + 1 === totalPairs) {
          setTimeout(() => {
            setGameStats(prev => ({ ...prev, gameCompleted: true }));
            setShowComplete(true);
            // Save stats when game completes
            saveGameStats(true, gameStats.moves + 1, gameStats.timeElapsed);
          }, 500);
        }
      } else {
        // No match - flip cards back after delay
        setTimeout(() => {
          setCards(prev => prev.map(card => {
            if (card.id === card1.id || card.id === card2.id) {
              return {
                ...card,
                isFlipped: false,
                isMismatch: false
              };
            }
            return card;
          }));
        }, 1000);
        
        setGameStats(prev => ({
          ...prev,
          moves: prev.moves + 1
        }));
      }
      
      setFlippedCards([]);
      setIsProcessing(false);
    }, 600);
  }, [flippedCards, gameStats.matches, gameStats.timeElapsed, difficulty]);

  // Save game statistics
  const saveGameStats = (completed: boolean, finalMoves?: number, finalTime?: number) => {
    const moves = finalMoves || gameStats.moves;
    const timeElapsed = finalTime || gameStats.timeElapsed;
    const totalPairs = difficultySettings[difficulty].pairs;
    const score = calculateScore(moves, timeElapsed);
    const perfect = completed && moves === totalPairs; // Perfect = minimum possible moves

    StatsManager.updateMatchingStats({
      difficulty,
      completed,
      timeElapsed,
      moves,
      score,
      perfect
    });
  };

  // Calculate score based on moves and time
  const calculateScore = (moves?: number, time?: number): number => {
    const finalMoves = moves || gameStats.moves;
    const finalTime = time || gameStats.timeElapsed;
    const timeBonus = difficultySettings[difficulty].timeBonus;
    const baseScore = 1000;
    const movePenalty = finalMoves * 10;
    const timePenalty = finalTime * 2;
    const difficultyBonus = difficulty === 'hard' ? 500 : difficulty === 'medium' ? 250 : 0;
    
    return Math.max(0, Math.floor((baseScore - movePenalty - timePenalty + difficultyBonus) * timeBonus));
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset game
  const resetGame = () => {
    // Save incomplete game stats if game was started
    if (gameStats.gameStarted && !gameStats.gameCompleted) {
      saveGameStats(false);
    }
    initializeGame();
  };

  // Change difficulty
  const changeDifficulty = (newDifficulty: Difficulty) => {
    // Save current game stats if switching mid-game
    if (gameStats.gameStarted && !gameStats.gameCompleted) {
      saveGameStats(false);
    }
    setDifficulty(newDifficulty);
  };

  // Auto-hint (flip a pair briefly)
  const showHint = () => {
    if (gameStats.gameCompleted || isProcessing) return;
    
    const unmatchedCards = cards.filter(card => !card.isMatched && !card.isFlipped);
    if (unmatchedCards.length < 2) return;
    
    // Find a matching pair
    const cardGroups = unmatchedCards.reduce((groups, card) => {
      if (!groups[card.flashcardId]) {
        groups[card.flashcardId] = [];
      }
      groups[card.flashcardId].push(card);
      return groups;
    }, {} as Record<string, MemoryCard[]>);
    
    const matchingPair = Object.values(cardGroups).find(group => group.length === 2);
    
    if (matchingPair) {
      // Briefly show the pair
      setCards(prev => prev.map(card => 
        matchingPair.some(pCard => pCard.id === card.id)
          ? { ...card, isFlipped: true }
          : card
      ));
      
      setTimeout(() => {
        setCards(prev => prev.map(card => 
          matchingPair.some(pCard => pCard.id === card.id)
            ? { ...card, isFlipped: false }
            : card
        ));
      }, 2000);
    }
  };

  // Save stats when component unmounts
  useEffect(() => {
    return () => {
      if (gameStats.gameStarted && !gameStats.gameCompleted) {
        saveGameStats(false);
      }
    };
  }, [gameStats.gameStarted, gameStats.gameCompleted]);

  if (loading) return <div className="loading-cards">Loading flashcards...</div>;
  if (error) return <div className="loading-cards">Error: {error.message}</div>;
  
  if (!data?.getSingleDeck?.flashcards || data.getSingleDeck.flashcards.length === 0) {
    return (
      <div className="memory-game-container">
        <div className="no-cards-message">
          <h3 className="no-cards-title">No Flashcards Available</h3>
          <p className="no-cards-text">This deck doesn't have any flashcards to play with.</p>
          <p>Add some flashcards to start playing the memory game!</p>
        </div>
      </div>
    );
  }
  

  const totalPairs = difficultySettings[difficulty].pairs;
  const progress = totalPairs > 0 ? (gameStats.matches / totalPairs) * 100 : 0;

  return (
    <div className="memory-game-container">
      <div className="memory-game-header">
        <h1 className="memory-game-title">Memory Matching Game</h1>
        <p className="memory-game-subtitle">
          Match terms with their definitions from: <strong>{data.getSingleDeck.title}</strong>
        </p>
      </div>

      {/* Difficulty Selector */}
      <div className="difficulty-selector">
        {(Object.keys(difficultySettings) as Difficulty[]).map(level => (
          <button
            key={level}
            className={`difficulty-button ${difficulty === level ? 'active' : ''}`}
            onClick={() => changeDifficulty(level)}
            disabled={gameStats.gameStarted && !gameStats.gameCompleted}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)} ({difficultySettings[level].pairs} pairs)
          </button>
        ))}
      </div>

      {/* Game Stats */}
      <div className="game-stats">
        <div className="stat-item">
          <div className="stat-value">{gameStats.moves}</div>
          <div className="stat-label">Moves</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{gameStats.matches}</div>
          <div className="stat-label">Matches</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{formatTime(gameStats.timeElapsed)}</div>
          <div className="stat-label">Time</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{Math.round(progress)}%</div>
          <div className="stat-label">Complete</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{calculateScore()}</div>
          <div className="stat-label">Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-indicator">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          {gameStats.matches} of {totalPairs} pairs matched
        </div>
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        <button onClick={resetGame} className="control-button btn-primary">
          New Game
        </button>
        <button 
          onClick={showHint} 
          className="control-button btn-secondary"
          disabled={gameStats.gameCompleted || isProcessing}
        >
          Show Hint
        </button>
      </div>

      {/* Game Board */}
<div className={`memory-game-board board-${difficulty}`}>
  {cards.map((card) => (
    <div
      key={card.id}
      className={`memory-card ${card.isFlipped ? 'flipped' : ''} ${
        card.isMatched ? 'matched' : ''
      } ${card.isMismatch ? 'mismatch' : ''} ${
        isProcessing && flippedCards.some(fc => fc.id === card.id) ? 'disabled' : ''
      }`}
      onClick={() => handleCardClick(card)}
    >
      <div className="card-inner">
        {/* Card Back - should show when NOT flipped */}
        <div className="card-face card-back">
          <div className="card-back-content">?</div>
        </div>
        
        {/* Card Front - should show when flipped */}
        <div className={`card-face card-front ${card.type}`}>
          <div className="card-content">
            <div className="card-type">{card.type}</div>
            <div className="card-text">{card.content}</div>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Game Complete Modal */}
      {showComplete && (
        <div className="game-complete-overlay" onClick={() => setShowComplete(false)}>
          <div className="game-complete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🎉 Congratulations!</h2>
            <p>You completed the memory game!</p>
            
            <div className="modal-stats">
              <div className="modal-stat">
                <div className="modal-stat-value">{gameStats.moves}</div>
                <div className="modal-stat-label">Total Moves</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-value">{formatTime(gameStats.timeElapsed)}</div>
                <div className="modal-stat-label">Time Taken</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-value">{calculateScore()}</div>
                <div className="modal-stat-label">Final Score</div>
              </div>
              <div className="modal-stat">
                <div className="modal-stat-value">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
                <div className="modal-stat-label">Difficulty</div>
              </div>
            </div>

            <div className="modal-performance">
              {gameStats.moves <= totalPairs && gameStats.timeElapsed <= 60 ? (
                <div className="performance-excellent">
                  <span className="performance-icon">⭐</span>
                  <span>Perfect Game! Minimum moves achieved!</span>
                </div>
              ) : gameStats.moves <= totalPairs * 1.5 && gameStats.timeElapsed <= 60 ? (
                <div className="performance-excellent">
                  <span className="performance-icon">🌟</span>
                  <span>Excellent Performance!</span>
                </div>
              ) : gameStats.moves <= totalPairs * 2 && gameStats.timeElapsed <= 120 ? (
                <div className="performance-good">
                  <span className="performance-icon">👍</span>
                  <span>Good Job!</span>
                </div>
              ) : (
                <div className="performance-okay">
                  <span className="performance-icon">👌</span>
                  <span>Well Done!</span>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowComplete(false);
                  resetGame();
                }} 
                className="modal-button btn-primary"
              >
                Play Again
              </button>
              <button 
                onClick={() => navigate('/stats')} 
                className="modal-button btn-secondary"
              >
                View Stats
              </button>
              <button 
                onClick={() => setShowComplete(false)} 
                className="modal-button btn-tertiary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matching;