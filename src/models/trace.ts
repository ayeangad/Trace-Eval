import type { TraceAction } from "./action";

export interface ActionTrace {
    id: string;
    taskId: string;

    startedAt: string;
    completedAt?: string;

    actions: TraceAction[];
}



