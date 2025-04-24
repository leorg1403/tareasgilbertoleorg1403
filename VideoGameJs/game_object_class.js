/*
 * Base class for game objects in general
 *
 * Gilberto Echeverria
 * 2025-04-07
 */

class GameObject {
    constructor(position, width, height, color, type) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
    }

    draw(ctx) {
        if (this.spriteImage && this.spriteImage.complete && this.spriteImage.naturalHeight !== 0) {
            // Solo dibujamos la imagen si está cargada completamente
            if (this.spriteRect) {
                ctx.drawImage(this.spriteImage,
                    this.spriteRect.x, this.spriteRect.y, 
                    this.spriteRect.width, this.spriteRect.height,
                    this.position.x, this.position.y, 
                    this.width, this.height);
            }
            else {
                ctx.drawImage(this.spriteImage, 
                this.position.x, this.position.y, 
                this.width, this.height);
            }
        }
        else {
            // Si la imagen no está cargada, dibujamos un rectángulo del color definido
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
        
        this.drawBoundingBox(ctx);
    }

    drawBoundingBox(ctx) {
        // Draw the bounding box of the sprite
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y,
                 this.width, this.height);
        ctx.stroke();
    }

    update(deltaTime) {
        // Método genérico de actualización
    }

    setSprite(imagePath, rect, onloadCallback) {
        this.spriteImage = new Image();
        
        // Añadir un evento de carga para la imagen
        this.spriteImage.onload = () => {
            console.log(`Imagen cargada exitosamente: ${imagePath}`);
            if (onloadCallback) onloadCallback();
        };
        
        this.spriteImage.onerror = () => {
            console.error(`Error al cargar la imagen: ${imagePath}`);
            // Intentar construir una URL alternativa
            const alternativePath = `../${imagePath}`;
            console.log(`Intentando ruta alternativa: ${alternativePath}`);
            
            // Intenta cargar desde una ruta alternativa
            const altImage = new Image();
            altImage.onload = () => {
                console.log(`Imagen cargada exitosamente desde ruta alternativa: ${alternativePath}`);
                this.spriteImage = altImage;
                if (onloadCallback) onloadCallback();
            };
            
            altImage.onerror = () => {
                console.error(`Error al cargar la imagen desde ruta alternativa: ${alternativePath}`);
                if (onloadCallback) onloadCallback(); // Llamar al callback incluso en error para no bloquear el juego
            };
            
            altImage.src = alternativePath;
        };
        
        this.spriteImage.src = imagePath;
        if (rect) {
            this.spriteRect = rect;
        }
    }
}


function boxOverlap(rect1, rect2) {
    return rect1.position.x < rect2.position.x + rect2.width &&
           rect1.position.x + rect1.width > rect2.position.x &&
           rect1.position.y < rect2.position.y + rect2.height &&
           rect1.position.y + rect1.height > rect2.position.y;
}

class AnimatedObject extends GameObject {
    constructor(position, width, height, color, type, sheetCols, sheetRows, spriteWidth, spriteHeight) {
        super(position, width, height, color, type);
        this.sheetCols = sheetCols;
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;   
        this.sheetRows = sheetRows;
        
        // Animation properties
        this.currentFrame = 0;
        this.minFrame = 0;
        this.maxFrame = sheetCols - 1;
        this.frameTime = 100; // Default time per frame in milliseconds
        this.lastFrameTime = 0;
        this.repeat = true;
    }

    setAnimation(minFrame, maxFrame, repeat = true, duration = 100) {
        this.minFrame = minFrame;
        this.maxFrame = maxFrame;
        this.currentFrame = minFrame;
        this.repeat = repeat;
        this.frameTime = duration;
        this.lastFrameTime = 0;
    }

    update_frame(deltaTime) {
        this.lastFrameTime += deltaTime;
        if (this.lastFrameTime >= this.frameTime) {
            if (this.repeat) {
                // Loop through frames if repeat is enabled
                this.currentFrame = (this.currentFrame >= this.maxFrame) ? 
                    this.minFrame : this.currentFrame + 1;
            } else {
                // Stop at the last frame if repeat is disabled
                this.currentFrame = Math.min(this.currentFrame + 1, this.maxFrame);
            }
            this.lastFrameTime = 0;
        }
    }

    draw(ctx) {
        if (this.spriteImage) {
            // Calculate the position in the sprite sheet based on current frame
            const row = Math.floor(this.currentFrame / this.sheetCols);
            const col = this.currentFrame % this.sheetCols;
            const sourceX = col * this.spriteWidth;
            const sourceY = row * this.spriteHeight;
            
            ctx.drawImage(this.spriteImage, 
                          sourceX, sourceY, 
                          this.spriteWidth, this.spriteHeight,
                          this.position.x, this.position.y, 
                          this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        }
        this.drawBoundingBox(ctx);
    }

    setSprite(imagePath, rect, onloadCallback) {
        // Use the parent class implementation instead of redefining
        super.setSprite(imagePath, rect, onloadCallback);
    }

    drawBoundingBox(ctx) {
        
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.rect(this.position.x, this.position.y,
                 this.width, this.height);
        ctx.stroke();
    }
    setFrameTime(frameTime) {
        this.frameTime = frameTime;
    }
    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
    }
    setSheetCols(sheetCols) {
        this.sheetCols = sheetCols;
    }
    setLastFrameTime(lastFrameTime) {
        this.lastFrameTime = lastFrameTime;
    }
    setPosition(position) {
        this.position = position;
    }
    setWidth(width) {
        this.width = width;
    }
    setHeight(height) {
        this.height = height;
    }
    update(deltaTime) {
        this.update_frame(deltaTime);
    }
}



