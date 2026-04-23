"""TipoPrueba service — async CRUD with enforced per-user ownership."""

from app.models.tipo_prueba import TipoPrueba
from app.schemas.tipo_prueba import TipoPruebaCreate, TipoPruebaUpdate
from app.services.base import BaseService

tipo_prueba_svc = BaseService[TipoPrueba, TipoPruebaCreate, TipoPruebaUpdate](
    TipoPrueba,
    owner_field="user_id",
    audit_action_prefix="tipo_prueba",
)
