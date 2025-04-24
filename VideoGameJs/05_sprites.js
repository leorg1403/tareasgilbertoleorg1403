/*
 * Simple animation on the HTML canvas
 *
 * Gilberto Echeverria
 * 2025-04-21
 */

"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 600;

// Context of the Canvas
let ctx;

// A variable to store the game object
let game;

// Variable to store the time at the previous frame
let oldTime;

let playerSpeed = 0.5;

// Definición de las teclas y sus direcciones correspondientes
const keyDirections = {
    w: "up",
    s: "down",
    a: "left",
    d: "right",
}

const playerMovement = {
    up: {
        axis: "y",
        direction: -1,
    },
    down: {
        axis: "y",
        direction: 1,
    },
    left: {
        axis: "x",
        direction: -1,
    },
    right: {
        axis: "x",
        direction: 1,
    },
    idle: {
        axis: "y",
        direction: 0,
    }
};

// Configuración de animaciones para cada dirección
const directionAnimations = {
    up: {
        row: 0,       // Primera fila para animación hacia arriba
        startFrame: 0,
        endFrame: 5,  // Asegurar que haya un rango válido de frames
        frameTime: 100
    },
    down: {
        row: 6,       // Fila para animación hacia abajo
        startFrame: 0,
        endFrame: 10,
        frameTime: 100
    },
    left: {
        row: 8,       // Fila para animación hacia la izquierda
        startFrame: 2, // Empezar desde el primer frame de la fila
        endFrame: 7,   // Asegurar que endFrame > startFrame
        frameTime: 100
    },
    right: {
        row: 3,       // Fila para animación hacia la derecha
        startFrame: 0,
        endFrame: 9,
        frameTime: 100
    },
    idle: {
        row: 4,       // Fila para animación de reposo
        startFrame: 0,
        endFrame: 3,
        frameTime: 150
    }
};

// Posiciones predefinidas para las monedas
const coinPositions = [
    new Vec(100, 100),
    new Vec(200, 150),
    new Vec(300, 200),
    new Vec(400, 250),
    new Vec(500, 300),
    new Vec(600, 350),
    new Vec(700, 200),
    new Vec(150, 400),
    new Vec(350, 500),
    new Vec(550, 100)
];

// Clase para las monedas
class Coin extends AnimatedObject {
    constructor(position) {
        // Configurar la moneda: 8 frames en 1 fila
        const sheetCols = 8;
        const sheetRows = 1;
        const spriteWidth = 32; // El ancho de cada frame (256/8 = 32)
        const spriteHeight = 32; // Alto del frame
        const width = 30; // Tamaño de render en el canvas
        const height = 30;
        
        super(position, width, height, "gold", "coin", sheetCols, sheetRows, spriteWidth, spriteHeight);
        
        // Configurar la animación automática (todos los frames, en bucle)
        this.setAnimation(0, 7, true, 100);
    }
    
    // Las monedas se animan solas, no necesitan más lógica específica
    update(deltaTime) {
        super.update(deltaTime);
    }
}

// Clase para el personaje Cuphead usando la sprite sheet proporcionada
class Cuphead extends AnimatedObject {
    constructor(position, width, height, color) {
        // Configuracion de la sprite sheet: 16 columnas y 9 filas aproximadamente
        const sheetCols = 16;
        const sheetRows = 9;
        const spriteWidth = 103.6;  // Ancho de cada frame
        const spriteHeight = 110.66; // Alto de cada frame
        
        super(position, width, height, color, "cuphead", sheetCols, sheetRows, spriteWidth, spriteHeight);
        this.velocity = new Vec(0, 0);
        this.keys = [];
        this.currentDirection = "idle";
        this.lastDirection = "down"; // Por defecto, mirando hacia abajo
        this.isMoving = false;
        
        // Configuramos la animacion por defecto (idle)
        this.setAnimationForDirection(this.currentDirection);
    }

    update(deltaTime) {
        // Añadir movimiento a Cuphead
        this.setVelocity();
        
        // Determinar la dirección actual basada en las teclas presionadas
        this.updateCurrentDirection();
        
        // Actualizar la posición
        this.position = this.position.plus(this.velocity.times(deltaTime));
        this.constrainToCanvas();
        
        // Utilizar el método de la clase padre para actualizar los frames
        // Solo actualizar la animación si está en movimiento
        if (this.isMoving) {
            // Llamar al método de la clase padre para actualizar el frame
            super.update(deltaTime);
        }
    }
    
    // Determina la dirección actual basada en las teclas presionadas
    updateCurrentDirection() {
        if (this.keys.length === 0) {
            // Si no hay teclas presionadas, usar la última dirección pero en estado idle
            if (this.isMoving) {
                this.isMoving = false;
                // Usar el último estado pero en modo idle
                // Ejemplo: si estaba moviéndose "up", ahora estará en idle mirando hacia "up"
                this.currentDirection = "idle";
                this.setAnimationForDirection(`idle_${this.lastDirection}`);
            }
        } else {
            // Obtener la última tecla presionada
            const newDirection = this.keys[this.keys.length - 1];
            
            // Solo cambiar la animación si la dirección ha cambiado
            if (this.currentDirection !== newDirection) {
                this.currentDirection = newDirection;
                this.lastDirection = newDirection; // Guardar la última dirección de movimiento
                this.isMoving = true;
                this.setAnimationForDirection(this.currentDirection);
            }
        }
    }
    
    // Establece la animación según la dirección actual
    setAnimationForDirection(direction) {
        // Verificar si es una dirección de idle con formato "idle_direction"
        let animation;
        
        if (direction.startsWith("idle_")) {
            // Extraer la dirección base (después de "idle_")
            const baseDirection = direction.substring(5);
            // Obtener la animación para esa dirección
            const baseAnimation = directionAnimations[baseDirection];
            
            // Si existe una animación idle específica, usarla
            if (directionAnimations[direction]) {
                animation = directionAnimations[direction];
            } 
            // Si no, usar una versión modificada de la animación base (primer frame estático)
            else if (baseAnimation) {
                animation = {
                    row: baseAnimation.row,
                    startFrame: baseAnimation.startFrame, // Usar solo el primer frame
                    endFrame: baseAnimation.startFrame,   // Mismo frame para mantenerlo estático
                    frameTime: baseAnimation.frameTime
                };
            }
        } else {
            // Para direcciones normales, usar la animación directamente
            animation = directionAnimations[direction];
        }
        
        if (animation) {
            console.log(`Cambiando animación a ${direction}: row=${animation.row}, frames=${animation.startFrame}-${animation.endFrame}`);
            this.changeAnimation(
                animation.row, 
                animation.startFrame, 
                animation.endFrame, 
                true,
                animation.frameTime
            );
        }
    }
    
    // Cambia la animacion basada en la fila de la sprite sheet
    changeAnimation(row, startFrame, endFrame, loop = true, frameTime = 100) {
        // Calcular los frames absolutos en la sprite sheet
        const minFrameAbsolute = row * this.sheetCols + startFrame;
        const maxFrameAbsolute = row * this.sheetCols + endFrame;
        
        // Imprimir información para debug
        console.log(`Configurando animación: minFrame=${minFrameAbsolute}, maxFrame=${maxFrameAbsolute}, frameTime=${frameTime}`);
        
        // Configurar la animación usando valores absolutos
        this.setAnimation(minFrameAbsolute, maxFrameAbsolute, loop, frameTime);
        
        // Asegurarse de que el frame actual esté dentro del rango
        this.currentFrame = minFrameAbsolute;
    }
    
    // Calcula la velocidad basada en las teclas presionadas
    setVelocity() {
        // Empezamos con velocidad cero
        this.velocity = new Vec(0, 0);
        
        // Por cada tecla sumamos la direccion correspondiente
        for (const key of this.keys) {
            const move = playerMovement[key];
            this.velocity[move.axis] += move.direction;
        }
        
        // Normalizamos para que la diagonal no sea mas rapida
        this.velocity = this.velocity.normalize().times(playerSpeed);
    }
    
    // Evita que el personaje se salga del canvas
    constrainToCanvas() {
        // Limites arriba y abajo
        if (this.position.y < 0) {
            this.position.y = 0;
        } else if (this.position.y + this.height > canvasHeight) {
            this.position.y = canvasHeight - this.height;
        } 
        
        // Limites izquierda y derecha
        if (this.position.x < 0) {
            this.position.x = 0;
        } else if (this.position.x + this.width > canvasWidth) {
            this.position.x = canvasWidth - this.width;
        }
    }
}

// Class to keep track of all the events and objects in the game
class Game {
    constructor() {
        this.createEventListeners();
        this.initObjects();
        this.collectedCoins = 0;
    }

    initObjects() {
        // Crear el personaje Cuphead
        this.cuphead = new Cuphead(new Vec(200, 200), 80, 80, "white");
        // Usar una imagen simple sin callbacks complejos
        this.cuphead.setSprite('CupHeaadSpriteSheet.png');
        
        // Inicializar el arreglo de actores (incluirá las monedas)
        this.actors = [];
        
        // Crear las 10 monedas en las posiciones predefinidas
        for (const position of coinPositions) {
            const coin = new Coin(position);
            coin.setSprite('coin_gold.png');
            this.actors.push(coin);
        }
    }

    draw(ctx) {
        // Dibujar todos los actores (monedas, etc.)
        for (let actor of this.actors) {
            actor.draw(ctx);
        }
        
        // Dibujar a Cuphead
        this.cuphead.draw(ctx);
        
        // Dibujar contador de monedas
        this.drawCoinCounter(ctx);
    }
    
    // Método para dibujar el contador de monedas
    drawCoinCounter(ctx) {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(`Monedas: ${this.collectedCoins}`, 20, 30);
    }

    update(deltaTime) {
        // Actualizar todos los actores
        for (let actor of this.actors) {
            actor.update(deltaTime);
        }
        
        // Actualizar a Cuphead
        this.cuphead.update(deltaTime);
        
        // Comprobar colisiones con las monedas
        this.checkCoinCollisions();
    }
    
    // Método para comprobar colisiones con las monedas
    checkCoinCollisions() {
        // Usar una copia del arreglo para poder modificarlo mientras iteramos
        const actorsCopy = [...this.actors];
        
        for (let actor of actorsCopy) {
            if (actor.type === "coin" && this.checkCollision(this.cuphead, actor)) {
                // Recolectar la moneda
                this.collectedCoins++;
                
                // Eliminar la moneda del arreglo de actores
                const index = this.actors.indexOf(actor);
                if (index !== -1) {
                    this.actors.splice(index, 1);
                }
            }
        }
    }
    
    // Método simple para comprobar colisión entre dos objetos (cajas delimitadoras)
    checkCollision(obj1, obj2) {
        return obj1.position.x < obj2.position.x + obj2.width &&
               obj1.position.x + obj1.width > obj2.position.x &&
               obj1.position.y < obj2.position.y + obj2.height &&
               obj1.position.y + obj1.height > obj2.position.y;
    }

    createEventListeners() {
        window.addEventListener('keydown', (event) => {
            if (Object.keys(keyDirections).includes(event.key)) {
                const direction = keyDirections[event.key];
                this.add_key(direction);
            }
        });

        window.addEventListener('keyup', (event) => {
            if (Object.keys(keyDirections).includes(event.key)) {
                const direction = keyDirections[event.key];
                this.del_key(direction);
            }
        });
    }

    add_key(direction) {
        if (!this.cuphead.keys.includes(direction)) {
            // Remover la dirección si ya existe para ponerla al final (prioridad)
            this.del_key(direction);
            this.cuphead.keys.push(direction);
            
            // Asegurarnos de que isMoving se establezca correctamente
            this.cuphead.isMoving = true;
        }
    }

    del_key(direction) {
        let index = this.cuphead.keys.indexOf(direction);
        if (index != -1) {
            this.cuphead.keys.splice(index, 1);
        }
    }
}


// Starting function that will be called from the HTML page
function main() {
    // Get a reference to the object with id 'canvas' in the page
    const canvas = document.getElementById('canvas');
    // Resize the element
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // Get the context for drawing in 2D
    ctx = canvas.getContext('2d');

    // Create the game object
    game = new Game();
    
    // Iniciar el bucle de juego
    requestAnimationFrame(drawScene);
}


// Main loop function to be called once per frame
function drawScene(newTime) {
    if (oldTime == undefined) {
        oldTime = newTime;
    }
    let deltaTime = (newTime - oldTime);

    // Clean the canvas so we can draw everything again
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    game.draw(ctx);
    game.update(deltaTime);

    oldTime = newTime;
    requestAnimationFrame(drawScene);
}
