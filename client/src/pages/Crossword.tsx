import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_SINGLE_DECK } from '../utils/queries';
import { Flashcard } from '../interfaces/Flashcard';
import '../styles/CrosswordGame.css';

interface CrosswordWord {
  id: number;
  word: string;
  clue: string;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  number: number;
}

interface CrosswordCell {
  letter: string;
  userLetter: string;
  blocked: boolean;
  number?: number;
  wordIds: number[];
}

interface GameStats {
  startTime: number;
  completed: boolean;
  correctCells: number;
  totalCells: number;
}



const Crossword: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Query for deck data
  const { data, loading, error } = useQuery(QUERY_SINGLE_DECK, {
    variables: { id: id },
    skip: !id,
  });

  const gridSize = 10; // Increased for more flexibility
  const [words, setWords] = useState<CrosswordWord[]>([]);
  const [grid, setGrid] = useState<CrosswordCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [selectedWord, setSelectedWord] = useState<CrosswordWord | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [gameStats, setGameStats] = useState<GameStats>({
    startTime: Date.now(),
    completed: false,
    correctCells: 0,
    totalCells: 0
  });
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [timer, setTimer] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

 
  // Create crossword words from flashcards
  const createCrosswordFromFlashcards = useCallback((flashcards: Flashcard[]): CrosswordWord[] => {
    if (!flashcards || flashcards.length === 0) return [];

    // Filter and prepare words (remove spaces, special chars, keep only letters)
    const processedCards = flashcards
      .map(card => ({
        ...card,
        cleanTerm: card.term.replace(/[^A-Za-z]/g, '').toUpperCase()
      }))
      .filter(card => card.cleanTerm.length >= 3 && card.cleanTerm.length <= 12);

    if (processedCards.length < 3) return []; // Need minimum words for crossword

    // Shuffle the cards for randomization
    const shuffledCards = [...processedCards].sort(() => Math.random() - 0.5);
    
    // Take up to 12 cards to prevent overcrowding
    const selectedCards = shuffledCards.slice(0, Math.min(12, shuffledCards.length));

    const crosswordWords: CrosswordWord[] = [];
    const usedPositions = new Set<string>();

    // Sort by length but with some randomization
    const sortedCards = [...selectedCards].sort((a, b) => {
      const lengthDiff = b.cleanTerm.length - a.cleanTerm.length;
      // Add small random factor while keeping longer words preferred
      return lengthDiff + (Math.random() - 0.5) * 0.5;
    });
    
    // Place first word horizontally in center (word number 1 is odd, so across)
    const firstCard = sortedCards[0];
    
    // Add some randomization to starting position
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor((gridSize - firstCard.cleanTerm.length) / 2);
    const rowOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    const colOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    
    const firstWord: CrosswordWord = {
      id: 1,
      word: firstCard.cleanTerm,
      clue: firstCard.definition,
      direction: 'across', // Word 1 (odd) goes across
      startRow: Math.max(0, Math.min(gridSize - 1, centerRow + rowOffset)),
      startCol: Math.max(0, Math.min(gridSize - firstCard.cleanTerm.length, centerCol + colOffset)),
      number: 1
    };
    
    crosswordWords.push(firstWord);
    
    // Mark positions as used
    for (let i = 0; i < firstWord.word.length; i++) {
      usedPositions.add(`${firstWord.startRow}-${firstWord.startCol + i}`);
    }

    let wordNumber = 2;

    // Try to place remaining words
    for (let cardIndex = 1; cardIndex < sortedCards.length && crosswordWords.length < 8; cardIndex++) {
      const card = sortedCards[cardIndex];
      const newWord = card.cleanTerm;
      
      // Determine direction based on word number: odd = across, even = down
      const targetDirection: 'across' | 'down' = wordNumber % 2 === 1 ? 'across' : 'down';
      
      // Try to find intersection with existing words
      let placed = false;
      
      // Randomize the order of existing words to try intersections with
      const shuffledExistingWords = [...crosswordWords].sort(() => Math.random() - 0.5);
      
      for (const existingWord of shuffledExistingWords) {
        if (placed) break;
        
        // Create arrays of indices and shuffle them for randomization
        const newWordIndices = Array.from({length: newWord.length}, (_, i) => i).sort(() => Math.random() - 0.5);
        const existingWordIndices = Array.from({length: existingWord.word.length}, (_, i) => i).sort(() => Math.random() - 0.5);
        
        // Try each letter in the new word (in random order)
        for (const newWordIndex of newWordIndices) {
          if (placed) break;
          const newLetter = newWord[newWordIndex];
          
          // Try each letter in existing word (in random order)
          for (const existingIndex of existingWordIndices) {
            if (placed) break;
            const existingLetter = existingWord.word[existingIndex];
            
            if (newLetter === existingLetter) {
              // Calculate position for intersection based on target direction
              let newStartRow: number, newStartCol: number;
              
              if (targetDirection === 'across') {
                // Place new word horizontally
                newStartRow = existingWord.direction === 'across' 
                  ? existingWord.startRow 
                  : existingWord.startRow + existingIndex;
                newStartCol = existingWord.direction === 'across' 
                  ? existingWord.startCol + existingIndex - newWordIndex
                  : existingWord.startCol - newWordIndex;
              } else {
                // Place new word vertically
                newStartRow = existingWord.direction === 'across' 
                  ? existingWord.startRow - newWordIndex
                  : existingWord.startRow + existingIndex - newWordIndex;
                newStartCol = existingWord.direction === 'across' 
                  ? existingWord.startCol + existingIndex
                  : existingWord.startCol;
              }
              
              // Check if placement is valid
              if (isValidPlacement(newWord, newStartRow, newStartCol, targetDirection, crosswordWords, gridSize)) {
                const intersectingWord: CrosswordWord = {
                  id: wordNumber,
                  word: newWord,
                  clue: card.definition,
                  direction: targetDirection,
                  startRow: newStartRow,
                  startCol: newStartCol,
                  number: wordNumber
                };
                
                crosswordWords.push(intersectingWord);
                wordNumber++;
                placed = true;
              }
            }
          }
        }
      }
    }

    return crosswordWords;
  }, []);

  // Check if word placement is valid
  const isValidPlacement = (
    word: string,
    startRow: number,
    startCol: number,
    direction: 'across' | 'down',
    existingWords: CrosswordWord[],
    gridSize: number
  ): boolean => {
    // Check bounds
    if (direction === 'across') {
      if (startRow < 0 || startRow >= gridSize || startCol < 0 || startCol + word.length > gridSize) {
        return false;
      }
    } else {
      if (startCol < 0 || startCol >= gridSize || startRow < 0 || startRow + word.length > gridSize) {
        return false;
      }
    }

    // Check for conflicts with existing words
    const newPositions = new Set<string>();
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;
      newPositions.add(`${row}-${col}`);
    }

    // Check each existing word for conflicts
    for (const existingWord of existingWords) {
      for (let i = 0; i < existingWord.word.length; i++) {
        const existingRow = existingWord.direction === 'across' ? existingWord.startRow : existingWord.startRow + i;
        const existingCol = existingWord.direction === 'across' ? existingWord.startCol + i : existingWord.startCol;
        const existingPos = `${existingRow}-${existingCol}`;
        
        if (newPositions.has(existingPos)) {
          // Position overlap - check if letters match
          const newIndex = direction === 'across' ? existingCol - startCol : existingRow - startRow;
          if (newIndex >= 0 && newIndex < word.length) {
            if (word[newIndex] !== existingWord.word[i]) {
              return false; // Letters don't match
            }
          }
        }
      }
    }

    return true;
  };

  // Load flashcards and create crossword
  useEffect(() => {
    if (data?.getSingleDeck?.flashcards) {
      const flashcards: Flashcard[] = data.getSingleDeck.flashcards;
      const crosswordWords = createCrosswordFromFlashcards(flashcards);
      setWords(crosswordWords);
    }
  }, [data, createCrosswordFromFlashcards]);

  // Initialize grid when words are set
  useEffect(() => {
    if (words.length === 0) return;

    const newGrid: CrosswordCell[][] = Array(gridSize).fill(null).map(() =>
      Array(gridSize).fill(null).map(() => ({
        letter: '',
        userLetter: '',
        blocked: true,
        wordIds: []
      }))
    );

    let totalCells = 0;

    // Place words in grid
    words.forEach(word => {
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'across' ? word.startRow : word.startRow + i;
        const col = word.direction === 'across' ? word.startCol + i : word.startCol;
        
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          if (newGrid[row][col].blocked) {
            totalCells++;
          }
          
          newGrid[row][col] = {
            letter: word.word[i],
            userLetter: newGrid[row][col].userLetter || '',
            blocked: false,
            number: (i === 0) ? word.number : newGrid[row][col].number,
            wordIds: [...(newGrid[row][col].wordIds || []), word.id]
          };
        }
      }
    });

    setGrid(newGrid);
    setGameStats(prev => ({ ...prev, totalCells }));
  }, [words]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameStats.completed) {
        setTimer(Math.floor((Date.now() - gameStats.startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStats.completed, gameStats.startTime]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (grid[row]?.[col]?.blocked) return;

    // If clicking the same cell, toggle direction
    if (selectedCell?.row === row && selectedCell?.col === col) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }

    // Find and select the appropriate word
    const cell = grid[row][col];
    const wordInDirection = words.find(word => 
      cell.wordIds.includes(word.id) && word.direction === direction
    );
    
    if (wordInDirection) {
      setSelectedWord(wordInDirection);
    } else {
      // If no word in current direction, find any word containing this cell
      const anyWord = words.find(word => cell.wordIds.includes(word.id));
      if (anyWord) {
        setSelectedWord(anyWord);
        setDirection(anyWord.direction);
      }
    }
  }, [grid, selectedCell, direction, words]);

  // Handle key input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || !selectedWord) return;

    const { row, col } = selectedCell;

    if (e.key === 'Backspace') {
      // Clear current cell and move to previous
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[row][col] = { ...newGrid[row][col], userLetter: '' };
        return newGrid;
      });

      // Move to previous cell in word
      const wordCells = getWordCells(selectedWord);
      const currentIndex = wordCells.findIndex(cell => cell.row === row && cell.col === col);
      if (currentIndex > 0) {
        const prevCell = wordCells[currentIndex - 1];
        setSelectedCell({ row: prevCell.row, col: prevCell.col });
      }
    } else if (e.key.match(/^[a-zA-Z]$/)) {
      // Insert letter and move to next cell
      const letter = e.key.toUpperCase();
      
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[row][col] = { ...newGrid[row][col], userLetter: letter };
        return newGrid;
      });

      // Move to next cell in word
      const wordCells = getWordCells(selectedWord);
      const currentIndex = wordCells.findIndex(cell => cell.row === row && cell.col === col);
      if (currentIndex < wordCells.length - 1) {
        const nextCell = wordCells[currentIndex + 1];
        setSelectedCell({ row: nextCell.row, col: nextCell.col });
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      // Handle arrow key navigation
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(gridSize - 1, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(gridSize - 1, col + 1);
          break;
      }

      if (!grid[newRow]?.[newCol]?.blocked) {
        setSelectedCell({ row: newRow, col: newCol });
      }
    }
  }, [selectedCell, selectedWord, grid]);

  // Add/remove keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get cells for a word
  const getWordCells = (word: CrosswordWord) => {
    const cells = [];
    for (let i = 0; i < word.word.length; i++) {
      const row = word.direction === 'across' ? word.startRow : word.startRow + i;
      const col = word.direction === 'across' ? word.startCol + i : word.startCol;
      cells.push({ row, col });
    }
    return cells;
  };

  // Check if word is completed correctly
  const isWordCompleted = (word: CrosswordWord): boolean => {
    const cells = getWordCells(word);
    return cells.every(({ row, col }) => 
      grid[row]?.[col]?.userLetter === grid[row]?.[col]?.letter
    );
  };

  // Get highlighted cells for selected word
  const getHighlightedCells = (): Set<string> => {
    if (!selectedWord) return new Set();
    
    const cells = getWordCells(selectedWord);
    return new Set(cells.map(({ row, col }) => `${row}-${col}`));
  };

  // Handle clue click
  const handleClueClick = (word: CrosswordWord) => {
    setSelectedWord(word);
    setDirection(word.direction);
    setSelectedCell({ row: word.startRow, col: word.startCol });
  };

  // Show hint for current word
  const showWordHint = () => {
    if (!selectedWord) return;
    
    const wordCells = getWordCells(selectedWord);
    const emptyCell = wordCells.find(({ row, col }) => !grid[row][col].userLetter);
    
    if (emptyCell) {
      const correctLetter = grid[emptyCell.row][emptyCell.col].letter;
      setCurrentHint(`The ${selectedWord.direction} word "${selectedWord.clue}" has the letter "${correctLetter}" at position ${wordCells.indexOf(emptyCell) + 1}.`);
      setShowHint(true);
    }
  };

  // Check solution
  const checkSolution = () => {
    let correct = 0;
    let total = 0;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = grid[row][col];
        if (!cell.blocked && cell.letter) {
          total++;
          if (cell.userLetter === cell.letter) {
            correct++;
          }
        }
      }
    }

    const completed = correct === total && total > 0;
    setGameStats(prev => ({ ...prev, correctCells: correct, completed }));

    if (completed) {
      alert('Congratulations! You completed the crossword!');
    } else {
      alert(`${correct} out of ${total} letters correct.`);
    }
  };

  // Clear grid
  const clearGrid = () => {
    setGrid(prev => prev.map(row => 
      row.map(cell => ({ ...cell, userLetter: '' }))
    ));
  };

  // Reset game
  const resetGame = () => {
  if (data?.getSingleDeck?.flashcards) {
    // Generate a completely new crossword layout
    const flashcards: Flashcard[] = data.getSingleDeck.flashcards;
    const newCrosswordWords = createCrosswordFromFlashcards(flashcards);
    setWords(newCrosswordWords);
  }
  
  // Reset game stats
  setGameStats({ 
    startTime: Date.now(), 
    completed: false, 
    correctCells: 0, 
    totalCells: 0 // Will be recalculated when grid is rebuilt
  });
  
  // Reset selection states
  setSelectedCell(null);
  setSelectedWord(null);
  setTimer(0);
  
  // Hide any open hint
  setShowHint(false);
  setCurrentHint('');
};

  // Loading and error states
  if (loading) {
    return (
      <div className="crossword-container">
        <div className="ui segment">
          <div className="ui active dimmer">
            <div className="ui indeterminate text loader">Loading crossword puzzle...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crossword-container">
        <div className="ui negative message">
          <div className="header">Error Loading Crossword</div>
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
      <div className="crossword-container">
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

  if (!data.getSingleDeck.flashcards || data.getSingleDeck.flashcards.length < 3) {
    return (
      <div className="crossword-container">
        <div className="ui placeholder segment">
          <div className="ui icon header">
            <i className="puzzle piece icon"></i>
            Not enough cards for crossword
          </div>
          <p>This deck needs at least 3 flashcards to generate a crossword puzzle.</p>
          <div className="inline">
            <button 
              className="ui primary button"
              onClick={() => navigate(`/deck/${id}/new-card`)}
            >
              Add More Cards
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

  if (words.length === 0) {
    return (
      <div className="crossword-container">
        <div className="ui warning message">
          <div className="header">Cannot Generate Crossword</div>
          <p>Unable to create a crossword from the available flashcards. Please ensure your flashcard terms contain only letters and are 3-12 characters long.</p>
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

  const highlightedCells = getHighlightedCells();
  const completedWords = words.filter(isWordCompleted);
  const progress = gameStats.totalCells > 0 ? (gameStats.correctCells / gameStats.totalCells) * 100 : 0;

  return (
    <div className="crossword-container">
      <div className="crossword-header">
        <h1 className="crossword-title">Crossword Puzzle</h1>
        <p className="crossword-subtitle">
          Playing with deck: <strong>{data.getSingleDeck.title}</strong>
        </p>
        <p>Click on a cell and start typing to fill in the answers</p>
      </div>

      <div className="crossword-main">
        <div>
          {/* Grid */}
          <div className="crossword-grid-container">
            <div 
              className="crossword-grid" 
              ref={gridRef}
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`crossword-cell ${
                      cell.blocked ? 'blocked' : ''
                    } ${
                      highlightedCells.has(`${rowIndex}-${colIndex}`) ? 'highlighted' : ''
                    } ${
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'active' : ''
                    } ${
                      cell.userLetter && cell.userLetter === cell.letter ? 'correct' : 
                      cell.userLetter && cell.userLetter !== cell.letter ? 'incorrect' : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    tabIndex={cell.blocked ? -1 : 0}
                  >
                    {cell.number && (
                      <span className="cell-number">{cell.number}</span>
                    )}
                    {!cell.blocked && (cell.userLetter || '')}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="crossword-controls">
            <button onClick={checkSolution} className="control-button btn-primary">
              Check Solution
            </button>
            <button onClick={showWordHint} className="control-button btn-secondary" disabled={!selectedWord}>
              Show Hint
            </button>
            <button onClick={clearGrid} className="control-button btn-danger">
              Clear Grid
            </button>
            <button onClick={resetGame} className="control-button btn-success">
              Reset Game
            </button>
            <button 
              onClick={() => navigate(`/deck/${id}`)} 
              className="control-button btn-secondary"
            >
              Back to Deck
            </button>
          </div>

          {/* Game Status */}
          <div className={`game-status ${gameStats.completed ? 'status-completed' : 'status-playing'}`}>
            {gameStats.completed ? 'Puzzle Completed!' : `${completedWords.length} of ${words.length} words completed`}
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            {gameStats.correctCells} of {gameStats.totalCells} letters correct
          </div>

          {/* Timer */}
          <div className="timer">
            Time: {formatTime(timer)}
          </div>
        </div>

        {/* Clues Panel */}
        <div className="clues-panel">
          <div className="clues-section">
            <h3 className="clues-title">Across</h3>
            <ul className="clues-list">
              {words
                .filter(word => word.direction === 'across')
                .map(word => (
                  <li
                    key={word.id}
                    className={`clue-item ${
                      selectedWord?.id === word.id ? 'active' : ''
                    } ${
                      isWordCompleted(word) ? 'completed' : ''
                    }`}
                    onClick={() => handleClueClick(word)}
                  >
                    <span className="clue-number">{word.number}.</span>
                    <span className="clue-text">{word.clue}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="clues-section">
            <h3 className="clues-title">Down</h3>
            <ul className="clues-list">
              {words
                .filter(word => word.direction === 'down')
                .map(word => (
                  <li
                    key={word.id}
                    className={`clue-item ${
                      selectedWord?.id === word.id ? 'active' : ''
                    } ${
                      isWordCompleted(word) ? 'completed' : ''
                    }`}
                    onClick={() => handleClueClick(word)}
                  >
                    <span className="clue-number">{word.number}.</span>
                    <span className="clue-text">{word.clue}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Hint Modal */}
      {showHint && (
        <div className="hint-overlay" onClick={() => setShowHint(false)}>
          <div className="hint-modal" onClick={e => e.stopPropagation()}>
            <h3 className="hint-title">Hint</h3>
            <p className="hint-text">{currentHint}</p>
            <div className="hint-buttons">
              <button onClick={() => setShowHint(false)} className="control-button btn-primary">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crossword;