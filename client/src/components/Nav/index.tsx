import { NavLink } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

import "../../styles/Nav.css";
import { useAuth } from '../../utils/authContext';
const NavigationBar = () => {
const { isAuthenticated, username, logout } = useAuth();
if (!isAuthenticated) {
    return null; 
  }

 return (
    <>
      <Navbar expand="lg" className="custom-navbar">
      <Container>
        {/* Hamburger Toggle Button */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Collapsible Navbar */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="navbar-nav">
            <Nav.Link as={NavLink} to="/Home">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/decks/createNewDeck">
              Create Deck
            </Nav.Link>
            <Nav.Link as={NavLink} to="/game/flashCards/Decks">
              View Decks
            </Nav.Link>
            <Nav.Link as={NavLink} to="/game">
              Games
            </Nav.Link>
            <Nav.Link as={NavLink} to="/AboutUs">
              About Us
            </Nav.Link>
            <Nav.Link as={NavLink} to="/stats">
              Stats
            </Nav.Link>
            <Nav.Link onClick={logout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor"
                className="bi bi-door-closed"
                viewBox="0 0 20 20"
              >
                <path d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3zm1 13h8V2H4z" />
                <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
              </svg>
              <span>{username}</span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    </>
  );
};

export default NavigationBar;
