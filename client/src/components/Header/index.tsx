import { useState } from 'react';
import "../../styles/Header.css"
import 'semantic-ui-css/semantic.min.css';

const Header = () => {
 

  //darkmode button
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode based on localStorage
    return localStorage.getItem('darkMode') === 'true';
  });

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };


  return (
    <header>
      <button onClick={toggleDarkMode}>
          <i className={`${darkMode ? 'moon icon' : 'sun icon'}`}></i>
        </button>
      <h1>StudyQuest</h1>
    
    </header>
  );
};

export default Header;