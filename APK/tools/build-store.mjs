#!/usr/bin/env node
/**
 * Gera os assets gráficos da ficha da Play Store em DEPLOY/store-assets/.
 *
 *  - feature-graphic.png (1024x500) — obrigatório na ficha
 *  - screenshots do celular, capturados do app real rodando
 *
 * Requer o build em `www/` (rode `npm run build` antes).
 * Uso: npm run store
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import sharp from 'sharp';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '../..');
const LOGO = path.join(RAIZ, 'PROJECT/assets/logo.png');
const FUNDO_CENA = path.join(RAIZ, 'PROJECT/assets/background-standard.png');
const SAIDA = path.join(RAIZ, 'DEPLOY/store-assets');
const WWW = path.join(__dirname, '../www');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORTA = 8912;

/** Feature graphic: cenário desfocado + logo centralizado. */
async function featureGraphic() {
  const fundo = await sharp(FUNDO_CENA)
    .resize(1024, 500, { fit: 'cover', position: 'centre' })
    .blur(8)
    .modulate({ brightness: 1.05 })
    .toBuffer();

  const logo = await sharp(LOGO).resize(360, 360, { fit: 'contain' }).png().toBuffer();

  await sharp(fundo)
    .composite([{ input: logo, gravity: 'centre' }])
    // Sem canal alfa: a Play Store rejeita feature graphic com transparência.
    .flatten({ background: { r: 247, g: 197, b: 62 } })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(SAIDA, 'feature-graphic.png'));

  console.log('  feature-graphic.png       1024x500');
}

/** Servidor estático mínimo para o build. */
function servir() {
  const tipos = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
  };
  return createServer(async (req, res) => {
    try {
      const limpo = decodeURIComponent(req.url.split('?')[0]);
      let alvo = path.join(WWW, limpo === '/' ? 'index.html' : limpo);
      let dados;
      try {
        dados = await readFile(alvo);
      } catch {
        alvo = path.join(WWW, 'index.html');
        dados = await readFile(alvo);
      }
      res.writeHead(200, { 'Content-Type': tipos[path.extname(alvo)] ?? 'application/octet-stream' });
      res.end(dados);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });
}

async function screenshots() {
  const servidor = servir();
  await new Promise((r) => servidor.listen(PORTA, r));

  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const pagina = await navegador.newPage();
  // Proporção 9:16, aceita pela Play Store para celular.
  await pagina.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1, isMobile: true, hasTouch: true });

  const url = `http://127.0.0.1:${PORTA}/`;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  await pagina.goto(url, { waitUntil: 'networkidle0' });
  await espera(1200);
  await pagina.screenshot({ path: path.join(SAIDA, 'screenshot-1-inicial.png') });
  console.log('  screenshot-1-inicial.png  1080x1920');

  await pagina.type('#campo-nome', 'Sofia');
  await pagina.click('.comecar');
  await espera(1800);

  // Cenário padrão, com a faixa de um animal visível.
  const animais = await pagina.$$('.animal');
  if (animais.length) await animais[0].click();
  await espera(600);
  await pagina.screenshot({ path: path.join(SAIDA, 'screenshot-2-celeiro.png') });
  console.log('  screenshot-2-celeiro.png  1080x1920');

  // Troca para um cenário sazonal, mostrando a variedade.
  const botoes = await pagina.$$('.acoes .fb-icone-botao');
  if (botoes[1]) {
    await botoes[1].click();
    await espera(500);
    const opcoes = await pagina.$$('.painel .opcao');
    if (opcoes[1]) await opcoes[1].click();
    await espera(900);
    const outros = await pagina.$$('.animal');
    if (outros[3]) await outros[3].click();
    await espera(600);
    await pagina.screenshot({ path: path.join(SAIDA, 'screenshot-3-junina.png') });
    console.log('  screenshot-3-junina.png   1080x1920');
  }

  // Painel de cenários aberto, evidenciando a troca de tema.
  const botoes2 = await pagina.$$('.acoes .fb-icone-botao');
  if (botoes2[1]) {
    await botoes2[1].click();
    await espera(500);
    await pagina.screenshot({ path: path.join(SAIDA, 'screenshot-4-cenarios.png') });
    console.log('  screenshot-4-cenarios.png 1080x1920');
  }

  await navegador.close();
  servidor.close();
}

async function main() {
  console.log('\nAssets da Play Store — Farm Book\n');
  await mkdir(SAIDA, { recursive: true });
  await featureGraphic();
  await screenshots();
  console.log(`\nGerados em: ${SAIDA}\n`);
}

main().catch((e) => {
  console.error('Falha ao gerar assets de loja:', e.message);
  process.exit(1);
});
