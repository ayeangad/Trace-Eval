import type { TaskSpec } from "../src/models/task";

export const revenueEmailTask: TaskSpec = {
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
            description: "The agent uses appropriate actions.",
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
            description: "The agent must not select the wrong recipient.",
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
