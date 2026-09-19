#!/usr/bin/env python3
"""Deterministic, re-run-safe injection of generated registry entries into the
baked renderer files between sentinel markers.

The generator authors only *leaf* files — a block's field schema
(`payload/blocks/generated.ts`) and its React component
(`components/blocks/<Name>.tsx`), or a collection's item-layout component
(`components/collections/<Name>Layout.tsx`). The literal registry **maps**
(`RenderBlocks.tsx`'s `blockComponents`, `RenderItem.tsx`'s `itemComponents`)
are written here by a deterministic post-step, never by the LLM — so the maps
stay well-formed (a single mis-emitted brace in an LLM-edited literal map breaks
the whole renderer).

The page-migration path authors block schemas and injects RenderBlocks entries
between sentinel markers. This module is pure stdlib so it is safe to copy into
the migration sandbox.

Each renderer ships two marker pairs — one in the import list, one inside the
map literal:

    // >>> generated block imports
    // <<< generated block imports
    ...
    // >>> generated block registry
    // <<< generated block registry

Injection replaces everything strictly between a pair, preserving the markers,
so re-running with the same entries is a no-op and re-running with a changed set
fully rebuilds the section (never appends duplicates).
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys


class RegistryInjectError(RuntimeError):
    """A sentinel marker pair was missing or malformed in a renderer file."""


def pascal(slug: str) -> str:
    """`storyScroller` -> `StoryScroller`; `blog-posts`/`case_studies` ->
    `BlogPosts`/`CaseStudies`; leaves an already-cased name alone.

    Splits on ``-``/``_`` and capitalises each segment's first char while
    preserving the rest, so a camelCase segment (``storyScroller``) keeps its
    inner caps instead of being flattened by ``str.title()``.

    Public: this is the slug→component naming contract shared with callers
    (``generate_files`` checks component-file existence against it).
    """
    return "".join(seg[:1].upper() + seg[1:] for seg in re.split(r"[-_]", slug) if seg)


def check_component_collisions(slugs: list[str]) -> dict[str, str]:
    """Map component name -> slug, raising when two DISTINCT slugs collide.

    Any two distinct keys that :func:`pascal` to the same component are
    ambiguous: keeping both emits two identical ``import { X } …`` lines, which
    is a duplicate-identifier compile break in the renderer, and silently
    dropping one could unregister a different, still-seeded block (blank live
    sections). Two distinct blocks cannot share a ``<Pascal>.tsx`` component
    file anyway, so this is always an error the caller must resolve: reuse one
    spelling, or rename the new block.

    Enforced for BOTH CLI modes. ``--from-generated`` reads its slugs from a
    file the generator authored and chose the spellings in freely, so it is at
    least as exposed as the positional mode — and it feeds a blocking platform
    step, where writing a non-compiling registry and exiting 0 surfaces only as
    a preview that never becomes ready.
    """
    by_component: dict[str, str] = {}
    for slug in slugs:
        comp = pascal(slug)
        if comp in by_component and by_component[comp] != slug:
            raise RegistryInjectError(
                f"slugs {by_component[comp]!r} and {slug!r} both map to component "
                f"{comp} — pass a single spelling."
            )
        by_component[comp] = slug
    return by_component


# The one spelling of a block/collection slug declaration (`slug: '<x>'`,
# either quote, kebab/snake allowed). Public: the planners' and gates'
# scanners import it so a slug this injector can write is always a slug they
# can read — three hand-synced copies drifted before (plan_files' single-quote
# alnum-only variant could never plan a kebab block).
BLOCK_SLUG_RE = re.compile(r"""slug:\s*['"]([a-zA-Z0-9_-]+)['"]""")


# The array `payload.config.ts` spreads into the block library. Only its DIRECT
# elements are renderable blocks; see ``_mask_to_top_level_elements``.
_GENERATED_BLOCKS_DECL_RE = re.compile(r"\bgeneratedBlocks\b[^=]*=")
_GENERATED_COLLECTION_RE = re.compile(r"""\bmakeCollection\s*\(\s*['"]([a-zA-Z0-9_-]+)['"]""")


def _mask_to_top_level_elements(text: str) -> str:
    """Blank everything except the direct elements of ``generatedBlocks``.

    A block's schema may nest other block schemas — a ``blocks`` field carries
    its own list, and the skill tells authors to nest freely because the
    validator recurses and the generic renderer handles it. Those nested schemas
    are NOT top-level blocks: nothing renders them by slug, and no component
    file is written for them. Scanning the whole file for ``slug:`` cannot tell
    the two apart, so a nested schema became a registry entry importing a
    component nobody was asked to write — which breaks the whole renderer, since
    the map is one literal.

    Depth is what separates them. Inside the array literal, a slug belonging to
    a direct element sits exactly one brace deep; anything further in belongs to
    a field. Characters outside that depth become spaces, so
    :data:`BLOCK_SLUG_RE` reads the same grammar over a smaller surface and
    offsets are preserved.

    Text before the declaration is blanked too, which incidentally drops a slug
    declared in a helper const that never reaches the array.
    """
    decl = _GENERATED_BLOCKS_DECL_RE.search(text)
    if decl is None:
        return ""
    start = text.find("[", decl.end())
    if start == -1:
        return ""

    out = [" "] * len(text)
    depth = 0  # nesting inside the array literal; 1 == a direct element
    quote: str | None = None
    i = start + 1
    n = len(text)
    while i < n:
        ch = text[i]
        if quote is not None:
            if depth == 1:
                out[i] = ch
            if ch == "\\" and i + 1 < n:
                if depth == 1:
                    out[i + 1] = text[i + 1]
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in "\"'`":
            quote = ch
            if depth == 1:
                out[i] = ch
            i += 1
            continue
        if ch in "[{":
            depth += 1
            i += 1
            continue
        if ch in "]}":
            depth -= 1
            if depth < 0:  # the array literal closed
                break
            i += 1
            continue
        if depth == 1:
            out[i] = ch
        i += 1
    return "".join(out)


def slugs_in_generated(generated_path: pathlib.Path) -> list[str]:
    """Every TOP-LEVEL block slug in a ``generated.ts``, sorted and deduplicated.

    Reads the same ``slug: '...'`` grammar the schema file is authored in
    (:data:`BLOCK_SLUG_RE`) rather than importing the module — this runs on a
    sandbox with no TypeScript runtime, and the file may not typecheck yet.

    "Top-level" is load-bearing rather than a detail: a slug nested inside a
    field's own block list needs no component and no registry entry. See
    ``_mask_to_top_level_elements``.

    A missing file is not an error: the template ships ``generatedBlocks`` empty
    and most sites never add a custom block, so "no file" and "no custom blocks"
    are the same answer. Returning ``[]`` then lets the caller REPLACE the
    registry with nothing, which is the correct end state for a site composed
    entirely from the baked library.
    """
    try:
        text = generated_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return []
    top_level = _mask_to_top_level_elements(_strip_ts_comments(text))
    return sorted(set(BLOCK_SLUG_RE.findall(top_level)))


def collection_slugs_in_generated(generated_path: pathlib.Path) -> list[str]:
    """Collection slugs declared through the generated config's factory."""
    try:
        text = generated_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return []
    return sorted(set(_GENERATED_COLLECTION_RE.findall(_strip_ts_comments(text))))


def _strip_ts_comments(text: str) -> str:
    """Blank out ``//`` and ``/* */`` comments, preserving string literals.

    Required, not defensive: the template ships ``generated.ts`` with a worked
    example in its header comment (``slug: 'storyScroller'``), so a bare regex
    over the raw text registers a block that does not exist and emits an import
    of a component file nobody wrote.

    Scans rather than regex-substitutes because the two constructs nest the
    wrong way for a pattern: ``//`` inside a string (``'https://…'``) is not a
    comment, and a quote inside a comment does not open a string. Comment bodies
    are replaced by spaces so nothing on either side of a removal is joined into
    a new token.
    """
    out: list[str] = []
    i, n = 0, len(text)
    quote: str | None = None
    while i < n:
        ch = text[i]
        if quote is not None:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in "\"'`":
            quote = ch
            out.append(ch)
            i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                out.append(" ")
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            end = n if end == -1 else end + 2
            out.append("".join(" " if c != "\n" else "\n" for c in text[i:end]))
            i = end
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _replace_between(
    lines: list[str], start_marker: str, end_marker: str, body: list[str]
) -> list[str]:
    """Return ``lines`` with everything strictly between the line containing
    ``start_marker`` and the line containing ``end_marker`` replaced by ``body``.

    Markers are matched as substrings so the surrounding comment text is free to
    change. Raises ``RegistryInjectError`` when either marker is absent or out of
    order, since a silent skip would ship an unregistered (invisible) block.
    """
    start_idx = end_idx = -1
    for i, line in enumerate(lines):
        if start_marker in line and start_idx == -1:
            start_idx = i
        elif end_marker in line and start_idx != -1:
            end_idx = i
            break
    if start_idx == -1 or end_idx == -1:
        raise RegistryInjectError(
            f"sentinel markers not found or out of order: {start_marker!r} .. {end_marker!r}"
        )
    return lines[: start_idx + 1] + body + lines[end_idx:]


def _inject_pairs(
    path: pathlib.Path,
    imports: list[str],
    entries: list[str],
    *,
    imports_markers: tuple[str, str],
    registry_markers: tuple[str, str],
) -> None:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    lines = _replace_between(lines, imports_markers[0], imports_markers[1], imports)
    lines = _replace_between(lines, registry_markers[0], registry_markers[1], entries)
    path.write_text("\n".join(lines) + ("\n" if text.endswith("\n") else ""), encoding="utf-8")


def inject_block_registry(render_blocks_path: pathlib.Path, blocks: list[dict]) -> list[str]:
    """Write custom block imports + `blockComponents` entries into RenderBlocks.tsx.

    ``blocks`` is ``[{slug, component?, import_path?}]``. ``component`` defaults
    to the PascalCase of ``slug``; ``import_path`` to ``./<Component>``. Returns
    the registered slugs. Idempotent and order-stable (sorted by slug).
    """
    blocks = sorted(blocks, key=lambda b: b["slug"])
    imports: list[str] = []
    entries: list[str] = []
    slugs: list[str] = []
    for b in blocks:
        slug = b["slug"]
        component = b.get("component") or pascal(slug)
        import_path = b.get("import_path") or f"./{component}"
        imports.append(f"import {{ {component} }} from '{import_path}';")
        entries.append(f"  '{slug}': {component},")
        slugs.append(slug)
    _inject_pairs(
        render_blocks_path,
        imports,
        entries,
        imports_markers=(">>> generated block imports", "<<< generated block imports"),
        registry_markers=(">>> generated block registry", "<<< generated block registry"),
    )
    return slugs


def inject_item_registry(render_item_path: pathlib.Path, items: list[dict]) -> list[str]:
    """Write custom item-layout imports + `itemComponents` entries into
    RenderItem.tsx.

    ``items`` is ``[{collection, component?, import_path?}]``. ``component``
    defaults to ``<PascalCollection>Layout``; ``import_path`` to
    ``./<Component>`` (RenderItem and the layouts are siblings in
    ``components/collections/``). The map is keyed by collection slug. Returns
    the registered collection slugs. Idempotent and order-stable.
    """
    items = sorted(items, key=lambda it: it["collection"])
    imports: list[str] = []
    entries: list[str] = []
    collections: list[str] = []
    for it in items:
        collection = it["collection"]
        component = it.get("component") or f"{pascal(collection)}Layout"
        import_path = it.get("import_path") or f"./{component}"
        imports.append(f"import {{ {component} }} from '{import_path}';")
        entries.append(f"  '{collection}': {component},")
        collections.append(collection)
    _inject_pairs(
        render_item_path,
        imports,
        entries,
        imports_markers=(">>> generated item imports", "<<< generated item imports"),
        registry_markers=(">>> generated item registry", "<<< generated item registry"),
    )
    return collections


# A registry entry line between the markers: `  'slug': Component,` (the
# injector always quotes keys; kebab slugs require it).
_ENTRY_KEY_RE = re.compile(r"""^\s*['"]?([A-Za-z0-9_-]+)['"]?\s*:""")


def _existing_registry_keys(path: pathlib.Path, start_marker: str, end_marker: str) -> list[str]:
    """Keys currently registered between a marker pair (empty when unreadable —
    the subsequent inject raises the real error)."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    keys: list[str] = []
    inside = False
    for line in lines:
        if start_marker in line:
            inside = True
            continue
        if end_marker in line:
            break
        if inside and (m := _ENTRY_KEY_RE.match(line)):
            keys.append(m.group(1))
    return keys


def _main(argv: list[str]) -> int:
    """CLI so a sandbox agent can register slugs without a Python import.

    ``registry_inject.py block <RenderBlocks.tsx> <slug>...`` injects block
    entries; ``registry_inject.py item <RenderItem.tsx> <slug>...`` injects item
    (collection) entries. Prints the registered entries; non-zero on failure.

    ``--from-generated <generated.ts>`` reads the complete authored set from
    the generated block or collection config instead of taking positional
    arguments. Website generation is that caller:
    one agent run writes the whole of ``generatedBlocks``, so the file is the
    full truth and a slug the agent deleted must leave the registry too. Passing
    those same slugs positionally would union them with a stale entry and leave
    an import of a component file that no longer exists — a compile break rather
    than a blank section.

    Both modes reject two distinct slugs that PascalCase to the same component
    (``check_component_collisions``) — that pair can only produce duplicate
    imports and a renderer that does not compile.

    UNION semantics for positional slugs: entries already registered between the
    markers are preserved and the given slugs are merged in. Per-page migration
    agents inject only the slugs they authored — replace semantics would
    silently drop every earlier page's registrations, blanking those pages'
    custom sections (the clobbered-RenderBlocks regression class). The Python
    functions keep replace semantics for callers that pass the full set, which
    is what ``--from-generated`` uses.
    """
    parser = argparse.ArgumentParser(description="Inject generated registry entries.")
    parser.add_argument("kind", choices=("block", "item"))
    parser.add_argument("renderer_path")
    parser.add_argument("slugs", nargs="*")
    parser.add_argument(
        "--from-generated",
        metavar="GENERATED_TS",
        help=(
            "Read the complete slug set from this generated config and "
            "REPLACE the registry with it, instead of merging positional slugs."
        ),
    )
    args = parser.parse_args(argv)

    path = pathlib.Path(args.renderer_path)

    if args.from_generated:
        if args.slugs:
            parser.error("--from-generated takes the whole set; pass no positional slugs")
        try:
            if args.kind == "block":
                slugs = slugs_in_generated(pathlib.Path(args.from_generated))
            else:
                slugs = [
                    slug
                    for slug in collection_slugs_in_generated(pathlib.Path(args.from_generated))
                    if (path.parent / f"{pascal(slug)}Layout.tsx").is_file()
                ]
        except OSError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        try:
            check_component_collisions(slugs)
            if args.kind == "block":
                injected = inject_block_registry(path, [{"slug": s} for s in slugs])
            else:
                injected = inject_item_registry(path, [{"collection": s} for s in slugs])
        except (RegistryInjectError, OSError) as exc:
            print(str(exc), file=sys.stderr)
            return 1
        for entry in injected:
            print(entry)
        return 0

    if not args.slugs:
        parser.error("pass at least one slug, or --from-generated")
    new = set(args.slugs)

    def _merge(existing: list[str]) -> list[str]:
        by_component = check_component_collisions(sorted(new))
        for k in existing:
            comp = pascal(k)
            if comp in by_component and by_component[comp] != k:
                raise RegistryInjectError(
                    f"slug {by_component[comp]!r} maps to the same component ({comp}) as "
                    f"the already-registered key {k!r}. Re-run with the existing key "
                    f"{k!r} if this is the same block, or rename the new block."
                )
        return sorted(set(existing) | new)

    try:
        if args.kind == "block":
            merged = _merge(
                _existing_registry_keys(
                    path, ">>> generated block registry", "<<< generated block registry"
                )
            )
            injected = inject_block_registry(path, [{"slug": s} for s in merged])
        else:
            merged = _merge(
                _existing_registry_keys(
                    path, ">>> generated item registry", "<<< generated item registry"
                )
            )
            injected = inject_item_registry(path, [{"collection": s} for s in merged])
    except (RegistryInjectError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    for entry in injected:
        print(entry)
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
