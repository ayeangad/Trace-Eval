# TraceEval

> Evaluate how an AI agent completes a task, not just whether it
> eventually succeeds.

TraceEval is an agent trajectory evaluation framework for measuring both
**task correctness** and **trajectory quality**.

The core idea is simple:

An agent can reach the correct final state while taking a poor
trajectory.

It can make an incorrect decision, recover later, take unnecessary
actions, retry failed operations, or violate a task-specific safety
constraint before eventually producing the expected result.

A final-state evaluator can miss all of that.

TraceEval combines deterministic evaluation with an LLM-based trajectory
judge so that an agent can be evaluated on both **what it achieved** and
**how it got there**.

------------------------------------------------------------------------

## Why TraceEval?

Consider an agent with this task:

> Find the Q3 revenue and email it to Sam.

A basic evaluator might only check:

``` text
recipient = Sam
body = "Total revenue: $482500"
sent = true
```

If those fields are correct, the agent passes.

But consider these two trajectories.

### Efficient trajectory

``` text
open_spreadsheet("Q3 Revenue")
        ↓
select_range("B4:B11")
        ↓
calculate_sum()
        ↓
select_contact("Sam")
        ↓
compose_email("Total revenue: $482500")
        ↓
send_email()
```

### Recovered trajectory

``` text
open_spreadsheet("Q3 Revenue")
        ↓
select_range("B4:B11")
        ↓
calculate_sum()
        ↓
select_contact("John")    ← incorrect recipient
        ↓
select_contact("Sam")     ← recovery
        ↓
compose_email(...)
        ↓
send_email()
```

Both can end with:

``` text
recipient = Sam
sent = true
```

A final-state evaluator therefore considers both successful.

TraceEval does not necessarily treat them as equivalent.

The second trajectory contains a potentially critical mistake even
though the agent recovered.

This distinction is the central motivation for the project.

------------------------------------------------------------------------

# Core idea

TraceEval evaluates an agent trajectory using multiple complementary
signals:

``` text
                         Agent
                           │
                           ▼
                    Environment
                           │
                           ▼
                    TraceRecorder
                           │
                           ▼
                    EnvironmentTrace
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
       Final State      Action       Critical Error
          Grader        Grader          Grader
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                  LLM Trajectory Judge
                           │
                           ▼
                  Evaluation Report
                           │
                           ▼
                         CLI
```

The system deliberately separates:

-   **hard constraints**, which should be deterministic
-   **qualitative trajectory judgment**, where an LLM is useful

------------------------------------------------------------------------

# What TraceEval evaluates

## 1. Final state

The `FinalStateGrader` checks whether the environment ended in the
expected state.

For example:

``` json
{
  "email": {
    "recipient": "Sam",
    "body": "Total revenue: $482500",
    "sent": true
  }
}
```

This answers:

> Did the agent ultimately accomplish the task?

This is necessary, but not sufficient.

------------------------------------------------------------------------

## 2. Action validity

The `ActionGrader` checks whether the actions taken by the agent conform
to task-defined rules.

For example:

``` ts
{
    actionType: "select_contact",
    acceptableInputs: [
        { name: "Sam" }
    ]
}
```

This allows the evaluator to distinguish between:

``` text
select_contact("Sam")
```

and:

``` text
select_contact("John")
```

The action grader is concerned with explicit, deterministic action
constraints.

------------------------------------------------------------------------

## 3. Critical errors

The `CriticalErrorGrader` detects actions that should invalidate a
trajectory even if the agent eventually recovers.

For example:

``` ts
{
    actionType: "select_contact",
    description: "Selecting John is a critical recipient error.",
    matches: {
        name: "John"
    }
}
```

If the trajectory contains:

``` text
select_contact("John")
select_contact("Sam")
```

the final state can still be correct.

But the critical error remains present in the trajectory.

This is an important distinction:

``` text
Recovery ≠ erasure of the original error
```

The evaluator preserves the historical fact that the action happened.

------------------------------------------------------------------------

## 4. LLM trajectory quality

Some properties are difficult to encode as deterministic rules.

For example:

-   Was the trajectory efficient?
-   Were there unnecessary actions?
-   Did the agent recover sensibly?
-   Was the sequence coherent?
-   Did the agent take an obviously indirect path?
-   Did the agent behave appropriately after an error?

The LLM trajectory judge evaluates these properties and returns:

-   score
-   reasoning
-   strengths
-   weaknesses
-   issues

Example:

``` json
{
  "score": 0.88,
  "reasoning": "The agent completed the task successfully but took an unnecessary detour.",
  "strengths": [
    "Correctly identified the revenue range",
    "Successfully completed the email workflow"
  ],
  "weaknesses": [
    "Selected the wrong contact before correcting it"
  ],
  "issues": [
    {
      "type": "unnecessary_action",
      "severity": "low",
      "actionIds": ["4"]
    }
  ]
}
```

The LLM judge provides qualitative signal.

It does not replace the deterministic graders.

------------------------------------------------------------------------

# Why combine deterministic and LLM evaluation?

Neither approach is sufficient on its own.

## Deterministic evaluation

Deterministic graders are useful for:

-   hard constraints
-   reproducibility
-   explicit task requirements
-   safety-critical conditions
-   regression testing
-   automated benchmarks

For example:

``` text
Expected recipient: Sam
Actual recipient: John

→ deterministic failure
```

There is no reason to ask an LLM to decide whether `"John"` equals
`"Sam"`.

------------------------------------------------------------------------

## LLM evaluation

LLM evaluation is useful when the property being evaluated is semantic
or difficult to formalize.

For example:

> Was selecting `A1:Z100` before selecting `B4:B11` an unnecessary
> detour?

That can be represented as a rule, but as task complexity increases,
manually encoding every possible inefficient trajectory becomes
impractical.

The LLM can reason over the trajectory as a whole.

------------------------------------------------------------------------

## The hybrid approach

TraceEval therefore treats the two systems differently:

``` text
Deterministic graders
        ↓
Hard constraints

LLM judge
        ↓
Qualitative trajectory assessment
```

The resulting evaluation is more informative than either:

``` text
final state = success
```

or:

``` text
LLM says the trajectory looks good
```

alone.

------------------------------------------------------------------------

# Example evaluation

TraceEval currently evaluates four trajectories for the same
`revenue-email` task.

``` text
Trace                   Outcome   Actions   Critical  Trajectory  Overall
────────────────────────────────────────────────────────────────────────────
critical-error.json     ✓         ✗         ✗         0.85        FAIL
efficient.json          ✓         ✓         ✓         0.98        PASS
failed.json             ✗         ✗         ✗         0.12        FAIL
inefficient.json        ✓         ✗         ✓         0.88        FAIL
```

The four fixtures intentionally represent different classes of behavior.

------------------------------------------------------------------------

## Efficient trajectory

``` text
Outcome       PASS
Actions       PASS
Critical      PASS
Trajectory    0.98
Overall       PASS
```

The agent takes the intended path without unnecessary actions.

------------------------------------------------------------------------

## Inefficient trajectory

``` text
Outcome       PASS
Actions       FAIL
Critical      PASS
Trajectory    0.88
Overall       FAIL
```

The agent reaches the correct final state but performs an unnecessary
range selection before selecting the required revenue range.

This demonstrates why:

``` text
final state success
```

does not necessarily imply:

``` text
trajectory quality
```

------------------------------------------------------------------------

## Critical-error trajectory

``` text
Outcome       PASS
Actions       FAIL
Critical      FAIL
Trajectory    0.85
Overall       FAIL
```

The agent eventually sends the email to Sam, but temporarily selects
John.

The final state is correct.

The trajectory is not considered clean.

This is one of the most important cases in the project because it
demonstrates the value of preserving the entire action history.

------------------------------------------------------------------------

## Failed trajectory

``` text
Outcome       FAIL
Actions       FAIL
Critical      FAIL
Trajectory    0.12
Overall       FAIL
```

The agent selects the wrong spreadsheet range, fails to recover, chooses
the wrong recipient, and sends an incorrect email.

Here, all evaluation layers agree that the trajectory failed.

------------------------------------------------------------------------

# Trace model

The evaluation system operates on a recorded `EnvironmentTrace`.

A trace contains:

``` text
initial state
     │
     ├── action
     │     └── result
     │
     ├── action
     │     └── result
     │
     ├── action
     │     └── result
     │
     ▼
final state
```

A simplified trace looks like:

``` json
{
  "id": "trace-id",
  "taskId": "revenue-email",
  "startedAt": "2026-08-11T15:39:12.707Z",
  "completedAt": "2026-08-11T15:39:12.708Z",
  "initialState": {
    "spreadsheet": {
      "name": "Q3 Revenue",
      "revenueRange": "B4:B11",
      "revenueTotal": 482500
    },
    "email": {
      "sent": false
    }
  },
  "actions": [
    {
      "id": "1",
      "index": 0,
      "timestamp": "2026-08-11T15:39:12.708Z",
      "action": {
        "id": "1",
        "type": "open_spreadsheet",
        "input": {
          "name": "Q3 Revenue"
        }
      },
      "result": {
        "success": true
      },
      "durationMs": 0.24
    }
  ],
  "finalState": {
    "email": {
      "recipient": "Sam",
      "body": "Total revenue: $482500",
      "sent": true
    }
  }
}
```

The trace is the common source of truth for all evaluators.

------------------------------------------------------------------------

# TraceRecorder

The `TraceRecorder` sits between the agent and environment.

Conceptually:

``` text
Agent
  │
  │ Action
  ▼
TraceRecorder
  │
  │ Action
  ▼
Environment
  │
  │ ActionResult
  ▼
TraceRecorder
  │
  ▼
Recorded TraceAction
```

For each action it records:

-   action ID
-   action index
-   timestamp
-   action type
-   action inputs
-   action result
-   execution duration

It also captures:

-   initial environment state
-   final environment state

This makes it possible to evaluate not only the endpoint but the
complete episode.

------------------------------------------------------------------------

# Environment abstraction

The environment exposes a small interface:

``` ts
export interface Environment<TState = unknown> {
    execute(
        action: Action
    ): ActionResult | Promise<ActionResult>;

    getState(): TState;
}
```

This keeps the tracing layer independent of the actual environment
implementation.

The current project includes a deterministic simulated environment:

``` text
RevenueEmailEnvironment
```

The environment models:

-   spreadsheet access
-   range selection
-   revenue calculation
-   contact selection
-   email composition
-   email sending

The environment is intentionally deterministic.

The goal is to study the evaluation system without introducing external
tool or API variability.

------------------------------------------------------------------------

# Task specifications

Tasks define what successful behavior means.

A task specification contains:

``` ts
export interface TaskSpec {
    task: Task;
    requiredOutcomes: OutcomeCriterion[];
    actionCriteria: ActionCriterion[];
    criticalErrorCriteria: CriticalErrorCriterion[];
}
```

This separates task semantics from the evaluator implementation.

For example:

``` text
tasks/
└── revenue-email.ts
```

contains the task-specific criteria.

The CLI does not need to know the details of the revenue-email workflow.

It resolves the task from:

``` text
trace.taskId
```

and loads the corresponding `TaskSpec`.

------------------------------------------------------------------------

# Criteria

## Outcome criterion

Defines the expected final state.

``` ts
{
    id: "final-state",
    name: "Correct final state",
    description: "The revenue email is correctly sent to Sam.",
    type: "outcome",
    expectedState: {
        email: {
            recipient: "Sam",
            body: "Total revenue: $482500",
            sent: true
        }
    }
}
```

------------------------------------------------------------------------

## Action criterion

Defines acceptable actions and inputs.

``` ts
{
    actionType: "select_contact",
    acceptableInputs: [
        { name: "Sam" }
    ]
}
```

This makes action validation explicit and deterministic.

------------------------------------------------------------------------

## Critical-error criterion

Defines actions that should be treated as critical.

``` ts
{
    actionType: "select_contact",
    description: "Selecting John is a critical recipient error.",
    matches: {
        name: "John"
    }
}
```

The evaluator scans the entire trajectory rather than only the final
state.

------------------------------------------------------------------------

# Evaluation pipeline

The central evaluation function orchestrates the individual graders.

Conceptually:

``` text
TaskSpec + EnvironmentTrace
             │
             ▼
       evaluateTrace()
             │
       ┌─────┼─────┐
       │     │     │
       ▼     ▼     ▼
    Outcome Action Critical
    Grader  Grader  Error
                    Grader
       │     │     │
       └─────┼─────┘
             │
             ▼
       LLM Trajectory
            Judge
             │
             ▼
      EvaluationReport
```

The resulting report contains independent evaluation dimensions and an
overall result.

This separation is important because a single scalar score can hide why
an agent failed.

------------------------------------------------------------------------

# Evaluation report

TraceEval reports both the individual dimensions and the overall result.

Example:

``` text
TraceEval Evaluation
────────────────────────────────

Task: revenue-email

Outcome
  ✓ Final state
  Score: 1.00

Actions
  ✓ Acceptable actions
  Score: 1.00

Critical Errors
  ✗ Critical error detected
  Score: 0.00

Trajectory Quality
  Score: 0.85

────────────────────────────────
Overall: ✗ FAIL
Trajectory score: 0.85
```

The report makes the failure inspectable.

Instead of:

``` text
score = 0
```

the user can see:

``` text
Final state: correct
Critical error: detected
Reason: wrong recipient was selected
Action: 4
```

------------------------------------------------------------------------

# CLI

TraceEval provides a simple CLI for evaluating traces.

## Single trace

``` bash
bun run scripts/traceeval evaluate traces/efficient.json
```

This produces a detailed report.

## Multiple traces

``` bash
bun run scripts/traceeval evaluate traces/*.json
```

This produces a comparison table:

``` text
TraceEval Evaluation Summary
────────────────────────────────────────────────────────────

Trace                   Outcome   Actions   Critical  Trajectory  Overall
────────────────────────────────────────────────────────────────────────────
critical-error.json     ✓         ✗         ✗         0.85        FAIL
efficient.json          ✓         ✓         ✓         0.98        PASS
failed.json             ✗         ✗         ✗         0.12        FAIL
inefficient.json        ✓         ✗         ✓         0.88        FAIL

────────────────────────────────────────────────────────────
1/4 traces passed
```

The single-trace mode is useful for debugging.

The multi-trace mode is useful for comparing agent behavior across
trajectories.

------------------------------------------------------------------------

# Project structure

``` text
TraceEval/
│
├── src/
│   │
│   ├── environment/
│   │   └── revenue-email.ts
│   │
│   ├── evaluators/
│   │   ├── action.ts
│   │   ├── criterion.ts
│   │   ├── critical-error.ts
│   │   ├── final-state.ts
│   │   └── grader.ts
│   │
│   ├── judge/
│   │   ├── llm.ts
│   │   ├── prompt.ts
│   │   └── types.ts
│   │
│   ├── models/
│   │   ├── action.ts
│   │   ├── environment.ts
│   │   ├── evaluation.ts
│   │   ├── task.ts
│   │   └── trace.ts
│   │
│   ├── reporting/
│   │   └── format.ts
│   │
│   ├── tracing/
│   │   └── recorder.ts
│   │
│   └── evaluation.ts
│
├── tasks/
│   └── revenue-email.ts
│
├── traces/
│   ├── efficient.json
│   ├── inefficient.json
│   ├── critical-error.json
│   └── failed.json
│
├── scripts/
│   └── traceeval.ts
│
├── tests/
│   ├── environments/
│   ├── evaluators/
│   ├── judge/
│   ├── reporting/
│   ├── tracing/
│   └── evaluation.test.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

------------------------------------------------------------------------

# Testing

Run the complete test suite:

``` bash
bun test
```

The test suite covers:

-   environment initialization and behavior
-   action execution
-   trace recording
-   initial and final state capture
-   deterministic final-state grading
-   action validation
-   critical-error detection
-   trajectory fixtures
-   LLM judge prompting
-   LLM trajectory evaluation
-   end-to-end evaluation
-   report formatting
-   multi-trace reporting

The project currently uses deterministic fixtures to make the behavior
of the evaluators easy to test and inspect.

The LLM integration tests are intentionally separate from the
deterministic grader tests because LLM outputs are probabilistic and
require API access.

------------------------------------------------------------------------

# LLM trajectory judge

The LLM judge receives the task and recorded trajectory and evaluates
the quality of the agent's behavior.

Its output is structured into:

``` text
score
reasoning
strengths
weaknesses
issues
```

Issues can identify categories such as:

``` text
unnecessary_action
inefficient_path
poor_recovery
confusing_action
```

The judge is used for qualitative analysis rather than enforcing exact
state transitions.

This distinction is intentional.

A useful evaluation system should not ask an LLM to perform
deterministic equality checks that a normal program can perform more
reliably.

------------------------------------------------------------------------

# Current task: Revenue Email

The current environment models a simple agent workflow.

The task is:

> Find the Q3 revenue and email the total to Sam.

The simulated spreadsheet contains:

``` text
Spreadsheet: Q3 Revenue
Revenue range: B4:B11
Revenue total: $482500
```

The intended workflow is:

``` text
1. Open Q3 Revenue
2. Select B4:B11
3. Calculate the sum
4. Select Sam
5. Compose the email
6. Send the email
```

This task is intentionally small.

The purpose is not to build a realistic spreadsheet or email client.

The purpose is to create a controlled environment in which different
trajectories can be compared.

------------------------------------------------------------------------

# Why the environment is deterministic

A trajectory evaluator should be tested independently from the
complexity of external tools.

Using a deterministic environment provides:

-   stable initial state
-   predictable action results
-   reproducible traces
-   deterministic grader tests
-   controlled failure cases
-   easy regression testing

This makes it possible to focus on the evaluation problem itself.

The environment can later be replaced with richer environments without
changing the core evaluation model.

------------------------------------------------------------------------

# Design principles

## 1. Outcomes and trajectories are different signals

A successful outcome does not imply a good trajectory.

``` text
Outcome = what happened
Trajectory = how it happened
```

TraceEval keeps both.

------------------------------------------------------------------------

## 2. Critical events should remain visible

If an agent makes a critical mistake and then recovers, the recovery
should not erase the historical event.

The trace is append-only evidence of what happened during the episode.

------------------------------------------------------------------------

## 3. Deterministic rules should handle deterministic requirements

If a requirement can be expressed precisely, it should generally be
evaluated deterministically.

For example:

``` text
recipient must equal Sam
```

does not require an LLM.

------------------------------------------------------------------------

## 4. LLMs should handle semantic judgment

If the evaluation requires broader reasoning about the trajectory, an
LLM can provide useful signal.

For example:

``` text
Was the agent's recovery reasonable?

Was this action unnecessary?

Was the trajectory coherent?
```

------------------------------------------------------------------------

## 5. Evaluation should be inspectable

The evaluator should provide evidence for its conclusion.

A useful result is:

``` text
FAIL
because:
  action 4 selected John
```

not merely:

``` text
score: 0
```

------------------------------------------------------------------------

# Limitations

TraceEval is currently a focused prototype rather than a production
evaluation platform.

Current limitations include:

### Single environment

The project currently demonstrates the architecture using one simulated
environment.

### Small task set

The current task specification focuses on the revenue-email workflow.

### LLM judge variability

LLM trajectory scores can vary between runs.

The deterministic graders are intended to provide stable hard
constraints while the LLM judge provides qualitative signal.

### No persistent evaluation store

Traces and task definitions are currently file-based.

### CLI-focused interface

The primary interface is currently the command-line evaluator rather
than a web dashboard.

These constraints are intentional for the current stage of the project.

------------------------------------------------------------------------

# Future directions

Potential extensions include:

-   multiple environments
-   reusable task registries
-   trajectory benchmark suites
-   additional deterministic graders
-   richer critical-error semantics
-   evaluator calibration
-   judge agreement analysis
-   multiple LLM judges
-   judge-vs-human correlation studies
-   persistent trace storage
-   experiment tracking
-   regression evaluation across agent versions
-   parallel evaluation of large trace sets
-   web-based evaluation dashboards

The most interesting next step is not simply adding more features.

It is understanding how different evaluation strategies correlate with
human judgments of agent behavior.

------------------------------------------------------------------------

# Development

Install dependencies:

``` bash
bun install
```

Run the tests:

``` bash
bun test
```

Type-check:

``` bash
npx tsc --noEmit
```

Evaluate one trace:

``` bash
bun run scripts/traceeval evaluate traces/efficient.json
```

Evaluate all fixtures:

``` bash
bun run scripts/traceeval evaluate traces/*.json
```

------------------------------------------------------------------------

# Summary

TraceEval is built around one idea:

> **An agent should be evaluated on its trajectory, not only its
> destination.**

A robust agent evaluation system needs to answer several different
questions:

``` text
Did the agent achieve the expected outcome?
        ↓
Did it use acceptable actions?
        ↓
Did it make any critical mistakes?
        ↓
Was the overall trajectory efficient and coherent?
```

TraceEval combines deterministic graders and an LLM trajectory judge to
answer those questions separately.

The result is an evaluation system that can distinguish:

``` text
Correct outcome
        ≠
Correct behavior
```

That distinction becomes increasingly important as AI agents move from
simple question answering toward long-horizon interaction with tools,
environments, and external systems.
