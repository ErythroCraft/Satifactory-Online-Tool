// Zeichnet Produktionsgebäude, Splitter und Fusionatoren (Merger)
function drawMachine(ctx, m, tileSize) {
    const padding = 4;
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.roundRect(-tileSize / 2 + padding, -tileSize / 2 + padding, tileSize - padding * 2, tileSize - padding * 2, 8);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(-tileSize / 2 + padding * 2, -tileSize / 2 + padding * 2, tileSize - padding * 4, tileSize - padding * 4, 6);
    ctx.fill();

    // --- INTEGRATION FÜR LOGISTIK-BLÖCKE ---
    if (m.type === 'Splitter') {
        // Ein Splitter teilt 1 Input (von hinten) auf 3 Outputs (vorne, links, rechts) auf
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#00ff00'; // Grüne Ausgangs-Pfeile
        ctx.fillText('▲', 0, -tileSize / 2 + 10);  // Vorne
        ctx.fillText('◀', -tileSize / 2 + 10, 0); // Links
        ctx.fillText('▶', tileSize / 2 - 10, 0);  // Rechts
        
        ctx.fillStyle = '#ff8c00'; // Oranger Eingangs-Pfeil
        ctx.fillText('▲', 0, tileSize / 2 - 10);  // Hinten (Eingang)
    } 
    else if (m.type === 'Merger') {
        // Ein Merger führt 3 Inputs (hinten, links, rechts) zu 1 Output (vorne) zusammen
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#00ff00'; // Grüner Ausgangs-Pfeil
        ctx.fillText('▲', 0, -tileSize / 2 + 10);  // Vorne
        
        ctx.fillStyle = '#ff8c00'; // Orange Eingangs-Pfeile
        ctx.fillText('▲', 0, tileSize / 2 - 10);  // Hinten
        ctx.fillText('▶', -tileSize / 2 + 10, 0); // Links
        ctx.fillText('◀', tileSize / 2 - 10, 0);  // Rechts
    } 
    else {
        // Standard-Produktionsgebäude (Schmelzer, Konstruktor, etc.)
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲', 0, -tileSize / 2 + 10);
    }

    // GEGENROTATION FÜR DIE SCHRIFT
    ctx.save();
    ctx.rotate(-(m.rotation * 90) * Math.PI / 180);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (m.recipe) {
        ctx.fillText(m.recipe, 0, -4);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(m.label, 0, 12);
    } else {
        ctx.fillText(m.label, 0, 0);
    }

    ctx.restore();
}
