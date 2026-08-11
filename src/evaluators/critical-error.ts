import type {
  CriticalErrorCriterion,
  CriticalErrorRule,
} from "./criterion";
import type {
  EvaluationContext,
  Grader,
  GraderResult,
} from "./grader";

export class CriticalErrorGrader implements Grader {
  constructor(
    public readonly criterion: CriticalErrorCriterion,
  ) {}

  async evaluate(
    context: EvaluationContext,
  ): Promise<GraderResult> {
    const violations: Array<{
      actionId: string;
      actionType: string;
      description: string;
      input: Record<string, unknown>;
    }> = [];

    for (const traceAction of context.trace.actions) {
      const matchedRules = this.criterion.rules.filter(
        (rule) =>
          rule.actionType === traceAction.action.type &&
          matchesInput(traceAction.action.input, rule.matches),
      );

      for (const rule of matchedRules) {
        violations.push({
          actionId: traceAction.id,
          actionType: traceAction.action.type,
          description: rule.description,
          input: traceAction.action.input,
        });
      }
    }

    const passed = violations.length === 0;

    return {
      passed,
      score: passed ? 1 : 0,
      reasoning: passed
        ? "No critical errors were detected."
        : `${violations.length} critical error(s) detected.`,
      metadata: {
        violations,
      },
    };
  }
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