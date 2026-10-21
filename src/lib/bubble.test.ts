import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bubbleFor } from './bubble.ts';

test('without a pose the kind decides: glad, hello, startled; errors stay longer', () => {
  assert.deepEqual(bubbleFor('success'), { pose: 'happy', motion: 'hop', durationMs: 4000 });
  assert.deepEqual(bubbleFor('info'), { pose: 'hello', motion: 'nod', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error'), { pose: 'oops', motion: 'shake', durationMs: 6000 });
});

test('a given pose wins, with the motion that fits it', () => {
  assert.deepEqual(bubbleFor('success', 'wink'), { pose: 'wink', motion: 'nod', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'love'), { pose: 'love', motion: 'pulse', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'teary'), { pose: 'teary', motion: 'sway', durationMs: 4000 });
  assert.deepEqual(bubbleFor('success', 'sleep'), { pose: 'sleep', motion: 'breathe', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error', 'lost'), { pose: 'lost', motion: 'sway', durationMs: 6000 });
});

test('every pose has a motion', () => {
  for (const pose of ['hello', 'happy', 'sleep', 'lost', 'sad', 'locked', 'wink', 'love', 'teary', 'oops'] as const) {
    assert.ok(bubbleFor('info', pose).motion, pose);
  }
});
