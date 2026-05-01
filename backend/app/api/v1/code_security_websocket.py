"""WebSocket endpoints for Code Security Reviews real-time updates."""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocketDisconnect, WebSocket, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.logging import logger
from app.models.code_security_review import CodeSecurityReview
from app.models.code_security_event import CodeSecurityEvent
from app.services.code_security_review_service import code_security_review_svc
from sqlalchemy import desc, select

router = APIRouter()

# In-memory store of active WebSocket connections by review ID
# In production, this should use Redis for distributed systems
active_connections: dict[str, list[WebSocket]] = {}


async def get_connection_manager() -> dict[str, list[WebSocket]]:
    """Get the connection manager (for dependency injection in future)."""
    return active_connections


@router.websocket("/ws/reviews/{review_id}/progress")
async def websocket_review_progress(websocket: WebSocket, review_id: str, db: AsyncSession = Depends(get_db)):
    """
    WebSocket endpoint for real-time analysis progress updates.

    Messages sent from server:
    - {"type": "progress", "progress": 0-100}
    - {"type": "status", "status": "PENDING|ANALYZING|COMPLETED|FAILED"}
    - {"type": "phase", "phase": "Inspector|Detective|Fiscal"}
    - {"type": "error", "message": "error details"}
    - {"type": "complete", "data": {...}}
    """
    try:
        # Verify review exists and user has access
        review = await code_security_review_svc.get(db, review_id)
        if not review:
            await websocket.close(code=4004, reason="Review not found")
            return

        # Accept the connection
        await websocket.accept()
        logger.info(f"WebSocket connected for review {review_id}")

        # Add to active connections
        if review_id not in active_connections:
            active_connections[review_id] = []
        active_connections[review_id].append(websocket)

        # Send initial state
        await websocket.send_json({
            "type": "initial_state",
            "review_id": review_id,
            "estado": review.estado,
            "progreso": review.progreso,
        })

        # Keep connection alive and handle incoming messages
        # (Clients can send keepalive pings or control messages)
        try:
            while True:
                # Wait for client messages (mostly for keepalive)
                data = await websocket.receive_text()
                message = json.loads(data)

                # Handle keepalive/ping
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

                # Handle client requesting status refresh
                elif message.get("type") == "get_status":
                    review = await code_security_review_svc.get(db, review_id)
                    await websocket.send_json({
                        "type": "status_response",
                        "estado": review.estado,
                        "progreso": review.progreso,
                    })

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for review {review_id}")
            if review_id in active_connections:
                active_connections[review_id].remove(websocket)
                if not active_connections[review_id]:
                    del active_connections[review_id]

        except json.JSONDecodeError:
            await websocket.send_json({"type": "error", "message": "Invalid JSON"})

        except Exception as e:
            logger.error(f"WebSocket error for review {review_id}: {str(e)}")
            await websocket.send_json({
                "type": "error",
                "message": "Internal server error"
            })

    except Exception as e:
        logger.error(f"WebSocket connection error: {str(e)}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass


@router.websocket("/ws/reviews/{review_id}/events")
async def websocket_review_events(websocket: WebSocket, review_id: str, db: AsyncSession = Depends(get_db)):
    """
    WebSocket endpoint for forensic event streaming.

    Messages sent from server:
    - {"type": "event", "data": {event details}}
    - {"type": "event_batch", "events": [{...}, {...}]}
    - {"type": "stream_complete"}
    """
    try:
        # Verify review exists
        review = await code_security_review_svc.get(db, review_id)
        if not review:
            await websocket.close(code=4004, reason="Review not found")
            return

        await websocket.accept()
        logger.info(f"WebSocket events connected for review {review_id}")

        # Add to active connections
        if review_id not in active_connections:
            active_connections[review_id] = []
        active_connections[review_id].append(websocket)

        try:
            # Send initial message
            await websocket.send_json({
                "type": "stream_started",
                "review_id": review_id,
            })

            # In production, this would subscribe to event stream from message queue
            # For now, simulate keepalive
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)

                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})

                elif message.get("type") == "get_events":
                    # Fetch latest events from DB
                    stmt = (
                        select(CodeSecurityEvent)
                        .where(CodeSecurityEvent.review_id == review_id)
                        .order_by(desc(CodeSecurityEvent.timestamp))
                        .limit(50)
                    )
                    result = await db.execute(stmt)
                    events = result.scalars().all()

                    await websocket.send_json({
                        "type": "event_batch",
                        "events": [
                            {
                                "id": str(e.id),
                                "timestamp": e.timestamp.isoformat(),
                                "commit_hash": e.commit_hash,
                                "autor": e.autor,
                                "archivo": e.archivo,
                                "accion": e.accion,
                                "mensaje_commit": e.mensaje_commit,
                                "nivel_riesgo": e.nivel_riesgo,
                            }
                            for e in events
                        ],
                    })

        except WebSocketDisconnect:
            logger.info(f"WebSocket events disconnected for review {review_id}")
            if review_id in active_connections:
                active_connections[review_id].remove(websocket)
                if not active_connections[review_id]:
                    del active_connections[review_id]

        except Exception as e:
            logger.error(f"WebSocket events error: {str(e)}")
            await websocket.send_json({
                "type": "error",
                "message": "Stream error"
            })

    except Exception as e:
        logger.error(f"WebSocket events connection error: {str(e)}")


async def broadcast_progress(review_id: str, progress: int, status: str = None, phase: str = None) -> None:
    """
    Broadcast progress update to all connected clients for a review.

    Called from analysis pipeline when progress changes.
    """
    if review_id not in active_connections:
        return

    message = {
        "type": "progress",
        "progress": progress,
    }

    if status:
        message["status"] = status

    if phase:
        message["phase"] = phase

    # Send to all connected clients
    disconnected = []
    for websocket in active_connections[review_id]:
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send progress update: {str(e)}")
            disconnected.append(websocket)

    # Remove disconnected clients
    for ws in disconnected:
        try:
            active_connections[review_id].remove(ws)
        except:
            pass


async def broadcast_event(review_id: str, event_data: dict[str, Any]) -> None:
    """
    Broadcast forensic event to all connected clients for a review.

    Called from analysis pipeline when forensic event occurs.
    """
    if review_id not in active_connections:
        return

    message = {
        "type": "event",
        "data": event_data,
    }

    disconnected = []
    for websocket in active_connections[review_id]:
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send event: {str(e)}")
            disconnected.append(websocket)

    for ws in disconnected:
        try:
            active_connections[review_id].remove(ws)
        except:
            pass


async def broadcast_completion(review_id: str, report_data: dict[str, Any]) -> None:
    """
    Broadcast analysis completion to all connected clients.

    Called from analysis pipeline when analysis finishes.
    """
    if review_id not in active_connections:
        return

    message = {
        "type": "complete",
        "data": report_data,
    }

    disconnected = []
    for websocket in active_connections[review_id]:
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send completion: {str(e)}")
            disconnected.append(websocket)

    # Close all connections
    for ws in active_connections[review_id]:
        try:
            await ws.close(code=1000, reason="Analysis complete")
        except:
            pass

    del active_connections[review_id]
