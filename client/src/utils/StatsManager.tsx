export interface GameStats {
  // Flashcard stats
  flashcards: {
    totalSessions: number;
    totalCardsStudied: number;
    averageAccuracy: number;
    bestAccuracy: number;
    currentStreak: number;
    bestStreak: number;
    totalTimeStudied: number; // in seconds
    lastPlayedDate: string;
  };
  
  // Matching game stats
  matching: {
    gamesPlayed: number;
    gamesCompleted: number;
    bestTimeEasy: number | null;
    bestTimeMedium: number | null;
    bestTimeHard: number | null;
    bestScoreEasy: number;
    bestScoreMedium: number;
    bestScoreHard: number;
    averageMoves: number;
    perfectGames: number; // games completed with minimum moves
    lastPlayedDate: string;
  };
  
  // Crossword stats
  crossword: {
    puzzlesSolved: number;
    puzzlesAttempted: number;
    bestTime: number | null;
    averageTime: number;
    averageAccuracy: number;
    hintsUsed: number;
    perfectSolves: number; // solved without hints
    wordsCompleted: number;
    lastPlayedDate: string;
  };
}

const defaultStats: GameStats = {
  flashcards: {
    totalSessions: 0,
    totalCardsStudied: 0,
    averageAccuracy: 0,
    bestAccuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalTimeStudied: 0,
    lastPlayedDate: '',
  },
  matching: {
    gamesPlayed: 0,
    gamesCompleted: 0,
    bestTimeEasy: null,
    bestTimeMedium: null,
    bestTimeHard: null,
    bestScoreEasy: 0,
    bestScoreMedium: 0,
    bestScoreHard: 0,
    averageMoves: 0,
    perfectGames: 0,
    lastPlayedDate: '',
  },
  crossword: {
    puzzlesSolved: 0,
    puzzlesAttempted: 0,
    bestTime: null,
    averageTime: 0,
    averageAccuracy: 0,
    hintsUsed: 0,
    perfectSolves: 0,
    wordsCompleted: 0,
    lastPlayedDate: '',
  },
};

export class StatsManager {
  private static getStatsKey(): string {
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    return `gameStats_${profile.username || 'guest'}`;
  }

  static getStats(): GameStats {
    try {
      const statsKey = this.getStatsKey();
      const stored = localStorage.getItem(statsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          flashcards: { ...defaultStats.flashcards, ...parsed.flashcards },
          matching: { ...defaultStats.matching, ...parsed.matching },
          crossword: { ...defaultStats.crossword, ...parsed.crossword },
        };
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    return { ...defaultStats };
  }

  static saveStats(stats: GameStats): void {
    try {
      const statsKey = this.getStatsKey();
      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  // Flashcard stats methods
  static updateFlashcardStats(sessionData: {
    cardsStudied: number;
    correct: number;
    totalAnswered: number;
    streak: number;
    timeSpent: number;
  }): void {
    const stats = this.getStats();
    const accuracy = sessionData.totalAnswered > 0 ? (sessionData.correct / sessionData.totalAnswered) * 100 : 0;
    
    stats.flashcards.totalSessions++;
    stats.flashcards.totalCardsStudied += sessionData.cardsStudied;
    stats.flashcards.bestAccuracy = Math.max(stats.flashcards.bestAccuracy, accuracy);
    stats.flashcards.bestStreak = Math.max(stats.flashcards.bestStreak, sessionData.streak);
    stats.flashcards.currentStreak = sessionData.streak;
    stats.flashcards.totalTimeStudied += sessionData.timeSpent;
    stats.flashcards.lastPlayedDate = new Date().toISOString();
    
    // Calculate running average accuracy
    const totalSessions = stats.flashcards.totalSessions;
    stats.flashcards.averageAccuracy = 
      ((stats.flashcards.averageAccuracy * (totalSessions - 1)) + accuracy) / totalSessions;
    
    this.saveStats(stats);
  }

  // Matching game stats methods
  static updateMatchingStats(gameData: {
    difficulty: 'easy' | 'medium' | 'hard';
    completed: boolean;
    timeElapsed: number;
    moves: number;
    score: number;
    perfect: boolean;
  }): void {
    const stats = this.getStats();
    
    stats.matching.gamesPlayed++;
    stats.matching.lastPlayedDate = new Date().toISOString();
    
    if (gameData.completed) {
      stats.matching.gamesCompleted++;
      
      // Update best times
      const timeField = `bestTime${gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1)}` as keyof typeof stats.matching;
      const currentBest = stats.matching[timeField] as number | null;
      if (currentBest === null || gameData.timeElapsed < currentBest) {
        (stats.matching[timeField] as number) = gameData.timeElapsed;
      }
      
      // Update best scores
      const scoreField = `bestScore${gameData.difficulty.charAt(0).toUpperCase() + gameData.difficulty.slice(1)}` as keyof typeof stats.matching;
      (stats.matching as any)[scoreField] = Math.max((stats.matching as any)[scoreField] as number, gameData.score);
      
      // Calculate average moves
      const completedGames = stats.matching.gamesCompleted;
      stats.matching.averageMoves = 
        ((stats.matching.averageMoves * (completedGames - 1)) + gameData.moves) / completedGames;
      
      if (gameData.perfect) {
        stats.matching.perfectGames++;
      }
    }
    
    this.saveStats(stats);
  }

  // Crossword stats methods
  static updateCrosswordStats(gameData: {
    completed: boolean;
    timeElapsed: number;
    correctCells: number;
    totalCells: number;
    hintsUsed: number;
    wordsCompleted: number;
  }): void {
    const stats = this.getStats();
    
    stats.crossword.puzzlesAttempted++;
    stats.crossword.lastPlayedDate = new Date().toISOString();
    stats.crossword.hintsUsed += gameData.hintsUsed;
    stats.crossword.wordsCompleted += gameData.wordsCompleted;
    
    const accuracy = gameData.totalCells > 0 ? (gameData.correctCells / gameData.totalCells) * 100 : 0;
    
    if (gameData.completed) {
      stats.crossword.puzzlesSolved++;
      
      // Update best time
      if (stats.crossword.bestTime === null || gameData.timeElapsed < stats.crossword.bestTime) {
        stats.crossword.bestTime = gameData.timeElapsed;
      }
      
      // Calculate average time for completed puzzles
      const solvedPuzzles = stats.crossword.puzzlesSolved;
      stats.crossword.averageTime = 
        ((stats.crossword.averageTime * (solvedPuzzles - 1)) + gameData.timeElapsed) / solvedPuzzles;
      
      // Perfect solve (no hints)
      if (gameData.hintsUsed === 0) {
        stats.crossword.perfectSolves++;
      }
    }
    
    // Calculate average accuracy across all attempts
    const totalAttempts = stats.crossword.puzzlesAttempted;
    stats.crossword.averageAccuracy = 
      ((stats.crossword.averageAccuracy * (totalAttempts - 1)) + accuracy) / totalAttempts;
    
    this.saveStats(stats);
  }

  // Utility methods
  static formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m ${secs}s`;
  }

  static getRelativeTime(dateString: string): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Reset stats (for testing or user preference)
  static resetStats(): void {
    const statsKey = this.getStatsKey();
    localStorage.removeItem(statsKey);
  }

  static exportStats(): string {
    return JSON.stringify(this.getStats(), null, 2);
  }
}