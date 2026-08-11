import { describe, expect, test } from "bun:test";
import { FinalStateGrader } from "../../src/evaluators/final-state";
import type { OutcomeCriterion } from "../../src/evaluators/criterion";
import type { EvaluationContext } from "../../src/evaluators/grader";

function createContext(finalState: unknown): EvaluationContext {
    return {
        task: { id: "test-task", description: "test" } as any,
        trace: {
            id: "trace-1",
            taskId: "test-task",
            startedAt: "2023-10-01",
            initialState: {},
            actions: [],
            finalState,
        } as any,
    };
}

describe("FinalStateGrader", () => {
    const criterion: OutcomeCriterion = {
        id: "crit-1",
        name: "Test Criterion",
        description: "Checks state",
        type: "outcome",
        expectedState: {
            email: {
                recipient: "Sam",
                sent: true
            }
        }
    };

    test("correct final state -> passed: true", async () => {
        const grader = new FinalStateGrader(criterion);
        const context = createContext({
            email: {
                recipient: "Sam",
                sent: true
            }
        });

        const result = await grader.evaluate(context);
        expect(result.passed).toBe(true);
        expect(result.score).toBe(1);
    });

    test("wrong recipient -> false", async () => {
        const grader = new FinalStateGrader(criterion);
        const context = createContext({
            email: {
                recipient: "John",
                sent: true
            }
        });

        const result = await grader.evaluate(context);
        expect(result.passed).toBe(false);
        expect(result.score).toBe(0);
    });

    test("wrong sent value -> false", async () => {
        const grader = new FinalStateGrader(criterion);
        const context = createContext({
            email: {
                recipient: "Sam",
                sent: false
            }
        });

        const result = await grader.evaluate(context);
        expect(result.passed).toBe(false);
    });

    test("missing expected field -> false", async () => {
        const grader = new FinalStateGrader(criterion);
        const context = createContext({
            email: {
                recipient: "Sam"
            }
        });

        const result = await grader.evaluate(context);
        expect(result.passed).toBe(false);
    });

    test("extra fields in actual state don't cause failure", async () => {
        const grader = new FinalStateGrader(criterion);
        const context = createContext({
            email: {
                recipient: "Sam",
                sent: true,
                body: "Hello world"
            },
            spreadsheet: {
                isOpen: true
            }
        });

        const result = await grader.evaluate(context);
        expect(result.passed).toBe(true);
    });
});
