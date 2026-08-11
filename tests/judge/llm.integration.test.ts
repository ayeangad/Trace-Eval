import { describe, expect, test } from "bun:test";
import type { EnvironmentTrace } from "../../src/models/environment";
import type { Task } from "../../src/models/task";
import { LLMTrajectoryJudge } from "../../src/judge/llm";

async function loadTrace(
    filename: string,
): Promise<EnvironmentTrace> {
    return await Bun.file(`traces/${filename}`).json();
}

const task: Task = {
    id: "revenue-email",
    description: "Find the Q3 revenue and email it to Sam.",
    initialState: {},
    expectedState: {},
};


describe("LLMTrajectoryJudge", () => {
    const judge = new LLMTrajectoryJudge();

    const cases = [
        "efficient.json",
        "inefficient.json",
        "failed.json",
        "critical-error.json",
    ];

    for (const filename of cases) {
        test(`evaluates ${filename}`, async () => {
            const trace = await loadTrace(filename);

            const result = await judge.evaluate(task, trace);

            console.log(`\n=== ${filename} ===`);
            console.log(JSON.stringify(result, null, 2));

            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(1);
            expect(result.reasoning.length).toBeGreaterThan(0);
            expect(Array.isArray(result.issues)).toBe(true);
        });
    }
});