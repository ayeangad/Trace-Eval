import { describe, expect, test } from "bun:test";
import {
    RevenueEmailEnvironment,
} from "../../src/environment/revenue-email";

describe("RevenueEmailEnvironment", () => {
    test("initializes with the correct state", () => {
        const environment = new RevenueEmailEnvironment();

        expect(environment.getState()).toEqual({
            spreadsheet: {
                name: "Q3 Revenue",
                revenueRange: "B4:B11",
                revenueTotal: 482500,
            },
            email: {
                recipient: undefined,
                body: undefined,
                sent: false,
            },
        });
    });
});