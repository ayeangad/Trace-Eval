import { expect, test } from "bun:test";
import {
    formatEvaluationReport,
    formatEvaluationSummary,
} from "../../src/reporting/format";
import type { EvaluationReport } from "../../src/evaluation";

test("formats an evaluation report", () => {
    const report: EvaluationReport = {
        taskId: "revenue-email",

        outcome: {
            passed: true,
            score: 1,
            reasoning: "Final state is correct.",
        },

        actions: {
            passed: true,
            score: 1,
            reasoning: "All actions were acceptable.",
        },

        criticalErrors: {
            passed: false,
            score: 0,
            reasoning: "1 critical error detected.",
            metadata: {
                violations: [
                    {
                        actionId: "4",
                        actionType: "select_contact",
                        description:
                            "Selecting John is a critical recipient error.",
                        input: {
                            name: "John",
                        },
                    },
                ],
            },
        },

        trajectory: {
            score: 0.82,
            reasoning:
                "The agent recovered but took an unnecessary detour.",
            strengths: [],
            weaknesses: [
                "Selected John before Sam.",
            ],
            issues: [
                {
                    type: "unnecessary_action",
                    severity: "low",
                    actionIds: ["4"],
                    explanation:
                        "Selecting John was unnecessary.",
                },
            ],
        },

        overall: {
            passed: false,
            score: 0.82,
        },
    };

    const output = formatEvaluationReport(report);

    expect(output).toContain("TraceEval Evaluation");
    expect(output).toContain("Task: revenue-email");
    expect(output).toContain("Critical Errors");
    expect(output).toContain("Action 4");
    expect(output).toContain("Trajectory Quality");
    expect(output).toContain("0.82");
    expect(output).toContain("Overall: ✗ FAIL");
});

test("formats multiple evaluation reports as a summary", () => {
    const report: EvaluationReport = {
        taskId: "revenue-email",

        outcome: {
            passed: true,
            score: 1,
        },

        actions: {
            passed: false,
            score: 0,
        },

        criticalErrors: {
            passed: true,
            score: 1,
        },

        trajectory: {
            score: 0.9,
            reasoning: "Minor inefficiency.",
            strengths: [],
            weaknesses: [],
            issues: [],
        },

        overall: {
            passed: false,
            score: 0.9,
        },
    };

    const efficientReport: EvaluationReport = {
        ...report,

        actions: {
            passed: true,
            score: 1,
        },

        trajectory: {
            ...report.trajectory,
            score: 0.98,
        },

        overall: {
            passed: true,
            score: 0.98,
        },
    };

    const output = formatEvaluationSummary([
        {
            filename: "efficient.json",
            report: efficientReport,
        },
        {
            filename: "inefficient.json",
            report,
        },
    ]);

    expect(output).toContain("TraceEval Evaluation Summary");
    expect(output).toContain("efficient.json");
    expect(output).toContain("inefficient.json");
    expect(output).toContain("0.98");
    expect(output).toContain("0.90");
    expect(output).toContain("1/2 traces passed");
});
