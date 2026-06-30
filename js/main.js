const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const coordDisplay = document.getElementById('selected-coord');
const contextMenu = document.getElementById('context-menu');
const menuTileInfo = document.getElementById('menu-tile-info');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
globalThis.addEventListener('resize', resize);
resize();

// Kamera- und Gitter-Konfiguration
let camX = 0, camY = 0, zoom = 1;
const minZoom = 0.2, maxZoom = 3, tileSize = 64;

let selectedTile = null;
let menuTargetTile = null;
let draggedSidebarElement = null;
let draggedMapMachine = null;

// Start-Objekte in der Welt
let machines = [
    { x: 2, y: 1, type: 'Smelter', color: '#ff8c00', label: 'Fe', rotation: 0 },
    { x: 3, y: 1, type: 'Belt', color: '#2d3748', label: '➔', rotation: 0 },
    { x: 4, y: 1, type: 'Belt', color: '#2d3748', label: '➔', rotation: 0 },
    { x: 5, y: 1, type: 'Constructor', color: '#00bfff', label: 'Platt', rotation: 0 }
];

let animOffset = 0;

function draw() {
    animOffset = (animOffset + 0.5) % tileSize;

    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 + camX, canvas.height / 2 + camY);
    ctx.scale(zoom, zoom);

    const left = (-canvas.width / 2 - camX) / zoom;
    const right = (canvas.width / 2 - camX) / zoom;
    const top = (-canvas.height / 2 - camY) / zoom;
    const bottom = (canvas.height / 2 - camY) / zoom;

    const startGridX = Math.floor(left / tileSize);
    const endGridX = Math.ceil(right / tileSize);
    const startGridY = Math.floor(top / tileSize);
    const endGridY = Math.ceil(bottom / tileSize);

    // 1. Gitter zeichnen
    ctx.strokeStyle = '#1c2333'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = startGridX; x <= endGridX; x++) { ctx.moveTo(x * tileSize, top); ctx.lineTo(x * tileSize, bottom); }
    for (let y = startGridY; y <= endGridY; y++) { ctx.moveTo(left, y * tileSize); ctx.lineTo(right, y * tileSize); }
    ctx.stroke();

    ctx.strokeStyle = '#28334a'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(0, top); ctx.lineTo(0, bottom); ctx.moveTo(left, 0); ctx.lineTo(right, 0);
    ctx.stroke();

    // 2. Markiertes Feld zeichnen (Ohne die Null)
    if (selectedTile !== null) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

        let renderX = selectedTile.x;
        if (renderX > 0) renderX -= 1;
        const sx = renderX * tileSize;

        let renderY = selectedTile.y;
        if (renderY > 0) renderY -= 1;
        const sy = -renderY * tileSize - tileSize;

        ctx.fillRect(sx, sy, tileSize, tileSize);
        ctx.strokeRect(sx, sy, tileSize, tileSize);
    }


    // 3. DYNAMISCHES RENDERING DER NORMALEN ELEMENTE (OHNE DIE NULL)
    machines.forEach(m => {
        if (draggedMapMachine === m) return;

        // **KORREKTUR X-ZEICHNUNG:** Wenn X positiv ist, ziehen wir die übersprungene 0 ab
        let renderX = m.x;
        if (renderX > 0) renderX -= 1;
        const px = renderX * tileSize;

        // **KORREKTUR Y-ZEICHNUNG:** Wenn Y positiv ist, ziehen wir die übersprungene 0 ab
        let renderY = m.y;
        if (renderY > 0) renderY -= 1;
        const py = -renderY * tileSize - tileSize; // Gespiegeltes Y

        ctx.save();
        ctx.translate(px + tileSize / 2, py + tileSize / 2);
        ctx.rotate((m.rotation * 90) * Math.PI / 180);

        if (m.type === 'Belt') {
            drawBelt(ctx, m, tileSize, animOffset, machines);
        } else if (m.type === 'Pipe') {
            drawPipe(ctx, m, tileSize, animOffset, machines);
        } else {
            drawMachine(ctx, m, tileSize);
        }

        ctx.restore();
    });


    // 4. VORSCHAU-SCHATTEN ZEICHNEN (Wenn ein Objekt auf der Map verschoben wird)
    // Dieser Block steht ganz alleine NACH der Schleife, damit er nur 1x aufgerufen wird
    // 4. VORSCHAU-SCHATTEN ZEICHNEN (Ohne die Null)
    if (draggedMapMachine !== null && selectedTile !== null) {
        ctx.save(); ctx.globalAlpha = 0.5;

        let renderX = selectedTile.x;
        if (renderX > 0) renderX -= 1;
        const sx = renderX * tileSize;

        let renderY = selectedTile.y;
        if (renderY > 0) renderY -= 1;
        const sy = -renderY * tileSize - tileSize;

        ctx.translate(sx + tileSize / 2, sy + tileSize / 2);
        ctx.rotate((draggedMapMachine.rotation * 90) * Math.PI / 180);

        ctx.fillStyle = draggedMapMachine.color;
        ctx.fillRect(-tileSize / 2 + 4, -tileSize / 2 + 4, tileSize - 8, tileSize - 8);

        ctx.restore();
    }
    ctx.restore();
    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
