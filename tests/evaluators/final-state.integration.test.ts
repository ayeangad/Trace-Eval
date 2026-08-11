import { describe, expect, test } from "bun:test";
import type { EnvironmentTrace } from "../../src/models/environment";
import type { OutcomeCriterion } from "../../src/evaluators/criterion";
import type { Task } from "../../src/models/task";
import { FinalStateGrader } from "../../src/evaluators/final-state";

const task: Task = {
    id: "revenue-email",
    description: "Find the Q3 revenue and email it to Sam.",
    initialState: {},
    expectedState: {},
};

const criterion: OutcomeCriterion = {
    id: "revenue-email-completed",
    name: "Revenue email completed",
    description: "The Q3 revenue is emailed to Sam.",
    type: "outcome",
    expectedState: {
        email: {
            recipient: "Sam",
            body: "Total revenue: $482500",
            sent: true,
        },
    },
};

async function loadTrace(
    filename: string,
): Promise<EnvironmentTrace> {
    return await Bun.file(`traces/${filename}`).json();
}

describe("FinalStateGrader against trajectory fixtures", () => {
    const grader = new FinalStateGrader(criterion);

    test("efficient trajectory passes", async () => {
        const trace = await loadTrace("efficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("inefficient trajectory still passes", async () => {
        const trace = await loadTrace("inefficient.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("failed trajectory fails", async () => {
        const trace = await loadTrace("failed.json");

        const result = await grader.evaluate({
            task,
            trace,
        });

        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);
    });
});