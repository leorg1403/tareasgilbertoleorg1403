/*
 * Simple vector class for 2D positions and calculations
 */

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }

    minus(other) {
        return new Vec(this.x - other.x, this.y - other.y);
    }

    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let len = this.length();
        if (len === 0) return new Vec(0, 0);
        return new Vec(this.x / len, this.y / len);
    }
}
