import type { Action, ActionResult } from "./action";
import type { ActionTrace } from "./trace";

export interface Environment<TState = unknown> {
    execute(action: Action): ActionResult | Promise<ActionResult>;
    getState(): TState;
}

export interface EnvironmentTrace extends ActionTrace {
    initialState?: unknown;
    finalState?: unknown;
}
