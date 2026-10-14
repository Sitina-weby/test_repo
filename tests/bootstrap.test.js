import test from 'node:test';
import assert from 'node:assert/strict';
test('pilot runs on Node 22 or newer',()=>assert.ok(Number(process.versions.node.split('.')[0])>=22));
