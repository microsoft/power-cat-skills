"""PowerCAT Access Migration  the named Access-to-Dataverse entry point.

This workload is a thin, friendly alias over the proven Access migration pipeline. It reuses the
`access-to-dataverse` reference skill's `customize` hook (sensitive-column flagging, standard
recommendations, and the optional model-driven-app build) so behaviour stays identical and there is a
single source of truth. Edit `mapping.yaml` to describe your Access database.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path

from mpf.core.models import MigrationResult, SourceModel
from mpf.engine import RunContext

# Load the reference skill's hooks so we don't duplicate behaviour.
_ref = Path(__file__).resolve().parents[1] / "access-to-dataverse" / "run.py"
_spec = importlib.util.spec_from_file_location("access_to_dataverse_run", _ref)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)


def customize(ctx: RunContext, source: SourceModel, result: MigrationResult) -> None:
    """Delegate to the access-to-dataverse reference hooks (same behaviour, single source of truth)."""
    _mod.customize(ctx, source, result)
