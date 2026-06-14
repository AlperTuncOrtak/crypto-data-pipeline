# Agent Collaboration Protocol - CryptoNeko

## Context
This project (CryptoNeko Ethereum tracker) is being co-developed simultaneously by two developers: **Haluk** and **Alper**. Each developer uses their own autonomous AI agent. To prevent code overwrites, race conditions, and duplicate efforts, you **MUST** strictly adhere to this protocol.

## Pre-Flight Check (Mandatory)
Before executing any task, generating code, or modifying files, you must perform the following checks using the GitHub MCP tool:
1. **Check Current Status:** Run `git status` and check which branch you are currently on.
2. **Fetch Remote Changes:** Look at the recent commits and remote branches to see what the other developer's agent is working on.
3. **Analyze Active Tasks:** If another branch contains active modifications to the files you intend to edit, **STOP** and ask the user for confirmation before proceeding.

## Branching & Commit Rules
* Never work directly on the `main` or `dev` branches unless explicitly instructed by your user.
* Always request to create a specific feature branch (e.g., `feature/haluk-eth-api` or `feature/alper-ui-fix`).
* Keep commits small, atomic, and descriptive. Push changes frequently so the other agent can detect your progress through the GitHub MCP.

## Conflict Resolution
* If you detect a conflict or notice that the other agent is editing the exact same module/file simultaneously, pause your execution, log the conflict in the chat, and ask your user: *"Alper's agent is currently modifying this file. Should I wait, merge, or proceed with a different sub-task?"*
