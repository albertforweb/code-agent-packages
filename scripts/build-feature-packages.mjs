#!/usr/bin/env node

import { createHash, createPrivateKey, sign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageRoot = repoRoot;
const outRoot = path.join(repoRoot, 'dist-feature-packages');
const REPRODUCIBLE_BUILD_DATE = new Date((Number(process.env.SOURCE_DATE_EPOCH || 0) || 0) * 1000);
const REPRODUCIBLE_BUILD_ISO = REPRODUCIBLE_BUILD_DATE.toISOString();
const DEFAULT_SIGNING_KEY_ID = 'codeagent-dev-ed25519-2026-07';
const DEFAULT_SIGNING_PRIVATE_KEY = [
  '-----BEGIN PRIVATE KEY-----',
  'MC4CAQAwBQYDK2VwBCIEILL6Ubq7/xL7Ghc12/eeowe5+VXWwFGj4CfWnFSyPoaH',
  '-----END PRIVATE KEY-----',
  '',
].join('\n');
const DEFAULT_SIGNING_PUBLIC_KEY = [
  '-----BEGIN PUBLIC KEY-----',
  'MCowBQYDK2VwAyEAkf9DrK2mkUflgdgfHYA2Q2Tyl+G0CBJ2qyc+wxAEJhY=',
  '-----END PUBLIC KEY-----',
  '',
].join('\n');

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function signingPrivateKey() {
  return createPrivateKey(process.env.CODEAGENT_PACKAGE_SIGNING_PRIVATE_KEY ?? DEFAULT_SIGNING_PRIVATE_KEY);
}

function signingKeyId() {
  return process.env.CODEAGENT_PACKAGE_SIGNING_KEY_ID ?? DEFAULT_SIGNING_KEY_ID;
}

function signingPublicKey() {
  return process.env.CODEAGENT_PACKAGE_SIGNING_PUBLIC_KEY ?? DEFAULT_SIGNING_PUBLIC_KEY;
}

function normalizeArtifactMtimes(root, files) {
  for (const file of files) {
    utimesSync(path.join(root, file), REPRODUCIBLE_BUILD_DATE, REPRODUCIBLE_BUILD_DATE);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed\n${[result.stdout, result.stderr].filter(Boolean).join('\n')}`);
  }
  return result;
}

function npxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function discoverPackageIds() {
  return readdirSync(packageRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(packageId => !packageId.startsWith('.') && packageId !== 'node_modules' && packageId !== 'scripts' && packageId !== 'dist-feature-packages')
    .filter(packageId => existsSync(path.join(packageRoot, packageId, 'manifest.json')))
    .sort();
}

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

const summaries = [];
const packageIds = discoverPackageIds();

for (const packageId of packageIds) {
  const sourceDir = path.join(packageRoot, packageId);
  const manifestPath = path.join(sourceDir, 'manifest.json');
  const packageJsonPath = path.join(sourceDir, 'package.json');
  const readmePath = path.join(sourceDir, 'README.md');

  if (!existsSync(manifestPath)) {
    fail(`Missing manifest for ${packageId}: ${path.relative(repoRoot, manifestPath)}`);
  }
  if (!existsSync(packageJsonPath)) {
    fail(`Missing package.json for ${packageId}: ${path.relative(repoRoot, packageJsonPath)}`);
  }

  const manifest = readJson(manifestPath);
  const packageJson = readJson(packageJsonPath);
  const packageMeta = packageJson.codeagentPackage ?? {};
  if (manifest.id !== packageId) {
    fail(`Manifest id ${manifest.id} does not match package directory ${packageId}`);
  }
  if (packageMeta.packageId !== packageId) {
    fail(`package.json codeagentPackage.packageId must be ${packageId}`);
  }
  if (packageMeta.productSku !== manifest.productSku) {
    fail(`package.json product SKU must match manifest product SKU for ${packageId}`);
  }
  if (manifest.sdk?.name !== '@codeagent/feature-package-sdk') {
    fail(`Manifest for ${packageId} must declare @codeagent/feature-package-sdk compatibility`);
  }

  const outDir = path.join(outRoot, packageId);
  mkdirSync(outDir, { recursive: true });
  cpSync(manifestPath, path.join(outDir, 'manifest.json'));
  cpSync(packageJsonPath, path.join(outDir, 'package.json'));
  if (existsSync(readmePath)) {
    cpSync(readmePath, path.join(outDir, 'README.md'));
  }

  const runtimeSourcePath = path.join(sourceDir, 'src', 'runtime.ts');
  const runtimeOutPath = path.join(outDir, 'dist', 'index.js');
  const runtimeFiles = [];
  if (existsSync(runtimeSourcePath)) {
    mkdirSync(path.dirname(runtimeOutPath), { recursive: true });
    run(npxCommand(), [
      'esbuild',
      runtimeSourcePath,
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${runtimeOutPath}`,
    ]);
    runtimeFiles.push('dist/index.js');
  }

  const artifactFiles = [
    'package.json',
    'manifest.json',
    ...(existsSync(path.join(outDir, 'README.md')) ? ['README.md'] : []),
    ...runtimeFiles,
  ];
  const fileSha256 = Object.fromEntries(
    artifactFiles.map(file => [file, sha256(path.join(outDir, file))]),
  );
  const signingPayload = {
    artifactId: manifest.distribution?.artifact?.artifactId ?? packageMeta.artifactId,
    packageId,
    productSku: manifest.productSku,
    version: manifest.version,
    distributionMode: manifest.distribution?.mode ?? 'installable',
    manifestFile: 'manifest.json',
    manifestSha256: sha256(path.join(outDir, 'manifest.json')),
    files: artifactFiles,
    fileSha256,
  };
  const signingPayloadJson = stableStringify(signingPayload);
  const signature = sign(null, Buffer.from(signingPayloadJson), signingPrivateKey()).toString('base64');
  const artifact = {
    ...signingPayload,
    signed: true,
    signatureAlgorithm: 'ed25519',
    signingKeyId: signingKeyId(),
    publicKey: signingPublicKey(),
    signedPayloadSha256: sha256Text(signingPayloadJson),
    signature,
    builtAt: REPRODUCIBLE_BUILD_ISO,
  };
  writeFileSync(path.join(outDir, 'artifact.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  normalizeArtifactMtimes(outDir, [...artifact.files, 'artifact.json']);

  const archiveName = `${manifest.productSku}-${manifest.version}.tgz`;
  const archivePath = path.join(outRoot, archiveName);
  const rawArchivePath = path.join(outRoot, `${manifest.productSku}-${manifest.version}.tar`);
  rmSync(rawArchivePath, { force: true });
  rmSync(`${rawArchivePath}.gz`, { force: true });
  rmSync(archivePath, { force: true });
  run('tar', ['-cf', rawArchivePath, '-C', outDir, ...artifact.files, 'artifact.json']);
  run('gzip', ['-n', '-f', rawArchivePath]);
  renameSync(`${rawArchivePath}.gz`, archivePath);

  const summary = {
    ...artifact,
    archiveFile: archiveName,
    archiveSha256: sha256(archivePath),
    archiveBytes: readFileSync(archivePath).byteLength,
  };
  writeFileSync(path.join(outDir, 'build-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  summaries.push(summary);
}

writeFileSync(path.join(outRoot, 'index.json'), `${JSON.stringify({ packages: summaries }, null, 2)}\n`);

for (const summary of summaries) {
  console.log(`${summary.packageId}: ${summary.archiveFile} ${summary.archiveSha256}`);
}
