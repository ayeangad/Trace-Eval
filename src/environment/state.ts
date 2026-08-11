export interface RevenueEmailState {
  spreadsheet: {
    name: string;
    revenueRange: string;
    revenueTotal: number;
  };
  email: {
    recipient?: string;
    body?: string;
    sent: boolean;
  };
}

export function createInitialRevenueEmailState(): RevenueEmailState {
  return {
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
  };
}