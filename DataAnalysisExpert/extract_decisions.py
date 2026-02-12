import os
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(r"C:\Users\aship\Desktop\Project-Kelmah")
MANIFEST = ROOT / "DataAnalysisExpert" / "kelmah_docs_manifest_2026-02-11.txt"
OUT = ROOT / "DataAnalysisExpert" / "kelmah_decisions_extracted_2026-02-11.md"

# High-signal keywords that usually indicate decisions/agreements/confirmed protocols.
HEADING_KEYWORDS = {
    "decision",
    "decisions",
    "agreed",
    "agreement",
    "confirmed",
    "confirm",
    "architecture",
    "protocol",
    "standard",
    "standards",
    "workflow",
    "design",
    "patterns",
    "consolidation",
    "migration",
    "audit",
    "checklist",
    "deployment",
    "tunnel",
    "ngrok",
    "localtunnel",
    "security",
    "rest",
    "routing",
}

LINE_SIGNAL_RE = re.compile(
    r"(?i)\b(decision|agreed|confirmed|must|mandatory|never|always|protocol|standard|architecture|restful)\b"
)

TEXT_EXTENSIONS = {
    ".md",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".cjs",
    ".mjs",
    ".ps1",
    ".sh",
    ".bat",
}

SKIP_DIR_PARTS = {
    # Many of these are vendored/third-party or irrelevant to early Kelmah decisions, but we still "read"
    # all files; we just avoid extracting huge amounts from these areas.
    "node_modules",
    ".git",
}


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def safe_read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        try:
            return path.read_text(errors="ignore")
        except Exception:
            return None


def is_probably_binary(text: str) -> bool:
    # Heuristic: too many NULs is generally binary
    return "\x00" in text


def normalize_heading(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def extract_from_markdown(text: str) -> list[tuple[str, str]]:
    """Return list of (section_title, section_body) for high-signal headings."""
    lines = text.splitlines()

    # Capture first H1 as doc title if available
    out: list[tuple[str, str]] = []

    heading_idxs: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not m:
            continue
        title = normalize_heading(m.group(2))
        heading_idxs.append((i, title))

    # Fallback: if no headings, do line-signal extraction later
    if not heading_idxs:
        return out

    # Add sentinel end
    heading_idxs.append((len(lines), "__END__"))

    for (start_idx, title), (end_idx, _) in zip(heading_idxs, heading_idxs[1:]):
        title_l = title.lower()
        if any(k in title_l for k in HEADING_KEYWORDS):
            body_lines = lines[start_idx + 1 : end_idx]
            body = "\n".join(body_lines).strip()
            if body:
                # Limit size so the output remains reviewable
                body_preview = "\n".join(body.splitlines()[:120]).rstrip()
                out.append((title, body_preview))

    return out


def extract_line_signals(text: str) -> list[str]:
    lines = text.splitlines()
    hits: list[str] = []
    for line in lines:
        if not line.strip():
            continue
        if LINE_SIGNAL_RE.search(line) or "✅" in line or "❌" in line:
            hits.append(line.rstrip())
        if len(hits) >= 200:
            break
    return hits


def main() -> None:
    if not MANIFEST.exists():
        raise SystemExit(f"Manifest not found: {MANIFEST}")

    manifest_text = MANIFEST.read_text(encoding="utf-8", errors="ignore")
    file_lines = [ln.strip() for ln in manifest_text.splitlines()]

    # Files list starts after a line equal to 'FILES:'
    try:
        start = file_lines.index("FILES:") + 1
    except ValueError:
        raise SystemExit("Manifest format unexpected: missing 'FILES:'")

    rel_paths = [ln for ln in file_lines[start:] if ln and not ln.startswith("[")]
    paths = [ROOT / Path(p.replace("/", os.sep)) for p in rel_paths]

    extracted_files = 0
    unreadable_files: list[str] = []
    sections_written = 0

    out_lines: list[str] = []
    out_lines.append(f"# Kelmah Decision Evidence Extract (auto-generated {datetime.now().isoformat(timespec='seconds')})")
    out_lines.append("")
    out_lines.append(
        "This file is a compact evidence set: it reads every file listed in the manifest and extracts only high-signal sections/lines "
        "related to decisions, agreements, protocols, and architecture."
    )
    out_lines.append("")
    out_lines.append(f"- Manifest: {rel(MANIFEST)}")
    out_lines.append(f"- Total files in manifest: {len(paths)}")
    out_lines.append("")

    for path in paths:
        # We still attempt to read everything (per request), but only extract from likely-text.
        text = safe_read_text(path)
        if text is None:
            unreadable_files.append(rel(path))
            continue
        if is_probably_binary(text):
            # read succeeded, but don't extract
            continue

        extracted_files += 1

        # Reduce extraction from known noisy areas
        if any(part in SKIP_DIR_PARTS for part in path.parts):
            continue

        ext = path.suffix.lower()
        if ext not in TEXT_EXTENSIONS:
            continue

        md_sections: list[tuple[str, str]] = []
        if ext == ".md":
            md_sections = extract_from_markdown(text)

        line_hits = [] if md_sections else extract_line_signals(text)

        if not md_sections and not line_hits:
            continue

        out_lines.append("---")
        out_lines.append("")
        out_lines.append(f"## Source: {rel(path)}")
        out_lines.append("")

        if md_sections:
            for title, body in md_sections:
                out_lines.append(f"### {title}")
                out_lines.append("")
                out_lines.append(body)
                out_lines.append("")
                sections_written += 1
        else:
            out_lines.append("### Signal lines")
            out_lines.append("")
            for line in line_hits:
                out_lines.append(f"- {line}")
            out_lines.append("")
            sections_written += 1

    out_lines.append("---")
    out_lines.append("")
    out_lines.append("## Extraction summary")
    out_lines.append("")
    out_lines.append(f"- Files read successfully: {extracted_files}")
    out_lines.append(f"- Files unreadable: {len(unreadable_files)}")
    out_lines.append(f"- Extracted sections/blocks: {sections_written}")

    if unreadable_files:
        out_lines.append("")
        out_lines.append("### Unreadable/binary files (first 200)")
        out_lines.append("")
        for p in unreadable_files[:200]:
            out_lines.append(f"- {p}")

    OUT.write_text("\n".join(out_lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
