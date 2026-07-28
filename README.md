# JBoards firmware distribution

Public on purpose: boards and browsers fetch from here unauthenticated while the
firmware sources stay private. Nothing here is edited by hand — it is written by
`tools/release.py` in the firmware repo, and the manifest is the pointer that
makes a version live.

## Layout

```
esp32/
  manifest.json     "what is current" — one entry per board
  versions.json     version history + changelogs
pb2/
  manifest.json     same shape, PocketBeagle 2 firmware
  versions.json
```

One directory per **platform**, not per board: a single manifest carries every
board of that platform, keyed by board name. Release tags are platform-prefixed
(`esp32-v0.0.1`) so ESP32 and PB2 releases never collide and nothing has to
consult the repo-global `/releases/latest`.

**Binaries are GitHub Release assets, never committed here.** Each combined
image is ~8.5 MB; committing them would make every clone carry every image ever
shipped, forever. The manifest holds absolute asset URLs instead.

## Who reads what

| Consumer | Fetches |
|---|---|
| ESP32 web UI (`firmwareService.ts`) | `esp32/manifest.json`, `esp32/versions.json` |
| PB2 device updater (`UpdateManager.cpp`) | `pb2/manifest.json` |

Both look up their own entry by normalized board name: the board's reported
product name, upper-cased, spaces to hyphens — `Waveshare ESP32-P4 Nano` →
`WAVESHARE-ESP32-P4-NANO`. A manifest key that does not match what a board
reports publishes cleanly and then fails on the device, so that mapping is
checked as part of releasing.

## Publishing

From the firmware repo:

```bash
python tools/release.py --env p4-nano-test --changelog-file notes.md \
    --repo-dir ../JBoardsFirmware --dry-run          # inspect first, always
python tools/release.py --env p4-nano-test --changelog-file notes.md \
    --repo-dir ../JBoardsFirmware --commit --push
```

It builds, packages a combined firmware+filesystem image, re-parses the
package header to confirm the embedded version and board tag, uploads the
asset, and writes the manifest **last** — so a bad release is undone by
reverting one small commit, with no rebuild and no asset surgery.

Then confirm what the world actually sees:

```bash
python tools/validate_manifest.py --live esp32 --check-urls
```

**`--check-urls` is not optional.** A manifest can be schema-valid, pass the
dry run, and still point at an asset that is not there — that is exactly how
v0.0.1 first shipped (the asset was published under its local filename while
the manifest named another). Nothing else in the pipeline detects it, and the
symptom on the device is a 404 mid-update. Also note the validator needs
`jsonschema` installed or it skips structural validation and still prints OK.

## Schema

Schema version 2. Normative definitions live in the firmware repo at
`docs/schemas/firmware-manifest.schema.json` and
`docs/schemas/firmware-versions.schema.json`; design and rationale in
`docs/architecture/FIRMWARE_DISTRIBUTION.md` (ruling D-26).

## History

Before 2026-07-28 this repo used a different layout: one top-level directory
per board (`JBOARD-16/`, `WAVESHARE-ESP32-P4-NANO/`) holding a flat schema-1
manifest plus committed `versions/<v>/firmware.bin` images. Those directories
were removed when the schema-2 layout was first published. Nothing was
stranded: no boards were in the field, and the S3 `JBOARD-*` family had already
been removed from the firmware entirely. Earlier tags still contain the old
tree if it is ever needed.
