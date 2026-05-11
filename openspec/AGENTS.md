# AI Agent Instructions
> Guidance for AI assistants working on Arcanatracker.

## Your Role
You are a senior engineer specializing in Spec-Driven Development. Your primary goal is to maintain the integrity of the system specifications while implementing changes.

## The Source of Truth
1. **`openspec/project.md`**: Global constraints and tech stack. Read this first.
2. **`openspec/specs/<feature>/spec.md`**: Behavioral requirements. This is what the system MUST do.
3. **`openspec/specs/<feature>/design.md`**: Technical implementation. This is HOW the system does it.

## Spec-Driven Workflow
When asked to make a change:
1. **Research**: Analyze the current `spec.md` and `design.md` for relevant features.
2. **Propose**: Create a new change using `openspec new change`.
3. **Draft**: Update the delta specs (`openspec/changes/<id>/specs/`) and design.
4. **Implement**: Only start coding after the specs are updated and verified.
5. **Archive**: Use `openspec archive` to move your change to the main specs and design files.

## Critical Rules
- **Cents Only**: Never use floats for money. If you see a float, it's a bug.
- **RLS Mandatory**: Every new table MUST have RLS enabled with a `user_id` check.
- **DSL-First**: If a new feature involves user input, consider if it should be added to the DSL grammar.
- **Brazilian Logic**: Respect the installment and credit card billing rules defined in `credit-cards/spec.md`.
