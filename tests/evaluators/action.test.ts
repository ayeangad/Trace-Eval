import { describe, expect, test } from "bun:test";
import type { EnvironmentTrace } from "../../src/models/environment";
import type { ActionCriterion } from "../../src/evaluators/criterion";
import { ActionGrader } from "../../src/evaluators/action";
import type { Task } from "../../src/models/task";

const task: Task = {
    id: "revenue-email",
    description: "Find the Q3 revenue and email it to Sam.",
    initialState: {},
    expectedState: {},
};

const criterion: ActionCriterion = {
    id: "valid-revenue-actions",
    name: "Valid revenue actions",
    description: "The agent should use the correct spreadsheet, range, and recipient.",
    type: "action",
    rules: [
        {
            actionType: "open_spreadsheet",
            acceptableInputs: [
                { name: "Q3 Revenue" },
            ],
        },
        {
            actionType: "select_range",
            acceptableInputs: [
                { range: "B4:B11" },
            ],
        },
        {
            actionType: "select_contact",
            acceptableInputs: [
                { name: "Sam" },
            ],
        },
    ],
};

async function loadTrace(
    filename: string,
): Promise<EnvironmentTrace> {
    return await Bun.file(`traces/${filename}`).json();
}

describe("ActionGrader", () => {
    const grader = new ActionGrader(criterion);

    test("efficient trajectory passes", async () => {
        const trace = await loadTrace("efficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("inefficient trajectory fails for using an unnecessary range", async () => {
        const trace = await loadTrace("inefficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);
        expect(result.metadata?.violations).toHaveLength(1);
    });

    test("failed trajectory fails for incorrect actions", async () => {
        const trace = await loadTrace("failed.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);
    });
});