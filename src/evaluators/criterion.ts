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
