import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

// Suppress findDOMNode warning from Semantic UI React
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

import App from "./App.jsx";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Error from "./pages/Error";
import About from "./pages/AboutUs";
import FlashCards from "./pages/FlashCard";
import Matching from "./pages/Matching";
import Crossword from "./pages/Crossword";
import LinkUp from "./pages/LinkUp";
import Game from "./pages/Game";
import Decks from "./pages/Decks";
import NewCard from "./components/NewCard/index";
import LandingPage from "./pages/LandingPage";
import CreateDeck from "./pages/createDeck";
import ViewDeck from "./pages/ViewADeck.js";
import Stats from "./pages/Stats"; 
import "./index.css";

const handleAddCard = (newFlashcard: { term: string; definition: string }) => {
  console.log('Card added:', newFlashcard);
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "/Home",
        element: <Home />
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/signup",
        element: <Signup />
      },
      {
        path: "/profiles/:profileId",
        element: <Profile />
      },
      {
        path: "/me",
        element: <Profile />
      },
      {
        path: "/flashcard/:id/",
        element: <FlashCards />
      },
      {
        path: "/matching/:id",
        element: <Matching />
      },
      {
        path: "/crossword/:id",
        element: <Crossword />,
      },
      {
        path: "/linkup/:id",
        element: <LinkUp />
      },
      {
        path:'/game/flashCards/Decks',
        element: <Decks/>
      },
      {
       path: '/deck/:id/new-card',
       element: <NewCard onAdd={handleAddCard} />,
      },
      {
        path: "/game",
        element: <Game />
      },
      {
        path: "/AboutUs",
        element: <About />
      },
      {
        path: "/deck/:id",
        element: <ViewDeck />
      },
      {
        path:"/decks/createNewDeck",
        element: <CreateDeck />
      },
      {
        path:"/stats/:gameType",
        element: <Stats />
      },
      {
        path: "/stats",
        element: <Stats />
      }
    ],
  },
]);

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
}


