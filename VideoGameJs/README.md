# VideoGameJs

## Descripción del Juego
En este minijuego controlas a Cuphead mientras recoges monedas de oro esparcidas por el escenario. Este proyecto demuestra cómo crear un juego 2D sencillo usando un pequeño framework de JavaScript que incluye manejo de sprites animados y detección de colisiones.

## Cómo se Juega
- Usa las teclas **W, A, S, D** para mover a Cuphead en las cuatro direcciones
- Recoge todas las monedas de oro tocándolas
- ¡Intenta conseguir todas las monedas lo más rápido posible!

## Características del Juego
- **Animaciones fluidas**: Cuphead cambia su animación según la dirección en que se mueve
- **Física simple**: Movimiento uniforme con límites para no salir de la pantalla
- **Colecciones**: Sistema de recolección de objetos con contador de monedas
- **Sprites animados**: Tanto el personaje como las monedas tienen animaciones propias

## Cómo Funciona

### Componentes Principales
- **GameObject**: Clase base para todos los objetos del juego. Maneja la posición, dimensiones, color y renderizado básico de sprites.
- **AnimatedObject**: Extiende GameObject para permitir animaciones de sprites mediante hojas de sprites (spritesheets).
- **Detección de Colisiones**: Función `boxOverlap` para detectar colisiones entre objetos rectangulares.

### Sistema de Animación
El sistema permite:
- Cargar imágenes de spritesheets
- Definir animaciones con frames específicos
- Controlar la velocidad de reproducción
- Establecer si una animación debe repetirse o no

### Cómo Utilizarlo
1. Crear objetos extendiendo las clases base (`GameObject` o `AnimatedObject`)
2. Cargar sprites con el método `setSprite`
3. Para objetos animados, configurar las animaciones con `setAnimation`
4. Actualizar los objetos en cada ciclo de juego con `update`
5. Dibujar los objetos en el canvas con `draw`
