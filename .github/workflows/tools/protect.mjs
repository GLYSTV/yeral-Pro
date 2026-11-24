// Protege index.html antes de empaquetarlo en el APK:
// el HTML real se guarda cifrado (XOR con clave aleatoria por compilación + base64) y un cargador mínimo lo
// descifra en memoria al arrancar. Así, al abrir el APK como ZIP ya no se ve el código legible.
// Uso: node tools/protect.mjs www/index.html
import fs from 'node:fs';
import crypto from 'node:crypto';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('Uso: node tools/protect.mjs <index.html>'); process.exit(1); }

const html = fs.readFileSync(file);
if (html.includes('data-yeral-protected')) { console.log('Ya estaba protegido.'); process.exit(0); }

const key = crypto.randomBytes(48);
const out = Buffer.alloc(html.length);
for (let i = 0; i < html.length; i++) out[i] = html[i] ^ key[i % key.length];

const chunks = out.toString('base64').match(/.{1,4000}/g).map(c => JSON.stringify(c)).join(',\n');
const loader = `<!doctype html>
<html data-yeral-protected="1"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#06050f"><title>YERAL-Pro</title>
<style>html,body{margin:0;background:#06050f}</style></head><body>
<script>
(function(){
var D=[${chunks}].join(""),K=${JSON.stringify(key.toString('base64'))};
function b(s){var r=atob(s),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
var x=b(D),y=b(K);for(var i=0;i<x.length;i++)x[i]^=y[i%y.length];
var h=new TextDecoder("utf-8").decode(x);x=y=D=K=null;
document.open();document.write(h);document.close();
})();
</script></body></html>
`;
fs.writeFileSync(file, loader);
console.log(`Protegido: ${html.length} -> ${Buffer.byteLength(loader)} bytes`);
