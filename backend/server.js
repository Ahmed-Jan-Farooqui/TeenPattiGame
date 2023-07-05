var Socket = require("socket.io").Socket;
var express = require("express");
var app = express();
var http = require("http");
var Server = require("socket.io").Server;
var cors = require("cors");
// Server state
var cardOrder = [
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
var deckOfCards = [];
var players = [];
var table_pile = [];
var top_card;
var current_player = 0;
var inHandCards = [];
var pileCards = [];
var player_sockets = [];
app.use(cors());
var server = http.createServer(app);
var io = new Server(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});
function swapLast(index_to_swap, array) {
    var temp = array[index_to_swap];
    array[index_to_swap] = array[array.length - 1];
    array[array.length - 1] = temp;
}
function isInHand(card) {
    return inHandCards[current_player].some(function (player_card) {
        return player_card.rank === card.rank && player_card.suit === card.suit;
    });
}
function isInPile(card) {
    return pileCards[current_player].some(function (player_card) {
        return player_card.rank === card.rank && player_card.suit === card.suit;
    });
}
function removeInHand(card, replacement_card) {
    var critical_index = -1;
    for (var i = 0; i < inHandCards[current_player].length; i++) {
        if (inHandCards[current_player][i].rank === card.rank &&
            inHandCards[current_player][i].suit === card.suit) {
            critical_index = i;
        }
    }
    if (replacement_card.rank === "null") {
        swapLast(critical_index, inHandCards[current_player]);
        inHandCards[current_player].pop();
        return;
    }
    inHandCards[current_player][critical_index] = replacement_card;
}
function removePileCard(card, replacement_card) {
    var critical_index = -1;
    for (var i = 0; i < pileCards[current_player].length; i++) {
        if (pileCards[current_player][i].rank === card.rank &&
            pileCards[current_player][i].suit === card.suit) {
        }
    }
}
function hasValidMove(current_player_cards) {
    if (top_card.rank === "null") {
        return true;
    }
    return current_player_cards.some(function (card) {
        return cardOrder.indexOf(card.rank) >= cardOrder.indexOf(top_card.rank);
    });
}
function hasPowerCard(current_player_cards) {
    return current_player_cards.some(function (card) {
        return (card.rank === "2" ||
            card.rank === "7" ||
            card.rank === "8" ||
            card.rank === "10");
    });
}
function canPlayerMove() {
    var current_player_cards = inHandCards[current_player];
    if (current_player_cards.length === 0) {
        current_player_cards = pileCards[current_player];
    }
    return (hasValidMove(current_player_cards) || hasPowerCard(current_player_cards));
}
function handleNormalMove(card, replacement_card) {
    table_pile.push(card);
    top_card = card;
    if (inHandCards.length !== 0) {
        removeInHand(card, replacement_card);
    }
    removePileCard(card, replacement_card);
}
function moveToNextPlayer() {
    if (current_player === 3) {
        current_player = 0;
    }
    else {
        current_player++;
    }
    var player_socket = player_sockets[current_player];
    for (var i = 0; i < player_sockets.length; i++) {
        player_sockets[i].emit("Next Player", current_player);
    }
    if (canPlayerMove()) {
        return;
    }
    player_socket.emit("Take Pile");
    inHandCards[current_player].concat(table_pile);
    table_pile = [];
    top_card = { rank: "null", suit: "null" };
    moveToNextPlayer();
}
function randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
// Initialize and shuffle a deck.
function initializeDeck() {
    var ranks = [
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
    var suits = ["spades", "clubs", "diams", "hearts"];
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 13; j++) {
            deckOfCards.push({ rank: ranks[j], suit: suits[i] });
        }
    }
    // Swap two random cards 52 times.
    for (var i = 0; i < 52; i++) {
        var random1 = randomNumberBetween(0, deckOfCards.length);
        var random2 = randomNumberBetween(0, deckOfCards.length);
        var temp = deckOfCards[random1];
        deckOfCards[random1] = deckOfCards[random2];
        deckOfCards[random2] = temp;
    }
}
initializeDeck();
top_card = deckOfCards[deckOfCards.length - 1];
table_pile.push(top_card);
deckOfCards.pop();
server.listen(3001, function () {
    console.log("SERVER IS LISTENING ON PORT 3001");
});
io.on("connection", function (socket) {
    console.log("user connected with a socket id", socket.id);
    player_sockets.push(socket);
    // Player initialization request
    socket.on("Player Init", function (player_name) {
        console.log("In Player Init request for: ", socket.id);
        players.push(player_name);
        var temp_array = [];
        var count = 0;
        while (count < 9) {
            temp_array.push(deckOfCards[deckOfCards.length - 1]);
            deckOfCards.pop();
            count++;
        }
        // Setting up player cards on server side.
        inHandCards.push(temp_array.slice(0, 3));
        pileCards.push(temp_array.slice(3, 9));
        // Telling player what their cards are.
        socket.emit("Player Init Response", temp_array, socket.id, top_card);
        // Telling other players what this player's visible cards are.
        var face_down_card = { rank: "null", suit: "null" };
        socket.broadcast.emit("Player Connect", {
            name: player_name,
            cards: temp_array.slice(6, 9),
            face_down_cards: [face_down_card, face_down_card, face_down_card]
        });
    });
    // Player move request
    socket.on("Player Move", function (card_info, playerID) {
        console.log("It is currently ".concat(players[current_player], "'s turn!"));
        console.log("Received move from ".concat(players[playerID], "!"));
        var display_message = "";
        var new_card = { rank: "null", suit: "null" };
        if (current_player != playerID) {
            display_message = "It is not your turn at the moment...";
            socket.emit("Server Move Message", false, display_message);
            return;
        }
        if (pileCards[current_player].length > 3 && card_info.rank === "null") {
            display_message = "Cannot play a face-down card yet...";
            socket.emit("Server Move Message", false, display_message);
            return;
        }
        if (inHandCards.length > 0 && !isInHand(card_info)) {
            display_message =
                "Must exhaust in-hand cards before you can play pile cards...";
            socket.emit("Server Move Message", false, display_message);
            return;
        }
        if (top_card.rank === "null") {
            // This branch handles a move when the top card itself is not set.
            display_message = "Valid move...";
            // Card always goes into pile if valid move.
            if (deckOfCards.length != 0) {
                new_card = deckOfCards[deckOfCards.length - 1];
                deckOfCards.pop();
            }
            if (hasPowerCard([card_info])) {
                return;
            }
            // If not a power card, then handle the normal move.
            handleNormalMove(card_info, new_card);
            socket.emit("Server Move Message", true, display_message, table_pile, new_card);
            socket.broadcast.emit("Other Player Move", table_pile);
            moveToNextPlayer();
            return;
        }
        if (cardOrder.indexOf(top_card.rank) > cardOrder.indexOf(card_info.rank)) {
            display_message =
                "Invalid move! Your card must have a higher or equal rank to the top card!";
            socket.emit("Server Move Message", false, display_message, []);
            return;
        }
        top_card = card_info;
        table_pile.push(card_info);
        if (deckOfCards.length != 0) {
            new_card = deckOfCards[deckOfCards.length - 1];
            deckOfCards.pop();
        }
        display_message = "Valid move...";
        socket.emit("Server Move Message", true, display_message, table_pile, new_card);
        socket.broadcast.emit("Other Player Move", table_pile);
        moveToNextPlayer();
    });
});
