import { describe, expect, test } from "bun:test";
import { RevenueEmailEnvironment } from "../../src/environment/revenue-email";
import { TraceRecorder } from "../../src/tracing/recorder";
import type { Action } from "../../src/models/action";

describe("TraceRecorder", () => {
    test("recorder initializes with the correct taskId and initialState through getTrace()", () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");
        
        const trace = recorder.getTrace();
        expect(trace.taskId).toBe("test-task");
        expect(trace.initialState).toBeDefined();
        expect(trace.initialState).toEqual(env.getState());
    });

    test("calling getTrace() before any actions returns an empty action list", () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");
        
        const trace = recorder.getTrace();
        expect(trace.actions).toEqual([]);
    });

    test("execute() executes and records an action, mutates environment", async () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");
        
        const action: Action = {
            id: "act-1",
            type: "select_contact",
            input: { name: "John Doe" },
        };
        
        const result = await recorder.execute(action);
        expect(result.success).toBe(true);
        
        const trace = recorder.getTrace();
        expect(trace.actions.length).toBe(1);
        expect(trace.actions[0]?.action).toEqual(action);
        expect(trace.actions[0]?.result).toEqual(result);
        
        expect(env.getState().email.recipient).toBe("John Doe");
        expect((trace.finalState as any).email.recipient).toBe("John Doe");
    });

    test("failed actions are recorded", async () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");
        
        const action: Action = {
            id: "act-fail",
            type: "invalid_action_type",
            input: {},
        };
        
        const result = await recorder.execute(action);
        expect(result.success).toBe(false);
        
        const trace = recorder.getTrace();
        expect(trace.actions.length).toBe(1);
        expect(trace.actions[0]?.action).toEqual(action);
        expect(trace.actions[0]?.result).toEqual(result);
    });

    test("getTrace() contains initialState, actions, and finalState, and action ordering is preserved", async () => {
        const env = new RevenueEmailEnvironment();
        const recorder = new TraceRecorder(env, "test-task");
        
        const action1: Action = {
            id: "act-1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        };
        
        const action2: Action = {
            id: "act-2",
            type: "select_range",
            input: { range: "A1:A5" },
        };
        
        await recorder.execute(action1);
        await recorder.execute(action2);
        
        const trace = recorder.getTrace();
        
        expect(trace.initialState).toBeDefined();
        
        expect(trace.actions.length).toBe(2);
        expect(trace.actions[0]?.action.id).toBe("act-1");
        expect(trace.actions[0]?.index).toBe(0);
        expect(trace.actions[1]?.action.id).toBe("act-2");
        expect(trace.actions[1]?.index).toBe(1);
        
        expect(trace.finalState).toBeDefined();
    });
});
