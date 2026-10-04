---
description: "Radar fechado de datos, inferencia, agentes y plataformas: cambios upstream, condiciones de adopción, compromisos y próxima evidencia."
hide:
  - toc
icon: material/microscope
---

<!-- markdownlint-disable MD013 -->

# :material-microscope: Radar tecnológico

> Un radar tecnológico con condiciones de adopción y un siguiente paso comprobable.

Sigo cambios que pueden alterar una decisión de plataforma: interoperabilidad,
coste operativo, recuperación, seguridad y esfuerzo de desarrollo.
Las recomendaciones son mi evaluación arquitectónica de las fuentes enlazadas.

<p class="research-meta">Fuentes revisadas · septiembre de 2026 · Revisar al cambiar una dependencia, carga o protocolo</p>

<div class="reading-panel" markdown="block">

## Radar de Decisiones

**Usar** indica una base para el alcance descrito. **Pilotar** exige una
prueba aislada contra una referencia. **Evaluar** indica que falta evidencia
antes de convertirlo en dependencia de plataforma.

Primero, una recomendación breve; después, el razonamiento completo y sus fuentes.

<div class="comparison-source" data-comparison="radar" markdown="block">

<div class="comparison-entry" data-group="data" data-category="Datos" data-position="use" data-label="Uso selectivo" data-summary="Empezar con archivos locales; compartir formatos solo si cada herramienta conserva los datos correctamente." markdown="block">

<span id="datos-comprobar-la-portabilidad"></span>

### Analítica local, Iceberg v3 y DuckLake

Iceberg v3 incorpora capacidades de formato como vectores de borrado, linaje
de filas y tipos adicionales. Una revisión del formato no garantiza que
cada motor pueda leer y escribir cada función. DuckLake llegó a v1.0 en
abril de 2026 con metadatos SQL y acceso compartido mediante PostgreSQL;
describirlo solo como catálogo de un nodo omite esa diferencia.
[Especificación de Iceberg](https://iceberg.apache.org/spec/),
[anuncio de DuckLake v1.0](https://duckdb.org/2026/04/13/ducklake-10).
DuckLabs anunció el 2026-08-26 que pasará a ser una filial de AWS; DuckDB y
DuckLake siguen bajo MIT y la DuckDB Foundation, y el 2026-09-02 se publicó
una alpha de DuckDB 2.0 con versión estable prevista para finales de octubre.
[DuckLabs y AWS](https://duckdb.org/2026/08/26/ducklabs-to-join-aws),
[alpha de DuckDB 2.0](https://duckdb.org/2026/09/02/try-duckdb-20-alpha).

**Mi criterio:** Empezar el desarrollo local con DuckDB/Polars y Parquet.
Elegir Iceberg cuando se necesite su ecosistema de motores; pilotar DuckLake
cuando su modelo de catálogo simplifique el despliegue previsto.

**Próxima prueba:** Ejecutar inserciones, borrados y cambios de esquema en
cada motor previsto y restaurar una copia. Registrar semántica de decimales
y timestamps, snapshots, commits concurrentes y permisos. Rechazar una
migración que convierta datos silenciosamente o use un escritor sin soporte.

</div>

<div class="comparison-entry" data-group="data" data-category="Datos" data-position="trial" data-label="Pilotar migración" data-summary="Probar primero un proyecto existente; revisar madurez, integraciones y vuelta segura a la versión anterior." markdown="block">

### dbt v2 y Fusion {#dbt-core-v2-y-fusion}

La actualización de licencias de junio de 2026 describe dos distribuciones
con un motor Rust compartido: el runtime Apache-2.0 `dbt-oss` y la
compilación `dbt` de dbt Labs, que añade análisis estático, funciones LSP y
`dbt lint` bajo una licencia de producto. La equivalencia antigua entre motor
Fusion y núcleo propietario ya no es correcta. dbt v2.0 alcanzó
disponibilidad general el 2026-09-14 (2.0.5 el 2026-09-18) con cinco
adaptadores GA; Spark y ClickHouse siguen en beta, y v1 mantiene soporte
completo como 1.12.x. Compartir motor no garantiza compatibilidad entre
distribuciones.
[FAQ de licencias de dbt](https://www.getdbt.com/licenses-faq).

**Mi criterio:** Pilotar con un proyecto existente antes de cambiar el
runner de producción. Comparar adaptadores, materializaciones propias,
modelos Python, macros, consumidores de artefactos y CI. Conservar el runtime
anterior hasta demostrar equivalencia de resultados y rollback.

</div>

<div class="comparison-entry" data-group="data" data-category="Datos" data-position="evaluate" data-label="Evaluar" data-summary="Demostrar que datos más recientes y una recuperación fiable justifican operar otro servicio." markdown="block">

### Lakehouses de streaming

Fluss documenta transferencia por niveles a almacenamiento lakehouse y
un servicio basado en Flink que conecta datos recientes con snapshots
históricos de Iceberg. Las integraciones y restricciones difieren entre
documentación publicada y de desarrollo.
[Almacenamiento lakehouse de Fluss](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/),
[integración con Iceberg](https://fluss.apache.org/docs/streaming-lakehouse/datalake-formats/iceberg/).

**Mi criterio:** Comparar con la ruta más simple CDC → log duradero →
lakehouse. Exigir corrección por tiempo de evento, backpressure, gestión
de duplicados, recuperación de cambios de esquema y una meta de frescura
medida. Otro nivel con estado debe justificar almacenamiento y operación.

</div>

<div class="comparison-entry" data-group="data" data-category="Datos" data-position="trial" data-label="Pilotar" data-summary="Añadir un motor para consultar datos recientes solo cuando el procesamiento programado de archivos no baste." markdown="block">

### Serving analítico y orquestación

ClickHouse 26.8 incorpora [SQL encadenado](https://clickhouse.com/blog/pipelined-sql-26.8),
una forma de escribir transformaciones por etapas. Es una extensión de dialecto,
no una garantía de consultas más rápidas. Kafka/Flink procesan eventos;
Airflow coordina tareas: no intercambiarlos como si resolvieran la misma carga.

**Mi criterio:** Pilotar Kafka → Flink → ClickHouse cuando consultas frescas
justifiquen un motor de serving. Conservar batch sobre Parquet/DuckDB como
referencia. Medir eventos tardíos, duplicados, lag, relectura y reconstrucción
del destino; comparar también el esfuerzo de guardia. El patrón
[medallion](https://docs.databricks.com/aws/en/lakehouse/medallion) ayuda a separar
datos recibidos, validados y de negocio, sin obligar a crear tres copias
cuando no aportan valor.

</div>

<div class="comparison-entry" data-group="ai" data-category="Inferencia" data-position="trial" data-label="Pilotar" data-summary="Aceptar más velocidad solo si calidad, tiempo de respuesta y coste total siguen cumpliendo las mismas metas." markdown="block">

### Inferencia: Optimizar Trabajo Útil

Separar prefill/decode, enrutar por caché KV, reutilizar prefijos y aplicar
decodificación especulativa resuelve cuellos de botella distintos. Separar
workers puede aislar prefills largos del decode, pero añade transferencia
y coordinación; la especulación depende de aceptación y compatibilidad.
[Ajuste de rendimiento en Dynamo](https://docs.dynamo.nvidia.com/dynamo/kubernetes/operations/performance-tuning).

**Mi criterio:** Empezar con un servidor instrumentado o una API de
referencia. Evaluar un cambio a la vez. Seleccionar modelos mediante tareas
versionadas, requisitos de licencia y límites del hardware, en lugar de
mantener una lista del modelo permanentemente “mejor”.

**Próxima prueba:** Variar tasa de llegada y concurrencia con caché fría y
caliente. Publicar calidad, TTFT, latencia entre tokens, p95/p99, rechazos,
colas y coste por tarea correcta. Comprobar aislamiento de caché por tenant.
Una mediana mejor con peor cola de latencia o calidad no pasa el mismo
criterio de aceptación.

</div>

<div class="comparison-entry" data-group="ai" data-category="Agentes" data-position="trial" data-label="Pilotar actualizaciones" data-summary="Actualizar tras probar permisos, compatibilidad y reintentos que podrían repetir una acción." markdown="block">

<span id="agentes-protocolos-estado-y-autoridad"></span>

### MCP 2026-07-28 y A2A 1.0

La revisión MCP de julio cambia a un núcleo de protocolo sin estado,
modifica descubrimiento y solicitudes, añade cabeceras de enrutamiento
y refuerza autorización. El estado de aplicación sigue necesitando un lugar
explícito. A2A 1.0 define comunicación entre agentes, una frontera distinta
del acceso a herramientas.
[Notas de MCP](https://blog.modelcontextprotocol.io/posts/2026-07-28/),
[anuncio de A2A 1.0](https://a2a-protocol.org/dev/blog/2026/03/12/a2a-protocol-ships-v10-production-ready-standard-for-agent-to-agent-communication/).

**Mi criterio:** Fijar una pareja cliente/servidor probada y migrar de forma
deliberada. Revisar el diseño anterior de sesiones de transporte. Incorporar
A2A cuando la responsabilidad cruce runtimes y explicitar permisos por
herramienta.

**Próxima prueba:** Credenciales vencidas o de otra audiencia, confusión de
identidad, cruces entre tenants, cancelación, duplicados y reinicio alrededor
de un efecto aprobado. Un protocolo o esquema de salida no vuelve
determinista el razonamiento ni impide por sí solo un bucle.

</div>

<div class="comparison-entry" data-group="ai" data-category="Agentes" data-position="evaluate" data-label="Evaluar" data-summary="Conservar memoria solo si encuentra información útil, respeta el borrado y mantiene permisos explícitos." markdown="block">

### Memoria y remediación asistida

La memoria persistente solo aporta valor si mejora recuperación y se puede
gobernar. Un dato incorrecto retenido puede contaminar tareas posteriores.
En remediación, el primer resultado útil es un diagnóstico acotado y
reproducible junto a un parche revisable.

**Mi criterio:** Empezar con contexto de sesión explícito y búsqueda
léxica/vectorial. Pilotar memoria con grafos cuando las relaciones justifiquen
su extracción. Mantener procedencia, fechas de validez, filtros por tenant
y propagación de borrados. Probar inyección desde documentos, respuestas
de herramientas y memoria.
[Riesgos OWASP de aplicaciones LLM](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final).

**Próxima prueba:** Comparar contra una referencia sin memoria en tareas
reservadas, borrar una fuente y comprobar que no reaparece; después,
reproducir un incidente en un entorno aislado. Remediar producción exige
permisos explícitos, validación y revisión antes de escribir.

</div>

<div class="comparison-entry" data-group="ai" data-category="Evaluación" data-position="use" data-label="Usar" data-summary="Comprobar resultados reales y fallos; comparar la evaluación de IA con el criterio humano." markdown="block">

### Evaluación: Medir Resultados y Calibrar Jueces

La evaluación de agentes necesita resultados por tarea y fallos operativos.
Aserciones de código, rúbricas de modelos y revisión humana tienen propósitos
distintos; los jueces de IA requieren calibración. El propio harness puede
introducir estado compartido o errores de calificación.
[Metodología de evaluación](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

**Mi criterio:** Usar pruebas deterministas para permisos, esquemas,
integridad y resultados conocidos. Reservar jueces de IA para aspectos
subjetivos con rúbrica y etiquetas humanas. Publicar ensayos fallidos
y variabilidad; separar mejoras de capacidad de protección contra regresiones.

**Próxima prueba:** Reservar datos por fuente y fecha, reproducir fallos
representativos y comparar jueces con etiquetas humanas. Los benchmarks
públicos aportan ideas; su clasificación no demuestra idoneidad para un flujo
privado.

</div>

<div class="comparison-entry" data-group="platform" data-category="Plataformas" data-position="trial" data-label="Pilotar" data-summary="Compartir asignación y enrutamiento de GPU solo si varios equipos lo necesitan y pueden recuperarse de fallos." markdown="block">

### Plataformas: Asignar, Enrutar y Recuperar

DRA de Kubernetes asigna dispositivos mediante solicitudes y drivers;
un gateway de inferencia elige endpoints con información del serving.
Son capas distintas y tienen requisitos de compatibilidad propios.
[DRA de Kubernetes](https://kubernetes.io/docs/concepts/resource-management/dynamic-resource-allocation/),
[Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/).

**Mi criterio:** Pilotar cuando varios equipos compartan una flota.
Partir de soporte documentado de drivers y gateway, identidad de cargas,
controles de admisión, procedencia de imágenes y restauración.
Un único servicio puede necesitar mucho menos.

**Próxima prueba:** Caída de driver, drenado de nodos GPU, pérdida de
capacidad, rollback de modelo, vecinos ruidosos y admisión denegada.
Las políticas sobre un plan Terraform/OpenTofu complementan la detección
de deriva en runtime; ninguna observa todo el sistema.
Consultar los [criterios de producción](blueprints.md#criterios-para-produccion).

</div>

<div class="comparison-entry" data-group="platform" data-category="Observabilidad" data-position="use" data-label="Usar" data-summary="Relacionar cada solicitud con su resultado y coste, sin exponer contenido sensible." markdown="block">

### Observabilidad y Coste: Versionar el Contrato

Las convenciones GenAI tienen ahora un repositorio propio de OpenTelemetry.
Fijar convenciones e instrumentación juntas y revisar estabilidad por señal.
FOCUS 1.3 define datos de coste/consumo y relaciones con compromisos
contractuales; no asigna automáticamente una factura a una tarea correcta.
[Convenciones GenAI](https://github.com/open-telemetry/semantic-conventions-genai),
[FOCUS 1.3](https://focus.finops.org/docs/specification/v1-3/).

**Mi criterio:** Relacionar identidad de solicitud, revisión de modelo/ruta,
tokens, latencia, resultado y coste asignado. Omitir contenido sensible de
prompts y herramientas por defecto. Controlar cardinalidad, muestreo,
retención y gasto de telemetría.

**Próxima prueba:** Conciliar una factura representativa con trazas,
incluyendo reintentos, caché, GPU ociosas y egress. Aplicar presupuestos
en código y señalar costes sin atribuir. Continuar los experimentos en
[Laboratorios de investigación](labs.md#contrato-de-evidencia).

</div>

</div>

</div>

## Versiones y Canales de Publicación {#release-watch}

La novedad orienta qué probar; no sustituye una versión fijada ni evidencia
de operación. Revisión: septiembre de 2026.

| Tecnología | Cambio contrastado | Próxima comprobación |
| :--- | :--- | :--- |
| [DuckDB](https://duckdb.org/release_calendar) | 1.5.5 estable; alpha de 2.0 publicada el 2026-09-02 y versión estable prevista para finales de octubre; DuckLabs pasa a AWS con la licencia MIT y el gobierno de la fundación sin cambios | Mantener la referencia estable; aislar pruebas cliente/servidor en la alpha 2.0; vigilar el gobierno del proyecto cuando se cierre la adquisición. |
| [dbt v2.0](https://github.com/dbt-labs/dbt/releases/tag/v2.0.5) | 2.0.0 GA el 2026-09-14, 2.0.5 el 2026-09-18; reescritura en Rust con cinco adaptadores GA, y 1.12.x con soporte completo | Confirmar adaptadores y macros antes de sustituir Core 1.x; licencia y madurez son preguntas distintas. |
| [Kafka 4.3](https://kafka.apache.org/blog/) | Línea 4.3; 4.3.1 publicada en junio; release candidate 1 de 4.4.0 etiquetada el 2026-09-22 | Probar actualización de brokers/clientes, recuperación y compatibilidad del estado. |
| [Airflow 3.3.2](https://airflow.apache.org/docs/apache-airflow/stable/release_notes.html) | Publicado el 17 de septiembre | Ensayar migración de DAGs, providers, workers y serialización XCom; Composer/MWAA llevan su propio calendario. |
| [ClickHouse 26.8 LTS](https://presentations.clickhouse.com/2026-release-26.8/) | LTS de agosto; añade SQL encadenado con <code>&#124;&gt;</code> (encadena etapas SQL); 26.9 estable publicada el 2026-09-21 | Comparar serving analítico con una referencia batch; medir semántica, coste y portabilidad del dialecto. |

El SQL Explorer de [Herramientas interactivas](tools.md) es un intérprete didáctico propio;
no incorpora DuckDB ni implementa el dialecto de ClickHouse.
