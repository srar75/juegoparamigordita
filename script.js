// Variables globales del juego
let currentLevel = null;
let board = [];
let selectedCandy = null;
let score = 0;
let movesLeft = 0;
let objectives = {};
let gameActive = false;
let highestUnlockedLevel = 1;
let playerProgress = {};

// Colores disponibles para los caramelos
const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

// Elementos DOM
const mainMenu = document.getElementById('main-menu');
const levelSelect = document.getElementById('level-select');
const instructionsScreen = document.getElementById('instructions');
const gameScreen = document.getElementById('game-screen');
const victoryScreen = document.getElementById('victory-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const gameBoard = document.getElementById('game-board');
const currentLevelDisplay = document.getElementById('current-level');
const currentScoreDisplay = document.getElementById('current-score');
const movesLeftDisplay = document.getElementById('moves-left');
const objectivesContainer = document.getElementById('objectives-container');
const levelsContainer = document.getElementById('levels-container');
const finalScoreDisplay = document.getElementById('final-score');
const starsEarnedDisplay = document.getElementById('stars-earned');

// Navegación entre pantallas
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('play-button').addEventListener('click', () => {
        showScreen(levelSelect);
        renderLevelSelect();
    });

    document.getElementById('instructions-button').addEventListener('click', () => {
        showScreen(instructionsScreen);
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        showScreen(mainMenu);
    });

    document.getElementById('back-from-instructions').addEventListener('click', () => {
        showScreen(mainMenu);
    });

    document.getElementById('back-from-game').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres salir? Perderás tu progreso en este nivel.')) {
            gameActive = false;
            showScreen(levelSelect);
        }
    });

    document.getElementById('next-level-button').addEventListener('click', () => {
        const nextLevelId = currentLevel.id + 1;
        console.log("Siguiente nivel botón clickeado, intentando ir al nivel:", nextLevelId);
        
        if (nextLevelId <= LEVELS.length) {
            showScreen(gameScreen); // Aseguramos que se muestre la pantalla de juego
            startLevel(nextLevelId);
        } else {
            showScreen(levelSelect);
            renderLevelSelect();
        }
    });

    document.getElementById('level-select-button').addEventListener('click', () => {
        console.log("Botón de selección de niveles clickeado");
        showScreen(levelSelect);
        renderLevelSelect();
    });

    document.getElementById('retry-button').addEventListener('click', () => {
        startLevel(currentLevel.id);
    });

    document.getElementById('menu-button').addEventListener('click', () => {
        showScreen(mainMenu);
    });
});

// Función para mostrar una pantalla y ocultar las demás
function showScreen(screen) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

// Renderizar la selección de niveles
function renderLevelSelect() {
    levelsContainer.innerHTML = '';

    LEVELS.forEach(level => {
        const levelButton = document.createElement('div');
        levelButton.className = `level-button ${level.id > highestUnlockedLevel ? 'locked' : ''}`;
        
        const levelNumber = document.createElement('div');
        levelNumber.textContent = level.id;
        levelButton.appendChild(levelNumber);

        // Mostrar estrellas ganadas
        const starsContainer = document.createElement('div');
        starsContainer.className = 'level-stars';
        
        const starsEarned = playerProgress[level.id]?.stars || 0;
        
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = i < starsEarned ? 'star' : 'empty-star';
            star.textContent = '★';
            starsContainer.appendChild(star);
        }
        
        levelButton.appendChild(starsContainer);

        if (level.id <= highestUnlockedLevel) {
            levelButton.addEventListener('click', () => {
                startLevel(level.id);
            });
        }

        levelsContainer.appendChild(levelButton);
    });
}

// Iniciar un nivel
function startLevel(levelId) {
    currentLevel = LEVELS.find(level => level.id === levelId);
    gameActive = true;
    score = 0;
    movesLeft = currentLevel.moves;
    objectives = {...currentLevel.objectives};
    
    // Actualizar la interfaz
    currentLevelDisplay.textContent = currentLevel.id;
    currentScoreDisplay.textContent = score;
    movesLeftDisplay.textContent = movesLeft;
    
    // Mostrar objetivos
    renderObjectives();
    
    // Crear el tablero
    createBoard();
    
    // Mostrar la pantalla de juego
    showScreen(gameScreen);
}

// Renderizar los objetivos del nivel
function renderObjectives() {
    objectivesContainer.innerHTML = '';
    
    for (const [color, count] of Object.entries(objectives)) {
        const objective = document.createElement('div');
        objective.className = 'objective';
        
        const icon = document.createElement('div');
        icon.className = `objective-icon ${color}`;
        objective.appendChild(icon);
        
        const text = document.createElement('span');
        text.textContent = `${COLOR_NAMES[color]}: ${count}`;
        objective.appendChild(text);
        
        objectivesContainer.appendChild(objective);
    }
}

// Crear el tablero de juego
function createBoard() {
    board = [];
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${currentLevel.cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${currentLevel.rows}, 1fr)`;
    
    // Crear el tablero inicial con caramelos aleatorios
    for (let row = 0; row < currentLevel.rows; row++) {
        board[row] = [];
        for (let col = 0; col < currentLevel.cols; col++) {
            let color;
            // Evitar coincidencias iniciales de 3 o más
            do {
                color = getRandomColor();
            } while (
                (col >= 2 && board[row][col-1] === color && board[row][col-2] === color) ||
                (row >= 2 && board[row-1][col] === color && board[row-2][col] === color)
            );
            
            board[row][col] = color;
            createCandy(row, col, color);
        }
    }
    
    // Verificar si hay movimientos posibles, si no, regenerar el tablero
    if (!hasValidMoves()) {
        createBoard();
    }
}

// Crear un elemento caramelo en el DOM
function createCandy(row, col, color) {
    const candy = document.createElement('div');
    candy.className = `candy ${color}`;
    candy.dataset.row = row;
    candy.dataset.col = col;
    
    candy.addEventListener('click', () => {
        if (!gameActive) return;
        
        if (selectedCandy) {
            // Si ya hay un caramelo seleccionado, intentar intercambiar
            const selectedRow = parseInt(selectedCandy.dataset.row);
            const selectedCol = parseInt(selectedCandy.dataset.col);
            const newRow = parseInt(candy.dataset.row);
            const newCol = parseInt(candy.dataset.col);
            
            // Verificar si son adyacentes
            if (
                (Math.abs(selectedRow - newRow) === 1 && selectedCol === newCol) ||
                (Math.abs(selectedCol - newCol) === 1 && selectedRow === newRow)
            ) {
                // Intentar hacer el movimiento
                swapCandies(selectedRow, selectedCol, newRow, newCol);
            } else {
                // Si no son adyacentes, seleccionar el nuevo caramelo
                selectedCandy.classList.remove('selected');
                selectedCandy = candy;
                selectedCandy.classList.add('selected');
            }
        } else {
            // Seleccionar el primer caramelo
            selectedCandy = candy;
            selectedCandy.classList.add('selected');
        }
    });
    
    gameBoard.appendChild(candy);
}

// Obtener un color aleatorio
function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Intercambiar dos caramelos
function swapCandies(row1, col1, row2, col2) {
    // Intercambiar en el modelo de datos
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    // Verificar si el movimiento crea coincidencias
    if (checkMatches()) {
        // Descontar un movimiento
        movesLeft--;
        movesLeftDisplay.textContent = movesLeft;
        
        // Actualizar el tablero visualmente después de resolver todas las coincidencias
        updateBoardDisplay();
        
        // Verificar el estado del juego después de resolver las coincidencias
        setTimeout(() => {
            checkGameState();
        }, 1000);
    } else {
        // Si no hay coincidencias, revertir el intercambio
        const tempBack = board[row1][col1];
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = tempBack;
        
        // Efecto visual de error
        flashError(row1, col1, row2, col2);
    }
    
    // Limpiar la selección
    selectedCandy.classList.remove('selected');
    selectedCandy = null;
}

// Verificar coincidencias en el tablero
function checkMatches() {
    let hasMatches = false;
    const matches = [];
    
    // Verificar coincidencias horizontales
    for (let row = 0; row < currentLevel.rows; row++) {
        let count = 1;
        let color = board[row][0];
        
        for (let col = 1; col < currentLevel.cols; col++) {
            if (board[row][col] === color) {
                count++;
            } else {
                if (count >= 3) {
                    // Registrar la coincidencia
                    for (let i = col - count; i < col; i++) {
                        matches.push({row, col: i});
                    }
                    hasMatches = true;
                }
                count = 1;
                color = board[row][col];
            }
        }
        
        // Verificar al final de la fila
        if (count >= 3) {
            for (let i = currentLevel.cols - count; i < currentLevel.cols; i++) {
                matches.push({row, col: i});
            }
            hasMatches = true;
        }
    }
    
    // Verificar coincidencias verticales
    for (let col = 0; col < currentLevel.cols; col++) {
        let count = 1;
        let color = board[0][col];
        
        for (let row = 1; row < currentLevel.rows; row++) {
            if (board[row][col] === color) {
                count++;
            } else {
                if (count >= 3) {
                    // Registrar la coincidencia
                    for (let i = row - count; i < row; i++) {
                        matches.push({row: i, col});
                    }
                    hasMatches = true;
                }
                count = 1;
                color = board[row][col];
            }
        }
        
        // Verificar al final de la columna
        if (count >= 3) {
            for (let i = currentLevel.rows - count; i < currentLevel.rows; i++) {
                matches.push({row: i, col});
            }
            hasMatches = true;
        }
    }
    
    // Si hay coincidencias, procesarlas
    if (hasMatches) {
        processMatches(matches);
    }
    
    return hasMatches;
}

// Procesar las coincidencias encontradas
function processMatches(matches) {
    // Eliminar duplicados
    const uniqueMatches = [];
    const seen = new Set();
    
    matches.forEach(match => {
        const key = `${match.row},${match.col}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMatches.push(match);
            
            // Actualizar objetivos
            const color = board[match.row][match.col];
            if (objectives[color] && objectives[color] > 0) {
                objectives[color]--;
            }
            
            // Sumar puntos
            score += 10;
        }
    });
    
    // Actualizar la interfaz
    currentScoreDisplay.textContent = score;
    renderObjectives();
    
    // Eliminar los caramelos coincidentes
    uniqueMatches.forEach(match => {
        board[match.row][match.col] = null;
    });
    
    // Hacer caer los caramelos
    moveCandiesDown();
    
    // Rellenar espacios vacíos
    fillEmptySpaces();
    
    // Verificar si hay nuevas coincidencias (reacción en cadena)
    setTimeout(() => {
        if (checkMatches()) {
            // Si hay nuevas coincidencias, no se descuenta movimiento adicional
        }
    }, 500);
}

// Mover los caramelos hacia abajo después de eliminar coincidencias
function moveCandiesDown() {
    for (let col = 0; col < currentLevel.cols; col++) {
        let emptySpaces = 0;
        
        // Contar espacios vacíos y mover caramelos hacia abajo
        for (let row = currentLevel.rows - 1; row >= 0; row--) {
            if (board[row][col] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                // Mover el caramelo hacia abajo
                board[row + emptySpaces][col] = board[row][col];
                board[row][col] = null;
            }
        }
    }
}

// Rellenar espacios vacíos con nuevos caramelos
function fillEmptySpaces() {
    for (let col = 0; col < currentLevel.cols; col++) {
        for (let row = 0; row < currentLevel.rows; row++) {
            if (board[row][col] === null) {
                board[row][col] = getRandomColor();
            }
        }
    }
}

// Actualizar la visualización del tablero
function updateBoardDisplay() {
    // Limpiar el tablero actual
    gameBoard.innerHTML = '';
    
    // Recrear todos los caramelos
    for (let row = 0; row < currentLevel.rows; row++) {
        for (let col = 0; col < currentLevel.cols; col++) {
            createCandy(row, col, board[row][col]);
        }
    }
}

// Verificar si hay movimientos válidos en el tablero
function hasValidMoves() {
    // Verificar horizontalmente
    for (let row = 0; row < currentLevel.rows; row++) {
        for (let col = 0; col < currentLevel.cols - 1; col++) {
            // Intercambiar temporalmente
            const temp = board[row][col];
            board[row][col] = board[row][col + 1];
            board[row][col + 1] = temp;
            
            // Verificar si crea coincidencias
            const hasMatch = checkPotentialMatches();
            
            // Revertir el intercambio
            board[row][col + 1] = board[row][col];
            board[row][col] = temp;
            
            if (hasMatch) return true;
        }
    }
    
    // Verificar verticalmente
    for (let row = 0; row < currentLevel.rows - 1; row++) {
        for (let col = 0; col < currentLevel.cols; col++) {
            // Intercambiar temporalmente
            const temp = board[row][col];
            board[row][col] = board[row + 1][col];
            board[row + 1][col] = temp;
            
            // Verificar si crea coincidencias
            const hasMatch = checkPotentialMatches();
            
            // Revertir el intercambio
            board[row + 1][col] = board[row][col];
            board[row][col] = temp;
            
            if (hasMatch) return true;
        }
    }
    
    return false;
}

// Verificar posibles coincidencias sin procesarlas
function checkPotentialMatches() {
    // Verificar horizontalmente
    for (let row = 0; row < currentLevel.rows; row++) {
        for (let col = 0; col < currentLevel.cols - 2; col++) {
            if (
                board[row][col] !== null &&
                board[row][col] === board[row][col + 1] &&
                board[row][col] === board[row][col + 2]
            ) {
                return true;
            }
        }
    }
    
    // Verificar verticalmente
    for (let row = 0; row < currentLevel.rows - 2; row++) {
        for (let col = 0; col < currentLevel.cols; col++) {
            if (
                board[row][col] !== null &&
                board[row][col] === board[row + 1][col] &&
                board[row][col] === board[row + 2][col]
            ) {
                return true;
            }
        }
    }
    
    return false;
}

// Efecto visual de error cuando un movimiento no es válido
function flashError(row1, col1, row2, col2) {
    const candy1 = document.querySelector(`.candy[data-row="${row1}"][data-col="${col1}"]`);
    const candy2 = document.querySelector(`.candy[data-row="${row2}"][data-col="${col2}"]`);
    
    candy1.style.backgroundColor = '#ff5252';
    candy2.style.backgroundColor = '#ff5252';
    
    setTimeout(() => {
        candy1.style.backgroundColor = '';
        candy2.style.backgroundColor = '';
    }, 300);
}

// Verificar el estado del juego después de cada movimiento
function checkGameState() {
    // Verificar si se han completado todos los objetivos
    const allObjectivesComplete = Object.values(objectives).every(count => count <= 0);
    
    // Verificar si se ha quedado sin movimientos
    if (movesLeft <= 0) {
        if (allObjectivesComplete) {
            // Victoria - completó los objetivos
            levelComplete();
        } else {
            // Derrota - se quedó sin movimientos
            gameOver();
        }
    } else if (allObjectivesComplete) {
        // Victoria anticipada - completó los objetivos antes de quedarse sin movimientos
        levelComplete();
    }
}

// Completar un nivel con éxito
function levelComplete() {
    gameActive = false;
    
    // Calcular las estrellas ganadas (1-3)
    const movesRatio = movesLeft / currentLevel.moves;
    const scoreRatio = score / currentLevel.scoreTarget;
    
    let stars = 1; // Mínimo una estrella por completar
    
    if (scoreRatio >= 1.5 || movesRatio >= 0.4) {
        stars++;
    }
    
    if (scoreRatio >= 2 || movesRatio >= 0.7) {
        stars++;
    }
    
    // Guardar el progreso
    playerProgress[currentLevel.id] = {
        completed: true,
        score: score,
        stars: stars
    };
    
    // Desbloquear el siguiente nivel
    if (currentLevel.id === highestUnlockedLevel) {
        highestUnlockedLevel++;
    }
    
    // Mostrar mensaje de amor
    const messageIndex = (currentLevel.id - 1) % LOVE_MESSAGES.length;
    document.getElementById('love-message').textContent = LOVE_MESSAGES[messageIndex];
    
    // Mostrar la pantalla de victoria
    finalScoreDisplay.textContent = score;
    starsEarnedDisplay.textContent = stars;
    showScreen(victoryScreen);
    
    // Guardar el progreso inmediatamente después de completar un nivel
    saveProgress();
    
    console.log("Nivel completado:", currentLevel.id, "Siguiente nivel desbloqueado:", highestUnlockedLevel);
}

// Fin del juego (derrota)
function gameOver() {
    gameActive = false;
    showScreen(gameOverScreen);
}

// Inicializar el juego
function initGame() {
    // Cargar progreso guardado (si existe)
    const savedProgress = localStorage.getItem('candyMatchProgress');
    if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        playerProgress = parsed.playerProgress || {};
        highestUnlockedLevel = parsed.highestUnlockedLevel || 1;
    }
    
    // Mostrar la pantalla principal
    showScreen(mainMenu);
}

// Guardar progreso
function saveProgress() {
    const gameData = {
        playerProgress: playerProgress,
        highestUnlockedLevel: highestUnlockedLevel
    };
    
    localStorage.setItem('candyMatchProgress', JSON.stringify(gameData));
}

// Guardar progreso automáticamente cada 30 segundos
setInterval(saveProgress, 30000);

// Guardar al cerrar la ventana
window.addEventListener('beforeunload', saveProgress);

// Iniciar el juego
initGame(); 
