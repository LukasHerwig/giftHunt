import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bubbleFor } from './bubble.ts';

test('each kind of message has its pose, and errors stay longer', () => {
  assert.deepEqual(bubbleFor('success'), { pose: 'happy', durationMs: 4000 });
  assert.deepEqual(bubbleFor('info'), { pose: 'hello', durationMs: 4000 });
  assert.deepEqual(bubbleFor('error'), { pose: 'sad', durationMs: 6000 });
});
