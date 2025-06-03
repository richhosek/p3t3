import React from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { 
  QUERY_PROFILES,
  QUERY_ALL_DECKS 
} from '../utils/queries';
import { 
  useState, 
  useEffect,
  useRef 
} from 'react';
import 'semantic-ui-css/semantic.min.css';
import '../styles/Home.css';
import SelectDeck from '../components/SelectDeck';  

interface Profile {
  _id: string;
  username: string;
}

interface Deck {
  _id: string;
  title: string;
  description: string;
  flashcards: Array<{
    _id: string;
    term: string;
    definition: string;
  }>;
}

interface ProfilesData {
  profiles: Profile[];
}

interface DecksData {
  getAllDecks: Deck[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { loading: profilesLoading, data: profilesData } = useQuery<ProfilesData>(QUERY_PROFILES);
  const { loading: decksLoading, data: decksData } = useQuery<DecksData>(QUERY_ALL_DECKS);
  
  const profiles = profilesData?.profiles || [];
  const decks = decksData?.getAllDecks || [];
  const loading = profilesLoading || decksLoading;

  // Get some stats for the dashboard
  const totalFlashcards = decks.reduce((total, deck) => total + deck.flashcards.length, 0);
  const availableDecks = decks.filter(deck => deck.flashcards.length > 0);
  const memoryGameDecks = decks.filter(deck => deck.flashcards.length >= 2);
  const crosswordGameDecks = decks.filter(deck => deck.flashcards.length >= 6);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const waveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const waveText = waveRef.current;
    if (!waveText) return;

    const text = waveText.textContent || "";
    waveText.textContent = ""; // clear existing text

    const words = text.split(" ");

    words.forEach((word, index) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.style.display = "inline-block";
      span.style.animation = `wave 0.5s ease forwards`;
      span.style.animationDelay = `${index * 0.1}s`;

      waveText.appendChild(span);

      if (index < words.length - 1) {
        waveText.appendChild(document.createTextNode(" "));
      }
    });
  }, []);
  
  if (selectedGame) {
    return <SelectDeck gamePath={selectedGame} />
  }

  


  if (loading) {
    return (
      <main>
        <div className="ui segment">
          <div className="ui active dimmer">
            <div className="ui indeterminate text loader">Loading Brain Games...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="home-container">
      <div className="hero-section">
        <div className="hero-header">
        <h1 className="main-title">Welcome to StudyQuest</h1>
        <p ref={waveRef}  className="hero-subtitle">
          Challenge your mind with interactive learning games and flashcards!
        </p>
        </div>
        {/* Quick Stats Dashboard */}
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">{decks.length}</div>
            <div className="stat-label">Decks</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{totalFlashcards}</div>
            <div className="stat-label">Flashcards</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{profiles.length}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        
        <div className="action-buttons">
          <button 
            className="ui large yellow button"
            onClick={() => navigate('/game/flashCards/Decks')} 
          >
            <i className="clone outline icon"></i>
            View All Decks
          </button>
        </div>
      </div>

      {/* Games Section */}
      <div className="games-section">
        <h2 className="section-title">Choose Your Game</h2>
        <div className="gameContainer">
          <div className="game-card homeFlashcard">
            <div className="game-icon">📚</div>
            <h3>Flashcard Study</h3>
            <p>Review and study your flashcards with our interactive study mode.</p>
            <div className="game-stats">
              <span className="game-stat">
                {availableDecks.length} decks available
              </span>
            </div>
            <button 
              className="ui violet button"
              onClick={() => setSelectedGame('flashcard')}
              disabled={availableDecks.length === 0}
            >
              {availableDecks.length === 0 ? 'No Decks Available' : 'Start Studying'}
            </button>
          </div>

          <div className="game-card homeMatching">
            <div className="game-icon">🎮</div>
            <h3>Memory Matching Game</h3>
            <p>Test your memory by matching terms with their definitions!</p>
            <div className="game-stats">
              <span className="game-stat">
                {memoryGameDecks.length} decks ready to play
              </span>
            </div>
            <button 
              className="ui violet button"
              onClick={() => setSelectedGame('memory')}
              disabled={memoryGameDecks.length === 0}
            >
              {memoryGameDecks.length === 0 ? 'Need 2+ Cards' : 'Play Memory Game'}
            </button>
          </div>

           <div className="game-card homeCrossword">
            <div className="game-icon">📝</div>
            <h3>Crossword Puzzle</h3>
            <p>Challenge yourself with crossword puzzles based on your flashcards!</p>
            <div className="game-stats">
              <span className="game-stat">
                {crosswordGameDecks.length} crossword-ready decks
              </span>
            </div>
            <button 
              className="ui violet button"
              onClick={() => setSelectedGame('crossword')}
              disabled={crosswordGameDecks.length === 0}
            >
              {crosswordGameDecks.length === 0 ? 'Need 3+ Cards' : 'Play Crosswords'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {decks.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>Get Started!</h3>
          <p>Create your first flashcard deck to begin your learning journey.</p>
          <button 
            className="ui large primary button"
            onClick={() => navigate('/decks/createNewDeck')}
          >
            Create Your First Deck
          </button>
        </div>
      )}

    </main>
  );
};

export default Home;
