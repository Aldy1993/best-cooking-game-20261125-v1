// Warung Senja — Twilight Wok Rush: hand-in program (Node 22, stdlib only).
//
// It assembles the submission payload in /output (or $MAKEFUN_OUTPUT_DIR
// outside the grader): a verbatim copy of game/ and screenshots/ plus the
// dossier.json the vendored make.fun library writes from them. The grader
// runs this program twice and requires both runs to write identical bytes,
// so every step below is deterministic: plain recursive copies, then one
// dossier build with fixed caps.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));

// Caps from the competition gate: dossier text 160 KiB, at most 4
// screenshots of at most 256 KiB each, game/ at most 993 entries / 48 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Warung Senja dossier written: ${dossier.length} bytes -> ${outDir}`);
