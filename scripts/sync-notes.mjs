// sync-notes.mjs
// 從 notes.config.json 指定的來源路徑讀取 .md 檔案，
// 轉換 frontmatter 格式後複製到 outputDir

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'notes.config.json');

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
const { sourcePath, include = [], outputDir } = config;
const OUTPUT_ABS = join(__dirname, '..', outputDir);

// ── 工具函式 ──────────────────────────────────────────────────

function walkDir(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.md')) {
      result.push(fullPath);
    }
  }
  return result;
}

function matchesInclude(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return include.some(pattern => {
    const prefix = pattern.split('/**')[0];
    return norm.startsWith(prefix + '/') && norm.endsWith('.md');
  });
}

// 將路徑中每個 segment 做 sanitize（移除 Vite/URL 不接受的字元）
function sanitizeSegment(seg) {
  return seg
    .replace(/[#?&*<>|\\:%+!@$^()[\]{}'",;=]/g, '')  // 移除 URL / 檔案系統特殊字元
    .replace(/\s+/g, '-')            // 空格 → 連字號
    .replace(/-{2,}/g, '-')          // 連續連字號壓縮
    .replace(/^-|-$/g, '');          // 去首尾連字號
}

function sanitizeRelPath(relPath) {
  return relPath
    .split('/')
    .map(seg => seg.endsWith('.md')
      ? sanitizeSegment(seg.slice(0, -3)) + '.md'
      : sanitizeSegment(seg))
    .join('/');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }
  return { meta, body: match[2] };
}

function parseTags(raw) {
  if (!raw) return [];
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(t => t.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);
}

function extractTitle(body, filename) {
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return basename(filename, '.md').replace(/[-_]/g, ' ');
}

function extractDescription(body) {
  const cleaned = body
    .replace(/^---[\s\S]*?^---/m, '')          // strip frontmatter remnants
    .replace(/^#.*$/gm, '')                     // remove headings
    .replace(/```[\s\S]*?```/g, '')             // remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '')            // remove images
    .replace(/\[\[.*?\]\]/g, '')                // remove wikilinks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');   // flatten markdown links

  const firstLine = cleaned
    .split('\n')
    .map(l => l.trim())
    .find(l => l.length > 8 && !l.startsWith('|') && !l.startsWith('-') && !l.startsWith('>'));

  return (firstLine ?? '').substring(0, 100).replace(/"/g, "'");
}

function buildFrontmatter(meta, body, filename) {
  const title = meta.title || extractTitle(body, filename);
  const date = meta.created || meta.date || meta.updated || '';
  const tags = parseTags(meta.tags);
  const description = meta.description
    ? meta.description.replace(/"/g, "'")
    : extractDescription(body);

  return [
    '---',
    `title: "${title}"`,
    `date: "${date}"`,
    `tags: [${tags.join(', ')}]`,
    `description: "${description}"`,
    '---',
    '',
  ].join('\n');
}

// ── 主流程 ────────────────────────────────────────────────────

// 清空 output
if (existsSync(OUTPUT_ABS)) {
  rmSync(OUTPUT_ABS, { recursive: true, force: true });
}
mkdirSync(OUTPUT_ABS, { recursive: true });

const sourceAbs = sourcePath.replace(/\\/g, '/');
const allFiles = walkDir(sourceAbs);
let synced = 0;
let skipped = 0;

for (const fullPath of allFiles) {
  const relPath = relative(sourceAbs, fullPath).replace(/\\/g, '/');

  if (!matchesInclude(relPath)) continue;

  try {
    const raw = readFileSync(fullPath, 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    const newFrontmatter = buildFrontmatter(meta, body, basename(fullPath));
    const transformed = newFrontmatter + body;

    const safeRelPath = sanitizeRelPath(relPath);
    const stem = safeRelPath.replace(/\.md$/, '').split('/').pop();
    if (!stem) {
      console.warn(`  skipped ${relPath}: filename becomes empty after sanitize`);
      skipped++;
      continue;
    }
    const outPath = join(OUTPUT_ABS, safeRelPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, transformed, 'utf-8');
    synced++;
  } catch (e) {
    console.warn(`  skipped ${relPath}: ${e.message}`);
    skipped++;
  }
}

console.log(`sync-notes: ${synced} files synced, ${skipped} skipped`);
console.log(`  source : ${sourceAbs}`);
console.log(`  output : ${outputDir}`);
