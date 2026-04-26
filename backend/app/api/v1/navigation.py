"""Navigation endpoints — public API for retrieving sidebar navigation tree."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.logging import logger
from app.core.response import success
from app.models.navigation_item import NavigationItem
from app.models.user import User
from app.schemas.navigation_item import NavigationTreeNode

if TYPE_CHECKING:
    pass

router = APIRouter()


def build_tree(
    items: list[NavigationItem],
    parent_id: None = None,
    user: User | None = None,
) -> list[NavigationTreeNode]:
    """Build hierarchical tree from flat list of items, filtering by user role."""
    children = []
    
    for item in items:
        # Skip deleted items
        if item.deleted_at:
            continue
        
        # Check role visibility
        if not item.visible:
            continue
        
        if item.required_role and user and item.required_role != user.role:
            continue
        
        # Match parent
        if item.parent_id != parent_id:
            continue
        
        # Recursively build children
        node_children = build_tree(items, item.id, user)
        
        node = NavigationTreeNode(
            id=item.id,
            label=item.label,
            href=item.href,
            icon=item.icon,
            orden=item.orden,
            visible=item.visible,
            required_role=item.required_role,
            children=node_children,
        )
        children.append(node)
    
    # Sort by orden
    children.sort(key=lambda x: x.orden)
    return children


@router.get("", response_model=list[NavigationTreeNode])
async def get_navigation(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    """Get navigation tree (role-filtered).
    
    - Public route (null current_user gets basic nav)
    - Filters items by user role and visibility
    - Returns hierarchical tree (parent-child relationships)
    """
    # Fetch all navigation items with eager loading
    query = (
        select(NavigationItem)
        .where(NavigationItem.deleted_at.is_(None))
        .options(selectinload(NavigationItem.children))  # type: ignore
    )
    
    result = await db.execute(query)
    items = result.unique().scalars().all()
    
    # Build tree
    tree = build_tree(items, parent_id=None, user=current_user)
    
    logger.info(
        "navigation.get",
        extra={
            "event": "navigation.get",
            "tree_size": len(tree),
            "user_role": current_user.role if current_user else "anonymous",
        },
    )
    
    return tree
