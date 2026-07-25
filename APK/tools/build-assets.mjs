#!/usr/bin/env node
/**
 * Pipeline de assets do Farm Book.
 *
 * Lê os originais de PROJECT/assets/ e gera as versões otimizadas em
 * APK/src/assets/. Os originais nunca são modificados.
 *
 *   - animais    : PNG 1024x1536 RGBA -> WebP 512x768  (alpha preservado)
 *   - backgrounds: PNG 1024x1536 RGB  -> WebP 1080x1620
 *   - logo       : PNG 1254x1254 RGBA -> WebP 512x512
 *   - sons       : copiados de PROJECT/assets/sounds/ (ja processados)
 *
 * Os arquivos .svg e .glb sao ignorados de proposito (ver ESPECIFICACAO 2.1 e 3.1).
 *
 * Uso: npm run assets
 */
import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '../..');
const ORIGEM = path.join(RAIZ, 'PROJECT/assets');
const DESTINO = path.join(__dirname, '../src/assets');

const QUALIDADE = 85;

const ANIMAIS = ['cavalo', 'galinha', 'gatinha', 'ovelha', 'porco', 'vaca'];
const BACKGROUNDS = [
  'standard',
  'halloween',
  'natalino',
  'pascoa',
  'thanksgiving',
  'festejunina',
];

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function converter(origem, destino, largura, altura, rotulo) {
  if (!existsSync(origem)) {
    console.log(`  [PULADO] ${rotulo} — origem não encontrada: ${path.basename(origem)}`);
    return { ok: false, bytes: 0 };
  }
  const antes = (await stat(origem)).size;
  await sharp(origem)
    .resize(largura, altura, { fit: 'fill' })
    .webp({ quality: QUALIDADE, effort: 6 })
    .toFile(destino);
  const depois = (await stat(destino)).size;
  const reducao = (100 * (1 - depois / antes)).toFixed(0);
  console.log(
    `  ${rotulo.padEnd(28)} ${kb(antes).padStart(9)} -> ${kb(depois).padStart(8)}  (-${reducao}%)`
  );
  return { ok: true, bytes: depois };
}

async function main() {
  console.log('\nPipeline de assets — Farm Book');
  console.log(`origem : ${ORIGEM}`);
  console.log(`destino: ${DESTINO}\n`);

  await mkdir(path.join(DESTINO, 'animais'), { recursive: true });
  await mkdir(path.join(DESTINO, 'backgrounds'), { recursive: true });
  await mkdir(path.join(DESTINO, 'sounds'), { recursive: true });

  let total = 0;

  console.log('Animais (512x768, alpha preservado):');
  for (const nome of ANIMAIS) {
    const r = await converter(
      path.join(ORIGEM, `${nome}.png`),
      path.join(DESTINO, 'animais', `${nome}.webp`),
      512,
      768,
      nome
    );
    total += r.bytes;
  }

  console.log('\nBackgrounds (1080x1620):');
  for (const nome of BACKGROUNDS) {
    const r = await converter(
      path.join(ORIGEM, `background-${nome}.png`),
      path.join(DESTINO, 'backgrounds', `${nome}.webp`),
      1080,
      1620,
      nome
    );
    total += r.bytes;
  }

  console.log('\nLogo (512x512):');
  const rl = await converter(
    path.join(ORIGEM, 'logo.png'),
    path.join(DESTINO, 'logo.webp'),
    512,
    512,
    'logo'
  );
  total += rl.bytes;

  console.log('\nSons (copiados de PROJECT/assets/sounds/):');
  const dirSons = path.join(ORIGEM, 'sounds');
  if (existsSync(dirSons)) {
    for (const arquivo of await readdir(dirSons)) {
      if (!arquivo.endsWith('.mp3')) continue;
      const destino = path.join(DESTINO, 'sounds', arquivo);
      await copyFile(path.join(dirSons, arquivo), destino);
      const bytes = (await stat(destino)).size;
      total += bytes;
      console.log(`  ${arquivo.padEnd(28)} ${kb(bytes).padStart(9)}`);
    }
  } else {
    console.log('  [PULADO] PROJECT/assets/sounds/ não encontrado');
  }

  console.log(`\nTotal embarcado: ${(total / 1024 / 1024).toFixed(2)} MB`);
  if (total > 30 * 1024 * 1024) {
    console.warn('AVISO: acima da meta de 30 MB definida na especificação.');
  }
  console.log('');
}

main().catch((e) => {
  console.error('Falha no pipeline:', e.message);
  process.exit(1);
});
