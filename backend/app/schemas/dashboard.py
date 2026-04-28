"""Schemas for dashboard endpoints (D2-D4 and related views)."""

from pydantic import BaseModel, ConfigDict, Field

DashboardProgram = str


class HierarchyFiltersRead(BaseModel):
    model_config = ConfigDict(extra="allow")

    direccion_id: str | None = None
    subdireccion_id: str | None = None
    gerencia_id: str | None = None
    organizacion_id: str | None = None
    celula_id: str | None = None
    repositorio_id: str | None = None


class DashboardTeamAnalystRead(BaseModel):
    user_id: str
    total_vulnerabilities: int
    open_vulnerabilities: int
    closed_vulnerabilities: int
    closure_rate: int


class DashboardTeamDataRead(BaseModel):
    team_size: int
    analysts: list[DashboardTeamAnalystRead]
    applied_filters: HierarchyFiltersRead | None = None


class DashboardProgramsBreakdownRead(BaseModel):
    program: str
    total_findings: int
    closed_findings: int
    completion_percentage: int


class DashboardProgramsDataRead(BaseModel):
    total_programs: int
    avg_completion: int
    programs_at_risk: int
    program_breakdown: list[DashboardProgramsBreakdownRead]
    applied_filters: HierarchyFiltersRead | None = None


class DashboardProgramDetailDataRead(BaseModel):
    program: DashboardProgram
    source: str
    total_findings: int
    open_findings: int
    closed_findings: int
    overdue_findings: int
    completion_percentage: int
    applied_filters: HierarchyFiltersRead | None = None


class DashboardHeatmapCellRead(BaseModel):
    month: int = Field(ge=1, le=12)
    value: int = Field(ge=0, le=100)
    total: int = Field(ge=0)
    closed: int = Field(ge=0)


class DashboardProgramsHeatmapDataRead(BaseModel):
    heatmap: dict[str, list[DashboardHeatmapCellRead]]
    year: int


class DashboardEngineStatRead(BaseModel):
    motor: str
    count: int
    trend: int


class DashboardTrendPointRead(BaseModel):
    period: str
    count: int


class DashboardVulnerabilityRowRead(BaseModel):
    id: str
    motor: str
    severidad: str
    titulo: str
    descripcion: str | None = None
    fecha_deteccion: str | None = None
    sla: str | None = None
    estado: str


class DashboardChildRead(BaseModel):
    id: str
    name: str
    count: int


class DashboardVulnerabilitiesSummaryRead(BaseModel):
    total: int
    by_engine: list[DashboardEngineStatRead]
    by_severity: dict[str, int]
    trend: list[DashboardTrendPointRead]
    pipeline: dict[str, int]


class DashboardVulnerabilitiesDataRead(BaseModel):
    summary: DashboardVulnerabilitiesSummaryRead
    children: list[DashboardChildRead]
    children_type: str | None = None
    vulnerabilities: list[DashboardVulnerabilityRowRead] | None = None
    total_vulnerabilities: int | None = None
    by_severity: dict[str, int] | None = None
    by_state: dict[str, int] | None = None
    sla_status: dict[str, int] | None = None
    overdue_count: int | None = None
    applied_filters: HierarchyFiltersRead | None = None


class DashboardEnvelopeTeamRead(BaseModel):
    status: str = "success"
    data: DashboardTeamDataRead


class DashboardEnvelopeProgramsRead(BaseModel):
    status: str = "success"
    data: DashboardProgramsDataRead


class DashboardEnvelopeProgramDetailRead(BaseModel):
    status: str = "success"
    data: DashboardProgramDetailDataRead


class DashboardEnvelopeProgramsHeatmapRead(BaseModel):
    status: str = "success"
    data: DashboardProgramsHeatmapDataRead


class DashboardEnvelopeVulnerabilitiesRead(BaseModel):
    status: str = "success"
    data: DashboardVulnerabilitiesDataRead
