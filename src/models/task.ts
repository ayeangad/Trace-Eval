import type { ActionCriterion, CriticalErrorCriterion, OutcomeCriterion } from "../evaluators/criterion";

export interface Task {
    id: string;
    description: string;
    initialState: unknown;
    expectedState: unknown;
}

export interface TaskSpec {
    task: Task;

    actionCriteria: ActionCriterion[];
    requiredOutcomes: OutcomeCriterion[];
    criticalErrorCriteria: CriticalErrorCriterion[]
}