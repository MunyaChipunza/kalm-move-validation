#!/usr/bin/env python3
"""Run KALM Move women production image jobs through the bundled image CLI."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time


DEFAULT_CLI = Path(r"C:\Users\Dell\.codex\skills\.system\imagegen\scripts\image_gen.py")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--jobs", required=True)
    parser.add_argument("--status", default="reports/kalm-move-women-production-run-status.jsonl")
    parser.add_argument("--summary", default="reports/kalm-move-women-production-run-summary.json")
    parser.add_argument("--concurrency", type=int, default=2)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only-missing", action="store_true")
    parser.add_argument("--limit", type=int)
    return parser.parse_args()


def load_jobs(path: Path) -> list[dict]:
    jobs = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            jobs.append(json.loads(line))
    return jobs


def load_api_key(repo: Path) -> str:
    value = os.environ.get("OPENAI_API_KEY", "").strip()
    if value:
        return value

    env_path = repo / ".env.local"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("OPENAI_API_KEY="):
                value = line.split("=", 1)[1].strip()
                if value:
                    return value

    raise RuntimeError("OPENAI_API_KEY is not available in the process or .env.local")


def resolve_path(repo: Path, raw: str) -> Path:
    path = Path(raw)
    if path.is_absolute():
        return path
    return repo / path


def build_command(repo: Path, job: dict) -> list[str]:
    cli = Path(os.environ.get("IMAGE_GEN_CLI", str(DEFAULT_CLI)))
    if not cli.exists():
        raise FileNotFoundError(f"Image CLI not found: {cli}")

    out_path = resolve_path(repo, job["output_path"])
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        str(cli),
        job.get("mode", "generate"),
        "--model",
        job["model"],
        "--prompt",
        job["prompt"],
        "--size",
        job["size"],
        "--quality",
        job["quality"],
        "--output-format",
        job["output_format"],
        "--output-compression",
        str(job["output_compression"]),
        "--out",
        str(out_path),
        "--no-augment",
    ]

    if job.get("mode") == "edit":
        for image in job.get("images", []):
            cmd.extend(["--image", str(resolve_path(repo, image))])

    return cmd


def error_tail(text: str, limit: int = 1600) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[-limit:]


def run_job(
    repo: Path,
    job: dict,
    api_key: str,
    force: bool,
    only_missing: bool,
    max_attempts: int,
    stop_event: threading.Event,
) -> dict:
    if stop_event.is_set():
        return {
            "job_id": job["job_id"],
            "product": job["product"],
            "colour": job["colour"],
            "view": job["view"],
            "output_path": job["output_path"],
            "status": "skipped_blocked",
            "seconds": 0,
        }

    out_path = resolve_path(repo, job["output_path"])
    if only_missing and out_path.exists() and out_path.stat().st_size > 0:
        return {
            "job_id": job["job_id"],
            "product": job["product"],
            "colour": job["colour"],
            "view": job["view"],
            "output_path": job["output_path"],
            "status": "skipped_exists",
            "seconds": 0,
        }

    cmd = build_command(repo, job)
    if force:
        cmd.append("--force")

    env = os.environ.copy()
    env["OPENAI_API_KEY"] = api_key
    started = time.time()
    last_error = ""

    for attempt in range(1, max_attempts + 1):
        result = subprocess.run(
            cmd,
            cwd=repo,
            env=env,
            text=True,
            capture_output=True,
        )
        if result.returncode == 0:
            return {
                "job_id": job["job_id"],
                "product": job["product"],
                "colour": job["colour"],
                "view": job["view"],
                "output_path": job["output_path"],
                "status": "complete",
                "attempts": attempt,
                "seconds": round(time.time() - started, 1),
            }

        last_error = error_tail(result.stderr or result.stdout)
        if "billing_hard_limit_reached" in last_error or "Billing hard limit has been reached" in last_error:
            stop_event.set()
            return {
                "job_id": job["job_id"],
                "product": job["product"],
                "colour": job["colour"],
                "view": job["view"],
                "output_path": job["output_path"],
                "status": "blocked_billing_limit",
                "attempts": attempt,
                "seconds": round(time.time() - started, 1),
                "error": last_error,
            }

        if attempt < max_attempts:
            time.sleep(min(45, 3 * attempt))

    return {
        "job_id": job["job_id"],
        "product": job["product"],
        "colour": job["colour"],
        "view": job["view"],
        "output_path": job["output_path"],
        "status": "failed",
        "attempts": max_attempts,
        "seconds": round(time.time() - started, 1),
        "error": last_error,
    }


def main() -> int:
    args = parse_args()
    repo = Path.cwd()
    jobs_path = resolve_path(repo, args.jobs)
    status_path = resolve_path(repo, args.status)
    summary_path = resolve_path(repo, args.summary)
    status_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    if args.concurrency < 1 or args.concurrency > 8:
        raise SystemExit("--concurrency must be between 1 and 8")
    if args.max_attempts < 1 or args.max_attempts > 3:
        raise SystemExit("--max-attempts must be between 1 and 3")

    jobs = load_jobs(jobs_path)
    if args.limit:
        jobs = jobs[: args.limit]
    api_key = load_api_key(repo)

    lock = threading.Lock()
    counts = {"complete": 0, "failed": 0, "skipped_exists": 0, "skipped_blocked": 0, "blocked_billing_limit": 0}
    started = time.time()
    stop_event = threading.Event()

    print(f"Running {len(jobs)} KALM image jobs with concurrency {args.concurrency}")
    with status_path.open("a", encoding="utf-8") as status_file:
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            futures = {
                executor.submit(
                    run_job,
                    repo,
                    job,
                    api_key,
                    args.force,
                    args.only_missing,
                    args.max_attempts,
                    stop_event,
                ): job
                for job in jobs
            }
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                with lock:
                    counts[result["status"]] = counts.get(result["status"], 0) + 1
                    status_file.write(json.dumps(result, ensure_ascii=False) + "\n")
                    status_file.flush()
                    done = sum(counts.values())
                    print(f"[{done}/{len(jobs)}] {result['status']} {result['job_id']} ({result.get('seconds', 0)}s)")

    summary = {
        "jobs": len(jobs),
        "counts": counts,
        "seconds": round(time.time() - started, 1),
        "status_path": str(status_path.relative_to(repo)),
    }
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 1 if counts.get("failed") else 0


if __name__ == "__main__":
    raise SystemExit(main())
