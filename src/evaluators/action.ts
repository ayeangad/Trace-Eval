import type { ActionCriterion, ActionRule } from "./criterion";
import type {
    EvaluationContext,
    Grader,
    GraderResult,
} from "./grader";

export class ActionGrader implements Grader {
    constructor(
        public readonly criterion: ActionCriterion,
    ) { }

    async evaluate(context: EvaluationContext): Promise<GraderResult> {
        const violations: Array<{
            actionId: string;
            actionType: string;
            input: Record<string, unknown>;
            reason: string;
        }> = [];

        for (const traceAction of context.trace.actions) {
            const rule = this.criterion.rules.find(
                (rule) => rule.actionType === traceAction.action.type,
            );

            if (!rule) {
                continue;
            }

            if (!isAcceptableInput(traceAction.action.input, rule)) {
                violations.push({
                    actionId: traceAction.id,
                    actionType: traceAction.action.type,
                    input: traceAction.action.input,
                    reason: "Action input is not in the acceptable action set.",
                });
            }
        }

        const passed = violations.length === 0;

        return {
            passed,
            score: passed ? 1 : 0,
            reasoning: passed
                ? "All evaluated actions were within their acceptable action sets."
                : `${violations.length} action(s) violated the acceptable action rules.`,
            metadata: {
                violations,
            },
        };
    }
}

function isAcceptableInput(
    input: Record<string, unknown>,
    rule: ActionRule,
): boolean {
    if (!rule.acceptableInputs || rule.acceptableInputs.length === 0) {
        return true;
    }

    return rule.acceptableInputs.some(
        (acceptableInput) => matchesInput(input, acceptableInput),
    );
}

function matchesInput(
    actual: Record<string, unknown>,
    expected: Record<string, unknown>,
): boolean {
    return Object.entries(expected).every(
        ([key, expectedValue]) =>
            Object.is(actual[key], expectedValue),
    );
}

