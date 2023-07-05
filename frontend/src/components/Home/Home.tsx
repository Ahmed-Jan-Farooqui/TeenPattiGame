import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import "./Home.css";
import TableCards from "./TableCards";
import HandCards from "./HandCards";
import TableHandCards from "./TableHandCards";
import NameForm from "./NameForm";
import TablePile from "./TablePile";
import MessageContainer from "./MessagesContainer";
import "./playing-cards.css";
import "./teenpatti.css";
import { useEffect, useState } from "react";

//create an interface for the props that you want to pass to this component
interface HomePageProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap>; //this is the type for sockets
  //you can always add more functions/objects that you would like as props for this component
}

interface card {
  rank: string;
  suit: string;
}

function HomePage({ socket }: HomePageProps) {
  const [myName, setMyName] = useState("");
  const [inHandCards, setInHandCards] = useState<card[]>([]);
  const [myFaceUpCards, setMyFaceUpCards] = useState<card[]>([]);
  const [myFaceDownCards, setMyFaceDownCards] = useState<card[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>("");
  const [serverMoveMessage, setServerMoveMessage] = useState(
    "If you don't have a move, you can take the pile by pressing the button above!"
  );
  const [playerID, setPlayerID] = useState(-1);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player3Name, setPlayer3Name] = useState("");
  const [player4Name, setPlayer4Name] = useState("");
  const [player1Cards, setPlayer1Cards] = useState<card[]>([]);
  const [player2Cards, setPlayer2Cards] = useState<card[]>([]);
  const [player3Cards, setPlayer3Cards] = useState<card[]>([]);
  const [player4Cards, setPlayer4Cards] = useState<card[]>([]);
  const [tablePile, setTablePile] = useState<card[]>([]);
  const [playerWhoWon, setPlayerWhoWon] = useState("");

  const initiatePlayerMove = (rank: string, suit: string) => {
    socket.emit("Player Move", { rank: rank, suit: suit }, playerID);
  };

  const removeInHand = (card_info: card, replacement_card: card) => {
    setInHandCards((old_cards) => {
      let new_cards: card[] = [];
      for (let i = 0; i < old_cards.length; i++) {
        if (
          old_cards[i].rank === card_info.rank &&
          old_cards[i].suit === card_info.suit
        ) {
          if (replacement_card.rank === "null") {
            continue;
          }
          new_cards.push(replacement_card);
          continue;
        }
        new_cards.push(old_cards[i]);
      }
      return new_cards;
    });
  };

  function removeFaceUp(card_info: card, replacement_card: card) {
    setMyFaceUpCards((old_cards) => {
      let new_cards: card[] = [];
      for (let i = 0; i < old_cards.length; i++) {
        if (
          old_cards[i].rank === card_info.rank &&
          old_cards[i].suit === card_info.suit
        ) {
          if (replacement_card.rank === "null") {
            continue;
          }
          new_cards.push(replacement_card);
          continue;
        }
        new_cards.push(old_cards[i]);
      }
      return new_cards;
    });
  }

  function removeFaceDown(card_info: card) {
    setMyFaceDownCards((old_cards) => {
      let new_cards: card[] = [];
      for (let i = 0; i < old_cards.length; i++) {
        if (
          old_cards[i].rank === card_info.rank &&
          old_cards[i].suit === card_info.suit
        ) {
          continue;
        }
        new_cards.push(old_cards[i]);
      }
      return new_cards;
    });
  }

  function modifyPlayerCards(
    card_info: card,
    setter: React.Dispatch<React.SetStateAction<card[]>>
  ) {
    setter((old_cards) => {
      let new_cards: card[] = [];

      // Handles updating of face down cards.
      if (old_cards.length <= 3) {
        for (let i = 0; i < old_cards.length - 1; i++) {
          new_cards.push(old_cards[i]);
        }
        return new_cards;
      }

      // Handles updating of face up cards.
      for (let i = 0; i < old_cards.length; i++) {
        if (
          old_cards[i].rank === card_info.rank &&
          old_cards[i].suit === card_info.suit
        ) {
          continue;
        }
        new_cards.push(old_cards[i]);
      }
      return new_cards;
    });
  }

  const initiateTakePile = () => {
    setInHandCards((old) => old.concat(tablePile));
    setTablePile([]);
    socket.emit("Took Pile", playerID);
  };

  // Create socket events for move related stuff.
  useEffect(() => {
    function handleChangeToDisplayCards(card_played: card, player_id: number) {
      switch (player_id) {
        case 0: {
          modifyPlayerCards(card_played, setPlayer1Cards);
          break;
        }
        case 1: {
          modifyPlayerCards(card_played, setPlayer2Cards);
          break;
        }
        case 2: {
          modifyPlayerCards(card_played, setPlayer3Cards);
          break;
        }
        case 3: {
          modifyPlayerCards(card_played, setPlayer4Cards);
          break;
        }
      }
    }

    socket.on(
      "Server Move Message",
      (valid: boolean, message: string, new_pile: card[], new_card) => {
        if (!valid) {
          setServerMoveMessage(message);
          return;
        }

        if (new_pile.length === 1 && new_pile[0].rank === "10") {
          setTablePile([]);
        } else {
          setTablePile(new_pile);
        }

        let top_card = new_pile[new_pile.length - 1];
        setServerMoveMessage(message);
        if (inHandCards.length > 0) {
          removeInHand(top_card, new_card);
        } else if (myFaceUpCards.length > 0) {
          removeFaceUp(top_card, new_card);
        } else {
          removeFaceDown(top_card);
        }

        // No need to modify the display cards if in hand cards are still available. Reduces chance of weird stuff happening.
        if (inHandCards.length > 0) {
          return;
        }

        handleChangeToDisplayCards(top_card, playerID);
      }
    );

    socket.on("Other Player Move", (recvd_pile: card[], player_id: number) => {
      if (recvd_pile.length === 1 && recvd_pile[0].rank === "10") {
        setTablePile([]);
        return;
      }
      setTablePile(recvd_pile);

      if (recvd_pile.length === 0) {
        return;
      }

      let top_card = recvd_pile[recvd_pile.length - 1];

      handleChangeToDisplayCards(top_card, player_id);
    });

    // Handles moving the turn forward.
    socket.on("Next Player", (next_player: number) => {
      switch (next_player) {
        case 0: {
          setCurrentPlayer(player1Name);
          return;
        }
        case 1: {
          setCurrentPlayer(player2Name);
          return;
        }
        case 2: {
          setCurrentPlayer(player3Name);
          return;
        }
        case 3: {
          setCurrentPlayer(player4Name);
          return;
        }
      }
    });

    // Handles the scenario where the discovered face down card was invalid.
    socket.on("Face Down Failed", (temp: card[], message: string) => {
      setTablePile([]);
      setServerMoveMessage(message);
      setInHandCards(temp);
      removeFaceDown(temp[temp.length - 1]);

      // Handles changing the display cards.
      handleChangeToDisplayCards(temp[temp.length - 1], playerID);
    });

    socket.on("Player Won", (player_name: string) => {
      setPlayerWhoWon(player_name);
    });

    // Cleanup on dismount.
    return () => {
      socket.off("Server Move Message");
      socket.off("Next Player");
      socket.off("Take Pile");
      socket.off("Other Player Move");
      socket.off("Face Down Failed");
      socket.off("Player Won");
    };
  }, [
    socket,
    player1Name,
    player2Name,
    player3Name,
    player4Name,
    inHandCards,
    myFaceDownCards,
    myFaceUpCards,
    myName,
    playerID,
  ]);

  // Create socket events for initial connection stuff.
  useEffect(() => {
    socket.on(
      "Player Init Response",
      (
        cards: { rank: string; suit: string }[],
        socket_id: any,
        top_card: { rank: string; suit: string }
      ) => {
        setInHandCards(cards.slice(0, 3));
        setMyFaceDownCards(cards.slice(3, 6));
        setMyFaceUpCards(cards.slice(6, 9));
        setTablePile((oldPile) => [...oldPile, top_card]);
        let face_down_card = { rank: "null", suit: "null" };
        let helper_array = [face_down_card, face_down_card, face_down_card];
        if (player1Cards.length === 0) {
          setPlayer1Cards(helper_array.concat(cards.slice(6, 9)));
          setPlayer1Name(myName);
          setPlayerID(0);
          setCurrentPlayer(myName);
        } else if (player2Cards.length === 0) {
          setPlayer2Cards(helper_array.concat(cards.slice(6, 9)));
          setPlayer2Name(myName);
          setPlayerID(1);
        } else if (player3Cards.length === 0) {
          setPlayer3Cards(helper_array.concat(cards.slice(6, 9)));
          setPlayer3Name(myName);
          setPlayerID(2);
        } else if (player4Cards.length === 0) {
          setPlayer4Cards(helper_array.concat(cards.slice(6, 9)));
          setPlayer4Name(myName);
          setPlayerID(3);
        }
      }
    );

    socket.on("Player Connect", ({ name, cards, face_down_cards }) => {
      console.log("Player connected!", name);
      if (player1Cards.length === 0) {
        setPlayer1Cards(face_down_cards.concat(cards));
        setPlayer1Name(name);
        setCurrentPlayer(player1Name);
      } else if (player2Cards.length === 0) {
        setPlayer2Cards(face_down_cards.concat(cards));
        setPlayer2Name(name);
      } else if (player3Cards.length === 0) {
        setPlayer3Cards(face_down_cards.concat(cards));
        setPlayer3Name(name);
      } else if (player4Cards.length === 0) {
        setPlayer4Cards(face_down_cards.concat(cards));
        setPlayer4Name(name);
      }
    });

    return () => {
      socket.off("Player Init Response");
      socket.off("Player Connect");
    };
  }, [
    socket,
    myName,
    player1Name,
    player1Cards.length,
    player2Cards.length,
    player3Cards.length,
    player4Cards.length,
  ]);

  useEffect(() => {
    console.log(player1Name);
    console.log(player2Name);
    console.log(player3Name);
    console.log(player4Name);
  }, [player1Name, player2Name, player3Name, player4Name]);

  return (
    <>
      {!myName && <NameForm setName={setMyName} socket={socket} />}
      {myName &&
        (!player1Name || !player2Name || !player3Name || !player4Name) && (
          <div className="loading">
            <h1 className="loading-message">WAITING FOR PLAYERS...</h1>
          </div>
        )}
      {myName &&
        player1Cards.length !== 0 &&
        player2Cards.length !== 0 &&
        player3Cards.length !== 0 &&
        player4Cards.length !== 0 &&
        !playerWhoWon && (
          <div className="main-container playingCards">
            <div className="game-container">
              <div className="heading-container">
                <h1>Teen Patti</h1>
              </div>
              <div className="game-table-container">
                <div className="game-table">
                  <TablePile cards={tablePile} />
                  <div className="game-players-container">
                    <div className="player-tag player-one">{player1Name}</div>
                    <TableCards
                      cards={player1Cards}
                      playerNumber="player-one"
                    />
                  </div>

                  <div className="game-players-container">
                    <div className="player-tag player-two">{player2Name}</div>
                    <TableCards
                      cards={player2Cards}
                      playerNumber="player-two"
                    />
                  </div>

                  <div className="game-players-container">
                    <div className="player-tag player-three">{player3Name}</div>
                    <TableCards
                      cards={player3Cards}
                      playerNumber="player-three"
                    />
                  </div>

                  <div className="game-players-container">
                    <div className="player-tag player-four">{player4Name}</div>
                    <TableCards
                      cards={player4Cards}
                      playerNumber="player-four"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="messages-and-cards-container">
              <div className="right-side-container messages-container">
                <h1>Messages</h1>
                <MessageContainer
                  current_player_name={currentPlayer}
                  server_move_message={serverMoveMessage}
                  take_pile_handler={initiateTakePile}
                />
              </div>
              <div className="right-side-container my-cards-container">
                <h1>My Cards</h1>
                <div className="my-cards-inner-container">
                  <HandCards
                    cards={inHandCards}
                    clickHandler={initiatePlayerMove}
                  />
                </div>
                <div className="my-fixed-cards-container">
                  <TableHandCards
                    face_up={myFaceUpCards}
                    face_down={myFaceDownCards}
                    clickHandler={initiatePlayerMove}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      {playerWhoWon && (
        <div className="winning-screen">
          <h1 className="winning-text">
            GAME OVER! {playerWhoWon} HAS WON THE GAME!
          </h1>
        </div>
      )}
    </>
  );
}
export default HomePage;
