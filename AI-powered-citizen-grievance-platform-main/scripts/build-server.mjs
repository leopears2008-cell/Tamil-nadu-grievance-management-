import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
const outputFile = path.join(outputDirectory, 'server.cjs');
const esbuild = path.join(projectRoot, 'node_modules', 'esbuild', 'bin', 'esbuild');

await mkdir(outputDirectory, { recursive: true });
await rm(outputFile, { force: true });

execFileSync(process.execPath, [
  esbuild,
  path.join(projectRoot, 'server.ts'),
  '--bundle',
  '--platform=node',
  '--target=node20',
  '--format=cjs',
  '--packages=external',
  '--outfile=' + outputFile,
  '--sourcemap',
], { cwd: projectRoot, stdio: 'inherit' });

console.info('Backend bundle created at dist/server.cjs');
