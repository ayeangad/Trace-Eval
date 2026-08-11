import { readFile } from "node:fs/promises";
import { evaluateTrace } from "../src/evaluation";
import { formatEvaluationReport } from "../src/reporting/format";
import type { EnvironmentTrace } from "../src/models/environment";
import type { TaskSpec } from "../src/models/task";
import { revenueEmailTask } from "../tasks/revenue-email";

const [, , command, tracePath] = process.argv;

if (command !== "evaluate" || !tracePath) {
    console.error(
        "Usage: bun run traceeval evaluate <trace.json>",
    );
    process.exit(1);
}

const trace = JSON.parse(
    await readFile(tracePath, "utf8"),
) as EnvironmentTrace;

const taskSpecs: Record<string, TaskSpec> = {
    "revenue-email": revenueEmailTask,
};

const taskSpec = taskSpecs[trace.taskId];

if (!taskSpec) {
    console.error(`Unknown task: ${trace.taskId}`);
    process.exit(1);
}

const report = await evaluateTrace(taskSpec, trace);

console.log(formatEvaluationReport(report));