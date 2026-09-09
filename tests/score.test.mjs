import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The application uses Vite ESM inside a CommonJS package. Data URLs let Node
// execute the same source modules without adding a second transpiler dependency.
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const leetUrl = moduleUrl(await readFile(new URL('../data/leet.js', import.meta.url), 'utf8'));
const scoreSource = (await readFile(new URL('../src/lib/score.js', import.meta.url), 'utf8'))
  .replace('../../data/leet.js', leetUrl);
const { LEET } = await import(leetUrl);
const { calcForYear, getStdScore } = await import(moduleUrl(scoreSource));
const { validateRawInput } = await import(moduleUrl(await readFile(new URL('../src/lib/rawInput.js', import.meta.url), 'utf8')));

test('blank input remains empty; zero is a valid score', () => {
  assert.deepEqual(validateRawInput('', 30, '언어이해'), { raw: null, error: null });
  assert.deepEqual(validateRawInput('0', 30, '언어이해'), { raw: 0, error: null });
});

test('invalid input is rejected rather than rounded or clamped', () => {
  for (const value of ['31', '40', '-1', '20.5', '20abc', 'NaN', 'Infinity', '1e1']) {
    const result = validateRawInput(value, 30, '언어이해');
    assert.equal(result.raw, null, value);
    assert.match(result.error, /언어이해.*0~30/, value);
  }
});

test('all academic years use their own subject limits', () => {
  for (const [year, data] of Object.entries(LEET)) {
    for (const [subject, label, limit] of [['eon', '언어이해', data.items_eon], ['chu', '추리논증', data.items_chu]]) {
      assert.equal(validateRawInput(String(limit), limit, label).raw, limit, `${year} ${subject}`);
      assert.equal(validateRawInput(String(limit + 1), limit, label).raw, null);
      assert.equal(getStdScore(year, subject, limit + 1), null);
    }
  }
});

test('switching years revalidates the same typed score', () => {
  assert.equal(validateRawInput('35', LEET[2009].items_eon, '언어이해').raw, 35);
  assert.equal(validateRawInput('35', LEET[2027].items_eon, '언어이해').raw, null);
});

test('score engine also rejects fractional and non-numeric values', () => {
  for (const raw of [null, undefined, NaN, Infinity, -1, 20.5, '20']) {
    assert.equal(getStdScore(2027, 'eon', raw), null);
  }
});

test('valid conversion values are unchanged', () => {
  const result = calcForYear(2027, 20, 34);
  assert.equal(result.eon.std, 49.7);
  assert.equal(result.chu.std, 81.2);
  assert.equal(Number((result.eon.std + result.chu.std).toFixed(1)), 130.9);
  assert.equal(result.eon.pct, 68.3);
  assert.equal(result.chu.pct, 97.4);
});
