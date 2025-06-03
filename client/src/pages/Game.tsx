import { useState } from 'react'
import "../styles/games.css"; 
import SelectDeck from '../components/SelectDeck/index'; 




const Game = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (selectedGame) {
    return <SelectDeck gamePath={selectedGame} />
  }
  

  return (
  <main>
      <div className='game-container'>
        <h1>Select a Game!</h1>
        <div className='gameoptions'>
        <button className='gamebutton' onClick={() => setSelectedGame("flashcard")}>Flashcard Game</button><br/>
        <button className='gamebutton' onClick={() => setSelectedGame("matching")}>Matching Game</button><br/>
        <button className='gamebutton' onClick={() => setSelectedGame("crossword")}>Crossword Game</button><br/>
        <button className='gamebutton' onClick={() => setSelectedGame("linkup")}>Link Up Game</button>
      </div>
      </div>
  </main>
  );
}
export default Game;