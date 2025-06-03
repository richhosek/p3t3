import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_SINGLE_DECK } from '../utils/queries';
import { Flashcard } from '../interfaces/Flashcard';
import '../styles/LinkUp.css';
interface Connection {
  termId: string;
  definitionId: string;
  isCorrect: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: Position | null;
  currentPoint: Position | null;
  startElementId: string | null;
  startElementType: 'term' | 'definition' | null;
}

interface GameStats {
  attempts: number;
  correct: number;
  timeElapsed: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  startTime: number;
}

const LinkUp: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id: id },
    skip: !id,
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [shuffledDefinitions, setShuffledDefinitions] = useState<Flashcard[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    startElementId: null,
    startElementType: null
  });

  const [gameStats, setGameStats] = useState<GameStats>({
    attempts: 0,
    correct: 0,
    timeElapsed: 0,
    gameStarted: false,
    gameCompleted: false,
    startTime: 0
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize flashcards when data loads
  useEffect(() => {
    if (data?.getSingleDeck?.flashcards) {
      const cards = data.getSingleDeck.flashcards.slice(0, 8); // Limit to 8 for better UX
      setFlashcards(cards);
      
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setShuffledDefinitions(shuffled);
    }
  }, [data]);

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

  // Check if game is completed
  useEffect(() => {
    if (flashcards.length > 0 && connections.length === flashcards.length && connections.every(conn => conn.isCorrect)) {
      setGameStats(prev => ({ ...prev, gameCompleted: true }));
    }
  }, [connections, flashcards.length]);

  const getElementCenter = (elementId: string): Position | null => {
    const element = document.getElementById(elementId);
    if (!element || !containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return {
      x: elementRect.left + elementRect.width / 2 - containerRect.left,
      y: elementRect.top + elementRect.height / 2 - containerRect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, elementType: 'term' | 'definition') => {
    e.preventDefault();
    
    // Start game on first interaction
    if (!gameStats.gameStarted) {
      setGameStats(prev => ({
        ...prev,
        gameStarted: true,
        startTime: Date.now()
      }));
    }

    const startPoint = getElementCenter(elementId);
    if (!startPoint) return;

    setDrawingState({
      isDrawing: true,
      startPoint,
      currentPoint: startPoint,
      startElementId: elementId,
      startElementType: elementType
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drawingState.isDrawing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top
    };

    setDrawingState(prev => ({
      ...prev,
      currentPoint
    }));
  }, [drawingState.isDrawing]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!drawingState.isDrawing) return;

    const target = e.target as HTMLElement;
    const endElementId = target.id || target.closest('[id]')?.id;
    
    if (endElementId && drawingState.startElementId && endElementId !== drawingState.startElementId) {
      const endElementType = endElementId.startsWith('term-') ? 'term' : 'definition';
      
      // Only allow connections between different types
      if (drawingState.startElementType !== endElementType) {
        createConnection(drawingState.startElementId, endElementId, drawingState.startElementType!);
      }
    }

    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      startElementId: null,
      startElementType: null
    });
  }, [drawingState]);

  // Add event listeners
  useEffect(() => {
    if (drawingState.isDrawing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drawingState.isDrawing, handleMouseMove, handleMouseUp]);

  const createConnection = (startId: string, endId: string, startType: 'term' | 'definition') => {
    // Remove any existing connections for these elements
    setConnections(prev => prev.filter(conn => 
      (startType === 'term' ? conn.termId !== startId : conn.definitionId !== startId) &&
      (startType === 'definition' ? conn.termId !== endId : conn.definitionId !== endId)
    ));

    const termId = startType === 'term' ? startId : endId;
    const definitionId = startType === 'definition' ? startId : endId;

    // Extract the flashcard IDs
    const termFlashcardId = termId.replace('term-', '');
    const definitionFlashcardId = definitionId.replace('definition-', '');

    const isCorrect = termFlashcardId === definitionFlashcardId;

    const newConnection: Connection = {
      termId,
      definitionId,
      isCorrect
    };

    setConnections(prev => [...prev, newConnection]);
    setGameStats(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct
    }));
  };

  const clearConnections = () => {
    setConnections([]);
    setGameStats(prev => ({
      ...prev,
      attempts: 0,
      correct: 0
    }));
  };

  const resetGame = () => {
    setConnections([]);
    if (flashcards.length > 0) {
      const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
      setShuffledDefinitions(shuffled);
    }
    setGameStats({
      attempts: 0,
      correct: 0,
      timeElapsed: 0,
      gameStarted: false,
      gameCompleted: false,
      startTime: 0
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = (connection: Connection): string => {
    return connection.isCorrect ? '#10b981' : '#ef4444';
  };

  const getElementConnectionStatus = (elementId: string): 'correct' | 'incorrect' | 'none' => {
    const connection = connections.find(conn => conn.termId === elementId || conn.definitionId === elementId);
    if (!connection) return 'none';
    return connection.isCorrect ? 'correct' : 'incorrect';
  };

  if (loading) {
    return (
      <div className="linkup-container">
        <div className="loading-state">
          Loading flashcards...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="linkup-container">
        <div className="error-state">
          Error loading deck: {error.message}
          <br />
          <button 
            onClick={() => navigate('/game/flashCards/Decks')}
            className="control-button btn-reset"
            style={{ marginTop: '1rem' }}
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  if (!data?.getSingleDeck || !flashcards.length) {
    return (
      <div className="linkup-container">
        <div className="error-state">
          No flashcards available for this deck.
          <br />
          <button 
            onClick={() => navigate('/game/flashCards/Decks')}
            className="control-button btn-reset"
            style={{ marginTop: '1rem' }}
          >
            Back to Decks
          </button>
        </div>
      </div>
    );
  }

  const deck = data.getSingleDeck;

  return (
    <div className="linkup-container">
      {/* Header */}
      <div className="linkup-header">
        <h1 className="linkup-title">Line Matching Game</h1>
        <p className="linkup-subtitle">
          Draw lines to connect terms with their correct definitions from: <strong>{deck.title}</strong>
        </p>
      </div>

      {/* Game Stats */}
      <div className="game-stats">
        <div className="stat-item stat-item-blue">
          <div className="stat-value stat-value-blue">{gameStats.attempts}</div>
          <div className="stat-label stat-label-blue">Attempts</div>
        </div>
        <div className="stat-item stat-item-green">
          <div className="stat-value stat-value-green">{gameStats.correct}</div>
          <div className="stat-label stat-label-green">Correct</div>
        </div>
        <div className="stat-item stat-item-purple">
          <div className="stat-value stat-value-purple">{formatTime(gameStats.timeElapsed)}</div>
          <div className="stat-label stat-label-purple">Time</div>
        </div>
        <div className="stat-item stat-item-orange">
          <div className="stat-value stat-value-orange">
            {flashcards.length > 0 ? Math.round((gameStats.correct / flashcards.length) * 100) : 0}%
          </div>
          <div className="stat-label stat-label-orange">Progress</div>
        </div>
      </div>

      {/* Controls */}
      <div className="game-controls">
        <button
          onClick={clearConnections}
          className="control-button btn-clear"
        >
          Clear Lines
        </button>
        <button
          onClick={resetGame}
          className="control-button btn-reset"
        >
          New Game
        </button>
        <button
          onClick={() => navigate(`/deck/${id}`)}
          className="control-button btn-reset"
        >
          Back to Deck
        </button>
      </div>

      {/* Game Completed Message */}
      {gameStats.gameCompleted && (
        <div className="game-completed">
          <h3 className="completed-title">🎉 Congratulations!</h3>
          <p>You've matched all terms correctly in {formatTime(gameStats.timeElapsed)} with {gameStats.attempts} attempts!</p>
        </div>
      )}

      {/* Game Area */}
      <div ref={containerRef} className="game-area">
        {/* SVG for drawing lines */}
        <svg
          ref={svgRef}
          className="game-svg"
        >
          {/* Draw existing connections */}
          {connections.map((connection, index) => {
            const startPoint = getElementCenter(connection.termId);
            const endPoint = getElementCenter(connection.definitionId);
            
            if (!startPoint || !endPoint) return null;

            return (
              <line
                key={index}
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke={getConnectionColor(connection)}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {/* Draw current line being drawn */}
          {drawingState.isDrawing && drawingState.startPoint && drawingState.currentPoint && (
            <line
              x1={drawingState.startPoint.x}
              y1={drawingState.startPoint.y}
              x2={drawingState.currentPoint.x}
              y2={drawingState.currentPoint.y}
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>

        {/* Game Content */}
        <div className="game-content">
          {/* Terms Column */}
          <div className="terms-column">
            <h3 className="column-title">Terms</h3>
            {flashcards.map((card) => {
              const elementId = `term-${card._id}`;
              const connectionStatus = getElementConnectionStatus(elementId);
              
              return (
                <div
                  key={card._id}
                  id={elementId}
                  className={`
                    game-item ${
                      connectionStatus === 'correct' ? 'game-item-correct' :
                      connectionStatus === 'incorrect' ? 'game-item-incorrect' :
                      'game-item-default'
                    }
                  `}
                  onMouseDown={(e) => handleMouseDown(e, elementId, 'term')}
                >
                  <div className="term-text">{card.term}</div>
                </div>
              );
            })}
          </div>

          {/* Definitions Column */}
          <div className="definitions-column">
            <h3 className="column-title">Definitions</h3>
            {shuffledDefinitions.map((card) => {
              const elementId = `definition-${card._id}`;
              const connectionStatus = getElementConnectionStatus(elementId);
              
              return (
                <div
                  key={card._id}
                  id={elementId}
                  className={`
                    game-item ${
                      connectionStatus === 'correct' ? 'game-item-correct' :
                      connectionStatus === 'incorrect' ? 'game-item-incorrect' :
                      'game-item-default'
                    }
                  `}
                  onMouseDown={(e) => handleMouseDown(e, elementId, 'definition')}
                >
                  <div className="definition-text">{card.definition}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p className="instructions-text">
          Click and drag from a term to its matching definition to draw a connection line.
          <br />
          Green lines indicate correct matches, red lines indicate incorrect matches.
        </p>
      </div>
    </div>
  );
};

export default LinkUp;