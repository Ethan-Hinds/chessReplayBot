const Piece = require("./Piece.js");
class Square {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.color = this.row % 2 != this.col % 2 ? "#6e6e6e" : "#8f8f8f";
        this.size = 96;
        this.x = this.col * this.size;
        this.y = this.row * this.size;
        this.piece;
    }

    show() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        if (this.piece) {
            this.piece.show();
        }
    }
}

module.exports = Square;