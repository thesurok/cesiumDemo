const fs = require('node:fs');
const path = require('node:path');

const token = process.env.CESIUM_ION_TOKEN ?? '';
if (!token.trim()) {
  console.error('CESIUM_ION_TOKEN is empty. Refusing to build without an Ion token.');
  process.exit(1);
}

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
const contents = `export const environment = {\n    cesiumIonToken: ${JSON.stringify(token)}\n};\n`;
fs.writeFileSync(target, contents);
console.log('Wrote production environment file.');
