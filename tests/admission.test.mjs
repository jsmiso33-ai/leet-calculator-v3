import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { gradeFromCutoffs, DEFAULT_BAND_GAP } = await import(moduleUrl(await readFile(new URL('../src/lib/admGrade.js', import.meta.url), 'utf8')));
const { ADMISSION_2026 } = await import(moduleUrl(await readFile(new URL('../data/schools.js', import.meta.url), 'utf8')));

test('at or above the 50% line is safe', () => {
  assert.equal(gradeFromCutoffs(140.9, 140.9, 137.8), 'safe');
  assert.equal(gradeFromCutoffs(145, 140.9, 137.8), 'safe');
});

test('between the 75% line and the 50% line is match, never safe', () => {
  assert.equal(gradeFromCutoffs(140.8, 140.9, 137.8), 'match');
  assert.equal(gradeFromCutoffs(137.8, 140.9, 137.8), 'match');
});

test('below the 75% line within one band gap is reach, further below is hard', () => {
  // gap = 140.9 - 137.8 = 3.1 → reach down to 134.7
  assert.equal(gradeFromCutoffs(135, 140.9, 137.8), 'reach');
  assert.equal(gradeFromCutoffs(134.6, 140.9, 137.8), 'hard');
});

test('missing or inconsistent 75% line falls back to the default gap below the 50% line', () => {
  for (const leet75 of [null, undefined, 131.9, 129.7]) {
    const leet50 = 129.7;
    assert.equal(gradeFromCutoffs(leet50 - 0.1, leet50, leet75), 'match', String(leet75));
    assert.equal(gradeFromCutoffs(leet50 - DEFAULT_BAND_GAP - 0.1, leet50, leet75), 'reach', String(leet75));
    assert.equal(gradeFromCutoffs(leet50 - 2 * DEFAULT_BAND_GAP - 0.1, leet50, leet75), 'hard', String(leet75));
  }
});

test('missing inputs produce no grade', () => {
  assert.equal(gradeFromCutoffs(null, 140.9, 137.8), null);
  assert.equal(gradeFromCutoffs(130, null, 137.8), null);
});

test('regression: no school labels a score below its 50% line as safe', () => {
  for (const [name, ad] of Object.entries(ADMISSION_2026)) {
    if (!ad.leet || ad.leet.val === null) continue;
    const leet75 = ad.leet75 && ad.leet75.val !== null ? ad.leet75.val : null;
    assert.notEqual(gradeFromCutoffs(ad.leet.val - 0.01, ad.leet.val, leet75), 'safe', name);
    assert.equal(gradeFromCutoffs(ad.leet.val, ad.leet.val, leet75), 'safe', name);
  }
});
