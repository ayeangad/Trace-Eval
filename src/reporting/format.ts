import type { EvaluationReport } from "../evaluation";

export function formatEvaluationReport(
    report: EvaluationReport,
): string {
    const lines: string[] = [];

    lines.push("TraceEval Evaluation");
    lines.push("────────────────────────────────");
    lines.push("");
    lines.push(`Task: ${report.taskId}`);
    lines.push("");

    lines.push("Outcome");
    lines.push(
        `  ${status(report.outcome.passed)} Final state`,
    );
    lines.push(
        `  Score: ${report.outcome.score.toFixed(2)}`,
    );

    if (report.outcome.reasoning) {
        lines.push(`  ${report.outcome.reasoning}`);
    }

    lines.push("");

    lines.push("Actions");
    lines.push(
        `  ${status(report.actions.passed)} Acceptable actions`,
    );
    lines.push(
        `  Score: ${report.actions.score.toFixed(2)}`,
    );

    if (report.actions.reasoning) {
        lines.push(`  ${report.actions.reasoning}`);
    }

    lines.push("");

    lines.push("Critical Errors");
    lines.push(
        `  ${status(report.criticalErrors.passed)} No critical errors`,
    );
    lines.push(
        `  Score: ${report.criticalErrors.score.toFixed(2)}`,
    );

    if (report.criticalErrors.reasoning) {
        lines.push(`  ${report.criticalErrors.reasoning}`);
    }

    const criticalViolations =
        report.criticalErrors.metadata?.violations;

    if (Array.isArray(criticalViolations)) {
        for (const violation of criticalViolations) {
            lines.push(
                `  → Action ${violation.actionId}: ${violation.description}`,
            );
        }
    }

    lines.push("");

    lines.push("Trajectory Quality");
    lines.push(
        `  Score: ${report.trajectory.score.toFixed(2)}`,
    );

    lines.push(
        `  ${report.trajectory.reasoning}`,
    );

    if (report.trajectory.issues.length > 0) {
        lines.push("");
        lines.push("  Issues:");

        for (const issue of report.trajectory.issues) {
            lines.push(
                `  → [${issue.severity}] ${issue.type} ` +
                `(actions: ${issue.actionIds.join(", ")})`,
            );
            lines.push(
                `    ${issue.explanation}`,
            );
        }
    }

    lines.push("");

    lines.push("────────────────────────────────");

    lines.push(
        `Overall: ${status(report.overall.passed)} ` +
        `${report.overall.passed ? "PASS" : "FAIL"}`,
    );

    lines.push(
        `Trajectory score: ${report.overall.score.toFixed(2)}`,
    );

    return lines.join("\n");
}

function status(passed: boolean): string {
    return passed ? "✓" : "✗";
}
