# Especificación Funcional: Módulo MDA (Modelado de Amenazas)

## 1. Objetivo del Módulo
El módulo MDA (Modelado de Amenazas / Threat Modeling) permite a los arquitectos de seguridad y analistas documentar, evaluar y gestionar los riesgos de diseño de las aplicaciones antes de que se escriba el código. Utiliza las metodologías estándar de la industria: **STRIDE** para la identificación de amenazas y **DREAD** para la evaluación del riesgo.

## 2. Arquitectura de la Pantalla
La interfaz está diseñada para gestionar "Programas de Modelado" que contienen múltiples "Sesiones", las cuales a su vez contienen "Amenazas". Se divide en:
- **Vista Principal (Lista de Programas):** Tabla con los proyectos o aplicaciones que están siendo modelados.
- **Detalle del Programa (Workspace):** Al seleccionar un programa, se abre un espacio de trabajo con tres pestañas principales:
  1. **Diagrama de Flujo de Datos (DFD):** Área para adjuntar o visualizar la arquitectura.
  2. **Sesiones de Modelado:** Lista de reuniones de análisis realizadas.
  3. **Matriz de Amenazas (STRIDE/DREAD):** El núcleo del módulo, donde se documentan y evalúan los riesgos.

## 3. Matriz de Amenazas (STRIDE / DREAD)

### 3.1 Identificación (STRIDE)
Cada amenaza documentada debe clasificarse según el modelo STRIDE:
- **S**poofing (Suplantación de identidad)
- **T**ampering (Manipulación de datos)
- **R**epudiation (Repudio)
- **I**nformation Disclosure (Divulgación de información)
- **D**enial of Service (Denegación de servicio)
- **E**levation of Privilege (Elevación de privilegios)

### 3.2 Evaluación de Riesgo (DREAD)
Para cada amenaza, el analista califica 5 factores en una escala del 1 al 10 (o Alto/Medio/Bajo, configurable vía Builder):
- **D**amage (Daño potencial)
- **R**eproducibility (Reproducibilidad)
- **E**xploitability (Explotabilidad)
- **A**ffected Users (Usuarios afectados)
- **D**iscoverability (Descubribilidad)
- **Score DREAD:** El sistema calcula automáticamente el promedio de estos 5 factores para determinar la Severidad final de la amenaza (Crítica, Alta, Media, Baja).

### 3.3 Mitigación y Seguimiento
- **Estrategia de Mitigación:** Texto descriptivo de cómo se abordará el riesgo.
- **Estatus:** Abierta, Mitigada, Aceptada (Riesgo Aceptado).
- **Ticket Jira:** Enlace al ticket de desarrollo donde se implementará la mitigación.

## 4. Asistente de IA (AI Threat Finder)
El módulo integra un asistente de Inteligencia Artificial para acelerar la identificación de amenazas.
- **Entrada:** El analista proporciona una breve descripción de la arquitectura o sube el DFD.
- **Procesamiento:** La IA analiza el contexto y sugiere amenazas potenciales basadas en STRIDE.
- **Salida:** Una lista de amenazas sugeridas que el analista puede "Aceptar" para agregarlas automáticamente a la matriz, o "Rechazar".

## 5. Interacciones del Prototipo HTML (Mockup)
El prototipo `17_mda_threat_modeling.html` implementa el "Workspace" de un programa específico:
1. **Pestañas de Navegación:** Permite cambiar entre el Resumen/DFD, las Sesiones y la Matriz de Amenazas.
2. **Matriz Interactiva:** Una tabla detallada donde cada fila es una amenaza. Muestra la clasificación STRIDE mediante "badges" visuales y el cálculo DREAD.
3. **Calculadora DREAD (Modal):** Al hacer clic en el score de una amenaza, se abre un modal interactivo con 5 sliders (uno por cada factor DREAD). Al mover los sliders, el Score Final y la Severidad se recalculan en tiempo real.
4. **Botón "Sugerencias IA":** Simula la llamada al asistente de IA, mostrando un panel lateral con amenazas recomendadas listas para ser agregadas a la matriz.

## 6. Reglas de Negocio
- **Integración con Vulnerabilidades:** Las amenazas que no son mitigadas antes de la liberación a producción se convierten automáticamente en "Vulnerabilidades de Diseño" (Motor: MDA) y aparecen en el Concentrado de Vulnerabilidades.
- **Aceptación de Riesgos:** Si una amenaza con severidad "Alta" o "Crítica" se marca como "Aceptada", el sistema requiere obligatoriamente que se adjunte un documento de "Aceptación de Riesgo" firmado por el Director del área (Nivel 2).
- **Cálculo de Severidad:**
  - Score DREAD 8.0 - 10.0 = Crítica
  - Score DREAD 6.0 - 7.9 = Alta
  - Score DREAD 4.0 - 5.9 = Media
  - Score DREAD 1.0 - 3.9 = Baja
