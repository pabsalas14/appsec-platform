#!/usr/bin/env python3
"""
Scaffold a new owned entity across backend + frontend.

Usage::

    python scripts/new_entity.py --name Project \
        --fields "title:str,description:text?,due_date:datetime?"

    # or via Makefile:
    make new-entity NAME=Project FIELDS="title:str,description:text?,due_date:datetime?"

Generated artifacts (all relative to repo root):

    backend/app/models/{snake}.py
    backend/app/schemas/{snake}.py
    backend/app/services/{snake}_service.py
    backend/app/api/v1/{snake}.py
    backend/tests/test_{snake}.py
    frontend/src/lib/schemas/{snake}.schema.ts
    frontend/src/hooks/use{PascalPlural}.ts
    frontend/src/app/(dashboard)/{plural_snake}/page.tsx

It also inserts the router registration in
``backend/app/api/v1/router.py``.

Supported field types: ``str``, ``text``, ``int``, ``float``, ``bool``,
``datetime``, ``uuid``. Append ``?`` to make the field nullable.

After generation, run::

    docker compose exec backend alembic revision --autogenerate -m "add {table}"
    docker compose exec backend alembic upgrade head
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, StrictUndefined
except ImportError:
    print(
        "jinja2 is required. Install the backend dependencies first:\n"
        "  pip install -r backend/requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)


ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = Path(__file__).resolve().parent / "templates"


# ─── Field type registry ────────────────────────────────────────────────────


@dataclass
class FieldSpec:
    name: str
    kind: str
    nullable: bool

    @property
    def py_inner(self) -> str:
        return {
            "str": "str",
            "text": "str",
            "int": "int",
            "float": "float",
            "bool": "bool",
            "datetime": "datetime",
            "uuid": "uuid.UUID",
        }[self.kind]

    @property
    def py_type_annot(self) -> str:
        inner = self.py_inner
        return f"{inner} | None" if self.nullable else inner

    @property
    def py_schema_type(self) -> str:
        inner = self.py_inner
        return f"Optional[{inner}]" if self.nullable else inner

    @property
    def py_schema_type_strict(self) -> str:
        return self.py_inner

    @property
    def sqla_col(self) -> str:
        return {
            "str": "String(255)",
            "text": "Text()",
            "int": "Integer()",
            "float": "Float()",
            "bool": "Boolean()",
            "datetime": "DateTime(timezone=True)",
            "uuid": "UUID(as_uuid=True)",
        }[self.kind]

    @property
    def sqla_import(self) -> str:
        return {
            "str": "String",
            "text": "Text",
            "int": "Integer",
            "float": "Float",
            "bool": "Boolean",
            "datetime": "DateTime",
            "uuid": "",  # comes from postgresql dialect
        }[self.kind]

    @property
    def zod(self) -> str:
        return {
            "str": "z.string()",
            "text": "z.string()",
            "int": "z.number().int()",
            "float": "z.number()",
            "bool": "z.boolean()",
            "datetime": "z.string()",
            "uuid": "z.string().uuid()",
        }[self.kind]

    @property
    def sample_value(self) -> str:
        return {
            "str": f'"sample {self.name}"',
            "text": f'"sample {self.name}"',
            "int": "1",
            "float": "1.0",
            "bool": "False",
            "datetime": '"2026-01-01T00:00:00Z"',
            "uuid": '"00000000-0000-0000-0000-000000000000"',
        }[self.kind]


# ─── Naming helpers ─────────────────────────────────────────────────────────


def _camel_to_snake(name: str) -> str:
    s = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s).lower()


def _pluralize(word: str) -> str:
    if word.endswith("y") and not word.endswith(("ay", "ey", "iy", "oy", "uy")):
        return word[:-1] + "ies"
    if word.endswith(("s", "sh", "ch", "x", "z")):
        return word + "es"
    return word + "s"


# ─── Parsing ────────────────────────────────────────────────────────────────


def parse_fields(raw: str) -> list[FieldSpec]:
    fields: list[FieldSpec] = []
    if not raw.strip():
        return fields
    for chunk in raw.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if ":" not in chunk:
            raise SystemExit(f"Invalid field spec (missing type): {chunk!r}")
        name, kind = chunk.split(":", 1)
        name = name.strip()
        kind = kind.strip()
        nullable = kind.endswith("?")
        if nullable:
            kind = kind[:-1]
        if not re.match(r"^[a-z_][a-z0-9_]*$", name):
            raise SystemExit(f"Invalid field name: {name!r}")
        if kind not in {"str", "text", "int", "float", "bool", "datetime", "uuid"}:
            raise SystemExit(f"Unsupported field type: {kind!r}")
        fields.append(FieldSpec(name=name, kind=kind, nullable=nullable))
    return fields


# ─── Rendering ──────────────────────────────────────────────────────────────


def render(template_name: str, ctx: dict) -> str:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES)),
        undefined=StrictUndefined,
        keep_trailing_newline=True,
    )
    return env.get_template(template_name).render(**ctx)


def write_file(path: Path, content: str, *, force: bool) -> None:
    if path.exists() and not force:
        raise SystemExit(f"Refusing to overwrite existing file: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f"  + {path.relative_to(ROOT)}")


def register_router(snake: str, plural_snake: str) -> None:
    router_file = ROOT / "backend" / "app" / "api" / "v1" / "router.py"
    src = router_file.read_text()

    import_line = f"from app.api.v1 import {snake}"
    include_line = (
        f'api_router.include_router({snake}.router, prefix="/{plural_snake}", '
        f'tags=["{snake.capitalize()}"])'
    )

    if import_line in src:
        print(f"  = router already registers {snake}")
        return

    src = re.sub(
        r"(from app\.api\.v1 import[^\n]+)",
        lambda m: m.group(1).rstrip() + f", {snake}",
        src,
        count=1,
    )

    if f"/{plural_snake}" not in src:
        src = src.rstrip() + "\n" + include_line + "\n"

    router_file.write_text(src)
    print(f"  ~ registered {snake} in {router_file.relative_to(ROOT)}")


def register_alembic_model(snake: str) -> None:
    env_file = ROOT / "backend" / "alembic" / "env.py"
    src = env_file.read_text()
    line = f"import app.models.{snake}   # noqa: F401"
    if line in src:
        return
    src = src.replace(
        "target_metadata = Base.metadata",
        f"{line}\n\ntarget_metadata = Base.metadata",
        1,
    )
    env_file.write_text(src)
    print(f"  ~ registered {snake} in alembic/env.py")


# ─── Main ───────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument(
        "--name", required=True, help="Entity name in PascalCase (e.g. Project)"
    )
    parser.add_argument(
        "--fields",
        default="",
        help='Comma-separated "name:type[?]" pairs. Types: str, text, int, '
        "float, bool, datetime, uuid.",
    )
    parser.add_argument(
        "--force", action="store_true", help="Overwrite existing files."
    )
    args = parser.parse_args()

    if not re.match(r"^[A-Z][A-Za-z0-9]*$", args.name):
        raise SystemExit(f"--name must be PascalCase, got {args.name!r}")

    pascal = args.name
    snake = _camel_to_snake(pascal)
    plural_snake = _pluralize(snake)
    pascal_plural = _pluralize(pascal)
    fields = parse_fields(args.fields)

    sqla_imports = sorted(
        {f.sqla_import for f in fields if f.sqla_import}
        | {"DateTime"}
    )

    ctx = {
        "pascal": pascal,
        "snake": snake,
        "plural_snake": plural_snake,
        "pascal_plural": pascal_plural,
        "table": plural_snake,
        "fields": fields,
        "sqla_imports": sqla_imports,
    }

    print(f"Scaffolding entity {pascal} (table={plural_snake})")

    write_file(
        ROOT / "backend" / "app" / "models" / f"{snake}.py",
        render("backend_model.py.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "backend" / "app" / "schemas" / f"{snake}.py",
        render("backend_schema.py.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "backend" / "app" / "services" / f"{snake}_service.py",
        render("backend_service.py.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "backend" / "app" / "api" / "v1" / f"{snake}.py",
        render("backend_router.py.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "backend" / "tests" / f"test_{snake}.py",
        render("backend_test.py.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "frontend" / "src" / "lib" / "schemas" / f"{snake}.schema.ts",
        render("frontend_schema.ts.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "frontend" / "src" / "hooks" / f"use{pascal_plural}.ts",
        render("frontend_hook.ts.j2", ctx),
        force=args.force,
    )
    write_file(
        ROOT / "frontend" / "src" / "app" / "(dashboard)" / plural_snake / "page.tsx",
        render("frontend_page.tsx.j2", ctx),
        force=args.force,
    )

    register_router(snake, plural_snake)
    register_alembic_model(snake)

    print(
        "\nDone. Next steps:\n"
        f"  1. docker compose exec backend alembic revision --autogenerate "
        f'-m "add {plural_snake}"\n'
        "  2. docker compose exec backend alembic upgrade head\n"
        "  3. docker compose exec backend python -m pytest tests/ -v\n"
    )


if __name__ == "__main__":
    main()
