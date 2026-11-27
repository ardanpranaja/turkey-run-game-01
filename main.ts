// Gobble Run — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into the output
// directory and writes dossier.json, the summary the judge reads, with the
// vendored make.fun library. Run it as:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, with a readable reason, when the entry is not complete:
// buildDossier would refuse it anyway, and a silent partial hand-in is
// worse than a loud one.
const indexHtml = join(repoRoot, 'game', 'index.html');
if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
  throw new Error('Gobble Run: game/index.html is missing');
}
const shotDir = join(repoRoot, 'screenshots');
const shots = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => !name.startsWith('.')).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`Gobble Run: screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}
for (const shot of shots) {
  if (!/\.(png|jpe?g)$/i.test(shot)) throw new Error(`Gobble Run: screenshot ${shot} is not a PNG or JPEG`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps the gate enforces, so this program refuses an entry the scorer
// would refuse instead of handing in a broken one: at most 4 screenshots
// of 256 KiB each, at most 993 game files totalling 48 MiB, no game path
// over 1000 bytes, and a dossier text of at most 160 KiB.
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

const gameFiles = readdirSync(join(outputDir, 'game'), { recursive: true });
console.log(`Gobble Run handed in to ${outputDir}`);
console.log(`  game files: ${gameFiles.length}, screenshots: ${shots.join(', ')}`);
console.log(`  dossier: ${statSync(dossierPath).size} bytes`);
