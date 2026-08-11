import type { OutcomeCriterion, TrajectoryCriterion } from "../evaluators/criterion";

export interface Task {
    id: string;
    description: string;

    initialState: unknown;
    expectedState: unknown;
}

export interface TaskSpec {
    task: Task;

    requiredOutcomes: OutcomeCriterion[];
    trajectoryCriteria: TrajectoryCriterion[];
}