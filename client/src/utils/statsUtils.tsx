interface GameStats {
  matchingBestTime: number | null;
  crosswordBestTime: number | null;
  totalGamesPlayed: number;
  averageMatchingTime: number | null;
  averageCrosswordTime: number | null;
  gamesWon: number;
  winStreak: number;
  bestWinStreak: number;
  matchingTimes: number[];
  crosswordTimes: number[];
}

export const getDefaultStats = (): GameStats => ({
  matchingBestTime: null,
  crosswordBestTime: null,
  totalGamesPlayed: 0,
  averageMatchingTime: null,
  averageCrosswordTime: null,
  gamesWon: 0,
  winStreak: 0,
  bestWinStreak: 0,
  matchingTimes: [],
  crosswordTimes: []
});

export const updateGameStats = (
  username: string, 
  gameType: 'matching' | 'crossword', 
  completionTime: number, 
  won: boolean = true
): void => {
  const statsKey = `stats_${username}`;
  const currentStats: GameStats = JSON.parse(localStorage.getItem(statsKey) || JSON.stringify(getDefaultStats()));
  
  // Update basic counts
  currentStats.totalGamesPlayed += 1;
  if (won) {
    currentStats.gamesWon += 1;
    currentStats.winStreak += 1;
    currentStats.bestWinStreak = Math.max(currentStats.bestWinStreak, currentStats.winStreak);
  } else {
    currentStats.winStreak = 0;
  }

  // Update game-specific stats
  if (gameType === 'matching') {
    currentStats.matchingTimes.push(completionTime);
    currentStats.matchingBestTime = currentStats.matchingBestTime 
      ? Math.min(currentStats.matchingBestTime, completionTime)
      : completionTime;
    currentStats.averageMatchingTime = 
      currentStats.matchingTimes.reduce((a, b) => a + b, 0) / currentStats.matchingTimes.length;
  } else if (gameType === 'crossword') {
    currentStats.crosswordTimes.push(completionTime);
    currentStats.crosswordBestTime = currentStats.crosswordBestTime
      ? Math.min(currentStats.crosswordBestTime, completionTime)
      : completionTime;
    currentStats.averageCrosswordTime = 
      currentStats.crosswordTimes.reduce((a, b) => a + b, 0) / currentStats.crosswordTimes.length;
  }

  // Save updated stats
  localStorage.setItem(statsKey, JSON.stringify(currentStats));
};

export const getStats = (username: string): GameStats => {
  const statsKey = `stats_${username}`;
  return JSON.parse(localStorage.getItem(statsKey) || JSON.stringify(getDefaultStats()));
};

