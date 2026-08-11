import type { EnvironmentTrace } from "../models/environment";
import type { Task } from "../models/task";
import type { TrajectoryJudgeResult } from "./types";

export interface TrajectoryJudge {
    evaluate(
        task: Task,
        trace: EnvironmentTrace,
    ): Promise<TrajectoryJudgeResult>;
}
