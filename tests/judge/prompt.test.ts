import { expect, test } from "bun:test";
import type { EnvironmentTrace } from "../../src/models/environment";
import type { Task } from "../../src/models/task";
import { buildTrajectoryJudgePrompt } from "../../src/judge/prompt";

const task: Task = {
  id: "revenue-email",
  description: "Find the Q3 revenue and email it to Sam.",
  initialState: {},
  expectedState: {},
};

const trace: EnvironmentTrace = {
  id: "trace-1",
  taskId: "revenue-email",
  startedAt: "2026-01-01",
  initialState: {},
  actions: [
    {
      id: "1",
      index: 0,
      timestamp: "2026-01-01",
      action: {
        id: "1",
        type: "open_spreadsheet",
        input: { name: "Q3 Revenue" },
      },
      result: {
        success: true,
      },
    },
  ],
  finalState: {
    email: {
      recipient: "Sam",
      sent: true,
    },
  },
};

test("trajectory judge prompt contains task and trajectory", () => {
  const prompt = buildTrajectoryJudgePrompt(task, trace);

  expect(prompt).toContain(task.description);
  expect(prompt).toContain("open_spreadsheet");
  expect(prompt).toContain("Q3 Revenue");
  expect(prompt).toContain("FINAL STATE");
  expect(prompt).toContain("efficiency");
});
