// Simple script to create basic WindBorne logos
const fs = require('fs');

// Create a simple SVG for favicon
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" fill="#4f46e5" stroke="#1e40af" stroke-width="1"/>
  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">W</text>
</svg>`;

// Write the SVG favicon
fs.writeFileSync('./client/public/favicon.svg', faviconSvg);

console.log('Simple WindBorne favicon created successfully!');
console.log('SVG favicon will be used by modern browsers.');
console.log('The existing PNG files remain for compatibility.');