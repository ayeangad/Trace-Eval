import { RevenueEmailEnvironment } from "../src/environment/revenue-email";
import { TraceRecorder } from "../src/tracing/recorder";
import type { Action } from "../src/models/action.js";

async function generateTrace(
    filename: string,
    actions: Action[],
) {
    const environment = new RevenueEmailEnvironment();
    const recorder = new TraceRecorder(environment, "revenue-email");

    for (const action of actions) {
        await recorder.execute(action);
    }

    const trace = recorder.getTrace();

    await Bun.write(
        `traces/${filename}`,
        JSON.stringify(trace, null, 2),
    );
}

async function main() {
    await generateTrace("efficient.json", [
        {
            id: "1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        },
        {
            id: "2",
            type: "select_range",
            input: { range: "B4:B11" },
        },
        {
            id: "3",
            type: "calculate_sum",
            input: {},
        },
        {
            id: "4",
            type: "select_contact",
            input: { name: "Sam" },
        },
        {
            id: "5",
            type: "compose_email",
            input: { body: "Total revenue: $482500" },
        },
        {
            id: "6",
            type: "send_email",
            input: {},
        },
    ]);

    await generateTrace("inefficient.json", [
        {
            id: "1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        },
        {
            id: "2",
            type: "select_range",
            input: { range: "A1:Z100" },
        },
        {
            id: "3",
            type: "select_range",
            input: { range: "B4:B11" },
        },
        {
            id: "4",
            type: "calculate_sum",
            input: {},
        },
        {
            id: "5",
            type: "select_contact",
            input: { name: "Sam" },
        },
        {
            id: "6",
            type: "compose_email",
            input: { body: "Total revenue: $482500" },
        },
        {
            id: "7",
            type: "send_email",
            input: {},
        },
    ]);

    await generateTrace("failed.json", [
        {
            id: "1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        },
        {
            id: "2",
            type: "select_range",
            input: { range: "A1:A5" },
        },
        {
            id: "3",
            type: "calculate_sum",
            input: {},
        },
        {
            id: "4",
            type: "select_contact",
            input: { name: "John" },
        },
        {
            id: "5",
            type: "compose_email",
            input: { body: "Total revenue: $100" },
        },
        {
            id: "6",
            type: "send_email",
            input: {},
        },
    ]);
    await generateTrace("critical-error.json", [
        {
            id: "1",
            type: "open_spreadsheet",
            input: { name: "Q3 Revenue" },
        },
        {
            id: "2",
            type: "select_range",
            input: { range: "B4:B11" },
        },
        {
            id: "3",
            type: "calculate_sum",
            input: {},
        },
        {
            id: "4",
            type: "select_contact",
            input: { name: "John" },
        },
        {
            id: "5",
            type: "select_contact",
            input: { name: "Sam" },
        },
        {
            id: "6",
            type: "compose_email",
            input: { body: "Total revenue: $482500" },
        },
        {
            id: "7",
            type: "send_email",
            input: {},
        },
    ]);
}

await main();
