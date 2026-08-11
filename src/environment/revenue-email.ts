import type { Action, ActionResult } from "../models/action";
import type { Environment } from "../models/environment";
import { type RevenueEmailState, createInitialRevenueEmailState } from "./state";

export class RevenueEmailEnvironment implements Environment<RevenueEmailState> {
    private openedSpreadsheet?: string;
    private selectedRange?: string;
    private calculatedTotal?: number;

    constructor(
        private state: RevenueEmailState = createInitialRevenueEmailState(),
    ) { }

    execute(action: Action): ActionResult {
        switch (action.type) {
            case "open_spreadsheet": {
                const name = action.input.name as string;
                if (name !== this.state.spreadsheet.name) {
                    return { success: false, error: `Spreadsheet '${name}' not found.` };
                }
                this.openedSpreadsheet = name;
                return { success: true };
            }
            case "select_range": {
                if (!this.openedSpreadsheet) {
                    return { success: false, error: "Cannot select range: no spreadsheet is currently open." };
                }
                const range = action.input.range as string;
                this.selectedRange = range;
                return { success: true };
            }
            case "calculate_sum": {
                if (!this.selectedRange) {
                    return { success: false, error: "Cannot calculate sum: no range is selected." };
                }
                if (this.selectedRange !== this.state.spreadsheet.revenueRange) {
                    return { success: false, error: `Cannot calculate sum for range '${this.selectedRange}'.` };
                }
                this.calculatedTotal = this.state.spreadsheet.revenueTotal;
                return { success: true };
            }
            case "select_contact": {
                const recipient = (action.input.name ?? action.input.contact) as string;
                if (!recipient) {
                    return { success: false, error: "No contact provided." };
                }
                this.state.email.recipient = recipient;
                return { success: true };
            }
            case "send_email": {
                if (!this.state.email.recipient) {
                    return {
                        success: false,
                        error: "Cannot send email without a recipient."
                    };
                }

                if (!this.state.email.body) {
                    return {
                        success: false,
                        error: "Cannot send email without a body."
                    };
                }

                this.state.email.sent = true;
                return { success: true };
            }
            case "compose_email": {
                const body = action.input.body as string;

                if (!body) {
                    return {
                        success: false,
                        error: "Cannot compose email with an empty body.",
                    };
                }

                this.state.email.body = body;

                return { success: true };
            }
            default:
                return { success: false, error: `Unknown action type: ${action.type}` };
        }
    }

    getState(): RevenueEmailState {
        return structuredClone(this.state);
    }
}