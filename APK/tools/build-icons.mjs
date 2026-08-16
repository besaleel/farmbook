#!/usr/bin/env node
/**
 * Gera os ícones do app Android e o ícone 512x512 da Play Store,
 * a partir de PROJECT/assets/logo.png.
 *
 * O Android recorta o ícone adaptativo em círculo/squircle, cortando cerca
 * de 25% da borda. Por isso o logo é reduzido dentro do quadro (safe zone)
 * antes de virar foreground, evitando que os animais sejam cortados.
 *
 * Uso: npm run icons
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '../..');

/**
 * Ícone do launcher e da loja: a arte quadrada, com a moldura amarela.
 * O quadro do Android é 1:1 e recorta em círculo/squircle — a arte paisagem
 * do splash encolheria demais aqui para caber, deixando o ícone quase vazio.
 */
const LOGO = path.join(RAIZ, 'PROJECT/assets/logo.png');

/**
 * Splash: arte paisagem, sem moldura e sem serrilhado. A tela cheia tem
 * espaço horizontal de sobra, então a proporção 3:2 rende um logo maior e
 * mais legível do que o quadrado.
 */
const LOGO_SPLASH = path.join(RAIZ, 'PROJECT/assets/logo-trans.png');

const RES = path.join(__dirname, '../android/app/src/main/res');
const LOJA = path.join(RAIZ, 'DEPLOY/store-assets');

// Cor de fundo do ícone adaptativo — amarelo da moldura do logo.
const FUNDO = { r: 247, g: 197, b: 62, alpha: 1 };

// densidade -> tamanho do ícone legado
const DENSIDADES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

async function iconeLegado(dens, tamanho) {
  const dir = path.join(RES, `mipmap-${dens}`);
  await mkdir(dir, { recursive: true });

  const base = sharp(LOGO).resize(tamanho, tamanho, { fit: 'contain', background: FUNDO });

  await base.clone().png().toFile(path.join(dir, 'ic_launcher.png'));
  await base.clone().png().toFile(path.join(dir, 'ic_launcher_round.png'));

  // Foreground adaptativo: logo a 66% do quadro, respeitando a safe zone.
  const interno = Math.round(tamanho * 0.66);
  await sharp({
    create: {
      width: tamanho,
      height: tamanho,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(LOGO).resize(interno, interno, { fit: 'contain' }).png().toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(dir, 'ic_launcher_foreground.png'));

  console.log(`  mipmap-${dens.padEnd(8)} ${tamanho}x${tamanho}`);
}

async function main() {
  console.log('\nÍcones do app — Farm Book\n');

  console.log('Android (legado + foreground adaptativo):');
  for (const [dens, tam] of Object.entries(DENSIDADES)) {
    await iconeLegado(dens, tam);
  }

  // Cor de fundo do ícone adaptativo
  const dirValues = path.join(RES, 'values');
  await mkdir(dirValues, { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  const hex = `#${[FUNDO.r, FUNDO.g, FUNDO.b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
  await writeFile(
    path.join(dirValues, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${hex}</color>\n</resources>\n`
  );
  console.log(`  values/ic_launcher_background.xml  ${hex}`);

  // Favicon do WebView / PWA — gerado do logo, nunca o padrão do Ionic.
  const dirIcon = path.join(__dirname, '../src/assets/icon');
  await mkdir(dirIcon, { recursive: true });
  for (const tam of [64, 180, 512]) {
    const nome = tam === 64 ? 'favicon.png' : `icon-${tam}.png`;
    await sharp(LOGO).resize(tam, tam, { fit: 'contain' }).png().toFile(path.join(dirIcon, nome));
  }
  console.log('\nWebView / PWA:\n  assets/icon/favicon.png (64), icon-180.png, icon-512.png');

  // Ícone 512x512 da Play Store — sem transparência, exigência do Google.
  await mkdir(LOJA, { recursive: true });
  await sharp(LOGO)
    .resize(512, 512, { fit: 'contain', background: FUNDO })
    .flatten({ background: FUNDO })
    .png()
    .toFile(path.join(LOJA, 'icon-512.png'));
  console.log('\nPlay Store:\n  DEPLOY/store-assets/icon-512.png  512x512 (sem alpha)');

  await splashScreens();
  console.log('');
}

/**
 * Splash screens em TODAS as densidades.
 *
 * O Capacitor instala o splash padrão dele em `drawable-port-*` e
 * `drawable-land-*`. O Android dá preferência a esses diretórios específicos
 * sobre o `drawable/` genérico — então escrever só em `drawable/` deixa o
 * ícone padrão aparecendo. Todas as variantes precisam ser sobrescritas.
 */
async function splashScreens() {
  // Retrato e paisagem, por densidade (mesmas dimensões usadas pelo Capacitor).
  const variantes = [
    ['drawable-port-mdpi', 320, 480],
    ['drawable-port-hdpi', 480, 800],
    ['drawable-port-xhdpi', 720, 1280],
    ['drawable-port-xxhdpi', 960, 1600],
    ['drawable-port-xxxhdpi', 1280, 1920],
    ['drawable-land-mdpi', 480, 320],
    ['drawable-land-hdpi', 800, 480],
    ['drawable-land-xhdpi', 1280, 720],
    ['drawable-land-xxhdpi', 1600, 960],
    ['drawable-land-xxxhdpi', 1920, 1280],
    ['drawable', 1080, 1920],
  ];

  for (const [dir, w, h] of variantes) {
    const destino = path.join(RES, dir);
    await mkdir(destino, { recursive: true });

    // Logo a 72% da largura, limitado a 42% da altura. A arte é paisagem
    // (3:2), então é a largura que manda em retrato; o teto pela altura
    // evita que ela domine a tela nas variantes em paisagem.
    //
    // O `trim` primeiro: a arte traz margem transparente irregular, que sem
    // o recorte entraria na conta do tamanho e deixaria o logo menor e
    // visivelmente fora do centro óptico.
    const largura = Math.min(Math.round(w * 0.72), Math.round(h * 0.42 * 1.5));
    const logo = await sharp(await sharp(LOGO_SPLASH).trim({ threshold: 10 }).toBuffer())
      .resize({ width: largura, fit: 'inside' })
      .png()
      .toBuffer();

    await sharp({ create: { width: w, height: h, channels: 4, background: FUNDO } })
      .composite([{ input: logo, gravity: 'center' }])
      // Fundo sólido + logo comprime muito bem em paleta indexada:
      // ~3,5 MB para ~500 KB no total, sem diferença perceptível.
      .png({ palette: true, quality: 90, compressionLevel: 9 })
      .toFile(path.join(destino, 'splash.png'));
  }

  console.log(`\nSplash (${variantes.length} variantes, todas as densidades):`);
  console.log('  drawable-port-*, drawable-land-* e drawable/ — logo do Farm Book');
}

main().catch((e) => {
  console.error('Falha ao gerar ícones:', e.message);
  process.exit(1);
});
