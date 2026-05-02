"""SCR Inspector Agent — Detección de patrones maliciosos en código.

Este módulo implementa el Inspector Agent, el primer paso del pipeline SCR.
Analiza código fuente en busca de:
- Backdoors y code injection
- Logical bombs y time bombs
- Credential exposure
- Malicious patterns (ofuscación, hidden code, etc)

El Inspector usa LLM (Anthropic, OpenAI, etc) para análisis semántico
combinado con regex patterns para detección rápida.

Ejemplo:
    >>> inspector = InspectorAgent(llm_provider="anthropic")
    >>> findings = await inspector.analyze_code(
    ...     code="import os; os.system('rm -rf /')",
    ...     context={"file": "setup.py", "repo": "https://github.com/..."}
    ... )
    >>> print(findings)
    [
        {
            "tipo_malicia": "COMMAND_INJECTION",
            "severidad": "CRITICO",
            "confianza": 0.95,
            "linea_inicio": 1,
            "descripcion": "Direct os.system() with unsanitized input"
        }
    ]
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Optional

from app.services.ia_provider import AIProviderType, get_ai_provider


@dataclass
class Finding:
    """Hallazgo de código malicioso.
    
    Attributes:
        tipo_malicia: Categoría (BACKDOOR, INJECTION, LOGIC_BOMB, etc)
        severidad: BAJO, MEDIO, ALTO, CRITICO
        confianza: Score 0-1 de confianza del hallazgo
        linea_inicio: Línea donde comienza
        linea_fin: Línea donde termina
        descripcion: Descripción del hallazgo
        codigo_snippet: Código relevante (~200 chars)
    """
    tipo_malicia: str
    severidad: str
    confianza: float
    linea_inicio: int
    linea_fin: int
    descripcion: str
    codigo_snippet: str


class InspectorAgent:
    """Agente Inspector del pipeline SCR.
    
    Realiza análisis de patrones maliciosos usando combinación de:
    - LLM semántico (análisis contextual)
    - Regex patterns (detección rápida)
    - AST analysis (Python - detección estructural)
    
    Attributes:
        llm_provider: Provider LLM a usar (default: anthropic)
        llm_model: Modelo específico (default: claude-3-5-sonnet)
        max_chunk_size: Max bytes por chunk para LLM (default: 200KB)
    """

    MALICIOUS_PATTERNS = {
        "BACKDOOR": [
            r"__import__\s*\(\s*['\"]os['\"]",
            r"subprocess\.Popen\s*\(\s*['\"](?:bash|sh|cmd|powershell)",
            r"eval\s*\(\s*(?:input|raw_input|request\.args)",
        ],
        "CREDENTIAL_EXPOSURE": [
            r"(password|secret|api_key|token)\s*=\s*['\"][^'\"]{10,}['\"]",
            r"AWS_SECRET_ACCESS_KEY\s*=",
            r"GITHUB_TOKEN\s*=",
        ],
        "LOGIC_BOMB": [
            r"datetime\.now\(\).*==\s*datetime\(",
            r"time\.time\(\).*==\s*\d{10}",
        ],
    }

    def __init__(
        self,
        llm_provider: str = "anthropic",
        llm_model: str = "claude-3-5-sonnet-20241022",
        max_chunk_size: int = 200_000,
    ):
        """Inicializa el Inspector Agent.
        
        Args:
            llm_provider: Proveedor LLM (anthropic, openai, ollama, etc)
            llm_model: Modelo específico del proveedor
            max_chunk_size: Máximo de bytes por chunk de código a analizar
        """
        self.llm_provider = llm_provider
        self.llm_model = llm_model
        self.max_chunk_size = max_chunk_size
        ptype_map = {
            "anthropic": AIProviderType.ANTHROPIC,
            "openai": AIProviderType.OPENAI,
            "ollama": AIProviderType.OLLAMA,
        }
        ptype = ptype_map.get(str(llm_provider).lower(), AIProviderType.ANTHROPIC)
        api_key = ""
        if ptype == AIProviderType.ANTHROPIC:
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif ptype == AIProviderType.OPENAI:
            api_key = os.getenv("OPENAI_API_KEY", "")
        elif ptype == AIProviderType.OLLAMA:
            api_key = os.getenv("OLLAMA_API_KEY", "ollama")
        kwargs: dict[str, object] = {"model": llm_model, "api_key": api_key or "unset"}
        if ptype == AIProviderType.OLLAMA:
            kwargs["base_url"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.llm = get_ai_provider(ptype, **kwargs)

    async def analyze_code(
        self,
        code: str,
        filename: str = "unknown",
        repo_context: Optional[dict] = None,
    ) -> list[Finding]:
        """Analiza código en busca de patrones maliciosos.
        
        Realiza análisis en dos fases:
        1. Regex pattern matching (rápido, determinístico)
        2. LLM semantic analysis (lento, contextual)
        
        Args:
            code: Contenido del código a analizar
            filename: Nombre del archivo (para contexto)
            repo_context: Contexto del repositorio
                {
                    "url": "https://github.com/...",
                    "branch": "main",
                    "commit": "abc123..."
                }
        
        Returns:
            Lista de findings encontrados ordenados por severidad
        
        Raises:
            ValueError: Si el código es muy grande (> 10MB)
        """
        if len(code) > 10_000_000:
            raise ValueError("Code too large (>10MB)")

        findings = []

        # Phase 1: Regex patterns (fast)
        findings.extend(self._regex_analysis(code, filename))

        # Phase 2: LLM analysis (slow but thorough)
        llm_findings = await self._llm_analysis(code, filename, repo_context)
        findings.extend(llm_findings)

        # Deduplicate and sort
        findings = self._deduplicate(findings)
        findings.sort(
            key=lambda f: (
                {"CRITICO": 0, "ALTO": 1, "MEDIO": 2, "BAJO": 3}.get(f.severidad, 4),
                -f.confianza,
            )
        )

        return findings

    def _regex_analysis(self, code: str, filename: str) -> list[Finding]:
        """Análisis rápido con regex patterns.
        
        Args:
            code: Código a analizar
            filename: Nombre del archivo
        
        Returns:
            Lista de findings encontrados
        """
        findings = []
        lines = code.split("\n")

        for malice_type, patterns in self.MALICIOUS_PATTERNS.items():
            for pattern in patterns:
                for line_num, line in enumerate(lines, 1):
                    if re.search(pattern, line, re.IGNORECASE):
                        findings.append(
                            Finding(
                                tipo_malicia=malice_type,
                                severidad="MEDIO",
                                confianza=0.6,
                                linea_inicio=line_num,
                                linea_fin=line_num,
                                descripcion=f"Pattern matched: {pattern[:50]}...",
                                codigo_snippet=line[:200],
                            )
                        )

        return findings

    async def _llm_analysis(
        self, code: str, filename: str, repo_context: Optional[dict]
    ) -> list[Finding]:
        """Análisis semántico con LLM.
        
        Args:
            code: Código a analizar
            filename: Nombre del archivo
            repo_context: Contexto del repositorio
        
        Returns:
            Lista de findings encontrados
        """
        # Split code into chunks if needed
        chunks = self._chunk_code(code)
        findings = []

        for chunk_num, chunk in enumerate(chunks):
            prompt = self._build_llm_prompt(chunk, filename, repo_context, chunk_num)
            
            response = await self.llm.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=2000,
            )

            # Parse LLM response and extract findings
            chunk_findings = self._parse_llm_response(response, chunk)
            findings.extend(chunk_findings)

        return findings

    def _chunk_code(self, code: str) -> list[str]:
        """Divide código en chunks si es muy grande.
        
        Args:
            code: Código a dividir
        
        Returns:
            Lista de chunks de código
        """
        if len(code) <= self.max_chunk_size:
            return [code]

        chunks = []
        lines = code.split("\n")
        current_chunk = []
        current_size = 0

        for line in lines:
            line_size = len(line.encode("utf-8"))
            if current_size + line_size > self.max_chunk_size and current_chunk:
                chunks.append("\n".join(current_chunk))
                current_chunk = []
                current_size = 0

            current_chunk.append(line)
            current_size += line_size

        if current_chunk:
            chunks.append("\n".join(current_chunk))

        return chunks

    def _build_llm_prompt(
        self,
        code: str,
        filename: str,
        repo_context: Optional[dict],
        chunk_num: int = 0,
    ) -> str:
        """Construye prompt para LLM.
        
        Args:
            code: Código a analizar
            filename: Nombre del archivo
            repo_context: Contexto repo
            chunk_num: Número de chunk (si hay múltiples)
        
        Returns:
            Prompt formateado para LLM
        """
        context_str = ""
        if repo_context:
            context_str = f"""
Repository: {repo_context.get('url')}
Branch: {repo_context.get('branch', 'main')}
Commit: {repo_context.get('commit', 'unknown')}
"""

        return f"""Analyze this code for malicious patterns:
{context_str}
File: {filename}
Chunk: {chunk_num}

<code>
{code}
</code>

List any findings in JSON format:
[
    {{
        "tipo_malicia": "BACKDOOR|INJECTION|LOGIC_BOMB|...",
        "severidad": "BAJO|MEDIO|ALTO|CRITICO",
        "confianza": 0.0-1.0,
        "linea_inicio": number,
        "descripcion": "reason why this is malicious"
    }}
]"""

    def _parse_llm_response(self, response: str, code: str) -> list[Finding]:
        """Parsea respuesta del LLM.
        
        Args:
            response: Respuesta del LLM
            code: Código original (para extraer snippets)
        
        Returns:
            Lista de findings parseados
        """
        # TODO: Parse JSON from LLM response
        # This is a placeholder implementation
        return []

    def _deduplicate(self, findings: list[Finding]) -> list[Finding]:
        """Elimina findings duplicados.
        
        Args:
            findings: Lista de findings (posiblemente con duplicados)
        
        Returns:
            Lista de findings únicos
        """
        seen = set()
        unique = []

        for finding in findings:
            key = (
                finding.tipo_malicia,
                finding.linea_inicio,
                finding.linea_fin,
                finding.codigo_snippet[:20],
            )
            if key not in seen:
                seen.add(key)
                unique.append(finding)

        return unique


# ─── Contrato estable (prompts + runners) usado por tests y enqueue ───

DEFAULT_MALICIOUS_PATTERNS: dict[str, list[str]] = {
    "EXEC_ENV_BACKDOOR": [
        r"os\.getenv\s*\(",
        r"exec\s*\(\s*input\s*\(",
    ],
    "DATA_EXFILTRATION": [
        r"(password|secret|api_key)\s*=\s*['\"][^'\"]{8,}['\"]",
        r"print\s*\(\s*SECRET",
    ],
    "LOGIC_BOMB": [
        r"datetime\.now\(\).*==",
        r"if\s+DEBUG\s*:",
    ],
}

DEFAULT_PATTERN_SEVERITY: dict[str, str] = {
    "EXEC_ENV_BACKDOOR": "CRITICO",
    "DATA_EXFILTRATION": "CRITICO",
    "LOGIC_BOMB": "CRITICO",
}


def _build_inspector_system_prompt(patterns: dict[str, list[str]]) -> str:
    """Prompt de sistema; debe mencionar categorías usadas en el contrato JSON."""
    lines = [
        "You are a security code inspector. Analyze code for malicious patterns.",
        "Known categories (JSON):",
    ]
    for name in patterns:
        lines.append(name)
    lines.append("Respond with JSON containing a `findings` array.")
    return "\n".join(lines)


def _build_inspector_prompt(code_chunks: list[tuple[str, str]]) -> str:
    blocks: list[str] = []
    for path, code in code_chunks:
        blocks.append(f"File: {path}\n{code}")
    return "\n\n".join(blocks)


async def run_inspector_stub(rutas_fuente: dict[str, str]) -> list[dict]:
    """Fallback sin LLM: no inventa hallazgos sintéticos."""
    return []


def _inspector_resolve_api_key(
    provider: AIProviderType, api_key_override: str | None
) -> str | None:
    if api_key_override:
        return api_key_override
    if provider == AIProviderType.ANTHROPIC:
        return os.getenv("ANTHROPIC_API_KEY")
    if provider == AIProviderType.OPENAI:
        return os.getenv("OPENAI_API_KEY")
    return os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")


async def run_inspector_real(
    rutas_fuente: dict[str, str],
    provider: AIProviderType,
    api_key_override: str | None = None,
) -> list[dict]:
    """Ejecuta el Inspector vía LLM y enriquece hallazgos (severidad, estado)."""
    api_key = _inspector_resolve_api_key(provider, api_key_override)
    if not api_key:
        return []

    llm = get_ai_provider(provider_type=provider, api_key=api_key)
    prompt = _build_inspector_prompt(list(rutas_fuente.items()))
    system = _build_inspector_system_prompt(DEFAULT_MALICIOUS_PATTERNS)

    response = await llm.generate(
        prompt=prompt,
        system=system,
        temperature=0.3,
        max_tokens=2000,
    )
    raw = getattr(response, "content", None)
    if raw is None:
        raw = str(response)
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []

    findings_in = data.get("findings")
    if not isinstance(findings_in, list):
        return []

    out: list[dict] = []
    for f in findings_in:
        if not isinstance(f, dict):
            continue
        tipo = str(f.get("tipo_malicia", ""))
        severidad = DEFAULT_PATTERN_SEVERITY.get(tipo, "MEDIO")
        row = {**f, "severidad": severidad, "estado": "DETECTED"}
        if "remediacion_sugerida" not in row:
            row["remediacion_sugerida"] = (
                "Review the affected code path and apply least-privilege controls."
            )
        out.append(row)
    return out
