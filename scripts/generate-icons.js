const fs = require('fs');
const path = require('path');

// Use sharp if available, otherwise fall back to a simple SVG->PNG via resvg-js or canvas
async function main() {
  let sharp;
  try { sharp = require('sharp'); } catch { }

  const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
  const svg = fs.readFileSync(svgPath);

  if (sharp) {
    for (const size of [192, 512]) {
      await sharp(svg).resize(size, size).png().toFile(
        path.join(__dirname, '..', 'public', `icon-${size}.png`)
      );
    }
    console.log('Icons generated with sharp');
  } else {
    // Fallback: create minimal valid PNGs using canvas-less approach
    // We'll just copy SVG approach - install sharp first
    console.log('sharp not found, installing...');
    require('child_process').execSync('npm install sharp --no-save', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    sharp = require('sharp');
    for (const size of [192, 512]) {
      await sharp(svg).resize(size, size).png().toFile(
        path.join(__dirname, '..', 'public', `icon-${size}.png`)
      );
    }
    console.log('Icons generated with sharp (after install)');
  }
}

main().catch(console.error);
