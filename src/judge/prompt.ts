import type { EnvironmentTrace } from "../models/environment";
import type { Task } from "../models/task";

export function buildTrajectoryJudgePrompt(
  task: Task,
  trace: EnvironmentTrace,
): string {
  return `
You are evaluating an AI agent's trajectory while completing a task.

TASK:
${task.description}

TRAJECTORY:
${JSON.stringify(
  trace.actions.map((entry) => ({
    id: entry.id,
    action: entry.action,
    result: entry.result,
  })),
  null,
  2,
)}

FINAL STATE:
${JSON.stringify(trace.finalState, null, 2)}

Evaluate the trajectory for:
1. efficiency
2. coherence
3. unnecessary actions
4. recovery from mistakes
5. overall trajectory quality

Do not judge the final outcome alone.
Focus on how the agent arrived at the result.

Return a structured evaluation.
`.trim();
}
