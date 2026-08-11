import type { OutcomeCriterion } from "./criterion";
import type {
    EvaluationContext,
    Grader,
    GraderResult,
} from "./grader";

export class FinalStateGrader implements Grader {
    constructor(
        public readonly criterion: OutcomeCriterion,
    ) { }

    async evaluate(context: EvaluationContext): Promise<GraderResult> {
        const expected = this.criterion.expectedState;
        const actual = context.trace.finalState;

        const passed = matchesExpectedState(actual, expected);

        return {
            passed,
            score: passed ? 1 : 0,
            reasoning: passed
                ? `Final state satisfies criterion "${this.criterion.name}".`
                : `Final state does not satisfy criterion "${this.criterion.name}".`,
        };
    }
}

function matchesExpectedState(
    actual: unknown,
    expected: unknown,
): boolean {
    if (expected === undefined) {
        return true;
    }

    if (
        typeof expected !== "object" ||
        expected === null
    ) {
        return Object.is(actual, expected);
    }

    if (
        typeof actual !== "object" ||
        actual === null
    ) {
        return false;
    }

    for (const [key, expectedValue] of Object.entries(
        expected as Record<string, unknown>,
    )) {
        const actualValue = (actual as Record<string, unknown>)[key];

        if (!matchesExpectedState(actualValue, expectedValue)) {
            return false;
        }
    }

    return true;
}

