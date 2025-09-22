const fs = require('fs');
const { createCanvas } = require('canvas');

function drawWindBorneLogo(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#06b6d4');

    // Draw background circle
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw wind lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = size/24;
    ctx.lineCap = 'round';

    const centerX = size / 2;
    const y1 = size * 0.35;
    const y2 = size * 0.5;
    const y3 = size * 0.65;
    const startX = size * 0.25;
    const endX = size * 0.75;

    // Wind lines
    ctx.beginPath();
    ctx.moveTo(startX, y1);
    ctx.quadraticCurveTo(centerX, y1 - size*0.1, endX, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, y2);
    ctx.quadraticCurveTo(centerX, y2 - size*0.08, endX, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, y3);
    ctx.quadraticCurveTo(centerX, y3 - size*0.06, endX, y3);
    ctx.stroke();

    // Draw W
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size/8}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('W', centerX, size * 0.85);

    return canvas;
}

try {
    // Generate and save the icons
    const logo192 = drawWindBorneLogo(192);
    const logo512 = drawWindBorneLogo(512);

    fs.writeFileSync('./client/public/logo192.png', logo192.toBuffer('image/png'));
    fs.writeFileSync('./client/public/logo512.png', logo512.toBuffer('image/png'));

    console.log('Icons generated successfully!');
} catch (error) {
    console.log('Canvas module not available, using fallback method');
}