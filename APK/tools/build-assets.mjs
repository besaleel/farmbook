#!/usr/bin/env node
/**
 * Pipeline de assets do Farm Book.
 *
 * Lê os originais de PROJECT/assets/ e gera as versões otimizadas em
 * APK/src/assets/. Os originais nunca são modificados.
 *
 *   - animais    : PNG 1024x1536 RGBA -> WebP 512x768  (alpha preservado)
 *   - backgrounds: PNG 1024x1536 RGB  -> WebP 1080x1620
 *   - logo       : PNG 1536x1024 RGBA -> WebP largura 640 (proporcao mantida)
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
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '../..');
const ORIGEM = path.join(RAIZ, 'PROJECT/assets');
const DESTINO = path.join(__dirname, '../src/assets');

const QUALIDADE = 85;

const ARQUIVO_MUSICA = 'background-music.mp3';

/**
 * Arte do logo. `logo-trans.png` substituiu o `logo.png` quadrado: a versão
 * antiga estava serrilhada nas bordas e trazia a moldura amarela embutida.
 */
const ARQUIVO_LOGO = 'logo-trans.png';

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

/**
 * Processa a música de fundo.
 *
 * O arquivo entregue vinha muito baixo (RMS entre -41 e -46 dB) e, como a
 * música toca a 25% do volume no jogo, ficaria inaudível no alto-falante de
 * um celular. Também vinha em 256 kbps estéreo — qualidade desnecessária
 * para uma trilha suave em loop.
 *
 * Aplicado: normalização (alvo mais baixo que o dos efeitos, para a música
 * ficar de fundo), mono e 96 kbps. As pontas já estão em silêncio, então o
 * loop emenda sem estalo — nenhum corte é necessário.
 */
async function converterMusica(origem, destino) {
  const antes = (await stat(origem)).size;
  const exec = promisify(execFile);

  await exec(ffmpegPath, [
    '-y', '-v', 'error',
    '-i', origem,
    '-af', 'loudnorm=I=-20:TP=-2:LRA=12',
    '-ac', '1',
    '-ar', '44100',
    '-b:a', '96k',
    destino,
  ]);

  const depois = (await stat(destino)).size;
  const reducao = (100 * (1 - depois / antes)).toFixed(0);
  console.log(
    `  ${ARQUIVO_MUSICA.padEnd(28)} ${kb(antes).padStart(9)} -> ${kb(depois).padStart(8)}  (-${reducao}%, normalizada)`
  );
  return depois;
}

/**
 * Converte um animal recortando a margem transparente ao redor da silhueta.
 *
 * Os PNGs originais trazem 30-40% de área vazia em volta do animal. Sem o
 * recorte, essa margem viraria área de toque morta (a criança tocaria "no
 * animal" sem resposta) e dificultaria o posicionamento por percentual.
 * `trim` deixa a imagem justa à silhueta; a proporção real de cada animal
 * é então preservada pela altura fixa.
 */
async function converterAnimal(nome) {
  const origem = path.join(ORIGEM, `${nome}.png`);
  const destino = path.join(DESTINO, 'animais', `${nome}.webp`);
  if (!existsSync(origem)) {
    console.log(`  [PULADO] ${nome} — origem não encontrada`);
    return { ok: false, bytes: 0 };
  }
  const antes = (await stat(origem)).size;

  const recortado = await sharp(origem)
    .trim({ threshold: 10 }) // remove a moldura transparente
    .toBuffer();

  await sharp(recortado)
    .resize({ height: 768, fit: 'inside', withoutEnlargement: false })
    .webp({ quality: QUALIDADE, effort: 6 })
    .toFile(destino);

  const meta = await sharp(destino).metadata();
  const depois = (await stat(destino)).size;
  console.log(
    `  ${nome.padEnd(28)} ${kb(antes).padStart(9)} -> ${kb(depois).padStart(8)}  ${meta.width}x${meta.height}`
  );
  return { ok: true, bytes: depois };
}

/**
 * Converte o logo preservando a proporção.
 *
 * O logo é paisagem (3:2) e a arte não tem moldura — é recortada na
 * silhueta. Redimensionar para um quadrado com `fit: 'fill'`, como fazem os
 * backgrounds, deformaria os animais; e `contain` só acrescentaria faixas
 * transparentes inúteis ao peso. A largura fixa mantém a nitidez na tela
 * inicial, onde o logo ocupa no máximo 240 CSS px (≈720 px em 3x).
 */
async function converterLogo() {
  const origem = path.join(ORIGEM, ARQUIVO_LOGO);
  const destino = path.join(DESTINO, 'logo.webp');
  if (!existsSync(origem)) {
    console.log(`  [PULADO] logo — origem não encontrada: ${ARQUIVO_LOGO}`);
    return { ok: false, bytes: 0 };
  }
  const antes = (await stat(origem)).size;

  // Recorta a margem transparente, como nos animais: ela não é desenho, só
  // peso, e desloca o logo do centro na tela inicial.
  const recortado = await sharp(origem).trim({ threshold: 10 }).toBuffer();

  await sharp(recortado)
    .resize({ width: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALIDADE, effort: 6 })
    .toFile(destino);

  const meta = await sharp(destino).metadata();
  const depois = (await stat(destino)).size;
  const reducao = (100 * (1 - depois / antes)).toFixed(0);
  console.log(
    `  ${'logo'.padEnd(28)} ${kb(antes).padStart(9)} -> ${kb(depois).padStart(8)}  (-${reducao}%)  ${meta.width}x${meta.height}`
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

  console.log('Animais (recortados na silhueta, altura 768, alpha preservado):');
  for (const nome of ANIMAIS) {
    const r = await converterAnimal(nome);
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

  console.log('\nLogo (largura 640, proporção preservada):');
  const rl = await converterLogo();
  total += rl.bytes;

  console.log('\nSons (de PROJECT/assets/sounds/):');
  const dirSons = path.join(ORIGEM, 'sounds');
  if (existsSync(dirSons)) {
    for (const arquivo of await readdir(dirSons)) {
      if (!arquivo.endsWith('.mp3')) continue;
      const origem = path.join(dirSons, arquivo);
      const destino = path.join(DESTINO, 'sounds', arquivo);

      if (arquivo === ARQUIVO_MUSICA) {
        total += await converterMusica(origem, destino);
        continue;
      }

      // Efeitos já vêm processados (ver BACKLOG 1.7): apenas copiar.
      await copyFile(origem, destino);
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
