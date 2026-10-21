import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_COLUMN } from './pageColumn.ts';

const SRC = join(import.meta.dirname, '..');

const sourceFiles = (): string[] =>
  (readdirSync(SRC, { recursive: true }) as string[])
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => join(SRC, file));

test('the page column is one centred 960px column with the shared side padding', () => {
  for (const part of ['mx-auto', 'w-full', 'max-w-[960px]', 'px-4', 'md:px-8']) {
    assert.ok(PAGE_COLUMN.split(' ').includes(part), `PAGE_COLUMN is missing ${part}`);
  }
});

test('no screen declares its own page width: they all use PAGE_COLUMN', () => {
  const offenders = sourceFiles().filter((file) => /max-w-\[(720|960)px\]/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(
    offenders.map((file) => file.slice(SRC.length + 1)),
    [],
    'these files hardcode a page column width; use PAGE_COLUMN from @/components/pageColumn',
  );
});
