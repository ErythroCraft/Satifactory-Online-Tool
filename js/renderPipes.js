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

// Zeichnet eine Pipeline im flüssigen shapez-Netzwerk-Stil (Kreuzungen, T-Stücke, Kurven)
function drawPipe(ctx, m, tileSize, animOffset, machines) {
    // Globale Himmelsrichtungen der Welt: 0=Rechts, 1=Unten, 2=Links, 3=Oben
    const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

    let connections = [false, false, false, false];

    for (let r = 0; r < 4; r++) {
        // **FIX:** Nutzen der neuen Achsen-Berechnung statt simpler Addition
        const nCoords = getNeighborCoords(m.x, m.y, dirs[r].x, dirs[r].y);
        const neighbor = machines.find(n => n.x === nCoords.x && n.y === nCoords.y);

        if (neighbor) {
            // Rohre verbinden sich mit Rohren oder Flüssigkeits-Gebäuden
            if (neighbor.type === 'Pipe' || neighbor.type === 'Refinery' || neighbor.type === 'WaterExtractor' || neighbor.type === 'Blender') {
                connections[r] = true;
            }
        }
    }

    ctx.save();
    // WICHTIG: Drehung aufheben, damit wir stabil im Welt-Koordinatensystem zeichnen!
    ctx.rotate(-(m.rotation * 90) * Math.PI / 180);

    const pipeWidth = tileSize / 4;

    // 1. Der zentrale Verteiler-Knoten in der Mitte
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(0, 0, pipeWidth * 1.1, 0, Math.PI * 2);
    ctx.fill();

    // 2. Zeichne die Rohrarme basierend auf den Welt-Verbindungen
    ctx.fillStyle = m.color;

    // Rechts / Osten (Index 0)
    if (connections[0] === true) {
        ctx.fillRect(0, -pipeWidth / 2, tileSize / 2, pipeWidth);
    }
    // Unten / Süden (Index 1)
    if (connections[1] === true) {
        ctx.fillRect(-pipeWidth / 2, 0, pipeWidth, tileSize / 2);
    }
    // Links / Westen (Index 2)
    if (connections[2] === true) {
        ctx.fillRect(-tileSize / 2, -pipeWidth / 2, tileSize / 2, pipeWidth);
    }
    // Oben / Norden (Index 3)
    if (connections[3] === true) {
        ctx.fillRect(-pipeWidth / 2, -tileSize / 2, pipeWidth, tileSize / 2);
    }

    // 3. Animierter Puls in der Mitte
    let pulse = Math.sin(animOffset * 0.1) * 1.5;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, (pipeWidth / 2) + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
