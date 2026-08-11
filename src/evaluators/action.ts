import type { Criterion } from "./criterion";
import type {
    EvaluationContext,
    Grader,
    GraderResult,
} from "./grader";

export class ActionGrader implements Grader {
    constructor(
        public readonly criterion: Criterion,
    ) { }

    async evaluate(context: EvaluationContext): Promise<GraderResult> {
        const failedActions = context.trace.actions.filter(
            (action) => !action.result.success,
        );

        if (failedActions.length === 0) {
            return {
                passed: true,
                score: 1,
                reasoning: "All actions executed successfully.",
            };
        }

        return {
            passed: false,
            score: 0,
            reasoning: `${failedActions.length} action(s) failed.`,
            metadata: {
                failedActions: failedActions.map((action) => ({
                    id: action.id,
                    type: action.action.type,
                    error: action.result.error,
                })),
            },
        };
    }
}