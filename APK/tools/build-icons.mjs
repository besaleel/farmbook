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
const LOGO = path.join(RAIZ, 'PROJECT/assets/logo.png');
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

  // Ícone 512x512 da Play Store — sem transparência, exigência do Google.
  await mkdir(LOJA, { recursive: true });
  await sharp(LOGO)
    .resize(512, 512, { fit: 'contain', background: FUNDO })
    .flatten({ background: FUNDO })
    .png()
    .toFile(path.join(LOJA, 'icon-512.png'));
  console.log('\nPlay Store:\n  DEPLOY/store-assets/icon-512.png  512x512 (sem alpha)');
  console.log('');
}

main().catch((e) => {
  console.error('Falha ao gerar ícones:', e.message);
  process.exit(1);
});
