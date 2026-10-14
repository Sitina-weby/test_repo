"use strict";

function assertRun(run) {
  if (run === null || typeof run !== "object" || !Array.isArray(run.history)) {
    throw new TypeError("Invalid run");
  }
}

function transition(run, from, to, nextGeneration, entry, action) {
  assertRun(run);
  if (run.status !== from) {
    throw new Error(
      `Cannot ${action} run in status "${run.status}" (expected "${from}")`
    );
  }
  return {
    ...run,
    status: to,
    generation: nextGeneration,
    history: entry ? [...run.history, entry] : [...run.history],
  };
}

function createRun(id) {
  return { id, status: "idle", generation: 0, history: [] };
}

function startRun(run) {
  assertRun(run);
  return transition(run, "idle", "running", 1, null, "start");
}

function stopRun(run, reason = "Přerušeno uživatelem") {
  assertRun(run);
  return transition(
    run,
    "running",
    "paused",
    run.generation,
    { type: "stopped", generation: run.generation, reason },
    "stop"
  );
}

function resumeRun(run) {
  assertRun(run);
  const generation = run.generation + 1;
  return transition(
    run,
    "paused",
    "running",
    generation,
    { type: "resumed", generation },
    "resume"
  );
}

module.exports = { createRun, startRun, stopRun, resumeRun };
