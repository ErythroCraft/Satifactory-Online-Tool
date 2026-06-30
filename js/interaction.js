let isDraggingCamera = false;
let startX, startY;
let totalDragDistance = 0;

// Hilfsfunktion zur Koordinaten-Umrechnung (Pixel -> MATHE-GRID OHNE DIE NULL)
function getGridCoords(clientX, clientY) {
    let mouseGridX = clientX - (canvas.width / 2) - camX;
    let mouseGridY = clientY - (canvas.height / 2) - camY;

    mouseGridX /= zoom;
    mouseGridY /= zoom;

    let tileX = Math.floor(mouseGridX / tileSize);
    let tileY = -Math.floor(mouseGridY / tileSize) - 1;

    if (tileX >= 0) tileX += 1;
    if (tileY >= 0) tileY += 1;

    return { x: tileX, y: tileY };
}

// **NEU & CRITICAL:** Berechnet die exakte Nachbarkachel unter Überspringen der Null!
function getNeighborCoords(x, y, dx, dy) {
    let nextX = x + dx;
    let nextY = y + dy;

    // Wenn wir von -1 nach rechts gehen (+1), landen wir bei 1, nicht bei 0
    if (x === -1 && dx === 1) nextX = 1;
    // Wenn wir von 1 nach links gehen (-1), landen wir bei -1, nicht bei 0
    if (x === 1 && dx === -1) nextX = -1;

    // Das Gleiche für die Y-Achse
    if (y === -1 && dy === 1) nextY = 1;
    if (y === 1 && dy === -1) nextY = -1;

    return { x: nextX, y: nextY };
}

// --- BIDIREKTIONALE SMART-ROTATION BEIM PLATZIEREN ---
function applySmartRotation(placedItem) {
    const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

    if (placedItem.type === 'Belt') {
        for (let r = 0; r < 4; r++) {
            // **FIX:** Nutzen der neuen Achsen-Berechnung
            const nCoords = getNeighborCoords(placedItem.x, placedItem.y, dirs[r].x, dirs[r].y);
            const neighbor = machines.find(m => m.x === nCoords.x && m.y === nCoords.y);

            if (neighbor) {
                if (neighbor.type !== 'Belt') {
                    const machineOutputRot = neighbor.rotation;
                    const oppositeRot = (r + 2) % 4;
                    if (machineOutputRot === oppositeRot) return machineOutputRot;
                }
                else if (neighbor.type === 'Belt') {
                    const oppositeRot = (r + 2) % 4;
                    if (neighbor.rotation === oppositeRot) return neighbor.rotation;
                }
            }
        }
        return 0;
    }
    else {
        for (let r = 0; r < 4; r++) {
            // **FIX:** Nutzen der neuen Achsen-Berechnung
            const nCoords = getNeighborCoords(placedItem.x, placedItem.y, dirs[r].x, dirs[r].y);
            const neighbor = machines.find(m => m.type === 'Belt' && m.x === nCoords.x && m.y === nCoords.y);

            if (neighbor) {
                const incomingRotation = (r + 2) % 4;
                if (neighbor.rotation === incomingRotation) return neighbor.rotation;
                if (neighbor.rotation === r) return r;
            }
        }
        return 0;
    }
}

// --- DRAG & DROP AUS DER SIDEBAR (HTML5 API) ---
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('dragstart', (e) => {
        // Explizites Speichern im globalen Kontext
        globalThis.draggedSidebarElement = {
            type: e.currentTarget.getAttribute('data-type'),
            color: e.currentTarget.getAttribute('data-color'),
            label: e.currentTarget.getAttribute('data-label')
        };
    });
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    const coords = getGridCoords(e.clientX, e.clientY);
    selectedTile = { x: coords.x, y: coords.y };
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();

    // **FIX:** Hier muss ebenfalls globalThis genutzt werden!
    if (!globalThis.draggedSidebarElement) return;

    const coords = getGridCoords(e.clientX, e.clientY);

    // Altes Objekt auf Zielkachel überschreiben
    machines = machines.filter(m => !(m.x === coords.x && m.y === coords.y));

    let newItem = {
        x: coords.x,
        y: coords.y,
        type: globalThis.draggedSidebarElement.type,
        color: globalThis.draggedSidebarElement.color,
        label: globalThis.draggedSidebarElement.label,
        rotation: 0
    };

    if (newItem.type !== 'Pipe') {
        newItem.rotation = applySmartRotation(newItem);
    }

    machines.push(newItem);

    // **FIX:** Zurücksetzen im globalen Kontext
    globalThis.draggedSidebarElement = null;
});


// --- DYNAMISCHE RECHTSKLICK-OPTIONEN ---
const recipeDatabase = {
    Smelter: [
        { name: "Eisenbarren", icon: "🔩 Fe" },
        { name: "Kupferbarren", icon: "🔶 Cu" },
        { name: "Cateriumbarren", icon: "🟡 Ct" }
    ],
    Constructor: [
        { name: "Eisenplatten", icon: "🟦 Plt" },
        { name: "Eisenstangen", icon: "🥢 Stg" },
        { name: "Schrauben", icon: "⚙️ Sch" },
        { name: "Kupferdraht", icon: "🧵 Drh" },
        { name: "Kupferblech", icon: "🟨 Blc" }
    ],
    Miner: [
        { name: "Eisen-Erz", icon: "🪨 Fe-Erz" },
        { name: "Kupfer-Erz", icon: "🪨 Cu-Erz" },
        { name: "Kalkstein", icon: "🪨 Kalk" }
    ]
};

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const coords = getGridCoords(e.clientX, e.clientY);

    menuTargetTile = { x: coords.x, y: coords.y };
    selectedTile = { x: coords.x, y: coords.y };

    coordDisplay.innerText = `X: ${coords.x}, Y: ${coords.y}`;
    menuTileInfo.innerText = `Kachel: ${coords.x}, ${coords.y}`;

    const targetMachine = machines.find(m => m.x === coords.x && m.y === coords.y);
    const optionsContainer = document.getElementById('dynamic-menu-options');
    const recipeTrigger = document.getElementById('ctx-recipe-trigger');
    const rotateBtn = document.getElementById('ctx-rotate');
    const clearBtn = document.getElementById('ctx-clear');

    optionsContainer.innerHTML = "";

    if (targetMachine) {
        rotateBtn.style.display = 'block';
        clearBtn.style.display = 'block';

        if (recipeDatabase[targetMachine.type]) {
            recipeTrigger.style.display = 'block';

            recipeDatabase[targetMachine.type].forEach(recipe => {
                const recipeBtn = document.createElement('div');
                recipeBtn.className = 'menu-recipe-item';
                recipeBtn.innerText = recipe.name;
                recipeBtn.onclick = (event) => {
                    event.stopPropagation();
                    targetMachine.recipe = recipe.icon;
                    contextMenu.style.display = 'none';
                };
                optionsContainer.appendChild(recipeBtn);
            });
        } else {
            recipeTrigger.style.display = 'none';
        }
    } else {
        rotateBtn.style.display = 'none';
        clearBtn.style.display = 'none';
        recipeTrigger.style.display = 'none';

        const emptyNotice = document.createElement('div');
        emptyNotice.className = 'menu-item';
        emptyNotice.innerText = 'Leeres Feld';
        emptyNotice.style.color = '#718096';
        emptyNotice.style.pointerEvents = 'none';
        optionsContainer.appendChild(emptyNotice);
    }

    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.display = 'block';
});

document.getElementById('ctx-rotate').addEventListener('click', () => {
    if (!menuTargetTile) return;
    const target = machines.find(m => m.x === menuTargetTile.x && m.y === menuTargetTile.y);
    if (target) target.rotation = (target.rotation + 1) % 4;
    contextMenu.style.display = 'none';
});

document.getElementById('ctx-clear').addEventListener('click', () => {
    if (!menuTargetTile) return;
    machines = machines.filter(m => !(m.x === menuTargetTile.x && m.y === menuTargetTile.y));
    contextMenu.style.display = 'none';
});

// --- MAUS INTERAKTIONEN (KLICKEN & ZIEHEN) ---
window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#sidebar') || e.target.closest('#context-menu')) return;
    contextMenu.style.display = 'none';

    if (e.button === 0) {
        const coords = getGridCoords(e.clientX, e.clientY);
        const clickedMachine = machines.find(m => m.x === coords.x && m.y === coords.y);

        if (clickedMachine) {
            draggedMapMachine = clickedMachine;
        } else {
            isDraggingCamera = true;
            startX = e.clientX - camX;
            startY = e.clientY - camY;
        }
        totalDragDistance = 0;
    }
});

window.addEventListener('mousemove', (e) => {
    const coords = getGridCoords(e.clientX, e.clientY);

    selectedTile = { x: coords.x, y: coords.y };
    coordDisplay.innerText = `X: ${coords.x}, Y: ${coords.y}`;

    if (isDraggingCamera) {
        const nextX = e.clientX - startX;
        const nextY = e.clientY - startY;
        totalDragDistance += Math.abs(nextX - camX) + Math.abs(nextY - camY);
        camX = nextX;
        camY = nextY;
    }

    if (draggedMapMachine !== null) {
        totalDragDistance += 1;
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        isDraggingCamera = false;

        if (e.target.closest('#sidebar') || e.target.closest('#context-menu')) return;

        if (draggedMapMachine !== null) {
            const coords = getGridCoords(e.clientX, e.clientY);
            const isTileOccupied = machines.some(m => m.x === coords.x && m.y === coords.y && m !== draggedMapMachine);

            if (!isTileOccupied) {
                draggedMapMachine.x = coords.x;
                draggedMapMachine.y = coords.y;
                if (draggedMapMachine.type !== 'Pipe') {
                    draggedMapMachine.rotation = applySmartRotation(draggedMapMachine);
                }
            }
            draggedMapMachine = null;
        }
    }
});

window.addEventListener('keydown', (e) => {
    // Wenn kein Feld ausgewählt ist, tun wir nichts
    if (selectedTile === null) return;

    // 1. MANUELLES DREHEN MIT DER TASTE 'R'
    if (e.key.toLowerCase() === 'r') {
        const target = machines.find(m => m.x === selectedTile.x && m.y === selectedTile.y);
        if (target) {
            target.rotation = (target.rotation + 1) % 4;
        }
    }

    // 2. SCHNELLES LÖSCHEN MIT DER TASTE 'Entf' (Delete) ODER 'Backspace'
    if (e.key === 'Delete' || e.key === 'Backspace') {
        // Entfernt das Objekt auf dem ausgewählten Feld aus der Liste
        machines = machines.filter(m => !(m.x === selectedTile.x && m.y === selectedTile.y));

        // Schließt das Kontextmenü, falls es auf diesem Feld offen war
        contextMenu.style.display = 'none';
    }
});

// --- MAUSRAD-ZOOM ---
window.addEventListener('wheel', (e) => {
    // Wenn sich die Maus über der Sidebar befindet, Karten-Zoom blockieren
    if (e.target.closest('#sidebar')) return;

    e.preventDefault();
    contextMenu.style.display = 'none';

    const zoomFactor = 1.1;
    const mouseX = e.clientX - canvas.width / 2;
    const mouseY = e.clientY - canvas.height / 2;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const oldZoom = zoom;

    if (wheel > 0) zoom = Math.min(maxZoom, zoom * zoomFactor);
    if (wheel < 0) zoom = Math.max(minZoom, zoom / zoomFactor);

    // Kamera-Position anpassen, damit der Punkt unter der Maus stabil bleibt
    camX = mouseX - (mouseX - camX) * (zoom / oldZoom);
    camY = mouseY - (mouseY - camY) * (zoom / oldZoom);
}, { passive: false });

// --- SIDEBAR SEITEN-WECHSEL (LINKS / RECHTS HÄNDER) ---
document.getElementById('toggle-sidebar-side').addEventListener('click', () => {
    // Schaltet die CSS-Klasse 'sidebar-right' auf dem <body> Element an oder aus
    document.body.classList.toggle('sidebar-right');
});