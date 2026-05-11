---
name: deploy
description: Validates the project by running the build command, and if successful, stages changes, generates a commit message, and pushes to the remote repository.
---

# Build and Commit

This skill automates the verification and deployment workflow. Use it when you have finished a task and want to ensure the code builds correctly before committing and pushing.

## Workflow

1. **Build Verification**: Run the project's build command (e.g., `npm run build`, `bun run build`).
   - If the build fails: Stop and report the errors. Do NOT commit.
2. **Staging**: If the build succeeds, stage all modified and untracked files (`git add .`).
3. **Commit Message Generation**:
   - Analyze the changes using `git diff --staged`.
   - Review the task context and `proposal.md` if available.
   - Generate a concise and descriptive commit message following the project's conventions (e.g., Conventional Commits).
4. **Commit**: Create the commit.
5. **Push**: Push the changes to the current branch on the remote repository.

## Usage Guidelines

- Always check `package.json` or project documentation to identify the correct build command.
- Ensure you have the necessary environment variables set for the build to succeed.
- If the build involves long-running processes or complex dependencies, explain this to the user before starting.
- NEVER push if the build fails. The build is the gatekeeper for system integrity.
