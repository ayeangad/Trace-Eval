export interface Criterion {
    id: string;
    name: string;
    description: string;
}

export interface OutcomeCriterion extends Criterion {
    type?: "outcome";
    expectedState?: unknown;
}

export interface TrajectoryCriterion extends Criterion {
    type?: "trajectory";
    rules?: string[];
}

export interface ActionCriterion extends Criterion {
    type?: "action";
    rules: ActionRule[];
}

export interface ActionRule {
    actionType: string;
    acceptableInputs?: Record<string, unknown>[];
}