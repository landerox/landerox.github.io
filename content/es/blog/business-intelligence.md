---
title: "BI y visualización de datos"
reviewed: 2026-10-15
description: "Compara Apache Superset, Metabase, Lightdash, Evidence y Redash: BI, ediciones open source, permisos, integración y costo operativo."
hide:
  - toc
icon: material/chart-box-outline
---

<!-- markdownlint-disable MD013 -->

# :material-chart-box-outline: BI y visualización de datos

> Elige pensando en quién hace las preguntas y qué datos puede consultar.

Un analista SQL explorando un warehouse, un equipo de negocio creando
dashboards y un cliente consultando un informe integrado necesitan interfaces
y permisos distintos. Evaluaría esos recorridos antes de contar gráficos.
La base de datos ejecuta las consultas analíticas; BI añade metadatos,
identidades, resultados en caché y responsabilidades de publicación.

<figure class="architecture-diagram architecture-overview">
  <ol class="architecture-flow" role="list">
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">01</span>
      <strong class="architecture-stage__title">Datasets y métricas</strong>
      <p>Tablas curadas, modelos semánticos o consultas SQL versionadas definen dimensiones, medidas y joins para compartir definiciones coherentes.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">02</span>
      <strong class="architecture-stage__title">Identidad y permisos</strong>
      <p>SSO, control por roles, filtros por fila y credenciales de base de datos fijan si las consultas corren con cuenta compartida o por lector.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">03</span>
      <strong class="architecture-stage__title">Pushdown y caché</strong>
      <p>La capa BI traduce exploraciones visuales o SQL en consultas al motor, coordina workers asíncronos y gestiona cachés sin cruzar datos.</p>
    </li>
    <li class="architecture-stage">
      <span class="architecture-stage__number" aria-hidden="true">04</span>
      <strong class="architecture-stage__title">Dashboards, informes y embeds</strong>
      <p>Gráficos interactivos, envíos programados, informes como código en Markdown y vistas firmadas llegan a equipos internos o clientes.</p>
    </li>
  </ol>
  <figcaption>Cuatro responsabilidades entre la base analítica y quien lee. El gobierno de métricas, la identidad y el aislamiento de caché separan las opciones de BI.</figcaption>
</figure>

## Comparación de un vistazo

**Fuentes revisadas: octubre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del núcleo | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Apache Superset 6.1.0](https://github.com/apache/superset/tree/6.1.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Exploración SQL y dashboards compartidos sobre varios motores analíticos | Metadatos, workers, cachés y permisos de base de datos necesitan un plan operativo. |
| [Metabase 0.64.1](https://github.com/metabase/metabase/tree/v0.64.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 en Open Source Edition | Usuarios de negocio que combinan consultas visuales con preguntas SQL | Gobierno avanzado e integración en aplicaciones dependen de la edición y sus términos. |
| [Redash 26.9.0](https://github.com/getredash/redash/tree/v26.9.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | BSD-2-Clause | Equipos SQL que comparten consultas, gráficos y dashboards | Programación, workers, resultados y credenciales de las fuentes necesitan mantenimiento. |
| [Lightdash 2.586.0](https://github.com/lightdash/lightdash/tree/2.586.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | Núcleo MIT; excepciones enterprise | Exploración sobre dimensiones y métricas modeladas, especialmente con dbt | La responsabilidad de los modelos y las funciones del núcleo abierto deben encajar con el despliegue. |
| [Evidence 40.1.8](https://github.com/evidence-dev/evidence/releases/tag/%40evidence-dev/evidence%4040.1.8) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | Framework MIT | Informes de datos redactados con SQL y Markdown | Publicación y control de acceso deben proteger los datos distribuidos con el informe. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en octubre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Apache Superset | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Cube | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Metabase | 1 | 0,5 | 1 | 0,5 | 1 | 4 |
    | Redash | 0,5 | 1 | 0,5 | 0,5 | 1 | 3,5 |
    | Lightdash | 1 | 0,5 | 0,5 | 0,5 | 0,5 | 3 |
    | Evidence | 0,5 | 0,5 | 0,5 | 1 | 0,5 | 3 |

## Empieza por el lector

- **Analistas SQL explorando varias fuentes:** preseleccionaría Superset y
  Redash. Probaría drivers reales, límites de consulta y carga de dashboards.
- **Usuarios de negocio que necesitan exploración guiada:** empezaría con
  Metabase y una pregunta real con sus usuarios. Verificaría los controles de
  Open Source Edition antes de incluir funciones de pago en el diseño.
- **Un equipo que ya gobierna métricas con dbt:** compararía Lightdash con
  las definiciones semánticas y responsabilidades existentes. Reconciliaría
  joins, filtros y nombres de métricas antes de elegir la presentación.
- **Un informe con explicación redactada y publicación reproducible:**
  consideraría Evidence. Trataría los datos generados como parte del
  artefacto publicado, con audiencia y límite de acceso explícitos.
- **Analítica integrada en una aplicación de clientes:** evaluaría primero
  aislamiento por tenant, propagación de identidad y licencias. Un iframe
  por sí solo no establece un límite de autorización.

## Versiones y notas operativas

??? info faq-item "Superset — proteger aplicación y base de datos"
    El [repositorio revisado](https://github.com/apache/superset/tree/6.1.0)
    describe exploración visual, SQL Lab y conexiones a bases de datos. Su
    [guía de seguridad](https://superset.apache.org/docs/security/)
    explica permisos y restricciones por filas.

    Usa una identidad de base de datos con los privilegios necesarios.
    Prueba cachés, acceso SQL y exportaciones con dos usuarios que deban ver
    datos distintos. Conserva los metadatos de la aplicación además de la
    fuente analítica; tablas del warehouse no reconstruyen dashboards y permisos.

??? info faq-item "Metabase — identificar edición y términos de integración"
    El [archivo de licencia](https://github.com/metabase/metabase/blob/v0.64.1/LICENSE.txt)
    distingue código y binarios AGPL de artefactos enterprise. La
    [página de licencias](https://www.metabase.com/license) documenta opciones
    de integración y términos comerciales separados.

    Prueba consultas visuales, editor SQL y distribución con la audiencia
    prevista. Revisa la edición exacta para aislamiento por tenant, auditoría
    e identidad. Recupera la base de la aplicación y verifica preguntas
    guardadas, permisos y entregas programadas.

??? info faq-item "Lightdash — coordinar cambios de métricas y aplicación"
    El [proyecto](https://github.com/lightdash/lightdash/tree/2.586.0)
    conecta dimensiones y métricas gobernadas con exploración interactiva.
    Su [licencia](https://github.com/lightdash/lightdash/blob/2.586.0/LICENSE)
    establece MIT para el núcleo y términos separados para un directorio enterprise.

    Cambia una métrica y un join mientras los dashboards los referencian.
    Comprueba revisión, vista previa y reversión en el despliegue real.
    Valida integración dbt y adaptadores sin asumir que toda función del
    producto alojado se incluye en el núcleo.

??? info faq-item "Evidence — revisar el artefacto de datos publicado"
    [Evidence Core](https://docs.evidence.dev/) construye aplicaciones de
    datos con SQL y Markdown. El framework MIT y Studio alojado tienen
    alcances distintos; la documentación identifica funciones exclusivas de Studio.

    Inspecciona el artefacto generado y las peticiones del navegador con una
    cuenta de lector. Ocultar un gráfico o enlace no elimina sus datos.
    Prueba actualizaciones, fallos de publicación y recuperación del informe
    anterior. Verifica que la documentación corresponde a la generación elegida.

??? info faq-item "Redash — operar la ejecución de consultas"
    El [proyecto autoalojado](https://github.com/getredash/redash/tree/v26.9.0)
    ofrece consultas guardadas, visualizaciones y dashboards. La
    [documentación](https://redash.io/help/) separa recorridos de usuario y
    operación de una instalación propia.

    Prueba consultas largas, una fuente no disponible y una credencial
    vencida. Comprueba qué resultados sobreviven en caché y quién puede
    exportarlos. Incluye base de la aplicación, cola y workers en el presupuesto.

## Dónde encajan Cube y Grafana

[Cube 1.8.6](https://github.com/cube-js/cube/tree/v1.8.6) <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> es una capa
semántica para exponer datos modelados mediante APIs y SQL. Sus
[licencias de código](https://github.com/cube-js/cube/blob/v1.8.6/LICENSE)
combinan Apache-2.0 y MIT según el paquete. Puede respaldar una aplicación
analítica; su entrega difiere de una interfaz BI de autoservicio completa.

[Grafana](observability.md) pertenece principalmente a la comparativa de
observabilidad. Puede consultar fuentes SQL, pero investigar incidentes,
visualizar series temporales y gobernar métricas de negocio son escenarios
de evaluación diferentes.

## Candidatos a seguir

[Rill](https://github.com/rilldata/rill/tree/v0.90.5) (Apache-2.0; 0.90.5,
publicada el 2026-10-09) define dashboards, una capa semántica y políticas de
seguridad como YAML y SQL, y consulta motores OLAP como ClickHouse y DuckDB.
Aún no tiene calificación: no he revisado qué incluye la edición open source
frente a Rill Cloud con los criterios de arriba.

## Una prueba que pueda cambiar la decisión

Usa un modelo de ingresos, dos tenants y una pregunta de negocio representativa.

1. **Corrección:** reconcilia totales, zonas horarias, nulos, filtros y
   multiplicación de filas por joins con una consulta de referencia.
2. **Autorización:** verifica dashboards, consultas directas, exportaciones,
   cachés y vistas integradas después de revocar permisos de un usuario.
3. **Usabilidad:** observa a los usuarios previstos responder la pregunta;
   registra errores y ayuda requerida, además del tiempo empleado.
4. **Recuperación:** restaura metadatos, identidades, conexiones e informes;
   comprueba que las entregas programadas llegan a la audiencia correcta.
5. **Costo:** mide trabajo en la base origen, frecuencia de actualización,
   almacenamiento en caché y operación con concurrencia representativa.

## Completa el recorrido de los datos

La [transformación](data-transformation.md) define modelos confiables;
los [motores OLAP](olap-databases.md) ejecutan consultas. El
[formato de tabla](lakehouse-table-formats.md) gobierna el estado del lakehouse,
y la [observabilidad](observability.md) ayuda a detectar informes
desactualizados y fallos. Empieza con la combinación mínima que necesita el lector.
