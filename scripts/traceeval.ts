import { readFile } from "node:fs/promises";
import { evaluateTrace } from "../src/evaluation";
import {
    formatEvaluationReport,
    formatEvaluationSummary,
} from "../src/reporting/format";
import type { EnvironmentTrace } from "../src/models/environment";
import type { TaskSpec } from "../src/models/task";
import { revenueEmailTask } from "../tasks/revenue-email";

const [, , command, ...tracePaths] = process.argv;

if (command !== "evaluate" || tracePaths.length === 0) {
    console.error(
        "Usage: bun run traceeval evaluate <trace.json> [trace.json ...]",
    );
    process.exit(1);
}

const taskSpecs: Record<string, TaskSpec> = {
    "revenue-email": revenueEmailTask,
};

const reports: Array<{
    filename: string;
    report: Awaited<ReturnType<typeof evaluateTrace>>;
}> = [];

for (const tracePath of tracePaths) {
    const trace = JSON.parse(
        await readFile(tracePath, "utf8"),
    ) as EnvironmentTrace;

    const taskSpec = taskSpecs[trace.taskId];

    if (!taskSpec) {
        console.error(
            `Unknown task '${trace.taskId}' in ${tracePath}`,
        );
        process.exit(1);
    }

    const report = await evaluateTrace(taskSpec, trace);

    reports.push({
        filename: tracePath.split("/").pop() ?? tracePath,
        report,
    });
}

if (reports.length === 1) {
    console.log(
        formatEvaluationReport(reports[0]!.report),
    );
} else {
    console.log(formatEvaluationSummary(reports));
}
