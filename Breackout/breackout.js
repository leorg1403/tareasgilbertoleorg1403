"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 600;

// Variable to store the times for the frames
let oldTime;

// Global settings
const paddleVelocity = 1.0;
const speedIncrease = 1.01; // Reducir aún más el incremento de velocidad
const initialSpeed = 0.4;
const maxBallSpeed = 0.8; // Establecer una velocidad máxima global para la bola

// Context of the Canvas
let ctx;

// The game object
let game;

// Block class for breakout game
class Block extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "block");
        this.destroyed = false;
        this.indestructible = false; // Agregar propiedad para bloques indestructibles

        // Power-up properties
        this.hasPowerUp = Math.random() < 0.2; // 20% chance for power-up
        this.powerUpType = this.hasPowerUp ? this.getRandomPowerUp() : null;
    }

    getRandomPowerUp() {
        const powerUps = ["slowMotion", "expandPaddle", "multiball", "extraLife"];
        return powerUps[Math.floor(Math.random() * powerUps.length)];
    }
}

// Clase para manejar power-ups
class PowerUp extends GameObject {
    constructor(position, type) {
        let color;
        switch (type) {
            case "slowMotion": color = "lightblue"; break;
            case "expandPaddle": color = "green"; break;
            case "multiball": color = "orange"; break;
            case "extraLife": color = "red"; break;
            default: color = "white"; break;
        }
        
        super(position, 20, 20, color, "powerup");
        this.type = type;
        this.velocity = new Vec(0, 0.2); // Caída lenta
        this.collected = false; // Nuevo flag para efecto de recolección
        this.collectedTime = 0; // Para animar recogida
    }

    draw(ctx) {
        // Si fue recolectado, dibujar efecto de recolección
        if (this.collected) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 1 - (this.collectedTime / 300); // Desvanecerse
            const expandSize = 10 * (this.collectedTime / 300);
            
            ctx.beginPath();
            ctx.arc(
                this.position.x + this.width / 2,
                this.position.y + this.height / 2,
                this.width / 2 + expandSize,
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.globalAlpha = 1;
            return;
        }

        // Power-up normal
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2,
            this.width / 2,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Añadir brillo para mayor visibilidad
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.width / 3,
            this.position.y + this.height / 3,
            this.width / 6,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    update(deltaTime) {
        if (this.collected) {
            this.collectedTime += deltaTime;
            return;
        }
        
        this.position = this.position.plus(this.velocity.times(deltaTime));
    }
}

// Clases for the Breakout game
class Ball extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "ball");
        this.reset();
    }

    update(deltaTime) {
        if (this.inPlay) {
            // Update the position using velocity
            this.position = this.position.plus(this.velocity.times(deltaTime));

            // Aplicar límite de velocidad en cada actualización
            const currentSpeed = this.velocity.magnitude();
            if (currentSpeed > maxBallSpeed) {
                this.velocity = this.velocity.normalize().times(maxBallSpeed);
            }
        } else {
            // If not in play, position ball above the paddle
            this.position.x = game.paddle.position.x + game.paddle.width / 2 - this.width / 2;
            this.position.y = game.paddle.position.y - this.height - 2;
        }
    }

    initVelocity() {
        this.inPlay = true;
        // Launch upward at random angle
        let angle = Math.random() * (Math.PI / 3) - (Math.PI / 6); // -30 to 30 degrees
        this.velocity = new Vec(Math.sin(angle), -Math.cos(angle)).times(initialSpeed);
    }

    reset() {
        this.inPlay = false;
        this.velocity = new Vec(0, 0);
    }
}

class Paddle extends GameObject {
    constructor(position, width, height, color) {
        super(position, width, height, color, "paddle");
        this.velocity = new Vec(0.0, 0.0);
    }

    update(deltaTime) {
        this.position = this.position.plus(this.velocity.times(deltaTime));

        // Keep paddle within screen bounds
        if (this.position.x < 0) {
            this.position.x = 0;
        } else if (this.position.x + this.width > canvasWidth) {
            this.position.x = canvasWidth - this.width;
        }
    }
}

// Class that controls all the objects in the game
class Game {
    constructor(canvasWidth, canvasHeight) {
        // Game config
        this.rows = 5;
        this.cols = 10;
        this.blockWidth = 70;
        this.blockHeight = 25;
        this.blockPadding = 10;

        // Level system
        this.currentLevel = 1;
        this.maxLevels = 5;

        // Create the main ball
        this.ball = new Ball(new Vec(canvasWidth / 2, canvasHeight - 50), 15, 15, "white");

        // Array to store all balls (including the main one)
        this.balls = [this.ball];

        // Create the paddle
        this.paddle = new Paddle(new Vec(canvasWidth / 2 - 50, canvasHeight - 30), 100, 15, "blue");

        // Create blocks grid
        this.blocks = [];
        this.createBlocks();

        // Create boundaries
        this.leftWall = new GameObject(new Vec(0, 0), 10, canvasHeight, "gray", "wall");
        this.topWall = new GameObject(new Vec(0, 0), canvasWidth, 10, "gray", "wall");
        this.rightWall = new GameObject(new Vec(canvasWidth - 10, 0), 10, canvasHeight, "gray", "wall");

        // Game state variables
        this.blocksDestroyed = 0;
        this.totalBlocks = this.rows * this.cols;
        this.lives = 3;
        this.gameState = "playing"; // playing, gameOver, won

        // UI elements
        this.scoreLabel = new TextLabel(20, 30, "20px Arial", "white");
        this.livesLabel = new TextLabel(canvasWidth - 100, 30, "20px Arial", "white");
        this.messageLabel = new TextLabel(canvasWidth / 2 - 100, canvasHeight / 2, "40px Arial", "white");

        // Power-up system
        this.powerUps = [];
        this.activePowerUps = {};
        this.powerUpTimers = {};

        // Slow motion properties
        this.timeScale = 1.0;
        this.slowMotionFactor = 0.3; // 30% normal speed
        this.manualSlowMotion = false;

        // Variables para mensajes de power-up
        this.powerUpMessage = "";
        this.powerUpMessageTime = 0;

        this.createEventListeners();
    }

    createBlocks() {
        // Clear any existing blocks
        this.blocks = [];

        // Different level configurations
        switch (this.currentLevel) {
            case 1:
                this.createStandardGrid();
                break;
            case 2:
                this.createDiamondPattern();
                break;
            case 3:
                this.createSpaceInvaderPattern();
                break;
            case 4:
                this.createSpiral();
                break;
            case 5:
                this.createBossLevel();
                break;
            default:
                this.createStandardGrid();
        }

        this.totalBlocks = this.blocks.filter(block => block.type === "block" && !block.indestructible).length;
    }

    createStandardGrid() {
        const startX = (canvasWidth - (this.blockWidth * this.cols + this.blockPadding * (this.cols - 1))) / 2;
        const startY = 60;

        const colors = ["red", "orange", "yellow", "green", "blue"];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = startX + col * (this.blockWidth + this.blockPadding);
                const y = startY + row * (this.blockHeight + this.blockPadding);
                const color = colors[row % colors.length];

                this.blocks.push(new Block(new Vec(x, y), this.blockWidth, this.blockHeight, color));
            }
        }
    }

    createDiamondPattern() {
        const centerX = canvasWidth / 2 - this.blockWidth / 2;
        const startY = 50;
        const size = 7; // Diamond size (odd number works best)
        const colors = ["red", "orange", "yellow", "green", "blue"];

        for (let row = 0; row < size; row++) {
            const blocksInRow = row < size / 2 ? row * 2 + 1 : (size - row - 1) * 2 + 1;
            const startX = centerX - (blocksInRow * this.blockWidth + (blocksInRow - 1) * this.blockPadding) / 2 + this.blockWidth / 2;

            for (let col = 0; col < blocksInRow; col++) {
                const x = startX + col * (this.blockWidth + this.blockPadding);
                const y = startY + row * (this.blockHeight + this.blockPadding);
                const color = colors[row % colors.length];

                this.blocks.push(new Block(new Vec(x, y), this.blockWidth, this.blockHeight, color));
            }
        }
    }

    createSpaceInvaderPattern() {
        const startX = canvasWidth / 2 - 150;
        const startY = 50;
        const pattern = [
            "  XXX  ",
            " XXXXX ",
            "XX X XX",
            "XXXXXXX",
            "X XXXXX",
            "X X X  ",
            "   X   "
        ];

        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === 'X') {
                    const x = startX + col * (this.blockWidth + 2);
                    const y = startY + row * (this.blockHeight + 2);
                    const color = row < 2 ? "green" : (row < 5 ? "red" : "blue");

                    this.blocks.push(new Block(new Vec(x, y), this.blockWidth, this.blockHeight, color));
                }
            }
        }
    }

    createSpiral() {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 3;
        const colors = ["red", "orange", "yellow", "green", "blue"];
        
        const maxRadius = 150;
        const blockAngle = Math.PI / 12; // 15 grados
        const radiusIncrement = 15;
        
        // Crear bloques en espiral
        for (let radius = maxRadius; radius > 40; radius -= radiusIncrement) {
            const circumference = 2 * Math.PI * radius;
            const blocksInRing = Math.floor(circumference / (this.blockWidth * 1.2));
            const angleIncrement = (2 * Math.PI) / blocksInRing;
            
            for (let i = 0; i < blocksInRing; i++) {
                const angle = i * angleIncrement;
                const x = centerX + radius * Math.cos(angle) - this.blockWidth / 2;
                const y = centerY + radius * Math.sin(angle) - this.blockHeight / 2;
                const color = colors[Math.floor((radius / radiusIncrement) % colors.length)];
                
                this.blocks.push(new Block(new Vec(x, y), this.blockWidth, this.blockHeight, color));
            }
        }
    }

    createBossLevel() {
        // Crear un nivel con bloques que requieren múltiples golpes
        const startX = (canvasWidth - (this.blockWidth * 8 + this.blockPadding * 7)) / 2;
        const startY = 60;
        
        // Crear bloques principales (que requieren varios golpes)
        for (let col = 0; col < 8; col++) {
            const x = startX + col * (this.blockWidth + this.blockPadding);
            const y = startY;
            
            // Crear un bloque especial que ahora es indestructible
            const block = new Block(new Vec(x, y), this.blockWidth, this.blockHeight, "gold");
            block.indestructible = true; // Ahora permanece indestructible
            this.blocks.push(block);
        }
        
        // Crear bloques normales alrededor
        const colors = ["red", "orange", "yellow", "green", "blue"];
        for (let row = 1; row < 5; row++) {
            for (let col = 0; col < 8; col++) {
                // Saltarse algunos bloques para crear un patrón más interesante
                if ((row === 2 || row === 3) && (col === 3 || col === 4)) continue;
                
                const x = startX + col * (this.blockWidth + this.blockPadding);
                const y = startY + row * (this.blockHeight + this.blockPadding);
                const color = colors[(row + col) % colors.length];
                
                this.blocks.push(new Block(new Vec(x, y), this.blockWidth, this.blockHeight, color));
            }
        }
    }

    update(deltaTime) {
        // Apply time scale to deltaTime
        const scaledDeltaTime = deltaTime * this.timeScale;

        if (this.gameState !== "playing") {
            return;
        }

        // Update objects
        this.paddle.update(scaledDeltaTime);

        // Update all balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.update(scaledDeltaTime);

            // Ball-paddle collision for each ball
            if (ball.inPlay && boxOverlap(ball, this.paddle)) {
                // Calculate bounce angle based on where ball hit the paddle
                const hitPosition = (ball.position.x + ball.width / 2) - (this.paddle.position.x + this.paddle.width / 2);
                const normalizedHit = hitPosition / (this.paddle.width / 2);
                const angle = normalizedHit * (Math.PI / 3); // Max 60 degree angle

                const speed = ball.velocity.magnitude();
                ball.velocity.x = Math.sin(angle) * speed;
                ball.velocity.y = -Math.abs(Math.cos(angle) * speed);

                // Ensure ball is above paddle to prevent multiple collisions
                ball.position.y = this.paddle.position.y - ball.height;
            }

            // Ball-wall collisions
            if (boxOverlap(ball, this.leftWall) || boxOverlap(ball, this.rightWall)) {
                ball.velocity.x *= -1;
            }
            if (boxOverlap(ball, this.topWall)) {
                ball.velocity.y *= -1;
            }

            // Check if ball falls below screen
            if (ball.position.y > canvasHeight) {
                // Only lose life if this is the last ball
                if (this.balls.length === 1) {
                    this.lives--;

                    if (this.lives <= 0) {
                        this.gameState = "gameOver";
                    } else {
                        ball.reset();
                    }
                } else {
                    // Remove this ball from array
                    this.balls.splice(i, 1);
                }
                continue;
            }

            // Ball-block collisions
            let hitBlock = false;
            for (let j = 0; j < this.blocks.length; j++) {
                if (!this.blocks[j].destroyed && boxOverlap(ball, this.blocks[j])) {
                    // No destruir bloques indestructibles
                    if (this.blocks[j].indestructible) {
                        // Solo rebotar la bola
                        const ballCenter = ball.position.plus(new Vec(ball.width / 2, ball.height / 2));
                        const blockCenter = this.blocks[j].position.plus(new Vec(this.blocks[j].width / 2, this.blocks[j].height / 2));
                        const diff = ballCenter.minus(blockCenter);
                        
                        if (Math.abs(diff.x) > Math.abs(diff.y)) {
                            ball.velocity.x *= -1;
                        } else {
                            ball.velocity.y *= -1;
                        }
                    } else {
                        // Bloque normal
                        this.blocks[j].destroyed = true;
                        this.blocksDestroyed++;

                        // Drop power-up if block has one
                        if (this.blocks[j].hasPowerUp) {
                            const powerUpPosition = new Vec(
                                this.blocks[j].position.x + this.blocks[j].width / 2 - 10,
                                this.blocks[j].position.y + this.blocks[j].height / 2 - 10
                            );
                            this.powerUps.push(new PowerUp(powerUpPosition, this.blocks[j].powerUpType));
                        }

                        // Determine collision side for realistic bouncing
                        const ballCenter = ball.position.plus(new Vec(ball.width / 2, ball.height / 2));
                        const blockCenter = this.blocks[j].position.plus(new Vec(this.blocks[j].width / 2, this.blocks[j].height / 2));
                        const diff = ballCenter.minus(blockCenter);

                        // Horizontal collision is stronger
                        if (Math.abs(diff.x) > Math.abs(diff.y)) {
                            ball.velocity.x *= -1;
                        } else {
                            ball.velocity.y *= -1;
                        }

                        // Slightly increase speed with limit
                        ball.velocity = ball.velocity.times(speedIncrease);

                        // Aplicar límite de velocidad global
                        const currentSpeed = ball.velocity.magnitude();
                        if (currentSpeed > maxBallSpeed) {
                            ball.velocity = ball.velocity.normalize().times(maxBallSpeed);
                        }

                        // Check win condition
                        if (this.blocksDestroyed >= this.totalBlocks) {
                            this.gameState = "won";
                        }
                    }

                    hitBlock = true;
                    break; // Only handle one collision per ball per frame
                }
            }

            if (hitBlock) break; // Only process one collision per frame
        }

        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].update(scaledDeltaTime);

            // Si fue recolectado y terminó la animación, eliminar
            if (this.powerUps[i].collected && this.powerUps[i].collectedTime > 300) {
                this.powerUps.splice(i, 1);
                continue;
            }

            // No procesar colisiones si ya fue recolectado
            if (this.powerUps[i].collected) continue;

            // Check if power-up is caught
            if (boxOverlap(this.powerUps[i], this.paddle)) {
                // Marcar como recolectado para mostrar efecto
                this.powerUps[i].collected = true;
                // Aplicar efecto de power-up
                this.activatePowerUp(this.powerUps[i].type);
                
                continue;
            }

            // Remove if out of bounds
            if (this.powerUps[i].position.y > canvasHeight) {
                this.powerUps.splice(i, 1);
            }
        }

        // Update power-up timers
        this.updatePowerUpTimers(deltaTime);
    }

    activatePowerUp(type) {
        // Mostrar mensaje en pantalla de qué power-up se activó
        this.showPowerUpMessage(type);
        
        // Power-up duration in milliseconds
        const duration = 10000; // 10 seconds

        switch (type) {
            case "slowMotion":
                this.timeScale = this.slowMotionFactor;
                this.activePowerUps.slowMotion = true;
                break;

            case "expandPaddle":
                const originalWidth = this.paddle.width;
                this.paddle.width *= 1.5;
                // Centrar el paddle para que la expansión sea simétrica
                this.paddle.position.x -= (this.paddle.width - originalWidth) / 2;
                this.activePowerUps.expandPaddle = originalWidth;
                break;

            case "multiball":
                // Create 2 additional balls
                for (let i = 0; i < 2; i++) {
                    // Asegurarse de que hay al menos una bola para copiar sus propiedades
                    if (this.balls.length > 0) {
                        const ballToCopy = this.balls[0];
                        const newBall = new Ball(
                            new Vec(ballToCopy.position.x, ballToCopy.position.y),
                            ballToCopy.width,
                            ballToCopy.height,
                            ballToCopy.color
                        );

                        // Random angles for additional balls
                        const angle = Math.random() * Math.PI;
                        newBall.velocity = new Vec(
                            Math.sin(angle),
                            -Math.abs(Math.cos(angle))
                        ).times(initialSpeed * 1.2);

                        newBall.inPlay = true;
                        this.balls.push(newBall);
                    }
                }
                break;

            case "extraLife":
                this.lives++;
                // No timer needed for extra life
                return;
        }

        // Set timer
        this.powerUpTimers[type] = duration;
    }
    
    // Método para mostrar mensaje de power-up
    showPowerUpMessage(type) {
        let message = "";
        switch (type) {
            case "slowMotion": message = "SLOW MOTION!"; break;
            case "expandPaddle": message = "EXPANDED PADDLE!"; break;
            case "multiball": message = "MULTI BALL!"; break;
            case "extraLife": message = "EXTRA LIFE!"; break;
        }
        
        // Guardar mensaje y tiempo para mostrarlo
        this.powerUpMessage = message;
        this.powerUpMessageTime = 1500; // Mostrar por 1.5 segundos
    }
    
    updatePowerUpTimers(deltaTime) {
        // Actualizar temporizador de mensaje
        if (this.powerUpMessageTime > 0) {
            this.powerUpMessageTime -= deltaTime;
        }
        
        for (let powerUp in this.powerUpTimers) {
            this.powerUpTimers[powerUp] -= deltaTime;

            if (this.powerUpTimers[powerUp] <= 0) {
                this.deactivatePowerUp(powerUp);
                delete this.powerUpTimers[powerUp];
            }
        }
    }

    deactivatePowerUp(type) {
        switch (type) {
            case "slowMotion":
                this.timeScale = 1.0;
                this.activePowerUps.slowMotion = false;
                break;

            case "expandPaddle":
                this.paddle.width = this.activePowerUps.expandPaddle;
                delete this.activePowerUps.expandPaddle;
                break;

            case "multiball":
                // We don't remove extra balls, they're just allowed to go out
                break;
        }
    }

    draw(ctx) {
        // Clear screen with background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw walls
        this.leftWall.draw(ctx);
        this.topWall.draw(ctx);
        this.rightWall.draw(ctx);

        // Draw blocks
        for (const block of this.blocks) {
            if (!block.destroyed) {
                block.draw(ctx);
            }
        }

        // Draw paddle
        this.paddle.draw(ctx);

        // Draw all balls
        for (const ball of this.balls) {
            ball.draw(ctx);
        }

        // Draw power-ups
        for (const powerUp of this.powerUps) {
            powerUp.draw(ctx);
        }

        // Draw active power-up indicators
        let indicatorY = 50;
        for (let powerUp in this.activePowerUps) {
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";

            let text = "";
            switch (powerUp) {
                case "slowMotion": text = "SLOW MOTION"; break;
                case "expandPaddle": text = "EXPANDED PADDLE"; break;
                case "multiball": text = "MULTI BALL"; break;
            }

            if (text) {
                const timeLeft = Math.ceil(this.powerUpTimers[powerUp] / 1000);
                ctx.fillText(`${text} (${timeLeft}s)`, canvasWidth / 2 - 80, indicatorY);
                indicatorY += 25;
            }
        }

        // Draw UI
        this.scoreLabel.draw(ctx, `Blocks: ${this.blocksDestroyed}/${this.totalBlocks}`);
        this.livesLabel.draw(ctx, `Lives: ${this.lives}`);

        // Dibujar mensaje de power-up si está activo
        if (this.powerUpMessageTime > 0) {
            const alpha = Math.min(1, this.powerUpMessageTime / 300);
            ctx.globalAlpha = alpha;
            ctx.font = "bold 30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.powerUpMessage, canvasWidth / 2, canvasHeight / 2 - 100);
            ctx.globalAlpha = 1;
        }

        // Game state messages
        if (this.gameState === "gameOver") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            this.messageLabel.draw(ctx, "GAME OVER");
        } else if (this.gameState === "won") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            if (this.currentLevel >= this.maxLevels) {
                this.messageLabel.draw(ctx, "GAME COMPLETED!");
            } else {
                this.messageLabel.draw(ctx, `LEVEL ${this.currentLevel} COMPLETED!`);
                ctx.font = "20px Arial";
                ctx.fillStyle = "white";
                ctx.fillText("Press SPACE for next level", canvasWidth/2 - 120, canvasHeight/2 + 50);
            }
        }
    }

    reset() {
        if (this.gameState === "won" && this.currentLevel < this.maxLevels) {
            // Avanzar al siguiente nivel
            this.currentLevel++;
            
            // Mantener vidas entre niveles
            const currentLives = this.lives; 
            
            // Limpiar y recrear bloques para el nivel actual
            this.blocks = [];
            this.createBlocks();
            this.blocksDestroyed = 0;
            
            // Restablecer estado del juego pero mantener vidas
            this.gameState = "playing";
            this.lives = currentLives;
        } else {
            // Reiniciar desde el nivel 1 si perdió o completó todos los niveles
            this.currentLevel = 1;
            
            // Limpiar y recrear bloques para el nivel actual
            this.blocks = [];
            this.createBlocks();
            this.blocksDestroyed = 0;
            
            // Restablecer estado del juego
            this.lives = 3;
            this.gameState = "playing";
        }
        
        // Siempre resetear estas propiedades
        this.paddle.position.x = canvasWidth / 2 - this.paddle.width / 2;
        this.paddle.width = 100; // Restaurar tamaño original del paddle
        
        // Asegurarse de que siempre hay una bola principal
        if (!this.ball || !this.balls.includes(this.ball)) {
            this.ball = new Ball(new Vec(canvasWidth / 2, canvasHeight - 50), 15, 15, "white");
        }
        
        this.balls = [this.ball];
        this.ball.reset();
        
        // Limpiar power-ups
        this.powerUps = [];
        this.activePowerUps = {};
        this.powerUpTimers = {};
        this.timeScale = 1.0;
    }

    createEventListeners() {
        // Mouse movement controls paddle
        window.addEventListener('mousemove', (event) => {
            const canvasRect = document.getElementById('canvas').getBoundingClientRect();
            const mouseX = event.clientX - canvasRect.left;
            this.paddle.position.x = mouseX - this.paddle.width / 2;
        });

        window.addEventListener('keydown', (event) => {
            // Arrow keys for paddle movement
            if (event.key === "ArrowLeft") {
                this.paddle.velocity.x = -paddleVelocity;
            } else if (event.key === "ArrowRight") {
                this.paddle.velocity.x = paddleVelocity;
            }

            // Space to launch ball or restart/advance level
            if (event.key === " " || event.code === "Space") {
                if (this.gameState === "won") {
                    // Avanzar al siguiente nivel o reiniciar
                    this.reset();
                } else if (this.gameState === "gameOver") {
                    // Reiniciar el juego
                    this.reset();
                } else if (!this.ball.inPlay) {
                    this.ball.initVelocity();
                }
            }

            // Shift key for manual slow motion
            if (event.key === "Shift") {
                // Only activate if not already in slow motion
                if (!this.activePowerUps.slowMotion) {
                    this.manualSlowMotion = true;
                    this.timeScale = this.slowMotionFactor;
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                this.paddle.velocity.x = 0;
            }

            // Release shift to exit manual slow motion
            if (event.key === "Shift" && this.manualSlowMotion) {
                this.manualSlowMotion = false;
                // Only reset timeScale if no slowMotion power-up is active
                if (!this.activePowerUps.slowMotion) {
                    this.timeScale = 1.0;
                }
            }
        });
    }
}

function main() {
    // Get canvas and setup
    const canvas = document.getElementById('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');

    game = new Game(canvasWidth, canvasHeight);

    drawScene(0);
}

function drawScene(newTime) {
    if (oldTime == undefined) {
        oldTime = newTime;
    }
    let deltaTime = newTime - oldTime;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Update all game objects
    game.update(deltaTime);

    // Draw all game objects
    game.draw(ctx);

    // Update the time for the next frame
    oldTime = newTime;
    requestAnimationFrame(drawScene);
}