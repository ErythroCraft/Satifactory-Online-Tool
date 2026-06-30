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

// Zeichnet ein Förderband – färbt bei Fehlern nur den Kachel-Hintergrund rot ein
function drawBelt(ctx, m, tileSize, animOffset, machines) {
    // Globale Welt-Vektoren: 0=Rechts, 1=Unten, 2=Links, 3=Oben
    const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

    // 1. SCAN DER NACHBARN
    let hasInputFrom = [false, false, false, false];
    let totalInputs = 0;
    let hasFrontalCollision = false;

    for (let r = 0; r < 4; r++) {
        // **FIX:** Nutzen der neuen Achsen-Berechnung statt simpler Addition
        const nCoords = getNeighborCoords(m.x, m.y, dirs[r].x, dirs[r].y);
        const neighbor = machines.find(n => n.x === nCoords.x && n.y === nCoords.y);

        if (neighbor) {
            const oppositeRot = (r + 2) % 4;

            // Eingang prüfen: Zeigt der Nachbar in unsere Kachel?
            if (neighbor.rotation === oppositeRot) {
                hasInputFrom[r] = true;
                totalInputs++;
            }

            // Frontale Kollision prüfen (Gegenverkehr)
            if (r === m.rotation && neighbor.type === 'Belt' && neighbor.rotation === oppositeRot) {
                hasFrontalCollision = true;
            }
        }
    }

    // Relative Richtungen bestimmen (Aus Sicht des Bandes)
    const backRot = (m.rotation + 2) % 4;
    const leftRot = (m.rotation + 3) % 4;
    const rightRot = (m.rotation + 1) % 4;

    const inBack = hasInputFrom[backRot];
    const inLeft = hasInputFrom[leftRot];
    const inRight = hasInputFrom[rightRot];

    // Fehler-Bedingungen ermitteln
    const isInvalid = totalInputs > 1 || hasFrontalCollision || (totalInputs === 1 && !inBack && !inLeft && !inRight);

    ctx.save();

    // -----------------------------------------------------------------
    // **WARN-HINTERGRUND ZEICHNEN**
    // Wenn das Band illegal liegt, färben wir zuerst NUR den Kachel-Boden rot
    // -----------------------------------------------------------------
    if (isInvalid) {
        ctx.fillStyle = 'rgba(255, 76, 76, 0.25)'; // Sanftes, aber deutliches Warn-Rot im Hintergrund
        ctx.fillRect(-tileSize / 2 + 2, -tileSize / 2 + 2, tileSize - 4, tileSize - 4);

        ctx.strokeStyle = '#ff4c4c';
        ctx.lineWidth = 2;
        ctx.strokeRect(-tileSize / 2 + 2, -tileSize / 2 + 2, tileSize - 4, tileSize - 4);
    }
    // -----------------------------------------------------------------

    // Jetzt zeichnen wir die reguläre Band-Geometrie einfach DARÜBER
    ctx.fillStyle = m.color;
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 3;

    // REINE KURVE VON LINKS
    if (inLeft && !inRight && !inBack) {
        ctx.beginPath(); ctx.arc(-tileSize / 2, -tileSize / 2, tileSize / 2 + tileSize / 4, 0, Math.PI / 2);
        ctx.lineTo(-tileSize / 2, tileSize / 4); ctx.arc(-tileSize / 2, -tileSize / 2, tileSize / 2 - tileSize / 4, Math.PI / 2, 0, true);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#4a5568'; ctx.save(); ctx.translate(-tileSize / 6, tileSize / 6); ctx.rotate(Math.PI / 4);
        ctx.fillText('➔', 0, 0); ctx.restore();
    }
    // REINE KURVE VON RECHTS
    else if (inRight && !inLeft && !inBack) {
        ctx.beginPath(); ctx.arc(-tileSize / 2, tileSize / 2, tileSize / 2 + tileSize / 4, Math.PI * 1.5, 0);
        ctx.lineTo(tileSize / 4, tileSize / 2); ctx.arc(-tileSize / 2, tileSize / 2, tileSize / 2 - tileSize / 4, 0, Math.PI * 1.5, true);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#4a5568'; ctx.save(); ctx.translate(-tileSize / 6, -tileSize / 6); ctx.rotate(-Math.PI / 4);
        ctx.fillText('➔', 0, 0); ctx.restore();
    }
    // GERADE ODER START-PIECE (Auch wenn ungültig, zeichnen wir die Form zur Orientierung!)
    else {
        ctx.fillRect(-tileSize / 2, -tileSize / 4, tileSize, tileSize / 2);
        ctx.beginPath();
        ctx.moveTo(-tileSize / 2, -tileSize / 4); ctx.lineTo(tileSize / 2, -tileSize / 4);
        ctx.moveTo(-tileSize / 2, tileSize / 4); ctx.lineTo(tileSize / 2, tileSize / 4);
        ctx.stroke();

        // Animierte Pfeile durchlaufen lassen
        drawArrow(ctx, -tileSize / 4, 0, animOffset, tileSize);
        drawArrow(ctx, tileSize / 4, 0, animOffset, tileSize);
    }

    ctx.restore();
}

function drawArrow(ctx, x, y, animOffset, tileSize) {
    ctx.fillStyle = '#4a5568'; ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let scrollX = x + (animOffset % (tileSize / 2)) - (tileSize / 4);
    if (scrollX > -tileSize / 2 && scrollX < tileSize / 2) {
        ctx.fillText('➔', scrollX, y);
    }
}
