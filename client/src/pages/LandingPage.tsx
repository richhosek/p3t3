import { useNavigate } from "react-router-dom";
import "./../styles/LandingPage.css"; // Import your CSS file for styling



export default function LandingPage() {
  const navigate = useNavigate();

   
   const routeLogin = () => {
    navigate("/login");
  };
  return (
  <div className="landing-page">
    {/* Hero Section */}
    <section className="hero">
      <h1>Master Anything, One Game at a Time</h1>
      <p>Transform study into play. Build flashcard decks, play interactive games, and boost your skills, all at once.</p>
      <div className="hero-buttons">
        <button onClick={routeLogin}>Get Started</button>
      </div>
    </section>

    {/* Key Features Section */}
    <section className="features">
      <div className="feature">
        <div className="icon">🎮</div>
        <h2>Play Your Way</h2>
        <p>Choose from multiple fun game modes to test your knowledge.</p>
      </div>
      <div className="feature">
        <div className="icon">📝</div>
        <h2>Create Custom Decks</h2>
        <p>Easily build flashcard decks on any subject.</p>
      </div>
      <div className="feature">
        <div className="icon">📊</div>
        <h2>Track Your Progress</h2>
        <p>Monitor your learning stats and see your improvement over time.</p>
      </div>
    </section>

    {/* Testimonials Section */}
    <section className="testimonials">
      <h2>Why Learners Love Us</h2>
      <p>"This website made studying feel like a game! I’ve never enjoyed learning this much." – Alex S.</p>
      <p>"I aced my exams thanks to the flashcard games. Highly recommend it!" – Maya P.</p>
    </section>

    {/* Secure Access Section */}
    <section className="secure">
      <h2>Your Learning, Protected</h2>
      <p>Sign in or create an account to securely save your flashcard decks and track your progress.</p>
    </section>
  </div>
);
}
