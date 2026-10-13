import assert from 'node:assert/strict';
import test from 'node:test';
import { overnightStartKey, previousKstDateKey } from './schedule-overnight';

test('12일 21시에 시작한 방송은 13일에 새 시작일로 보지 않는다', () => {
  const started = new Date('2026-10-12T12:00:00.000Z');
  assert.equal(overnightStartKey(started, '2026-10-13'), '2026-10-12');
  assert.equal(overnightStartKey(started, '2026-10-12'), null);
});

test('시작 시각이 없으면 이어 붙이지 않는다', () => {
  assert.equal(overnightStartKey(null, '2026-10-13'), null);
  assert.equal(overnightStartKey(new Date(Number.NaN), '2026-10-13'), null);
});

test('전날 키는 KST 자정 직전이다', () => {
  assert.equal(previousKstDateKey('2026-10-13'), '2026-10-12');
});
