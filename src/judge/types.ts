export interface TrajectoryJudgeResult {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  issues: TrajectoryIssue[];
}

export interface TrajectoryIssue {
  type:
    | "unnecessary_action"
    | "poor_recovery"
    | "inefficient_path"
    | "confusing_action"
    | "other";

  severity: "low" | "medium" | "high";

  actionIds: string[];

  explanation: string;
}
