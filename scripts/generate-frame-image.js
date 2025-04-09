const { createCanvas } = require('canvas');
const fs = require('fs');

// Create a canvas
const canvas = createCanvas(1200, 630);
const ctx = canvas.getContext('2d');

// Set background
ctx.fillStyle = '#1a1a1a';
ctx.fillRect(0, 0, 1200, 630);

// Set text style
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 48px Arial';
ctx.textAlign = 'center';

// Draw title
ctx.fillText('COIN TOSS GAME', 600, 200);

// Draw instruction
ctx.font = '36px Arial';
ctx.fillText('Choose Heads or Tails', 600, 300);

// Draw buttons
ctx.fillStyle = '#4CAF50';
ctx.fillRect(400, 400, 200, 80);
ctx.fillRect(800, 400, 200, 80);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 32px Arial';
ctx.fillText('HEADS', 500, 450);
ctx.fillText('TAILS', 900, 450);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/coin-toss-frame.png', buffer);

console.log('Frame image generated successfully!'); 