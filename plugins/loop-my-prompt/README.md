# loop-my-prompt

Rewrite prompts with explicit outcomes, observable feedback, evidence-based correction, and bounded stopping conditions without executing the underlying task.

## Skills

- **loop-my-prompt** - Rewrite a supplied prompt around a concrete goal, action, observation, comparison, correction and stopping loop. Return a copy-ready prompt and a concise explanation of the changes.

## Usage

Invoke `/loop-my-prompt` with the prompt you want to improve, or use a natural-language request:

- "Rewrite this prompt with a concrete feedback loop: [paste prompt]."
- "Improve this implementation prompt with observable acceptance criteria and bounded corrections: [paste prompt]."
- "Loop-engineer this writing prompt while preserving its word limit and output format: [paste prompt]."

The result has two sections: **Rewritten prompt**, containing the complete prompt in one fenced text block, and **What changed and why**, explaining the actual edits.

## Notes

- This is an instruction-only skill. It requires no specific model, tools, MCP server, network access or additional dependencies.
- It rewrites the supplied prompt; it does not execute the task described inside it.
- It preserves the original scope, constraints, output format and explicit effort limits. Missing essential inputs and unavailable verification must remain explicit.
- When the source has no finite effort limit, it proposes one correction pass for simple work or at most two for multi-step work, clearly identifying these as suggested defaults.
- Provide the source prompt directly or clearly identify an authorized source. Access to that source depends on the host's available capabilities and permissions.
- Automatic discovery depends on the host's Agent Skills support.

## Installation

```text
copilot plugin marketplace add microsoft/power-cat-skills
copilot plugin install loop-my-prompt@power-cat-skills
```

Start a new conversation after installation so the host can discover the skill.

## License

MIT. See the [repository license](https://github.com/microsoft/power-cat-skills/blob/main/LICENSE).
