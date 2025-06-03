import { useQuery } from "@apollo/client";
import { QUERY_ALL_DECKS } from "../../utils/queries";
import { useNavigate } from "react-router-dom"; 

interface Props {
    gamePath: string;
}

const SelectDeck: React.FC<Props> = ({ gamePath }) => {
    const { data, loading, error } = useQuery(QUERY_ALL_DECKS);
    const navigate = useNavigate();

    if (loading) {
        return <div>Shuffling decks...</div>;
    }

    if (error) {
        console.error("Error fetching decks:", error);
        return <div>Error Shuffling decks.</div>;
    }
    
   const handleSelect = (deckId: string) => {
        if (deckId !== undefined) {
    
            if (gamePath === 'flashcard') {
                navigate(`/flashcard/${deckId}`);
            } else {
                navigate(`/${gamePath}/${deckId}`);
            }
        } else {
            console.error("No deck Found");
        }
    };

    return (
        <div>
            <h1>Select a Deck!</h1>
            {data.getAllDecks.map((deck: any) => (
                <button className='ui violet button'key={deck._id} onClick={() => handleSelect(deck._id)}>
                    <h2>{deck.title}</h2>
                    <p>{deck.description}</p>
                </button>
            ))}
        </div>
    );
}
export default SelectDeck;