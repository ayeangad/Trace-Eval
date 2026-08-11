import type { Action, ActionResult, TraceAction } from "../models/action";
import type { Environment, EnvironmentTrace } from "../models/environment";
import type { RevenueEmailEnvironment } from "../environment/revenue-email";
import type { ActionTrace } from "../models/trace";


export class TraceRecorder {
    private actions: TraceAction[] = [];
    private readonly startedAt: string;

    constructor(
        private readonly environment: RevenueEmailEnvironment,
        private readonly taskId: string,
    ) {
        this.startedAt = new Date().toISOString();
    }

    execute(action: Action): ActionResult {
        const startTime = performance.now();
        const result = this.environment.execute(action);
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

    getTrace(): ActionTrace {
        return {
            id: crypto.randomUUID(),
            taskId: this.taskId,
            startedAt: this.startedAt,
            completedAt: new Date().toISOString(),
            actions: structuredClone(this.actions),
        };
    }
}
