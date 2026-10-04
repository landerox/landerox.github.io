---
reviewed: 2026-09-23
description: "Compara dbt 1.12 y 2.0, SQLMesh, Dataform Core y Bruin: modelado SQL, cambios incrementales, despliegue, licencias open source y recuperación."
hide:
  - toc
icon: material/table-arrow-right
---

<!-- markdownlint-disable MD013 -->

# :material-table-arrow-right: Transformación y modelado de datos

> Elige según la seguridad con la que un cambio se convierte en datos confiables.

Un scheduler puede iniciar un job correctamente y producir una tabla con
ingresos duplicados. Las herramientas de transformación describen modelos,
dependencias y controles; su modelo de despliegue determina cómo llegan los
cambios a los consumidores. Compararía ese ciclo antes que la sintaxis.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del núcleo | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [dbt Core 1.12.5](https://github.com/dbt-labs/dbt/tree/v1.12.5) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | Modelado SQL con un proyecto dbt existente y cualquier adaptador v1 | Adaptador, paquetes, estrategia incremental y ejecución de jobs necesitan pruebas de compatibilidad propias. |
| [dbt 2.0.5 · dbt-oss](https://github.com/dbt-labs/dbt/tree/v2.0.5) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Un proyecto nuevo, o con la migración ya probada, en Snowflake, BigQuery, Databricks, Redshift o DuckDB que busca un único binario y validación al parsear | Cinco adaptadores GA, con Spark y ClickHouse aún en beta; el análisis estático, el LSP completo y `dbt lint` vienen en la compilación `dbt` con licencia de producto, no en `dbt-oss`. |
| [SQLMesh 0.236.2](https://github.com/SQLMesh/sqlmesh/tree/v0.236.2) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Planificar cambios de modelos, backfills por intervalos y promoción entre entornos | El estado de los modelos y los entornos virtuales pasan a formar parte del contrato operativo. |
| [Dataform Core 3.0.70](https://github.com/dataform-co/dataform/tree/3.0.70) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Transformaciones SQLX en una plataforma centrada en BigQuery | El framework open source y el servicio gestionado de Google Cloud tienen alcances de despliegue distintos. |
| [Bruin 0.11.762](https://github.com/bruin-data/bruin/tree/v0.11.762) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Un proyecto que combina SQL, Python, ingesta y controles de calidad | Su alcance de pipeline requiere delimitar responsabilidades con un orquestador existente. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | dbt Core 1.12 | 1 | 1 | 1 | 1 | 1 | 5 |
    | dbt 2.0 (dbt-oss) | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | SQLMesh | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | Dataform Core | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | Bruin | 1 | 1 | 0,5 | 1 | 0,5 | 4 |

Los cinco núcleos revisados utilizan una licencia permisiva. Revisa por
separado los términos de servicios comerciales y runtimes relacionados.

## Empieza por la carga

- **Un entorno dbt que funciona:** mantendría dbt Core 1.12 entre las
  opciones; v1 sigue con soporte completo. Exigiría evidencia de mejoras en
  cambios seguros, recuperación o esfuerzo operativo. Migraría paquetes,
  macros, tests y comportamiento del adaptador dentro del ensayo, tanto si el
  destino es dbt 2.0 como otra herramienta.
- **Un proyecto nuevo con un adaptador de v2:** empezaría con dbt 2.0 si el
  warehouse es Snowflake, BigQuery, Databricks, Redshift o DuckDB. Decidiría
  desde el inicio si los jobs ejecutan `dbt-oss` o la compilación `dbt` con
  licencia de producto, y la fijaría.
- **Cambios frecuentes en modelos particionados:** compararía los planes y
  entornos de SQLMesh con el proceso real de despliegue dbt. Incluiría
  recuperación del estado y coste de recalcular datos históricos.
- **BigQuery y un modelo operativo Google Cloud existente:** compararía
  Dataform Core y el servicio Dataform por separado. Definiría qué
  responsabilidades de ejecución, identidad y repositorio asume el servicio.
- **Un pipeline compacto de SQL y Python:** probaría Bruin cuando ingesta y
  transformación pertenecen al mismo repositorio. Decidiría si Bruin o un
  orquestador externo controla reintentos y programación de cada paso.

## Versiones y notas operativas

??? info faq-item "dbt — fijar la línea, la compilación y el adaptador"
    dbt v2.0, una reescritura completa en Rust, alcanzó disponibilidad general
    el 2026-09-14; [2.0.5](https://github.com/dbt-labs/dbt/releases/tag/v2.0.5)
    era la versión vigente al revisar. v1 vive en la
    [rama `1.latest`](https://github.com/dbt-labs/dbt/tree/1.latest) y sigue
    con soporte completo; la versión v1 revisada es
    [1.12.5](https://github.com/dbt-labs/dbt/tree/v1.12.5). Fija juntos la
    línea de dbt, la compilación, el adaptador de base de datos y los paquetes
    del proyecto. Prueba escrituras incrementales con datos duplicados y
    tardíos, incluyendo un cambio de esquema durante un backfill.

    v2 se distribuye como un único binario autocontenido con drivers
    compilados. Su
    [ciclo de vida de adaptadores](https://docs.getdbt.com/docs/supported-data-platforms)
    indica disponibilidad general para Snowflake, BigQuery, Databricks,
    Redshift y DuckDB (solo CLI), Apache Spark en beta y ClickHouse en beta
    privada; los demás adaptadores de v1 aún no tienen driver para v2. La
    [guía de actualización](https://docs.getdbt.com/docs/dbt-versions/dbt-upgrade/upgrading-to-v2)
    elimina la funcionalidad obsoleta y convierte las configuraciones
    desconocidas en errores de parseo. dbt 1.12 puede ensayar el nuevo parser
    con `--use-v2-parser`, y ambas líneas escriben un manifest compatible, de
    modo que `state:modified` y `--defer` siguen funcionando en entornos
    mixtos. Una versión mayor nueva sigue sin demostrar que paquetes o macros
    existentes funcionen sin cambios.

    La fila de v2 puntúa la madurez con 0,5: el proyecto tiene una larga
    trayectoria, pero este runtime alcanzó disponibilidad general nueve días
    antes de la revisión y publicó cinco parches en sus primeros cuatro días.
    La interoperabilidad se queda en 0,5 hasta que sus adaptadores cubran lo
    que cubre v1.

??? info faq-item "SQLMesh — proteger planes, estado e intervalos"
    El [ciclo de los modelos](https://sqlmesh.readthedocs.io/en/stable/concepts/overview/)
    incluye planes de cambios, intervalos de backfill, tests y auditorías.
    Los entornos virtuales pueden reutilizar resultados físicos cuando
    corresponde.

    La [guía de estado](https://sqlmesh.readthedocs.io/en/stable/faq/faq/)
    identifica metadatos persistidos de modelos y ejecuciones. Restaura ese
    estado junto con los objetos del warehouse que referencia. Ensaya un
    backfill parcial y una reversión después de cambiar el significado de
    un modelo; revertir una vista no demuestra que el histórico se corrigió.

??? info faq-item "Dataform — distinguir framework y servicio gestionado"
    [Dataform Core](https://github.com/dataform-co/dataform/tree/3.0.70)
    ofrece SQLX y compilación basada en dependencias. El
    [servicio Dataform de Google](https://docs.cloud.google.com/dataform/docs/overview)
    gestiona workflows que ejecutan SQL en BigQuery.

    Prueba la compilación con la cuenta de servicio y ubicaciones de datasets
    reales. Revisa aserciones, configuración de versiones y de ejecución.
    Reproduce una tabla de origen no disponible y un cambio de permisos;
    compilar correctamente no demuestra acceso a los datos durante la ejecución.

??? info faq-item "Bruin — definir quién controla cada paso"
    El [proyecto Bruin revisado](https://github.com/bruin-data/bruin/tree/v0.11.762)
    combina ingesta, transformación SQL/Python y calidad de datos en un CLI.
    Su alcance se solapa con parte de la responsabilidad de un orquestador.

    Ejecuta un pipeline de varios lenguajes en local y en el entorno previsto.
    Sigue las credenciales y salidas intermedias, y reintenta tras completar
    una escritura externa. Evita que políticas independientes multipliquen
    el mismo efecto lateral entre schedulers anidados.

## Dónde encajan dbt v2 y las bibliotecas de procesamiento

**dbt v2 separa el código fuente de la distribución.** El código del antiguo
motor Fusion vive en el [repositorio principal de dbt](https://github.com/dbt-labs/dbt),
donde el código de v2 es Apache-2.0; el
[repositorio `dbt-fusion`](https://github.com/dbt-labs/dbt-fusion) es un archivo.
`pip install dbt-oss` instala ese
[runtime Apache-2.0](https://docs.getdbt.com/docs/local/install-dbt-v2): el
lenguaje de dbt, la semántica del DAG y los comandos estándar. El
`pip install dbt` por defecto instala la compilación de dbt Labs bajo la
[licencia de producto de dbt](https://www.getdbt.com/dbt-product-license-agreement),
que añade comprensión de SQL y análisis estático, funciones LSP, `dbt lint` y
la extensión de VS Code. El linaje por columna, la comprobación de tipos y el
análisis de impacto además requieren una cuenta de la plataforma dbt,
gratuita o de pago
([disponibilidad de funciones](https://docs.getdbt.com/docs/dbt/dbt-availability)).
Comprueba qué binario ejecuta cada job antes de heredar la etiqueta Apache;
esta comparación califica `dbt-oss`.

[Ibis 12.0.0](https://github.com/ibis-project/ibis/tree/12.0.0), Polars y Spark
ayudan a expresar o ejecutar transformaciones. Su función difiere de
controlar promoción de modelos, backfills y estado de producción. En el
[stack de datos](../stack.md), DuckDB y otros motores aportan ejecución,
mientras que la capa de modelado aporta cambios reproducibles.

Asimismo, [Airflow o Dagster](workflow-orchestrators.md) pueden coordinar
un job de transformación. Orquestador y framework de modelado pueden ser
útiles juntos; cada responsabilidad necesita un responsable claro.

## Una prueba que pueda cambiar la decisión

Usa los mismos pedidos, clientes y modelo de ingresos diarios en cada
candidato. Mantén fijos el motor de ejecución y la instantánea de entrada.

1. **Corrección:** reconcilia ingresos tras pedidos duplicados, eventos
   tardíos, un tipo de cambio corregido y un cliente eliminado.
2. **Impacto del cambio:** modifica un modelo compartido y revisa qué
   dependencias se reconstruyen. Compara los datos, además del plan generado.
3. **Recuperación:** interrumpe una ejecución entre escrituras, restaura
   metadatos y continúa sin duplicar efectos visibles externamente.
4. **Aislamiento del despliegue:** comprueba que desarrollo no reemplaza
   tablas de producción ni expone resultados sin aprobar a dashboards.
5. **Coste:** registra trabajo del warehouse, almacenamiento temporal,
   duración del backfill y tiempo operativo. Separa compilación de consultas.

## Completa el recorrido de los datos

Modela las [tablas del lakehouse](lakehouse-table-formats.md), programa sus
actualizaciones con un [orquestador](workflow-orchestrators.md) y expón los
resultados mediante [OLAP](olap-databases.md) y [BI](business-intelligence.md).
Usa [observabilidad](observability.md) para detectar salidas fallidas o
desactualizadas; éxito técnico y corrección de negocio necesitan controles propios.
