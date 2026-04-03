// --- 1. SETUP & CONFIGURATION ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 15;
const CELL_SIZE = canvas.width / GRID_SIZE;

// Grid Types for Different Furniture
const EMPTY = 0;
const DIAS = 1;         // Judge's Dias
const WITNESS = 2;      // Witness Box
const JURY = 3;         // Jury Box
const PROSECUTION = 4;  // Prosecution Table
const DEFENSE = 5;      // Defense Table
const DOCK = 6;         // The Accused Cage / Dock
const SEATING = 7;      // Audience Seating

let grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY));

// Positions
let player = { r: 14, c: 0 };
let enemy = { r: 0, c: 14 };
let evidence = { r: 7, c: 7 };

// Game State
let playerScore = 0;
let aiScore = 0;
let currentMode = "PvA";
let p1Algo = "Manual";
let p2Algo = "A*";

let plannedPathP1 = [];
let plannedPathP2 = [];

// Colors & Designs
const PALETTE = {
    bg: "#FFFFFF",
    grid: "#F5F2EB",
    [DIAS]: { color: "#5C3D2E", text: "JUDGE", fontColor: "#FFFFFF" },
    [WITNESS]: { color: "#865439", text: "WITNESS", fontColor: "#FFFFFF" },
    [DOCK]: { color: "#475569", text: "DOCK", fontColor: "#FFFFFF" },
    [PROSECUTION]: { color: "#C0D8C0", text: "PROS.", fontColor: "#2C3639" },
    [DEFENSE]: { color: "#F5C6A5", text: "DEF.", fontColor: "#2C3639" },
    [JURY]: { color: "#A7D2CB", text: "JURY", fontColor: "#2C3639" },
    [SEATING]: { color: "#EAE3D2", text: "SEAT", fontColor: "#7A7A7A" }
};

const ICONS = {
    player: "👩‍💼",
    enemy: "👨‍💼",
    evidence: "📜"
};

// --- 2. THE BRAIN (ALGORITHMS) ---

function manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function isValid(r, c) {
    return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && grid[r][c] === EMPTY;
}

// 🧠 A* SEARCH (The Smart One: Snaps directly and optimally to target)
function runAStar(start, target) {
    let openSet = [{ r: start.r, c: start.c, g: 0, h: manhattan(start.r, start.c, target.r, target.c), f: 0, parent: null }];
    let closedSet = new Set();
    openSet[0].f = openSet[0].g + openSet[0].h;
    
    const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        let curr = openSet.shift();
        let key = `${curr.r},${curr.c}`;
        if (closedSet.has(key)) continue;
        closedSet.add(key);

        if (curr.r === target.r && curr.c === target.c) {
            let path = [];
            let temp = curr;
            while (temp.parent) { path.push({ r: temp.r, c: temp.c }); temp = temp.parent; }
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            let nr = curr.r + dr[i], nc = curr.c + dc[i];
            if (isValid(nr, nc) && !closedSet.has(`${nr},${nc}`)) {
                let g = curr.g + 1;
                let h = manhattan(nr, nc, target.r, target.c);
                openSet.push({ r: nr, c: nc, g: g, h: h, f: g + h, parent: curr });
            }
        }
    }
    return [];
}

// 🌊 BFS SEARCH (Modified to take a boxy, wide-turning detour)
function runBFS(start, target) {
    let queue = [{ r: start.r, c: start.c, parent: null }];
    let visited = new Set([`${start.r},${start.c}`]);
    
    // Forces boxy horizontal and vertical movements first
    const dr = [0, 0, 1, -1];
    const dc = [1, -1, 0, 0];

    while (queue.length > 0) {
        let curr = queue.shift();
        if (curr.r === target.r && curr.c === target.c) {
            let path = [];
            let temp = curr;
            while (temp.parent) { path.push({ r: temp.r, c: temp.c }); temp = temp.parent; }
            return path.reverse();
        }
        for (let i = 0; i < 4; i++) {
            let nr = curr.r + dr[i], nc = curr.c + dc[i];
            if (isValid(nr, nc) && !visited.has(`${nr},${nc}`)) {
                visited.add(`${nr},${nc}`);
                queue.push({ r: nr, c: nc, parent: curr });
            }
        }
    }
    return [];
}

// 🌀 DFS SEARCH (The Deep Diver: Wanders and takes the scenic route)
function runDFS(start, target) {
    let stack = [{ r: start.r, c: start.c, parent: null }];
    let visited = new Set([`${start.r},${start.c}`]);
    
    const dr = [-1, 1, 0, 0];
    const dc = [0, 0, -1, 1];

    while (stack.length > 0) {
        let curr = stack.pop(); 
        
        if (curr.r === target.r && curr.c === target.c) {
            let path = [];
            let temp = curr;
            while (temp.parent) { path.push({ r: temp.r, c: temp.c }); temp = temp.parent; }
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            let nr = curr.r + dr[i];
            let nc = curr.c + dc[i];
            
            if (isValid(nr, nc) && !visited.has(`${nr},${nc}`)) {
                visited.add(`${nr},${nc}`);
                stack.push({ r: nr, c: nc, parent: curr });
            }
        }
    }
    return [];
}

function getAiTarget() {
    let distPlayerToEvidence = manhattan(player.r, player.c, evidence.r, evidence.c);
    let distAiToEvidence = manhattan(enemy.r, enemy.c, evidence.r, evidence.c);
    if (currentMode === "PvA" && distPlayerToEvidence < distAiToEvidence) {
        return { r: player.r, c: player.c };
    }
    return { r: evidence.r, c: evidence.c };
}

function updatePaths() {
    let aiTarget = getAiTarget();
    
    // 🤖 Rival AI Pathing (P2)
    if (p2Algo === "A*") plannedPathP2 = runAStar(enemy, aiTarget);
    else if (p2Algo === "BFS") plannedPathP2 = runBFS(enemy, aiTarget);
    else if (p2Algo === "DFS") plannedPathP2 = runDFS(enemy, aiTarget);

    // 👩‍💼 Simulation Pathing (P1 in AI vs AI mode)
    if (currentMode === "AvA" && p1Algo !== "Manual") {
        if (p1Algo === "A*") plannedPathP1 = runAStar(player, evidence);
        else if (p1Algo === "BFS") plannedPathP1 = runBFS(player, evidence);
        else if (p1Algo === "DFS") plannedPathP1 = runDFS(player, evidence);
    } else {
        plannedPathP1 = [];
    }
}

// --- 3. GRAPHICS & RENDERING ---

function generateCourtroom() {
    grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(EMPTY));
    
    for (let i = 5; i <= 9; i++) grid[1][i] = DIAS; 
    grid[2][3] = WITNESS;
    grid[2][11] = DOCK; 
    for (let r = 4; r <= 8; r++) grid[r][1] = JURY;
    for (let c = 4; c <= 6; c++) grid[6][c] = PROSECUTION; 
    for (let c = 8; c <= 10; c++) grid[6][c] = DEFENSE; 
    for (let r = 11; r <= 12; r++) {
        for (let c = 1; c <= 5; c++) grid[r][c] = SEATING; 
        for (let c = 9; c <= 13; c++) grid[r][c] = SEATING; 
    }
    
    resetRound();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            ctx.strokeStyle = PALETTE.grid;
            ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            const cellType = grid[r][c];
            if (cellType !== EMPTY) {
                ctx.fillStyle = PALETTE[cellType].color;
                ctx.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                
                ctx.fillStyle = PALETTE[cellType].fontColor;
                ctx.font = "bold 9px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(PALETTE[cellType].text, c * CELL_SIZE + CELL_SIZE/2, r * CELL_SIZE + CELL_SIZE/2);
            }
        }
    }

    // Draw Paths
    ctx.fillStyle = "rgba(122, 139, 130, 0.3)";
    plannedPathP1.forEach(p => ctx.fillRect(p.c * CELL_SIZE, p.r * CELL_SIZE, CELL_SIZE, CELL_SIZE));

    ctx.fillStyle = "rgba(231, 97, 97, 0.3)";
    plannedPathP2.forEach(p => ctx.fillRect(p.c * CELL_SIZE, p.r * CELL_SIZE, CELL_SIZE, CELL_SIZE));

    // Draw Characters
    ctx.font = "30px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(ICONS.evidence, evidence.c * CELL_SIZE + CELL_SIZE/2, evidence.r * CELL_SIZE + CELL_SIZE/2);
    ctx.fillText(ICONS.player, player.c * CELL_SIZE + CELL_SIZE/2, player.r * CELL_SIZE + CELL_SIZE/2);
    ctx.fillText(ICONS.enemy, enemy.c * CELL_SIZE + CELL_SIZE/2, enemy.r * CELL_SIZE + CELL_SIZE/2);
}

// --- 4. GAME CONTROLS ---

function resetRound() {
    player = { r: 14, c: 0 };
    enemy = { r: 0, c: 14 };
    
    const safeSpots = [
        {r: 4, c: 4}, {r: 4, c: 10},
        {r: 5, c: 5}, {r: 5, c: 9},
        {r: 8, c: 3}, {r: 8, c: 11},
        {r: 10, c: 4}, {r: 10, c: 10}
    ];

    const randomChoice = safeSpots[Math.floor(Math.random() * safeSpots.length)];
    evidence.r = randomChoice.r;
    evidence.c = randomChoice.c;
    
    updatePaths();
}

function checkWin() {
    if (player.r === evidence.r && player.c === evidence.c) {
        playerScore++;
        document.getElementById('pScore').innerText = playerScore;
        resetRound();
    } else if (enemy.r === evidence.r && enemy.c === evidence.c) {
        aiScore++;
        document.getElementById('aScore').innerText = aiScore;
        resetRound();
    }
}

// 🕹️ KEYBOARD CONTROLS (Player vs AI)
// 🕹️ KEYBOARD CONTROLS (Player vs AI)
window.addEventListener('keydown', (e) => {
    if (currentMode !== "PvA" || p1Algo !== "Manual") return;

    let nr = player.r, nc = player.c;
    if (e.key === 'ArrowUp') nr--;
    if (e.key === 'ArrowDown') nr++;
    if (e.key === 'ArrowLeft') nc--;
    if (e.key === 'ArrowRight') nc++;

    // Only proceed if the player's intended move is onto an EMPTY floor tile
    if (isValid(nr, nc)) {
        player.r = nr; 
        player.c = nc;
        
        // RE-CALCULATE PATHS IMMEDIATELY SO THE AI KNOWS WHERE TO GO
        updatePaths(); 

        // Force the Rival AI to take its next step if a path exists
        if (plannedPathP2.length > 0) {
            enemy.r = plannedPathP2[0].r; 
            enemy.c = plannedPathP2[0].c;
        }
        
        checkWin(); 
        updatePaths(); // Recalculate one more time for the next render
        draw();
    }
});

// UI Event Listeners
document.getElementById('gameMode').addEventListener('change', (e) => { currentMode = e.target.value; resetRound(); draw(); });
document.getElementById('p1Algo').addEventListener('change', (e) => { p1Algo = e.target.value; updatePaths(); draw(); });
document.getElementById('p2Algo').addEventListener('change', (e) => { p2Algo = e.target.value; updatePaths(); draw(); });

// 🖱️ ACTION BUTTON (AI vs AI)
document.getElementById('actionBtn').addEventListener('click', () => {
    if (currentMode === "AvA") {
        if (plannedPathP1.length > 0) { 
            player.r = plannedPathP1[0].r; 
            player.c = plannedPathP1[0].c; 
        }
        if (plannedPathP2.length > 0) { 
            enemy.r = plannedPathP2[0].r; 
            enemy.c = plannedPathP2[0].c; 
        }
        checkWin(); 
        updatePaths(); 
        draw();
    }
});

generateCourtroom();
draw();