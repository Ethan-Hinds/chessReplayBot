const Square = require("./Square");
const Piece = require("./Piece.js");

module.exports = class Board {
    constructor() {
        this.squares = [];
        for (let r = 0; r < 8; r += 1) {
            this.squares.push([]);
            for (let c = 0; c < 8; c += 1) {
                this.squares[r].push(new Square(r, c));
            }
        }
    }

    async updateCanvas() {
        for (let r = 0; r < 8; r += 1) {
            for (let c = 0; c < 8; c += 1) {
                this.squares[r][c].show();
            }
        }
    }
    
    setPosition(squares, userSide) {
        for (let r = 0; r < 8; r += 1) {
            for (let c = 0; c < 8; c += 1) {
                let squareToClear = userSide == "white" ? this.squares[r][c] : this.squares[7-r][7-c];
                squareToClear.piece = undefined;
                let piece = squares[r][c];
                if (piece) {
                    let color = piece.color == "w" ? "white" : "black";
                    let type;
                    switch (piece.type) {
                        case "r":
                            type = "rook"; break;
                        case "n":
                            type = "knight"; break;
                        case "b":
                            type = "bishop"; break;
                        case "q":
                            type = "queen"; break;
                        case "k":
                            type = "king"; break;
                        case "p":
                            type = "pawn"; break;
                    }
                    let square = userSide == "white" ? this.squares[r][c] : this.squares[7-r][7-c];
                    square.piece = new Piece(type, color, square);
                }
            }
        }
    }
}