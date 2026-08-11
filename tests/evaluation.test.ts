import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { evaluateTrace } from "../src/evaluation";
import type { EnvironmentTrace } from "../src/models/environment";
import type { TaskSpec } from "../src/models/task";

async function loadTrace(filename: string): Promise<EnvironmentTrace> {
    const content = await readFile(`traces/${filename}`, "utf8");
    return JSON.parse(content);
}

const taskSpec: TaskSpec = {
    task: {
        id: "revenue-email",
        description:
            "Find the total revenue in the Q3 Revenue spreadsheet and email it to Sam.",
        initialState: {},
        expectedState: {
            email: {
                recipient: "Sam",
                body: "Total revenue: $482500",
                sent: true,
            },
        },
    },

    requiredOutcomes: [
        {
            id: "final-state",
            name: "Correct final state",
            description: "The revenue email is correctly sent to Sam.",
            type: "outcome",
            expectedState: {
                email: {
                    recipient: "Sam",
                    body: "Total revenue: $482500",
                    sent: true,
                },
            },
        },
    ],

    actionCriteria: [
        {
            id: "valid-actions",
            name: "Valid actions",
            description: "The agent uses only appropriate actions and inputs.",
            type: "action",
            rules: [
                {
                    actionType: "open_spreadsheet",
                    acceptableInputs: [{ name: "Q3 Revenue" }],
                },
                {
                    actionType: "select_range",
                    acceptableInputs: [{ range: "B4:B11" }],
                },
                {
                    actionType: "calculate_sum",
                },
                {
                    actionType: "select_contact",
                    acceptableInputs: [{ name: "Sam" }],
                },
                {
                    actionType: "compose_email",
                },
                {
                    actionType: "send_email",
                },
            ],
        },
    ],

    criticalErrorCriteria: [
        {
            id: "critical-errors",
            name: "No critical errors",
            description:
                "The agent must not select the wrong recipient.",
            type: "critical_error",
            rules: [
                {
                    actionType: "select_contact",
                    description:
                        "Selecting John is a critical recipient error.",
                    matches: {
                        name: "John",
                    },
                },
            ],
        },
    ],
};

describe("TraceEval end-to-end evaluation", () => {
    test("efficient trajectory passes", async () => {
        const trace = await loadTrace("efficient.json");

        const report = await evaluateTrace(taskSpec, trace);

        expect(report.overall.passed).toBe(true);
        expect(report.outcome.passed).toBe(true);
        expect(report.actions.passed).toBe(true);
        expect(report.criticalErrors.passed).toBe(true);
        expect(report.trajectory.score).toBeGreaterThan(0.8);
    }, 15000);

    test("critical error causes overall failure despite correct final state", async () => {
        const trace = await loadTrace("critical-error.json");

        const report = await evaluateTrace(taskSpec, trace);

        expect(report.outcome.passed).toBe(true);
        expect(report.criticalErrors.passed).toBe(false);
        expect(report.overall.passed).toBe(false);
    }, 15000);

    test("failed trajectory fails overall evaluation", async () => {
        const trace = await loadTrace("failed.json");

        const report = await evaluateTrace(taskSpec, trace);

        expect(report.overall.passed).toBe(false);
        expect(report.outcome.passed).toBe(false);
    }, 15000);
});
