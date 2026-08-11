import { describe, expect, test } from "bun:test";
import { RevenueEmailEnvironment } from "../../src/environment/revenue-email";
import { TraceRecorder } from "../../src/tracing/recorder";
import type { Action } from "../../src/models/action";

describe("TraceRecorder", () => {
    test("initializes correctly with initial environment state", () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");

        expect(recorder.taskId).toBe("test-task");
        expect(recorder.getActions()).toEqual([]);

        const trace = recorder.getTrace();
        expect(trace.taskId).toBe("test-task");
        expect(trace.actions).toEqual([]);
        expect(trace.initialState).toBeDefined();
    });

    test("records actions executed on environment", async () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "task-1");

        const action: Action = {
            id: "act-1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        };

        const result = await recorder.execute(action);
        expect(result.success).toBe(true);

        const actions = recorder.getActions();
        expect(actions.length).toBe(1);
        expect(actions[0]?.action).toEqual(action);
        expect(actions[0]?.result.success).toBe(true);
        expect(actions[0]?.index).toBe(0);
    });


    test("stops and returns final trace", () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "task-stop");

        expect(recorder.completedAt).toBeUndefined();

        const completedTrace = recorder.stop();
        expect(completedTrace.completedAt).toBeDefined();
        expect(recorder.completedAt).toBe(completedTrace.completedAt);
    });

    test("resets recorder state", async () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "task-reset");

        await recorder.execute({
            id: "act-1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        });

        expect(recorder.getActions().length).toBe(1);
        recorder.reset();
        expect(recorder.getActions().length).toBe(0);
    });
});
