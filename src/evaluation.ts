import type { EnvironmentTrace } from "./models/environment";
import type { TaskSpec } from "./models/task";
import type { GraderResult } from "./evaluators/grader";
import type { TrajectoryJudgeResult } from "./judge/types";
import { FinalStateGrader } from "./evaluators/final-state";
import { ActionGrader } from "./evaluators/action";
import { CriticalErrorGrader } from "./evaluators/critical-error";
import { LLMTrajectoryJudge } from "./judge/llm";

export interface EvaluationReport {
    taskId: string;

    outcome: GraderResult;
    actions: GraderResult;
    criticalErrors: GraderResult;
    trajectory: TrajectoryJudgeResult;

    overall: {
        passed: boolean;
        score: number;
    };
}

export async function evaluateTrace(
    taskSpec: TaskSpec,
    trace: EnvironmentTrace,
): Promise<EvaluationReport> {
    const context = {
        task: taskSpec.task,
        trace,
    };

    const outcome = await new FinalStateGrader(
        taskSpec.requiredOutcomes[0]!,
    ).evaluate(context);

    const actions = await new ActionGrader(
        taskSpec.actionCriteria[0]!,
    ).evaluate(context);

    const criticalErrors = await new CriticalErrorGrader(
        taskSpec.criticalErrorCriteria[0]!,
    ).evaluate(context);

    const trajectory = await new LLMTrajectoryJudge().evaluate(
        taskSpec.task,
        trace,
    );

    const passed =
        outcome.passed &&
        actions.passed &&
        criticalErrors.passed;

    return {
        taskId: taskSpec.task.id,
        outcome,
        actions,
        criticalErrors,
        trajectory,
        overall: {
            passed,
            score: trajectory.score,
        },
    };
}
