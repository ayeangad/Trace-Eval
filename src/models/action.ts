export interface Action {
    id: string;
    type: string;
    input: Record<string, unknown>;
}

export interface ActionResult {
    success: boolean;
    output?: unknown;
    error?: string;
}

export interface TraceAction {
    id: string;
    index: number;
    timestamp: string;

    action: Action;
    result: ActionResult;

    durationMs?: number;
}