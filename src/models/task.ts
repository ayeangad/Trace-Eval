import type { ActionCriterion, CriticalErrorCriterion, OutcomeCriterion, TrajectoryCriterion } from "../evaluators/criterion";

export interface Task {
    id: string;
    description: string;
    initialState: unknown;
    expectedState: unknown;
}

export interface TaskSpec {
    actionCriteria: any;
    task: Task;

    requiredOutcomes: OutcomeCriterion[];
    trajectoryCriteria: TrajectoryCriterion[];
    criticalErrorCriteria: CriticalErrorCriterion[]
}