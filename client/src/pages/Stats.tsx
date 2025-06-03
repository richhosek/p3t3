import React, { useState, useEffect } from 'react';
import { StatsManager } from '../utils/StatsManager';
import type { GameStats } from '../utils/StatsManager';
import '../styles/Stats.css';

const Stats: React.FC = () => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'matching' | 'crossword'>('overview');

  useEffect(() => {
    const gameStats = StatsManager.getStats();
    setStats(gameStats);
  }, []);

  const Profile = JSON.parse(localStorage.getItem('profile') || '{}');
  
  

  if (!stats) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <p className="loading-text">Loading your stats...</p>
        </div>
      </div>
    );
  }

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all your game statistics? This action cannot be undone.')) {
      StatsManager.resetStats();
      setStats(StatsManager.getStats());
    }
  };

  const handleExportStats = () => {
    const exportData = StatsManager.exportStats();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${Profile.username}_game_stats.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => {
    const totalGamesPlayed = stats.flashcards.totalSessions + stats.matching.gamesPlayed + stats.crossword.puzzlesAttempted;
    const totalTimeSpent = stats.flashcards.totalTimeStudied + 
      (stats.crossword.averageTime * stats.crossword.puzzlesSolved);

    return (
      <div className="stats-grid md-2-cols lg-3-cols">
        {/* Overall Stats */}
        <div className="stat-card gradient-blue">
          <h3 className="stat-card-title">🎮 Overall Stats</h3>
          <div className="stat-card-content">
            <div className="stat-row">
              <span className="stat-label">Total Games:</span>
              <span className="stat-value">{totalGamesPlayed}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Time Played:</span>
              <span className="stat-value">{StatsManager.formatTime(totalTimeSpent)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Member Since:</span>
              <span className="stat-value">{Profile.createdAt ? new Date(Profile.createdAt).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Flashcards Quick Stats */}
        <div className="stat-card gradient-green">
          <h3 className="stat-card-title">📚 Flashcards</h3>
          <div className="stat-card-content">
            <div className="stat-row">
              <span className="stat-label">Sessions:</span>
              <span className="stat-value">{stats.flashcards.totalSessions}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Cards Studied:</span>
              <span className="stat-value">{stats.flashcards.totalCardsStudied}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Best Accuracy:</span>
              <span className="stat-value">{stats.flashcards.bestAccuracy.toFixed(1)}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Best Streak:</span>
              <span className="stat-value">{stats.flashcards.bestStreak}</span>
            </div>
          </div>
        </div>

        {/* Matching Quick Stats */}
        <div className="stat-card gradient-purple">
          <h3 className="stat-card-title">🧩 Matching</h3>
          <div className="stat-card-content">
            <div className="stat-row">
              <span className="stat-label">Games Played:</span>
              <span className="stat-value">{stats.matching.gamesPlayed}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Completed:</span>
              <span className="stat-value">{stats.matching.gamesCompleted}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Perfect Games:</span>
              <span className="stat-value">{stats.matching.perfectGames}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Best Time:</span>
              <span className="stat-value">
                {Math.min(
                  ...[stats.matching.bestTimeEasy, stats.matching.bestTimeMedium, stats.matching.bestTimeHard]
                    .filter(time => time !== null)
                ) !== Infinity 
                  ? StatsManager.formatTime(Math.min(
                      ...[stats.matching.bestTimeEasy, stats.matching.bestTimeMedium, stats.matching.bestTimeHard]
                        .filter(time => time !== null)
                    ))
                  : 'No records'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Crossword Quick Stats */}
        <div className="stat-card gradient-orange">
          <h3 className="stat-card-title">🔤 Crossword</h3>
          <div className="stat-card-content">
            <div className="stat-row">
              <span className="stat-label">Puzzles Solved:</span>
              <span className="stat-value">{stats.crossword.puzzlesSolved}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {stats.crossword.puzzlesAttempted > 0 
                  ? ((stats.crossword.puzzlesSolved / stats.crossword.puzzlesAttempted) * 100).toFixed(1)
                  : 0
                }%
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Best Time:</span>
              <span className="stat-value">
                {stats.crossword.bestTime ? StatsManager.formatTime(stats.crossword.bestTime) : 'No records'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Perfect Solves:</span>
              <span className="stat-value">{stats.crossword.perfectSolves}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="stat-card gradient-indigo">
          <h3 className="stat-card-title">⏰ Recent Activity</h3>
          <div className="stat-card-content">
            <div className="stat-row">
              <span className="stat-label">Flashcards:</span>
              <span className="stat-value">{StatsManager.getRelativeTime(stats.flashcards.lastPlayedDate)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Matching:</span>
              <span className="stat-value">{StatsManager.getRelativeTime(stats.matching.lastPlayedDate)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Crossword:</span>
              <span className="stat-value">{StatsManager.getRelativeTime(stats.crossword.lastPlayedDate)}</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="stat-card gradient-yellow">
          <h3 className="stat-card-title">🏆 Achievements</h3>
          <div className="stat-card-content">
            {stats.flashcards.bestStreak >= 10 && (
              <div className="achievement-item">
                <span className="achievement-icon">🔥</span>
                <span>Flashcard Master (10+ streak)</span>
              </div>
            )}
            {stats.matching.perfectGames >= 5 && (
              <div className="achievement-item">
                <span className="achievement-icon">🎯</span>
                <span>Memory Expert (5+ perfect games)</span>
              </div>
            )}
            {stats.crossword.perfectSolves >= 3 && (
              <div className="achievement-item">
                <span className="achievement-icon">🧠</span>
                <span>Puzzle Genius (3+ no-hint solves)</span>
              </div>
            )}
            {totalGamesPlayed >= 50 && (
              <div className="achievement-item">
                <span className="achievement-icon">🎮</span>
                <span>Gaming Enthusiast (50+ games)</span>
              </div>
            )}
            {totalGamesPlayed < 1 && (
              <p className="achievement-placeholder">Play some games to unlock achievements!</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFlashcardStats = () => (
    <div className="stats-grid md-2-cols">
      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#16a34a' }}>📚 Study Statistics</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Total Sessions:</span>
            <span className="stat-value green">{stats.flashcards.totalSessions}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Cards Studied:</span>
            <span className="stat-value">{stats.flashcards.totalCardsStudied}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Time Studied:</span>
            <span className="stat-value">{StatsManager.formatTime(stats.flashcards.totalTimeStudied)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg. Session:</span>
            <span className="stat-value">
              {stats.flashcards.totalSessions > 0 
                ? StatsManager.formatTime(Math.floor(stats.flashcards.totalTimeStudied / stats.flashcards.totalSessions))
                : '0s'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#2563eb' }}>🎯 Performance</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Average Accuracy:</span>
            <span className="stat-value blue">{stats.flashcards.averageAccuracy.toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Best Accuracy:</span>
            <span className="stat-value">{stats.flashcards.bestAccuracy.toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Current Streak:</span>
            <span className="stat-value">{stats.flashcards.currentStreak}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Best Streak:</span>
            <span className="stat-value orange">{stats.flashcards.bestStreak}</span>
          </div>
        </div>
      </div>

      <div className="stat-card white md-full-span">
        <h3 className="stat-card-title" style={{ color: '#7c3aed' }}>📈 Progress Insights</h3>
        <div className="progress-insights">
          <div className="insight-item">
            <div className="insight-value green">
              {stats.flashcards.totalSessions > 0 
                ? (stats.flashcards.totalCardsStudied / stats.flashcards.totalSessions).toFixed(1)
                : '0'
              }
            </div>
            <div className="insight-label">Avg Cards per Session</div>
          </div>
          <div className="insight-item">
            <div className="insight-value blue">
              {stats.flashcards.averageAccuracy > 85 ? '🏆' : stats.flashcards.averageAccuracy > 70 ? '🥈' : '🥉'}
            </div>
            <div className="insight-label">Performance Level</div>
          </div>
          <div className="insight-item">
            <div className="insight-value purple">
              {StatsManager.getRelativeTime(stats.flashcards.lastPlayedDate)}
            </div>
            <div className="insight-label">Last Study Session</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMatchingStats = () => (
    <div className="stats-grid md-2-cols">
      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#7c3aed' }}>🧩 Game Statistics</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Games Played:</span>
            <span className="stat-value purple">{stats.matching.gamesPlayed}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Games Completed:</span>
            <span className="stat-value">{stats.matching.gamesCompleted}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Completion Rate:</span>
            <span className="stat-value">
              {stats.matching.gamesPlayed > 0 
                ? ((stats.matching.gamesCompleted / stats.matching.gamesPlayed) * 100).toFixed(1)
                : '0'
              }%
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Perfect Games:</span>
            <span className="stat-value yellow">{stats.matching.perfectGames}</span>
          </div>
        </div>
      </div>

      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#16a34a' }}>⏱️ Best Times</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Easy:</span>
            <span className="stat-value green">
              {stats.matching.bestTimeEasy ? StatsManager.formatTime(stats.matching.bestTimeEasy) : 'No records'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Medium:</span>
            <span className="stat-value yellow">
              {stats.matching.bestTimeMedium ? StatsManager.formatTime(stats.matching.bestTimeMedium) : 'No records'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Hard:</span>
            <span className="stat-value red">
              {stats.matching.bestTimeHard ? StatsManager.formatTime(stats.matching.bestTimeHard) : 'No records'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Average Moves:</span>
            <span className="stat-value">{stats.matching.averageMoves.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="stat-card white md-full-span">
        <h3 className="stat-card-title" style={{ color: '#4f46e5' }}>🏆 High Scores</h3>
        <div className="high-scores-grid">
          <div className="score-card green-bg">
            <div className="score-difficulty green">Easy</div>
            <div className="score-value green">{stats.matching.bestScoreEasy}</div>
            <div className="score-label">Best Score</div>
          </div>
          <div className="score-card yellow-bg">
            <div className="score-difficulty yellow">Medium</div>
            <div className="score-value yellow">{stats.matching.bestScoreMedium}</div>
            <div className="score-label">Best Score</div>
          </div>
          <div className="score-card red-bg">
            <div className="score-difficulty red">Hard</div>
            <div className="score-value red">{stats.matching.bestScoreHard}</div>
            <div className="score-label">Best Score</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCrosswordStats = () => (
    <div className="stats-grid md-2-cols">
      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#ea580c' }}>🔤 Puzzle Statistics</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Puzzles Attempted:</span>
            <span className="stat-value orange">{stats.crossword.puzzlesAttempted}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Puzzles Solved:</span>
            <span className="stat-value">{stats.crossword.puzzlesSolved}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">
              {stats.crossword.puzzlesAttempted > 0 
                ? ((stats.crossword.puzzlesSolved / stats.crossword.puzzlesAttempted) * 100).toFixed(1)
                : '0'
              }%
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Words Completed:</span>
            <span className="stat-value blue">{stats.crossword.wordsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="stat-card white">
        <h3 className="stat-card-title" style={{ color: '#2563eb' }}>⏰ Time & Performance</h3>
        <div className="stat-card-content">
          <div className="stat-row">
            <span className="stat-label">Best Time:</span>
            <span className="stat-value green">
              {stats.crossword.bestTime ? StatsManager.formatTime(stats.crossword.bestTime) : 'No records'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Average Time:</span>
            <span className="stat-value">
              {stats.crossword.averageTime > 0 ? StatsManager.formatTime(Math.floor(stats.crossword.averageTime)) : 'No records'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Average Accuracy:</span>
            <span className="stat-value">{stats.crossword.averageAccuracy.toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Hints Used:</span>
            <span className="stat-value yellow">{stats.crossword.hintsUsed}</span>
          </div>
        </div>
      </div>

      <div className="stat-card white md-full-span">
        <h3 className="stat-card-title" style={{ color: '#dc2626' }}>🎯 Mastery Metrics</h3>
        <div className="mastery-grid">
          <div className="mastery-item red-bg">
            <div className="mastery-value red">{stats.crossword.perfectSolves}</div>
            <div className="mastery-label">Perfect Solves</div>
            <div className="mastery-sublabel">(No hints used)</div>
          </div>
          <div className="mastery-item blue-bg">
            <div className="mastery-value blue">
              {stats.crossword.puzzlesSolved > 0 
                ? (stats.crossword.hintsUsed / stats.crossword.puzzlesSolved).toFixed(1)
                : '0'
              }
            </div>
            <div className="mastery-label">Avg Hints per Puzzle</div>
          </div>
          <div className="mastery-item green-bg">
            <div className="mastery-value green">
              {stats.crossword.puzzlesSolved > 0 
                ? (stats.crossword.wordsCompleted / stats.crossword.puzzlesSolved).toFixed(1)
                : '0'
              }
            </div>
            <div className="mastery-label">Avg Words per Puzzle</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="stats-page-container">
      <div className="stats-content-wrapper">
        {/* Header */}
        <div className="stats-header">
          <h1 className="stats-main-title">
            {Profile.username}'s Game Statistics
          </h1>
          <p className="stats-subtitle">
            Track your progress across all games
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="stats-nav-tabs">
          {[
            { key: 'overview', label: '🏠 Overview', color: 'blue' },
            { key: 'flashcards', label: '📚 Flashcards', color: 'green' },
            { key: 'matching', label: '🧩 Matching', color: 'purple' },
            { key: 'crossword', label: '🔤 Crossword', color: 'orange' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`stats-tab-button ${
                activeTab === tab.key ? `active ${tab.color}` : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'flashcards' && renderFlashcardStats()}
          {activeTab === 'matching' && renderMatchingStats()}
          {activeTab === 'crossword' && renderCrosswordStats()}
        </div>

        {/* Action Buttons */}
        <div className="stats-actions">
          <button
            onClick={handleExportStats}
            className="action-button blue"
          >
            📊 Export Stats
          </button>
          <button
            onClick={handleResetStats}
            className="action-button red"
          >
            🔄 Reset Stats
          </button>
        </div>

        {/* Footer Info */}
        <div className="stats-footer">
          <p>Stats are automatically saved as you play. All data is stored locally on your device.</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;