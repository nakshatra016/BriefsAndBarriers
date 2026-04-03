# ⚖️ Briefs & Barriers

**Briefs & Barriers** is an interactive, grid-based pathfinding game set in a high-stakes supreme courtroom. Play as a Paralegal racing against a Rival Clerk to fetch crucial case evidence (The Briefs) before they do! 

The game acts as a visual learning tool for classic Computer Science graph traversal algorithms, demonstrating how different search strategies operate in real-time within a maze-like environment.

---

## ✨ Features

* **🧠 Advanced Intercept AI:** The rival clerk doesn't just blindly trace paths. If the game detects you are winning the race to the evidence, the AI dynamically switches targets to hunt you down and cut you off!
* **🎨 Cozy Aesthetic:** Swapped standard harsh colors for a warm, minimalist courtroom palette with large, readable character emojis.
* **🏛️ Authentic Courtroom Layout:** Navigating through procedural obstacles designed to look like the Judge's Dias, Jury Box, Witness Stand, and Defense/Prosecution tables.
* **🎮 Dual Game Modes:**
  * **Player vs AI:** Race against the clock using your keyboard arrow keys.
  * **AI vs AI Simulation:** Pick an algorithm for both entities and watch them race to see which pathing logic is more efficient.

---

## 🕹️ Algorithms Featured

The project visually contrasts three heavy-hitting pathfinding approaches:

| Algorithm | Type | Behavior in Game |
| :--- | :--- | :--- |
| **BFS** | Uninformed | Floods the grid level-by-level. Guaranteed to find the shortest path but explores heavily. |
| **DFS** | Uninformed | Dives deep into paths. Can end up taking wildly winding, non-optimal routes. |
| **A\*** | Informed | Uses a Manhattan distance heuristic to calculate grid costs. Snaps straight to the target efficiently. |

---

## 🛠️ Tech Stack

* **Frontend:** HTML5 Canvas (Game Grid)
* **Styling:** CSS3 & Tailwind CSS (Dashboard UI)
* **Logic:** Pure Vanilla JavaScript (ES6)

*No frameworks or installations required. This project runs locally by clicking the index file!*

---

## 🚀 How to Play Locally

1. Clone or download this repository to your local machine.
2. Navigate to the project directory.
3. Double-click the `index.html` file to launch the game instantly in your default web browser.
4. Use your **Arrow Keys** to move if you are playing in "Manual" mode!
