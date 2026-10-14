"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createRun,
  startRun,
  stopRun,
  resumeRun,
} = require("../src/lifecycle.js");

test("createRun creates idle run", () => {
  assert.deepEqual(createRun("a"), {
    id: "a",
    status: "idle",
    generation: 0,
    history: [],
  });
});

test("startRun moves idle to running generation 1", () => {
  const run = startRun(createRun("a"));
  assert.equal(run.status, "running");
  assert.equal(run.generation, 1);
  assert.equal(run.id, "a");
  assert.deepEqual(run.history, []);
});

test("stopRun pauses running and records default reason", () => {
  const run = stopRun(startRun(createRun("a")));
  assert.equal(run.status, "paused");
  assert.equal(run.generation, 1);
  assert.deepEqual(run.history, [
    { type: "stopped", generation: 1, reason: "Přerušeno uživatelem" },
  ]);
});

test("stopRun records custom reason", () => {
  const run = stopRun(startRun(createRun("a")), "Důvod");
  assert.equal(run.history[0].reason, "Důvod");
});

test("resumeRun resumes paused with generation + 1", () => {
  const run = resumeRun(stopRun(startRun(createRun("a"))));
  assert.equal(run.status, "running");
  assert.equal(run.generation, 2);
  assert.deepEqual(run.history[1], { type: "resumed", generation: 2 });
});

test("invalid transitions throw", () => {
  const idle = createRun("a");
  const running = startRun(idle);
  const paused = stopRun(running);
  assert.throws(() => stopRun(idle));
  assert.throws(() => resumeRun(idle));
  assert.throws(() => startRun(running));
  assert.throws(() => resumeRun(running));
  assert.throws(() => startRun(paused));
  assert.throws(() => stopRun(paused));
});

test("inputs are not mutated", () => {
  const idle = createRun("a");
  const idleCopy = structuredClone(idle);
  const running = startRun(idle);
  assert.deepEqual(idle, idleCopy);
  const runningCopy = structuredClone(running);
  const paused = stopRun(running, "x");
  assert.deepEqual(running, runningCopy);
  const pausedCopy = structuredClone(paused);
  resumeRun(paused);
  assert.deepEqual(paused, pausedCopy);
  assert.notEqual(paused.history, running.history);
});

test("multiple stop/resume cycles preserve id and history", () => {
  let run = startRun(createRun("stable"));
  run = stopRun(run, "r1");
  run = resumeRun(run);
  run = stopRun(run, "r2");
  run = resumeRun(run);
  run = stopRun(run);
  assert.equal(run.id, "stable");
  assert.equal(run.status, "paused");
  assert.equal(run.generation, 3);
  assert.deepEqual(run.history, [
    { type: "stopped", generation: 1, reason: "r1" },
    { type: "resumed", generation: 2 },
    { type: "stopped", generation: 2, reason: "r2" },
    { type: "resumed", generation: 3 },
    { type: "stopped", generation: 3, reason: "Přerušeno uživatelem" },
  ]);
});
