import OpenAI from "openai";
import type { EnvironmentTrace } from "../models/environment";
import type { Task } from "../models/task";
import type { TrajectoryJudge } from "./trajectory";
import type { TrajectoryJudgeResult } from "./types";
import { buildTrajectoryJudgePrompt } from "./prompt";

export interface LLMJudgeOptions {
    model?: string;
}

export class LLMTrajectoryJudge implements TrajectoryJudge {
    private readonly client: OpenAI;
    private readonly model: string;

    constructor(options: LLMJudgeOptions = {}) {
        this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.model = "gpt-5.4-mini"
    }

    async evaluate(
        task: Task,
        trace: EnvironmentTrace,
    ): Promise<TrajectoryJudgeResult> {
        const prompt = buildTrajectoryJudgePrompt(task, trace);

        const response = await this.client.responses.create({
            model: this.model,
            instructions: `
You are an expert evaluator of AI agent trajectories.

Evaluate the agent's process, not merely its final result.

Be conservative:
- Do not call a valid recovery a failure.
- Distinguish unnecessary actions from critical mistakes.
- Consider whether actions were reasonable given the task.
- Do not penalize the agent for actions that are required to complete the task.
- Base your evaluation only on the task and trajectory provided.

Return ONLY valid JSON matching the requested schema.
      `.trim(),
            input: prompt,
            text: {
                format: {
                    type: "json_schema",
                    name: "trajectory_judge_result",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            score: {
                                type: "number",
                                minimum: 0,
                                maximum: 1,
                            },
                            reasoning: {
                                type: "string",
                            },
                            strengths: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                            },
                            weaknesses: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                            },
                            issues: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        type: {
                                            type: "string",
                                            enum: [
                                                "unnecessary_action",
                                                "poor_recovery",
                                                "inefficient_path",
                                                "confusing_action",
                                                "other",
                                            ],
                                        },
                                        severity: {
                                            type: "string",
                                            enum: ["low", "medium", "high"],
                                        },
                                        actionIds: {
                                            type: "array",
                                            items: {
                                                type: "string",
                                            },
                                        },
                                        explanation: {
                                            type: "string",
                                        },
                                    },
                                    required: [
                                        "type",
                                        "severity",
                                        "actionIds",
                                        "explanation",
                                    ],
                                    additionalProperties: false,
                                },
                            },
                        },
                        required: [
                            "score",
                            "reasoning",
                            "strengths",
                            "weaknesses",
                            "issues",
                        ],
                        additionalProperties: false,
                    },
                },
            },
        });

        if (!response.output_text) {
            throw new Error("LLM judge returned an empty response.");
        }

        return JSON.parse(response.output_text) as TrajectoryJudgeResult;
    }
}
