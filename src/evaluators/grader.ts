import type { Task } from "../models/task";
import type { EnvironmentTrace } from "../models/environment";
import type { Criterion } from "./criterion";

export interface EvaluationContext {
    task: Task;
    trace: EnvironmentTrace;
}

export interface Grader {
    criterion: Criterion;

    evaluate(context: EvaluationContext): Promise<GraderResult>;
}

export interface GraderResult {
    passed: boolean;
    score: number;
    reasoning?: string;
    metadata?: Record<string, unknown>;
}