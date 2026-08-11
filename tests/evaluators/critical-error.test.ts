import { describe, expect, test } from "bun:test";
import type { EnvironmentTrace } from "../../src/models/environment";
import type { CriticalErrorCriterion } from "../../src/evaluators/criterion";
import { CriticalErrorGrader } from "../../src/evaluators/critical-error";
import type { Task } from "../../src/models/task";

const task: Task = {
    id: "revenue-email",
    description: "Find the Q3 revenue and email it to Sam.",
    initialState: {},
    expectedState: {},
};

const criterion: CriticalErrorCriterion = {
    id: "critical-errors",
    name: "No critical errors",
    description: "The agent must not select the wrong recipient.",
    type: "critical_error",
    rules: [
        {
            actionType: "select_contact",
            description: "Selecting John instead of Sam is a critical error.",
            matches: {
                name: "John",
            },
        },
    ],
};

async function loadTrace(
    filename: string,
): Promise<EnvironmentTrace> {
    return await Bun.file(`traces/${filename}`).json();
}

describe("CriticalErrorGrader", () => {
    const grader = new CriticalErrorGrader(criterion);

    test("efficient trajectory has no critical errors", async () => {
        const trace = await loadTrace("efficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("inefficient trajectory has no critical errors", async () => {
        const trace = await loadTrace("inefficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("critical-error trajectory fails despite correct final state", async () => {
        const trace = await loadTrace("critical-error.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);

        expect(result.metadata?.violations).toHaveLength(1);
    });

    test("failed trajectory contains a critical error", async () => {
        const trace = await loadTrace("failed.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);
        expect(result.metadata?.violations).toHaveLength(1);
    });
});