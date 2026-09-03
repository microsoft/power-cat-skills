"""Airtable to Microsoft App Modernization agent-driven skill.

This skill is operated through SKILL.md by an AI coding agent because it requires
interactive customer choices, secure local Airtable token entry, target-platform
selection, and optional Dataverse/SharePoint/App/Flow tooling.
"""
from __future__ import annotations


RUN_MESSAGE = (
    "powercat-airtablemigration is an agent-driven skill. Open this skill folder "
    "with a coding agent and prompt: 'Use SKILL.md. Start a fresh Airtable migration run.'"
)


def run(ctx) -> None:  # type: ignore[no-untyped-def]
    """Fail fast with clear guidance if invoked through the factory runner."""
    raise NotImplementedError(RUN_MESSAGE)

