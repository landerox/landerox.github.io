#!/usr/bin/env python3
"""Prepare hook environments with bounded recovery from npm download failures."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import re
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RETRY_DELAYS = (60, 120)
DEFAULT_RELEASE_AGE_DAYS = 1
NPM_DOWNLOAD_ERROR = re.compile(
    r"(?im)^\s*npm (?:error|ERR!) code "
    r"(?:EAI_AGAIN|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|"
    r"ENETUNREACH|EHOSTUNREACH|E429|E5\d\d)\s*$"
)
NPM_TARBALL_NOT_FOUND = re.compile(
    r"npm (?:error|ERR!) 404 Not Found - GET https?://\S+/-/\S+\.tgz(?:\s|$)"
)


def retryable_download_error(output: str) -> bool:
    """A missing tarball may be transient; a missing version or config is not."""
    plain = re.sub(r"\x1b\[[0-9;]*m", "", output)
    return bool(
        NPM_DOWNLOAD_ERROR.search(plain)
        or (
            re.search(r"(?im)^\s*npm (?:error|ERR!) code E404\s*$", plain)
            and NPM_TARBALL_NOT_FOUND.search(plain)
        )
    )


def npm_environment(release_age_days: int) -> dict[str, str]:
    """Apply the same release age to npm inside pre-commit's isolated Node."""
    environment = {
        key: value
        for key, value in os.environ.items()
        if key.lower() != "npm_config_min_release_age"
    }
    environment["npm_config_min_release_age"] = str(release_age_days)
    return environment


def cache_key(release_age_days: int) -> str:
    """Invalidate installed environments when runtimes, pins or policy change."""
    runtimes = {
        "python": sys.version,
        "node": subprocess.check_output(["node", "--version"], text=True).strip(),
        "npm": subprocess.check_output(["npm", "--version"], text=True).strip(),
        "release_age_days": release_age_days,
    }
    digest = hashlib.sha256(json.dumps(runtimes, sort_keys=True).encode())
    for relative in (
        ".pre-commit-config.yaml",
        "uv.lock",
        "scripts/install_precommit_hooks.py",
    ):
        digest.update(relative.encode() + b"\0" + (ROOT / relative).read_bytes())
    return f"pre-commit-v1-{platform.system()}-{platform.machine()}-{digest.hexdigest()}"


def install_hooks(release_age_days: int) -> int:
    """Install only; lint and audits run once in their separate workflow steps."""
    environment = npm_environment(release_age_days)
    attempts = len(RETRY_DELAYS) + 1
    for attempt in range(attempts):
        print(
            f"Preparing hook environments: attempt {attempt + 1}/{attempts}; "
            f"minimum npm release age {release_age_days} day(s).",
            flush=True,
        )
        result = subprocess.run(
            ["uv", "run", "pre-commit", "install-hooks"],
            cwd=ROOT,
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            check=False,
        )
        output = result.stdout or ""
        print(output, end="" if output.endswith("\n") else "\n", flush=True)
        if result.returncode == 0:
            if attempt:
                print(f"Hook installation recovered on attempt {attempt + 1}.")
            return 0
        if attempt == len(RETRY_DELAYS) or not retryable_download_error(output):
            return result.returncode
        delay = RETRY_DELAYS[attempt]
        print(f"npm download failed; retrying installation in {delay} seconds.", flush=True)
        time.sleep(delay)
    raise AssertionError("unreachable")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache-key", action="store_true")
    arguments = parser.parse_args()
    try:
        release_age_days = int(
            os.environ.get(
                "PRE_COMMIT_NPM_MIN_RELEASE_AGE_DAYS", str(DEFAULT_RELEASE_AGE_DAYS)
            )
        )
        if release_age_days < 0:
            raise ValueError
    except ValueError:
        parser.error("PRE_COMMIT_NPM_MIN_RELEASE_AGE_DAYS must be a non-negative integer")
    if arguments.cache_key:
        print(f"key={cache_key(release_age_days)}")
        return 0
    return install_hooks(release_age_days)


if __name__ == "__main__":
    raise SystemExit(main())
