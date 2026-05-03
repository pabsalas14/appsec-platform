"""Query Builder router — endpoints for dynamic query creation (Fase 1)."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.saved_widget import SavedWidget
from app.models.user import User
from app.schemas.saved_widget import SavedWidgetCreate, SavedWidgetRead, SavedWidgetUpdate, WidgetPermissions
from app.services.base import BaseService
from app.services.query_builder_service import QueryBuilderService

router = APIRouter(prefix="/query-builder", tags=["Admin · Query Builder"])

# Initialize service for SavedWidget CRUD
saved_widget_svc = BaseService[SavedWidget, SavedWidgetCreate, SavedWidgetUpdate](
    SavedWidget,
    owner_field="user_id",
    audit_action_prefix="saved_widget",
)


@router.post("/validate")
async def validate_query(
    query_config: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate a query configuration without executing it.
    Returns validation result with errors and warnings.
    """
    try:
        qb_svc = QueryBuilderService(db)
        validation = await qb_svc.validate_query(query_config)
        return success(validation)
    except Exception as e:
        logger.exception(f"Query validation error: {e}")
        raise HTTPException(status_code=400, detail=f"Validation error: {e!s}") from e


@router.post("/execute")
async def execute_query(
    query_config: dict[str, Any],
    timeout_seconds: int = Query(30, ge=5, le=60),
    max_rows: int = Query(1000, ge=10, le=10000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Execute a query configuration and return preview data.
    Validates before executing.
    """
    try:
        qb_svc = QueryBuilderService(db)

        # Validate first
        validation = await qb_svc.validate_query(query_config)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=f"Query validation failed: {validation['errors']}")

        # Build and execute
        query = await qb_svc.build_query(query_config)
        result = await qb_svc.execute_with_limits(query, timeout_seconds, max_rows)

        return success(result)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Query execution error: {e}")
        raise HTTPException(status_code=500, detail=f"Execution error: {e!s}") from e


@router.post("/schema-info")
async def get_schema_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return complete schema information for the Query Builder frontend.
    Lists all tables, columns, and relationships.
    """
    try:
        from app.database import Base

        schema_info = {
            "tables": [],
            "relationships": {},
        }

        # Extract all mapped tables and columns
        for mapper in Base.registry.mappers:
            model_class = mapper.class_
            table_name = model_class.__tablename__

            columns = []
            for col in mapper.columns:
                columns.append(
                    {
                        "name": col.name,
                        "type": str(col.type),
                        "nullable": col.nullable,
                        "primary_key": col.primary_key,
                        "foreign_key": bool(col.foreign_keys),
                    }
                )

            schema_info["tables"].append(
                {
                    "name": table_name,
                    "model": model_class.__name__,
                    "columns": columns,
                }
            )

            # Extract relationships
            relationships = []
            for relationship_prop in mapper.relationships:
                relationships.append(
                    {
                        "name": relationship_prop.key,
                        "target_table": relationship_prop.mapper.class_.__tablename__,
                        "direction": str(relationship_prop.direction),
                    }
                )

            if relationships:
                schema_info["relationships"][table_name] = relationships

        return success(schema_info)

    except Exception as e:
        logger.exception(f"Schema info error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.post("/save")
async def save_widget(
    data: SavedWidgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a widget configuration for later use."""
    try:
        # Validate the query config first
        qb_svc = QueryBuilderService(db)
        validation = await qb_svc.validate_query(data.query_config)

        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=f"Invalid query config: {validation['errors']}")

        # Create the widget
        widget = await saved_widget_svc.create(
            db=db,
            actor_id=current_user.id,
            data=data,
            user_id=current_user.id,  # Override to ensure ownership
        )

        result = await saved_widget_svc.get_by_id(db=db, id=widget.id)
        return success(SavedWidgetRead.model_validate(result))

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Save widget error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.get("/widgets")
async def list_widgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all saved widgets for the current user."""
    try:
        widgets = await saved_widget_svc.list(
            db=db,
            skip=skip,
            limit=limit,
            user_id=current_user.id,  # Filter to current user
        )

        total = await saved_widget_svc.count(db=db, user_id=current_user.id)

        items = [SavedWidgetRead.model_validate(w) for w in widgets]
        page = (skip // limit) + 1 if limit else 1
        return paginated(items, page=page, page_size=limit, total=total)

    except Exception as e:
        logger.exception(f"List widgets error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.get("/widgets/{widget_id}")
async def get_widget(
    widget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific widget by ID."""
    try:
        import uuid

        widget_uuid = uuid.UUID(widget_id)
        widget = await saved_widget_svc.get_by_id(db=db, id=widget_uuid)

        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")

        # Check ownership
        if widget.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        return success(SavedWidgetRead.model_validate(widget))

    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid widget ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Get widget error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.patch("/widgets/{widget_id}")
async def update_widget(
    widget_id: str,
    data: SavedWidgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a widget configuration."""
    try:
        import uuid

        widget_uuid = uuid.UUID(widget_id)
        widget = await saved_widget_svc.get_by_id(db=db, id=widget_uuid)

        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")

        if widget.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # If query_config is being updated, validate it
        if data.query_config:
            qb_svc = QueryBuilderService(db)
            validation = await qb_svc.validate_query(data.query_config)

            if not validation["valid"]:
                raise HTTPException(status_code=400, detail=f"Invalid query config: {validation['errors']}")

        # Update the widget
        updated = await saved_widget_svc.update(
            db=db,
            actor_id=current_user.id,
            id=widget_uuid,
            data=data,
        )

        return success(SavedWidgetRead.model_validate(updated))

    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid widget ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Update widget error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.delete("/widgets/{widget_id}")
async def delete_widget(
    widget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a widget (soft delete)."""
    try:
        import uuid

        widget_uuid = uuid.UUID(widget_id)
        widget = await saved_widget_svc.get_by_id(db=db, id=widget_uuid)

        if not widget:
            raise HTTPException(status_code=404, detail="Widget not found")

        if widget.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        await saved_widget_svc.delete(db=db, actor_id=current_user.id, id=widget_uuid)

        return success({"message": "Widget deleted"})

    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid widget ID") from e
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Delete widget error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e!s}") from e


@router.put("/widgets/{widget_id}/permissions")
async def set_widget_permissions(
    widget_id: str,
    permissions: WidgetPermissions,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set granular access permissions for a widget.

    Only the widget owner can modify permissions. Supports:
    - visibility: private | shared | public
    - shared_with_roles: role names with view access
    - shared_with_user_ids: specific user UUIDs with view access
    - can_edit_roles: roles with edit access
    - can_edit_user_ids: specific users with edit access
    """
    import uuid

    try:
        widget_uuid = uuid.UUID(widget_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid widget ID") from e

    widget = await saved_widget_svc.get_by_id(db=db, id=widget_uuid)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    if widget.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the widget owner can modify permissions")

    widget.widget_permissions = permissions.model_dump(mode="json")
    await db.flush()
    await db.refresh(widget)
    return success(SavedWidgetRead.model_validate(widget))


@router.get("/widgets/{widget_id}/permissions")
async def get_widget_permissions(
    widget_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current permission settings for a widget.

    Widget owner and users/roles with explicit access can view permissions.
    """
    import uuid

    try:
        widget_uuid = uuid.UUID(widget_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid widget ID") from e

    widget = await saved_widget_svc.get_by_id(db=db, id=widget_uuid)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    # Owner always has access; others need to be in shared list
    perms = widget.widget_permissions or {}
    visibility = perms.get("visibility", "private")
    shared_ids = [str(uid) for uid in perms.get("shared_with_user_ids", [])]
    edit_ids = [str(uid) for uid in perms.get("can_edit_user_ids", [])]

    is_owner = widget.user_id == current_user.id
    has_access = (
        is_owner
        or visibility == "public"
        or str(current_user.id) in shared_ids
        or str(current_user.id) in edit_ids
    )

    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")

    defaults = WidgetPermissions()
    return success(
        {
            "widget_id": widget_id,
            "permissions": perms or defaults.model_dump(mode="json"),
            "is_owner": is_owner,
        }
    )
