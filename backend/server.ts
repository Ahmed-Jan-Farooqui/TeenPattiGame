const { Socket } = require("socket.io");

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

interface card {
  rank: string;
  suit: string;
}

// Server state
let cardOrder = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
let deckOfCards: card[] = [];
let players: string[] = [];
let table_pile: card[] = [];
let top_card: card;
let current_player: number = 0;
let inHandCards: card[][] = [];
let face_up_cards: card[][] = [];
let face_down_cards: card[][] = [];
let player_sockets: any[] = [];
let sevenFlag = false;

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

function swapLast(index_to_swap: number, array: card[]) {
  let temp: card = array[index_to_swap];
  array[index_to_swap] = array[array.length - 1];
  array[array.length - 1] = temp;
}

function isInHand(card: card) {
  return inHandCards[current_player].some((player_card) => {
    return player_card.rank === card.rank && player_card.suit === card.suit;
  });
}

function isInFaceDown(card: card) {
  return face_down_cards[current_player].some((player_card) => {
    return player_card.rank === card.rank && player_card.suit === card.suit;
  });
}

function isInFaceUp(card: card) {
  return face_up_cards[current_player].some((player_card) => {
    return player_card.rank === card.rank && player_card.suit === card.suit;
  });
}

function removeInHand(card: card, replacement_card: card, player: number) {
  let critical_index = -1;
  for (let i = 0; i < inHandCards[player].length; i++) {
    if (
      inHandCards[player][i].rank === card.rank &&
      inHandCards[player][i].suit === card.suit
    ) {
      critical_index = i;
    }
  }
  if (replacement_card.rank === "null") {
    swapLast(critical_index, inHandCards[player]);
    inHandCards[player].pop();
    return;
  }
  inHandCards[player][critical_index] = replacement_card;
}

function hasValidMove(current_player_cards: card[]) {
  if (top_card.rank === "null") {
    return true;
  }
  return current_player_cards.some((card) => {
    return cardOrder.indexOf(card.rank) >= cardOrder.indexOf(top_card.rank);
  });
}

function hasPowerCard(current_player_cards: card[]) {
  return current_player_cards.some((card) => {
    return (
      card.rank === "2" ||
      card.rank === "7" ||
      card.rank === "8" ||
      card.rank === "10"
    );
  });
}

function handlePowerMove(card: card, replacement_card: card) {
  // If refresh card played, set the server side top card to be unset.
  let message: string = "";
  let initial_player = current_player;
  if (card.rank === "2") {
    sevenFlag = false; // If seven flag were set, we set it to false.
    top_card = { rank: "null", suit: "null" };
    table_pile.push(card);
    message =
      "You've played a refresh card! You can now play any card of your choice.";
  }
  // Set the seven flag to true to indicate next move will be handled differently.
  if (card.rank === "7") {
    sevenFlag = true;
    top_card = card;
    table_pile.push(card);
    message = "You've played a seven! Very cheeky.";
    moveToNextPlayer();
  }
  // Don't change the top card if card played was a eight! We will still display it tho. Notice how we don't change the seven flag either, as it may have been the previous top card.
  if (card.rank === "8") {
    table_pile.push(card);
    message =
      "You've played an eight! The next player must play a valid card according to the card below yours";
    moveToNextPlayer();
  }
  // If card is 10, discard the pile.
  if (card.rank === "10") {
    sevenFlag = false; // If seven flag were set, we it to false.
    table_pile = [];
    table_pile.push(card);
    top_card = { rank: "null", suit: "null" };
    message = "What the hell man?";
    moveToNextPlayer();
  }

  if (inHandCards[initial_player].length > 0) {
    removeInHand(card, replacement_card, initial_player);
    return message;
  }
  removeFaceUpCards(card, initial_player);
  return message;
}

function handleSevenMove(card: card, replacement_card: card) {
  if (cardOrder.indexOf(top_card.rank) < cardOrder.indexOf(card.rank)) {
    return false;
  }
  sevenFlag = false;
  top_card = card;
  table_pile.push(card);
  if (inHandCards[current_player].length > 0) {
    removeInHand(card, replacement_card, current_player);
    return true;
  }
  removeFaceUpCards(card, current_player);
  return true;
}

function removeFaceUpCards(card: card, player: number) {
  let critical_index = -1;
  for (let i = 0; i < face_up_cards[player].length; i++) {
    if (
      face_up_cards[player][i].rank === card.rank &&
      face_up_cards[player][i].suit === card.suit
    ) {
      critical_index = i;
    }
  }
  if (critical_index === -1) {
    return;
  }
  swapLast(critical_index, face_up_cards[player]);
  face_up_cards[player].pop();
}

function canPlayerMove() {
  let current_player_cards: card[];

  // I decide which cards are currently being used.
  if (inHandCards[current_player].length > 0) {
    current_player_cards = inHandCards[current_player];
  } else if (face_up_cards[current_player].length > 0) {
    current_player_cards = face_up_cards[current_player];
  } else {
    current_player_cards = face_down_cards[current_player];
  }
  return (
    hasValidMove(current_player_cards) || hasPowerCard(current_player_cards)
  );
}

function handleNormalMove(card: card, replacement_card: card) {
  // Only need to check ranking if top card set
  if (top_card.rank !== "null") {
    if (cardOrder.indexOf(top_card.rank) > cardOrder.indexOf(card.rank)) {
      return false;
    }
  }

  // If we make it past the initial conditions, it means the move is valid.
  table_pile.push(card);
  top_card = card;
  if (inHandCards[current_player].length !== 0) {
    removeInHand(card, replacement_card, current_player);
    return true;
  }
  removeFaceUpCards(card, current_player);
  return true;
}

function handleFaceDownRejected(
  card_info: card,
  socket: any,
  player_id: number
) {
  let temp = table_pile;
  let message = "Bad draw! Allah is not with you.";
  temp.push(card_info);
  sevenFlag = false;
  table_pile = [];
  top_card = { rank: "null", suit: "null" };
  inHandCards[current_player] = temp;
  socket.emit("Face Down Failed", temp, message);
  socket.broadcast.emit("Other Player Move", table_pile, player_id);
  moveToNextPlayer();
}

function moveToNextPlayer() {
  if (current_player === 3) {
    current_player = 0;
  } else {
    current_player++;
  }
  for (let i = 0; i < player_sockets.length; i++) {
    player_sockets[i].emit("Next Player", current_player);
  }
}

function randomNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

function evaluateWinner(player: number) {
  if (
    inHandCards[player].length !== 0 ||
    face_down_cards[player].length !== 0 ||
    face_up_cards[player].length !== 0
  ) {
    return;
  }
  for (let i = 0; i < player_sockets.length; i++) {
    player_sockets[i].emit("Player Won", players[player]);
  }
}

async function timeout() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

// Initialize and shuffle a deck.
function initializeDeck() {
  let ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  let suits = ["spades", "clubs", "diams", "hearts"];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
      deckOfCards.push({ rank: ranks[j], suit: suits[i] });
    }
  }
  // Swap two random cards 52 times.
  for (let i = 0; i < 52; i++) {
    let random1 = randomNumberBetween(0, deckOfCards.length);
    let random2 = randomNumberBetween(0, deckOfCards.length);
    let temp = deckOfCards[random1];
    deckOfCards[random1] = deckOfCards[random2];
    deckOfCards[random2] = temp;
  }
}
initializeDeck();
top_card = deckOfCards[deckOfCards.length - 1];
table_pile.push(top_card);
deckOfCards.pop();

server.listen(3001, () => {
  console.log("SERVER IS LISTENING ON PORT 3001");
});

io.on("connection", (socket: any) => {
  player_sockets.push(socket);

  // Player initialization request
  socket.on("Player Init", async (player_name: string) => {
    let face_down_card: card = { rank: "null", suit: "null" };
    players.push(player_name);
    let temp_array: card[] = [];
    let count = 0;
    while (count < 9) {
      temp_array.push(deckOfCards[deckOfCards.length - 1]);
      deckOfCards.pop();
      count++;
    }
    // Setting up player cards on server side.
    inHandCards.push(temp_array.slice(0, 3));
    face_down_cards.push(temp_array.slice(3, 6));
    face_up_cards.push(temp_array.slice(6, 9));
    // Telling player what their cards are.
    socket.emit("Player Init Response", temp_array, socket.id, top_card);
    // Telling other players what this player's visible cards are.
    socket.broadcast.emit("Player Connect", {
      name: player_name,
      cards: temp_array.slice(6, 9),
      face_down_cards: [face_down_card, face_down_card, face_down_card],
    });
  });

  // Player move request
  socket.on("Player Move", (card_info: card, playerID: number) => {
    let display_message = "";
    let new_card: card = { rank: "null", suit: "null" };
    let valid_face_down = false;

    // Check if a player has played out of turn.
    if (current_player != playerID) {
      display_message = "It is not your turn at the moment...";
      socket.emit("Server Move Message", false, display_message);
      return;
    }

    // Check if a face down card is played that neither the in-hand cards nor the face up cards have any cards.
    if (
      (face_up_cards[current_player].length > 0 ||
        inHandCards[current_player].length > 0) &&
      card_info.rank === "null"
    ) {
      display_message = "Cannot play a face-down card yet...";
      socket.emit("Server Move Message", false, display_message);
      return;
    }

    // Check if a valid card is played that it is actually in hand.
    if (inHandCards[current_player].length > 0 && !isInHand(card_info)) {
      display_message =
        "Must exhaust in-hand cards before you can play pile cards...";
      socket.emit("Server Move Message", false, display_message);
      return;
    }

    // If a null card has made it this far, then we are in a valid face-down card scenario. We can set our initial argument to the discovered face down card.
    if (card_info.rank === "null") {
      let idx = face_down_cards[current_player].length;
      card_info = face_down_cards[current_player][idx - 1];
      valid_face_down = true;
    }

    // Set new card here. We may or may not have a valid move yet, but we need it to run the functions.
    if (deckOfCards.length !== 0) {
      new_card = deckOfCards[deckOfCards.length - 1];
    }

    // Check if the user played a power card.
    if (hasPowerCard([card_info])) {
      // If it is a power card that was played, we know that the move will be valid so we can pop the new card from the deck.
      display_message = handlePowerMove(card_info, new_card);
      deckOfCards.pop();
      // If the played card was actually a discovered card, need to remove one face down card.
      if (valid_face_down) {
        face_down_cards[playerID].pop();
      }
      // Can actually emit the same message either way since our face down card was successful.
      socket.emit(
        "Server Move Message",
        true,
        display_message,
        table_pile,
        new_card
      );
      socket.broadcast.emit("Other Player Move", table_pile, playerID);
      evaluateWinner(playerID);
      if (table_pile.length === 1 && table_pile[0].rank === "10") {
        table_pile = [];
      }
      return;
    }

    // Handle the scenario of the top card being a seven differently.
    if (sevenFlag) {
      if (!handleSevenMove(card_info, new_card)) {
        display_message =
          "Invalid move! Seven is a power card which can only be stacked by a card smaller than it.";
        // If our played card was a discovered card and it failed, it needs to be handled differently.
        if (valid_face_down) {
          face_down_cards[playerID].pop();
          handleFaceDownRejected(card_info, socket, playerID);
          return;
        }
        socket.emit("Server Move Message", false, display_message, []);
        return;
      }
      // Valid move with the seven paradigm
      display_message = "Valid move...";
      deckOfCards.pop();
      // If played card was discovered, need to remove a face down card.
      if (valid_face_down) {
        face_down_cards[playerID].pop();
      }
      socket.emit(
        "Server Move Message",
        true,
        display_message,
        table_pile,
        new_card
      );
      socket.broadcast.emit("Other Player Move", table_pile, playerID);
      evaluateWinner(playerID);
      moveToNextPlayer();
      return;
    }

    // Check if the normal move played was a valid one.
    if (!handleNormalMove(card_info, new_card)) {
      display_message =
        "Invalid move! Your card must have a higher or equal rank to the top card!";
      // Must handle face down rejections differently.
      if (valid_face_down) {
        face_down_cards[playerID].pop();
        handleFaceDownRejected(card_info, socket, playerID);
        return;
      }
      socket.emit("Server Move Message", false, display_message, []);
      return;
    }

    // Being in this branch of code means the move was indeed valid. Thankfully, our function above has already processed it. Just need to emit the messages now.
    display_message = "Valid move...";
    deckOfCards.pop();
    // If card was discovered, must remove a facedown card.
    if (valid_face_down) {
      face_down_cards[playerID].pop();
    }
    socket.emit(
      "Server Move Message",
      true,
      display_message,
      table_pile,
      new_card
    );
    socket.broadcast.emit("Other Player Move", table_pile, playerID);
    evaluateWinner(playerID);
    // A normal move always results in the turn being progressed, so I call it explicitly here.
    moveToNextPlayer();
  });

  socket.on("Took Pile", (playerID: number) => {
    inHandCards[playerID] = inHandCards[playerID].concat(table_pile);
    table_pile = [];
    top_card = { rank: "null", suit: "null" };
    sevenFlag = false;
    socket.broadcast.emit("Other Player Move", table_pile, playerID);
    moveToNextPlayer();
  });
});
