---
description: "Investigación aplicada en inferencia, plataformas de datos y agentes, con referencias de comparación y criterios de evaluación."
hide:
  - toc
icon: material/flask
---

<!-- markdownlint-disable MD013 -->

# :material-flask: Laboratorios de investigación

> Preguntas de arquitectura de mi trabajo en cloud, datos e IA, cada una contrastada con una alternativa más simple.

Cada experimento parte de esa alternativa y de un fallo concreto que
investigar. Las etiquetas de estado siguen mi ciclo interno de investigación;
el código de clientes es confidencial.

## Laboratorios de Investigación { .reading-panel-heading }

=== "Desarrollo Activo"

    <div class="lab-entry" markdown>

    ### Servicio de inferencia {#inference-fabric-inference-fabric}

    **Propósito:** Respuestas más rápidas sin perder calidad ni ocultar costes.

    **Punto de partida:** Un servidor agrupa solicitudes; probar cachés frías
    y calientes con igual calidad. Comparar vLLM/SGLang; evaluar Dynamo y
    LMCache ante un cuello de botella, no como conjunto obligatorio.

    **Medir:** Espera hasta el primer token, fragmento de texto (TTFT), e
    intervalo entre tokens (ITL); latencias altas (p95/p99), respuestas dentro
    del objetivo, cola, memoria y coste por tarea correcta.

    **Probar fallos:** Sobrecarga, cancelación, expulsión de caché, bucles de
    recuperación, filtraciones entre clientes y caída del procesador de
    entradas.

    **Próxima evidencia:** Barrido reproducible, una optimización por vez.
    Separar procesamiento de entrada y generación debe compensar
    transferencia de caché y capacidad adicional. La decodificación
    especulativa debe justificar memoria del borrador y tasa de aceptación.
    [Guía de arquitectura de Dynamo](https://docs.dynamo.nvidia.com/dynamo/knowledge-base/concepts/system-architecture/disaggregated-serving).

    </div>

    <div class="lab-entry" markdown>

    ### Interoperabilidad de tablas abiertas {#data-fabric-data-fabric}

    **Propósito:** Conservar resultados analíticos coherentes al cambiar de
    motor, catálogo o almacenamiento.

    **Punto de partida:** DuckDB o Polars sobre Parquet con esquemas
    explícitos. Evaluar Iceberg con catálogo REST para tablas compartidas
    entre motores; comparar el catálogo SQL y la concurrencia de DuckLake.

    **Medir:** Resultados equivalentes, precisión decimal, fechas y horas, nulos,
    frescura e ingesta completa frente a incremental.

    **Probar fallos:** Inserciones/borrados interrumpidos, esquemas
    incompatibles, escritores concurrentes, snapshots vencidos y recuperación.
    Repetir cambios duplicados y desordenados antes de conectar una fuente
    en vivo.

    **Próxima evidencia:** Matriz de lectores/escritores y traza de
    recuperación. La [especificación Iceberg v3](https://iceberg.apache.org/spec/)
    define vectores de borrado y linaje; cada motor requiere pruebas.
    Los [catálogos de DuckLake](https://ducklake.select/docs/stable/duckdb/usage/choosing_a_catalog_database)
    tienen límites de concurrencia distintos.

    </div>

    <div class="lab-entry" markdown>

    ### Flujos agénticos durables {#agent-fabric-agent-fabric}

    **Propósito:** Reanudar flujos de IA sin repetir escrituras ni dejar que
    un modelo se conceda permisos.

    **Punto de partida:** Un agente con herramientas estructuradas y
    ejecución acotada. Añadir LangGraph o Pydantic AI cuando guardar puntos
    de recuperación lo justifique. Separar estado de aplicación y transporte.
    Fijar versiones del protocolo de herramientas (MCP); considerar
    comunicación entre agentes (A2A) solo con operadores independientes.

    **Medir:** Tareas completadas, tiempo, coste de tokens, llamadas,
    reintentos y acciones denegadas. Validar identidad, alcance por cliente y
    argumentos fuera del modelo; un clasificador no concede autoridad.

    **Probar fallos:** Credenciales o aprobaciones vencidas, duplicados,
    cancelación y respuestas hostiles de herramientas. Aislar la ejecución;
    acotar tiempo, tokens, llamadas y reintentos.

    **Próxima evidencia:** Trazas que demuestren que reanudar no repite una
    escritura aprobada. Usar estado persistente y operaciones idempotentes,
    sin asumir respuestas deterministas del modelo.
    [Persistencia en LangGraph](https://docs.langchain.com/oss/python/langgraph/persistence)
    y [A2A 1.0](https://a2a-protocol.org/latest/specification/).

    </div>

=== "Completados"

    <div class="lab-entry" markdown>

    ### Reparación de código guiada por logs {#engineering-fabric-engineering-fabric}

    Un estudio de cómo los logs y las dependencias de datos pueden orientar
    una reparación de código revisable.

    **Alcance interno:** Diagnóstico mediante logs, linaje de dbt y propuestas
    de parches, con dependencias afectadas y validación en un entorno aislado.

    **Límite:** La propuesta debe reproducir el fallo, superar regresiones y
    recibir revisión humana antes de aplicarse. Producir un parche no
    demuestra que un incidente de producción esté resuelto.

    </div>

    <div class="lab-entry" markdown>

    ### Arnés de evaluación de IA {#eval-fabric-eval-fabric}

    Una forma reproducible de comparar prompts, recuperación y flujos de
    agentes.

    **Alcance interno:** Un sistema de evaluación con datasets versionados,
    aserciones deterministas y rúbricas calibradas. Las herramientas
    candidatas incluyen Pytest, Promptfoo, DeepEval y Phoenix.

    **Límite:** Reservar tareas de regresión no vistas, conservar ensayos
    fallidos y calibrar jueces de IA con etiquetas humanas. Medir éxito,
    acciones no autorizadas, latencia y coste por separado. Varios jueces
    pueden compartir sesgos; el consenso no basta como verdad.
    [Metodología de evaluación](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

    </div>

=== "Planificados"

    <div class="lab-entry" markdown>

    ### Recuperación y memoria {#knowledge-fabric-knowledge-fabric}

    Encontrar conocimiento relevante sin retener información obsoleta o
    retirada.

    **Punto de partida:** Comparar búsqueda por palabras, vectorial e híbrida
    con PostgreSQL/pgvector o Qdrant antes de añadir memoria basada en grafos.

    **Evidencia necesaria:** Ejecutar tareas no vistas con fuentes y fechas
    de validez registradas. Borrar una fuente y comprobar que los registros
    derivados no permiten recuperarla. Comparar relevancia, frescura y coste
    de mantenimiento. Considerar Graphiti o una base de grafos solo si las
    consultas de relaciones mejoran esas tareas lo suficiente para justificar
    extracción y mantenimiento continuos.

    </div>

    <div class="lab-entry" markdown>

    ### Decisiones validadas con políticas {#governance-fabric-governance-fabric}

    Facilitar la revisión de decisiones de arquitectura y excepciones de
    políticas.

    **Punto de partida:** Registros de decisiones de arquitectura comprobados
    con Open Policy Agent (OPA) y Conftest, reglas explícitas y excepciones
    verificables.

    **Evidencia necesaria:** Comparar ejemplos aceptados y rechazados,
    conservar la versión de la política e identificar quién aprueba
    excepciones. Los agentes pueden señalar evidencia faltante y redactar
    revisiones, pero no concederse autoridad. Un responsable acepta las
    excepciones y las reglas deterministas aplican la decisión. Registrar la
    evidencia que respalda cada cambio de política propuesto.

    </div>

    <div class="lab-entry" markdown>

    ### Plataformas reproducibles {#platform-fabric-platform-fabric}

    Hacer reproducibles los despliegues y permitir que un equipo ensaye su
    recuperación.

    **Punto de partida:** Terraform/OpenTofu, GitOps y controles Kubernetes
    alrededor de un procedimiento documentado de despliegue y restauración.

    **Evidencia necesaria:** Recrear un entorno, restaurar su estado y
    demostrar una reversión con el runtime y los drivers previstos. Incorporar
    Crossplane, asignación dinámica de recursos (DRA) o un gateway de
    inferencia solo ante una necesidad demostrada. Registrar compatibilidad,
    responsabilidad de capacidad y pasos ante fallos de dependencias;
    otra capa de control debe justificar su trabajo operativo.

    </div>

    <div class="lab-entry" markdown>

    ### Costo por tarea exitosa {#fabric-ops-fabric-ops}

    Relacionar cada resultado útil con su coste real y evidencia operativa.

    **Punto de partida:** Resultados de aplicación, señales OpenTelemetry y
    facturación normalizada con el formato de costes FOCUS.

    **Evidencia necesaria:** Incluir reintentos, capacidad ociosa, transferencia
    de datos y retención de telemetría en el coste por tarea correcta. Aplicar
    presupuestos durante la ejecución; un dashboard no detiene el consumo
    excesivo. Comparar investigación asistida por IA, de solo lectura, con
    un runbook humano, conservando fuentes y midiendo falsos positivos.
    Toda remediación exige revisión y autoridad explícita antes de escribir.

    </div>

    <div class="lab-entry" markdown>

    ### Frescura del streaming {#streaming-fabric-streaming-fabric}

    Decidir si datos más frescos justifican operar más servicios de forma
    continua.

    **Punto de partida:** Procesamiento por lotes sobre Parquet/DuckDB.
    Pilotar Kafka 4.3, Flink y ClickHouse 26.8 LTS por etapas, no como
    conjunto obligatorio.

    **Evidencia necesaria:** Medir frescura, demora de procesamiento,
    consultas concurrentes y coste. Repetir duplicados y eventos tardíos
    desde posiciones conocidas, reconstruir el destino y comparar resultados.
    Probar cambios de esquema, sobrecarga y caída del consumidor.
    El [radar](explorations.md#release-watch) enlaza versiones y fuentes.
    Aquí se estudia entrega continua; Interoperabilidad de tablas abiertas estudia compatibilidad
    entre motores y catálogos.

    </div>

    <div class="lab-entry" markdown>

    ### Usabilidad de herramientas {#experience-lab-experience-lab}

    Ayudar a comprender una herramienta de ingeniería y a interpretar su
    resultado.

    **Punto de partida:** Ejemplos guiados y controles HTML nativos.
    Usar [Herramientas interactivas](tools.md) para comparar ayudas progresivas, sugerencias de
    comandos y explicaciones de fallos con visitantes técnicos y no técnicos.

    **Evidencia necesaria:** Éxito de tarea, comprensión del resultado,
    recuperación de errores y recorridos por teclado/táctil. Revisar
    movimiento reducido, zoom y ayudas técnicas junto con las
    [premisas UX/UI](blueprints.md#ux-ui). Estas sesiones de usuarios no se
    han realizado. Añadir complejidad visual exige evidencia de que ayuda
    a completar la tarea prevista.

    </div>

## Fundamentos de Ingeniería

| Principio | Compromiso operativo |
| :--- | :--- |
| Open source primero | Registrar licencias, términos de modelos y ruta de salida; los servicios gestionados siguen siendo una opción explícita. |
| Local primero | Reproducir el comportamiento localmente; no inferir concurrencia o resiliencia de producción desde un portátil. |
| Portabilidad por contrato | Probar esquemas, autenticación, semántica SQL y fallos en destinos concretos. |
| Evaluar antes de desplegar | Versionar cargas y umbrales de aceptación antes de comparar candidatos. |
| Autoridad humana | Aplicar alcance y aprobaciones de herramientas en código, fuera del juicio del modelo. |
| Coste de ejecución | Incluir reintentos, hardware ocioso, operación y tareas fallidas en el denominador. |

**Compatibilidad bajo revisión:** MCP 2026-07-28 cambia el ciclo del
transporte; dbt v2.0 es GA con cinco adaptadores y 1.12 mantiene soporte, y DuckDB 2.0 es una alpha;
la telemetría GenAI tiene su propio repositorio de convenciones en evolución.
El [Radar tecnológico](explorations.md) registra las fuentes
primarias y las condiciones para adoptar estos cambios.

## Contrato de Evidencia

Antes de publicar una afirmación de rendimiento, adjuntar:

1. **Reproducción:** revisión de código, dataset/versión, semilla si aplica,
   hardware, drivers, runtime, pesos, precisión y dependencias fijadas.
2. **Carga:** patrón de llegada, concurrencia, longitudes de entrada/salida,
   estado de caché, calentamiento, repeticiones y fallos sin descartar.
3. **Comparación:** referencia, umbral de calidad, percentiles de latencia,
   throughput útil, confianza o variabilidad y supuestos de coste total.
4. **Operación:** pruebas de autorización, recuperación/rollback, límites
   conocidos y condiciones que invalidarían el resultado.

Ningún porcentaje de ahorro ni objetivo de latencia de esta página se
presenta como un resultado medido. La selección de arquitectura empieza en
[Blueprints de Producción](blueprints.md); la evaluación de candidatos está
en el [Radar tecnológico](explorations.md).
