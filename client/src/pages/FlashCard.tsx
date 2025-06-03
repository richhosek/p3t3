import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_SINGLE_DECK } from '../utils/queries';
import { StatsManager } from '../utils/StatsManager';
import { Flashcard } from '../interfaces/Flashcard';
import '../styles/FlashcardGame.css';


interface StudyStats {
  correct: number;
  incorrect: number;
  total: number;
  currentStreak: number;
  bestStreak: number;
}

interface SessionTracker {
  startTime: number;
  cardsStudied: Set<string>;
  answers: { correct: number; total: number };
  streak: number;
}

const FlashCard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id: id },
    skip: !id,
  });

  // Study state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'sequential' | 'random' | 'incorrect'>('sequential');
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyStats, setStudyStats] = useState<StudyStats>({
    correct: 0,
    incorrect: 0,
    total: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  const [incorrectCards, setIncorrectCards] = useState<Flashcard[]>([]);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [isStudyComplete, setIsStudyComplete] = useState(false);

  // Session tracking for stats
  const [sessionTracker, setSessionTracker] = useState<SessionTracker>({
    startTime: Date.now(),
    cardsStudied: new Set(),
    answers: { correct: 0, total: 0 },
    streak: 0
  });

  // Initialize study cards when data loads
  useEffect(() => {
    if (data?.getSingleDeck?.flashcards) {
      const cards = [...data.getSingleDeck.flashcards];
      if (studyMode === 'random') {
        // Shuffle cards for random mode
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cards[i], cards[j]] = [cards[j], cards[i]];
        }
      } else if (studyMode === 'incorrect' && incorrectCards.length > 0) {
        setStudyCards(incorrectCards);
        setIsFlipped(false);
        setShowAnswer(false);
        return;
      }
      setStudyCards(cards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  }, [data, studyMode, incorrectCards]);

  // Card flip animation variants
  const cardVariants = {
    front: { rotateY: 0 },
    back: { rotateY: 180 },
  };

  const cardTransition = {
    duration: 0.6,
    type: "spring",
    stiffness: 300,
    damping: 20,
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(true);
    
    // Track card as studied
    const currentCard = studyCards[currentCardIndex];
    if (currentCard) {
      setSessionTracker(prev => ({
        ...prev,
        cardsStudied: new Set([...prev.cardsStudied, currentCard._id])
      }));
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!showAnswer) return;

    const newStats = { ...studyStats };
    newStats.total += 1;
    
    // Update session tracker
    setSessionTracker(prev => ({
      ...prev,
      answers: {
        correct: prev.answers.correct + (isCorrect ? 1 : 0),
        total: prev.answers.total + 1
      },
      streak: isCorrect ? prev.streak + 1 : 0
    }));
    
    if (isCorrect) {
      newStats.correct += 1;
      newStats.currentStreak += 1;
      newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
    } else {
      newStats.incorrect += 1;
      newStats.currentStreak = 0;
      // Add to incorrect cards for review
      const currentCard = studyCards[currentCardIndex];
      if (!incorrectCards.find(card => card._id === currentCard._id)) {
        setIncorrectCards([...incorrectCards, currentCard]);
      }
    }
    
    setStudyStats(newStats);
    nextCard();
  };

  const nextCard = () => {
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    } else {
      setIsStudyComplete(true);
      // Save session stats when study is complete
      saveSessionStats();
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const saveSessionStats = () => {
    const timeSpent = Math.floor((Date.now() - sessionTracker.startTime) / 1000);
    
    StatsManager.updateFlashcardStats({
      cardsStudied: sessionTracker.cardsStudied.size,
      correct: sessionTracker.answers.correct,
      totalAnswered: sessionTracker.answers.total,
      streak: Math.max(sessionTracker.streak, studyStats.bestStreak),
      timeSpent: timeSpent
    });
  };

  const restartStudy = () => {
    // Save current session before restarting
    if (sessionTracker.answers.total > 0) {
      saveSessionStats();
    }
    
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setIsStudyComplete(false);
    setStudyStats({
      correct: 0,
      incorrect: 0,
      total: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    
    // Reset session tracker
    setSessionTracker({
      startTime: Date.now(),
      cardsStudied: new Set(),
      answers: { correct: 0, total: 0 },
      streak: 0
    });
  };

  const switchStudyMode = (mode: 'sequential' | 'random' | 'incorrect') => {
    if (mode === 'incorrect' && incorrectCards.length === 0) {
      alert('No incorrect cards to review yet!');
      return;
    }
    setStudyMode(mode);
    restartStudy();
  };

  // Save stats when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (sessionTracker.answers.total > 0) {
        saveSessionStats();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="ui segment">
          <div className="ui active dimmer">
            <div className="ui indeterminate text loader">Loading deck...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('FlashCard GraphQL Error:', error);
    return (
      <div className="error-container">
        <div className="ui negative message">
          <div className="header">Error Loading Deck</div>
          <p>{error.message}</p>
          <button 
            className="ui button" 
            onClick={() => navigate('/game/flashCards/Decks')}
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  if (!data?.getSingleDeck) {
    return (
      <div className="not-found-container">
        <div className="ui warning message">
          <div className="header">Deck Not Found</div>
          <p>The requested deck could not be found.</p>
          <button 
            className="ui button" 
            onClick={() => navigate('/game/flashCards/Decks')}
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  const deck = data.getSingleDeck;

  if (!deck.flashcards || deck.flashcards.length === 0) {
    return (
      <div className="no-cards-container">
        <div className="ui placeholder segment">
          <div className="ui icon header">
            <i className="file outline icon"></i>
            No flashcards in this deck
          </div>
          <div className="inline">
            <button 
              className="ui primary button"
              onClick={() => navigate(`/deck/${id}/new-card`)}
            >
              Add Flashcards
            </button>
            <button 
              className="ui button"
              onClick={() => navigate('/game/flashCards/Decks')}
            >
              Back to Decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = studyCards[currentCardIndex];

  if (isStudyComplete) {
    const sessionTime = Math.floor((Date.now() - sessionTracker.startTime) / 1000);
    const accuracy = studyStats.total > 0 ? (studyStats.correct / studyStats.total) * 100 : 0;

    return (
      <div className="study-complete-container">
        <h1 className="complete-title">Study Complete! 🎉</h1>
        
        <div className="results-card">
          <h2 className="results-title">Session Results</h2>
          <div className="results-grid">
            <div className="stat-card stat-card-green">
              <div className="stat-number stat-number-green">{studyStats.correct}</div>
              <div className="stat-label stat-label-green">Correct</div>
            </div>
            <div className="stat-card stat-card-red">
              <div className="stat-number stat-number-red">{studyStats.incorrect}</div>
              <div className="stat-label stat-label-red">Incorrect</div>
            </div>
            <div className="stat-card stat-card-blue">
              <div className="stat-number stat-number-blue">{accuracy.toFixed(1)}%</div>
              <div className="stat-label stat-label-blue">Accuracy</div>
            </div>
            <div className="stat-card stat-card-purple">
              <div className="stat-number stat-number-purple">{studyStats.bestStreak}</div>
              <div className="stat-label stat-label-purple">Best Streak</div>
            </div>
            <div className="stat-card stat-card-orange">
              <div className="stat-number stat-number-orange">{sessionTracker.cardsStudied.size}</div>
              <div className="stat-label stat-label-orange">Cards Studied</div>
            </div>
            <div className="stat-card stat-card-indigo">
              <div className="stat-number stat-number-indigo">
                {Math.floor(sessionTime / 60)}:{(sessionTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="stat-label stat-label-indigo">Time Spent</div>
            </div>
          </div>
        </div>

        {/* Performance feedback */}
        <div className="performance-feedback">
          {accuracy >= 90 ? (
            <div className="feedback feedback-excellent">
              <span className="feedback-icon">🌟</span>
              <span className="feedback-text">Outstanding performance! You're mastering this material!</span>
            </div>
          ) : accuracy >= 75 ? (
            <div className="feedback feedback-good">
              <span className="feedback-icon">👍</span>
              <span className="feedback-text">Great job! Keep up the good work!</span>
            </div>
          ) : accuracy >= 60 ? (
            <div className="feedback feedback-okay">
              <span className="feedback-icon">📚</span>
              <span className="feedback-text">Good effort! Consider reviewing the incorrect cards.</span>
            </div>
          ) : (
            <div className="feedback feedback-needs-work">
              <span className="feedback-icon">💪</span>
              <span className="feedback-text">Keep practicing! Review the material and try again.</span>
            </div>
          )}
        </div>

        <div className="button-group">
          <button onClick={restartStudy} className="btn-primary">
            Study Again
          </button>
          
          {incorrectCards.length > 0 && (
            <button onClick={() => switchStudyMode('incorrect')} className="btn-secondary">
              Review Incorrect Cards ({incorrectCards.length})
            </button>
          )}
          
          <button onClick={() => navigate(`/deck/${id}`)} className="btn-tertiary">
            Back to Deck
          </button>
          
          <button onClick={() => navigate('/stats')} className="btn-stats">
            View All Stats
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return <div className="no-cards-container"><p>No cards to study</p></div>;
  }

  return (
    <div className="study-container">
      {/* Header */}
      <div className="study-header">
        <h1 className="study-title">Studying: {deck.title}</h1>
        <div className="study-info">
          <div className="card-counter">
            Card {currentCardIndex + 1} of {studyCards.length}
          </div>
          <div className="stats-display">
            <span className="stat-correct">✓ {studyStats.correct}</span>
            <span className="stat-incorrect">✗ {studyStats.incorrect}</span>
            <span className="stat-streak">🔥 {studyStats.currentStreak}</span>
            <span className="stat-cards">📚 {sessionTracker.cardsStudied.size} studied</span>
          </div>
        </div>
      </div>

      {/* Study Mode Selector */}
      <div className="mode-selector">
        <div className="mode-buttons">
          <button
            onClick={() => switchStudyMode('sequential')}
            className={`mode-button ${
              studyMode === 'sequential' ? 'mode-button-active' : 'mode-button-inactive'
            }`}
          >
            Sequential
          </button>
          <button
            onClick={() => switchStudyMode('random')}
            className={`mode-button ${
              studyMode === 'random' ? 'mode-button-active' : 'mode-button-inactive'
            }`}
          >
            Random
          </button>
          <button
            onClick={() => switchStudyMode('incorrect')}
            disabled={incorrectCards.length === 0}
            className={`mode-button ${
              studyMode === 'incorrect' 
                ? 'mode-button-active' 
                : incorrectCards.length === 0
                ? 'mode-button-disabled'
                : 'mode-button-inactive'
            }`}
          >
            Review Incorrect ({incorrectCards.length})
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentCardIndex) / studyCards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="card-container">
        <div className="card-wrapper">
          <motion.div
            className="card"
            initial="front"
            animate={isFlipped ? "back" : "front"}
            variants={cardVariants}
            transition={cardTransition}
            onClick={handleFlip}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front of Card */}
            <div className="card-face card-front" style={{ 
              backfaceVisibility: 'hidden',
              position: 'absolute',
              width: '100%',
              height: '100%'
            }}>
              <div className="card-content">
                <div className="card-label">Term</div>
                <div className="card-text">
                  {currentCard?.term || "No term available"}
                </div>
                <div className="card-instruction">Click to reveal answer</div>
              </div>
            </div>

            {/* Back of Card */}
            <div className="card-face card-back" style={{ 
              backfaceVisibility: 'hidden',
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: 'rotateY(180deg)'
            }}>
              <div className="card-content">
                <div className="card-label">Definition</div>
                <div className="card-text">{currentCard.definition}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Answer Buttons */}
      {showAnswer && (
        <div className="answer-buttons">
          <button onClick={() => handleAnswer(false)} className="answer-button answer-incorrect">
            ✗ Incorrect
          </button>
          <button onClick={() => handleAnswer(true)} className="answer-button answer-correct">
            ✓ Correct
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="navigation">
        <button
          onClick={previousCard}
          disabled={currentCardIndex === 0}
          className="nav-button nav-button-gray"
        >
          Previous
        </button>

        <button onClick={() => navigate(`/deck/${id}`)} className="nav-button nav-button-light-gray">
          Exit Study
        </button>

        <button
          onClick={nextCard}
          disabled={currentCardIndex === studyCards.length - 1}
          className="nav-button nav-button-gray"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default FlashCard;