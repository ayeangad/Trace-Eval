import type { Action, ActionResult, TraceAction } from "../models/action.js";
import type { Environment, EnvironmentTrace } from "../models/environment.js";

export class TraceRecorder<TState = unknown> {
    private readonly actions: TraceAction[] = [];
    private readonly startedAt: string;
    private readonly initialState: TState;

    constructor(
        private readonly environment: Environment<TState>,
        private readonly taskId: string,
    ) {
        this.startedAt = new Date().toISOString();
        this.initialState = structuredClone(environment.getState());
    }

    async execute(action: Action): Promise<ActionResult> {
        const startTime = performance.now();

        const result = await this.environment.execute(action);

        const durationMs = performance.now() - startTime;

        this.actions.push({
            id: action.id,
            index: this.actions.length,
            timestamp: new Date().toISOString(),
            action,
            result,
            durationMs,
        });

        return result;
    }

    getTrace(): EnvironmentTrace {
        return {
            id: crypto.randomUUID(),
            taskId: this.taskId,
            startedAt: this.startedAt,
            completedAt: new Date().toISOString(),
            initialState: structuredClone(this.initialState),
            actions: structuredClone(this.actions),
            finalState: structuredClone(this.environment.getState()),
        };
    }
}