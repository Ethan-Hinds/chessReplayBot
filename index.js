const express = require("express");
const app = express();
app.use(express.static("public"));
app.use(express.json({limit: "1mb"}));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Listening at " + port);
});

const ChessWebAPI = require('chess-web-api');
const chessAPI = new ChessWebAPI();

const {Chess} = require('chess.js');
const chess = new Chess();

require('dotenv').config();

const fs = require("fs");

const {Client, MessageAttachment} = require('discord.js');
const client = new Client();
client.login(process.env.DISCORD_TOKEN);

const _canvas = {createCanvas, loadImage} = require('canvas');
global.loadImage = _canvas.loadImage;
global.canvas = createCanvas(96*8, 96*8);
global.ctx = canvas.getContext("2d");

const GIFEncoder = require('gif-encoder-2');

const Board = require('./Board.js');
const { start } = require('repl');

const prefix = "!";
var whitePlayer;
var blackPlayer;
var userSide;

var discordUsers;
var delay = 2000;

client.once("ready", () => {
    console.log("Replay Chess Bot is online!");
    discordUsers = getDiscordUserData();
});

client.on("message", async function(message) {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);

    let startMove;
    let endMove;

    let name = message.author.username;

    let recognizedCommand = false;

    switch(args.length) {
        case 1:
            if (args[0] == "game") {
                recognizedCommand = true;
                startMove = 0;
            } else if (args[0] == "delay") {
                message.channel.send("Current delay is " + delay/1000 + " seconds");
                return;
            } else if (args[0] == "add") {
                message.channel.send("Please specify your chess.com username when using !add");
                return;
            }
            break;
        case 2:
            if (args[0] == "game") {
                recognizedCommand = true;
                if (isNaN(args[1])) {
                    message.channel.send("Please enter a valid start move!");
                    return;
                }
                startMove = args[1];
            } else if (args[0] == "add") {
                recognizedCommand = true;
                if (discordUsers.hasOwnProperty(name)) {
                    message.channel.send("I already have your username saved as " + discordUsers[name].username);
                    return;
                }
                discordUsers[name] = {username: args[1]};
                fs.writeFileSync("players.json", JSON.stringify(discordUsers));
                message.channel.send("I have saved your chess.com username.");
                return;
            } else if (args[0] == "delay") {
                recognizedCommand = true;
                if (isNaN(args[1])) {
                    message.channel.send("Please specifiy a delay!");
                    return;
                }
                delay = parseFloat(args[1]) * 1000;
                message.channel.send("Delay set to " + delay/1000 + " seconds");
                return;
            }
            break;
        case 3:
            if (isNaN(args[1]) || isNaN(args[2])) {
                message.channel.send("Please enter valid start and stop moves! Ex: !game 5 10");
                return;
            }
            recognizedCommand = true;
            startMove = args[1];
            endMove = args[2];
            break;
    }

    if (!recognizedCommand) {
        message.channel.send("Type !add <chess.com username> to add yourself to the bot.\n\n!game to view your most recent chess.com game\n!game # will replay the game starting from move #\n!game # # will replay the game from move # to move #\n\n!delay # will set the delay between frames.  Current delay is " + delay/1000 + " seconds");
        return;
    }

    if (!discordUsers.hasOwnProperty(name)) {
        message.channel.send("Please tell me your chess.com username by typing !add <chess.com username>");
        return;
    }
    let username = discordUsers[name].username;

    let encoder = new GIFEncoder(96*8, 96*8);

    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    encoder.setDelay(delay);
    encoder.start();

    let board = new Board();
    chess.reset();

    message.channel.send("Please wait a moment.");

    chessAPI.getPlayerCompleteMonthlyArchives(username, year, month).then(async function(response) {
        let numGames = response.body.games.length;
        whitePlayer = response.body.games[numGames-1].pgn.match(/\[White\s"(.*?)"\]/)[1];
        blackPlayer = response.body.games[numGames-1].pgn.match(/\[Black\s"(.*?)"\]/)[1];
        userSide = whitePlayer.toLowerCase() == username.toLowerCase() ? "white" : "black";
        console.log(whitePlayer, blackPlayer, userSide)
        let moves = response.body.games[numGames-1].pgn.split(/Link.*?]/)[1].replace(/{.*?\.\s/g, "").replace(/{.*/, "").slice(5).split(" ");
        startMove = Math.min(Math.max(parseInt(startMove), 1), moves.length/2);
        if (!endMove) {
            endMove = moves.length;
        } else {
            endMove = Math.min(Math.max(parseInt(endMove), 1), moves.length/2);   
        }
        playGame(board, moves, 0, startMove-1, endMove, message, encoder);
    }).catch(() => {
        message.channel.send("Unable to find a chess.com user with that name!");
        return;
    });
});

function playGame(board, moves, move, startMove, endMove, message, encoder) {
    if (move < startMove) {
        chess.move(moves[0]);
        moves = moves.slice(1);
        playGame(board, moves, move+0.5, startMove, endMove, message, encoder);
    } else if (moves.length > 0 && move <= endMove) {
        board.setPosition(chess.board(), userSide);
        board.updateCanvas().then(() => {
            encoder.addFrame(ctx);
            chess.move(moves[0]);
            moves = moves.slice(1);
            playGame(board, moves, move+0.5, startMove, endMove, message, encoder);
        });
    } else {
        encoder.finish();
        let buffer = encoder.out.getData();
        const attachment = new MessageAttachment(buffer, "image.gif");
        message.channel.send(`${whitePlayer} vs ${blackPlayer}`, attachment);
    }
}

function getDiscordUserData() {
    let playersData = fs.readFileSync("players.json");
    let players = JSON.parse(playersData);
    return players;
}