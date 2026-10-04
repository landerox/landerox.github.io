---
reviewed: 2026-09-23
description: "Compara observabilidad open source por función: Prometheus, Grafana, Mimir, VictoriaMetrics, Thanos, Loki, OpenSearch, Tempo, Jaeger, Pyroscope y colectores."
hide:
  - toc
icon: material/pulse
---

<!-- markdownlint-disable MD013 -->

# :material-pulse: Herramientas de observabilidad y sus funciones

> Elige las señales necesarias para investigar un fallo real.

Grafana y Prometheus pertenecen a la misma categoría de observabilidad,
pero resuelven partes distintas del problema. Prometheus recopila y almacena
métricas y evalúa reglas. Grafana consulta fuentes de datos y ofrece paneles,
exploración y alertas. Suelen trabajar juntos; una nota única que enfrente
a uno con el otro ocultaría esa relación.

## De un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Función | Componentes revisados | Calificación | Licencia del núcleo | Qué cambia la decisión |
| :--- | :--- | :--- | :--- | :--- |
| Recopilación de métricas y consultas locales | [Prometheus 3.14.0](https://github.com/prometheus/prometheus/tree/v3.14.0) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | Cobertura de recolección, series activas, retención local y reglas de alerta. |
| Paneles y exploración | [Grafana 13.2.2](https://github.com/grafana/grafana/tree/v13.2.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | AGPLv3 | Permisos sobre fuentes, plugins y edición OSS o comercial seleccionada. |
| Consultas globales y retención de Prometheus | [Thanos 0.42.4](https://github.com/thanos-io/thanos/tree/v0.42.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Topología existente de Prometheus, deduplicación y componentes de consulta y almacenamiento. |
| Logs | [Loki 3.7.8](https://github.com/grafana/loki/tree/v3.7.8) / [OpenSearch 3.8.0](https://github.com/opensearch-project/OpenSearch/tree/3.8.0) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | AGPLv3 / Apache-2.0 | Exploración por etiquetas frente a búsqueda indexada y su coste de almacenamiento. |
| Recopilación y envío | [OpenTelemetry Collector 0.161.0](https://github.com/open-telemetry/opentelemetry-collector/tree/v0.161.0) / [Alloy 1.19.2](https://github.com/grafana/alloy/tree/v1.19.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 / Apache-2.0 | Receptores, procesadores, exportadores y señales admitidas por la distribución elegida. |
| Envío de notificaciones | [Alertmanager 0.34.1](https://github.com/prometheus/alertmanager/tree/v0.34.1) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Agrupación, deduplicación, silencios y entrega al equipo responsable. |
| Métricas a largo plazo | [Mimir 3.2.1](https://github.com/grafana/mimir/tree/mimir-3.2.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 | Métricas multiinquilino, almacenamiento de objetos y operación distribuida. |
| Backend alternativo de métricas | [VictoriaMetrics 1.152.0](https://github.com/VictoriaMetrics/VictoriaMetrics/tree/v1.152.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 en el núcleo | Despliegue de un nodo o clúster, compatibilidad de consultas y límites enterprise. |
| Trazas distribuidas | [Tempo 3.0.3](https://github.com/grafana/tempo/tree/v3.0.3) / [Jaeger 2.21.0](https://github.com/jaegertracing/jaeger/tree/v2.21.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span><br><span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | AGPLv3 / Apache-2.0 | Investigación de trazas, muestreo, almacenamiento e integración con la interfaz existente. |
| Perfilado continuo | [Pyroscope 2.3.1](https://github.com/grafana/pyroscope/tree/v2.3.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 en el servidor | Lenguajes compatibles, sobrecarga de recolección e investigación del consumo de CPU o memoria. |
| Aplicación integrada de observabilidad | [SigNoz 0.143.0](https://github.com/SigNoz/signoz/tree/v0.143.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | MIT en el núcleo; excepciones enterprise | Investigación desde una interfaz común, operación del backend y controles de la edición exacta. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Prometheus | 1 | 1 | 1 | 1 | 1 | 5 |
    | Grafana | 1 | 0,5 | 1 | 1 | 1 | 4,5 |
    | Thanos | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Loki | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | OpenSearch | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Jaeger | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | OpenTelemetry Collector | 1 | 1 | 0,5 | 1 | 1 | 4,5 |
    | Alloy | 1 | 1 | 0,5 | 1 | 1 | 4,5 |
    | Alertmanager | 1 | 1 | 1 | 1 | 0,5 | 4,5 |
    | Mimir | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | VictoriaMetrics | 1 | 0,5 | 1 | 1 | 0,5 | 4 |
    | Tempo | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | Pyroscope | 1 | 1 | 1 | 0,5 | 0,5 | 4 |
    | SigNoz | 1 | 0,5 | 1 | 0,5 | 1 | 4 |

AGPL es una licencia open source. Las distribuciones comerciales de Grafana,
los directorios enterprise y los plugins pueden tener otros términos; el
nombre de un proveedor no determina la licencia de todos sus componentes.
El [resumen de licencias de Grafana](https://grafana.com/licensing/) y cada
repositorio revisado establecen esos límites.

## Empieza por el incidente

- **Un servicio pequeño necesita métricas útiles:** comienza con Prometheus,
  Grafana y una ruta explícita de entrega de alertas. Añade infraestructura
  de retención cuando la historia, disponibilidad o escala real lo requieran.
- **Varias instalaciones de Prometheus necesitan historia compartida:**
  compara Thanos, Mimir y VictoriaMetrics con la topología actual y consultas
  representativas. Incluye datos ausentes, deduplicación y límites entre inquilinos.
- **La investigación empieza por etiquetas de servicio y rangos de tiempo:**
  preselecciona Loki para logs. Incluye OpenSearch cuando la búsqueda indexada
  en contenido y campos sea central para el trabajo.
- **Una petición atraviesa varios servicios:** compara Tempo y Jaeger con
  peticiones instrumentadas y una política de muestreo. El almacenamiento
  no puede reconstruir spans que nunca se recopilaron.
- **La demora está dentro de un proceso:** evalúa Pyroscope para perfilado
  y conecta la evidencia con métricas y trazas. El perfilado y las trazas
  distribuidas responden preguntas distintas.
- **El equipo busca una aplicación para investigar:** prueba SigNoz junto
  a una composición de herramientas de Grafana. Compara el despliegue y los
  permisos completos, incluidos el backend y cualquier dependencia comercial.

## Versiones y notas de operación

??? info faq-item "Métricas — Prometheus, Mimir, VictoriaMetrics y Thanos"
    El [resumen de Prometheus](https://prometheus.io/docs/introduction/overview/)
    distingue servidor, exportadores y Alertmanager. Su base local de series
    temporales y sus reglas son útiles sin un servicio distribuido de métricas.
    Son datos de monitorización, no un registro completo para facturar por petición.

    [Mimir](https://grafana.com/docs/mimir/latest/introduction/) añade
    almacenamiento y consulta de métricas a largo plazo con varios inquilinos.
    [VictoriaMetrics](https://docs.victoriametrics.com/victoriametrics/)
    ofrece opciones de un nodo y clúster; verifica consultas y replicación
    en el despliegue elegido.
    [Thanos](https://thanos.io/tip/thanos/getting-started.md/)
    puede ampliar instalaciones existentes de Prometheus con consultas globales
    y almacenamiento histórico. Incluye sus componentes en las pruebas de recuperación.

??? info faq-item "Logs — Loki y OpenSearch"
    [Loki](https://github.com/grafana/loki/tree/v3.7.8) organiza flujos de logs
    mediante etiquetas; [OpenSearch](https://github.com/opensearch-project/OpenSearch/tree/3.8.0)
    aporta un motor de búsqueda y analítica con campos indexados.

    Repite investigaciones reales: servicio e identificador de traza conocidos,
    texto de error desconocido y una ventana larga. Mide ingesta, almacenamiento
    de índices o bloques, latencia de consulta y eliminación por retención.
    Evita conjuntos ilimitados de etiquetas con identificadores de usuario o
    petición; elige deliberadamente los campos que indexas.

??? info faq-item "Trazas y perfiles — Tempo, Jaeger y Pyroscope"
    [Tempo](https://github.com/grafana/tempo/tree/v3.0.3) y
    [Jaeger](https://github.com/jaegertracing/jaeger/tree/v2.21.0)
    permiten trabajar con trazas distribuidas. El
    [límite de licencia de Pyroscope](https://github.com/grafana/pyroscope/blob/v2.3.0/LICENSE)
    distingue su servidor AGPL de integraciones cliente con sus propios términos.

    Sigue una petición lenta a través de reintentos y trabajo asíncrono.
    Confirma la propagación de contexto y qué spans descarta el muestreo.
    Para perfiles, mide la sobrecarga en el entorno de ejecución real y
    comprueba que el periodo capturado incluye el problema investigado.

??? info faq-item "Colectores — OpenTelemetry Collector y Grafana Alloy"
    [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
    recibe, procesa y exporta telemetría. No es el backend de consulta
    persistente. La disponibilidad y estabilidad de componentes dependen
    de la distribución y la señal elegidas.

    [Alloy](https://grafana.com/docs/alloy/latest/introduction/) es una
    distribución de OpenTelemetry Collector con pipelines de Prometheus e
    integraciones para logs, trazas y perfiles. Elige por los componentes
    necesarios y la configuración que el equipo pueda operar. Prueba buffers,
    reintentos, sobrecarga y eliminación de atributos sensibles antes del envío.

??? info faq-item "Paneles y alertas — asigna responsables explícitos"
    [Grafana](https://github.com/grafana/grafana/tree/v13.2.2) es la interfaz
    compartida de consulta y visualización en el
    [stack de plataforma](../stack.md) del sitio. Un panel no sustituye el
    almacenamiento de métricas, logs, trazas o perfiles que consulta.

    Prometheus evalúa sus reglas; Alertmanager distribuye notificaciones.
    Las alertas de Grafana también pueden evaluar reglas sobre fuentes
    compatibles. Define qué sistema controla cada regla, silencio y contacto.
    Simula una caída del backend y verifica la entrega sin depender de que
    el panel esté disponible.

??? info faq-item "Plataformas integradas — compara el despliegue completo"
    [SigNoz](https://github.com/SigNoz/signoz/tree/v0.143.0) reúne la
    investigación de telemetría en una aplicación. Su
    [licencia](https://github.com/SigNoz/signoz/blob/v0.143.0/LICENSE)
    usa MIT en el núcleo con excepciones enterprise. Verifica permisos,
    identidades y retención en la edición que realmente evalúas.

    La versión 0.143.0 añade observabilidad de IA y usa tokens opacos como
    proveedor de sesión por defecto, así que cada usuario vuelve a iniciar
    sesión una vez. Según la
    [guía de actualización](https://signoz.io/docs/operate/migration/upgrade-0-143/),
    un colector autogestionado necesita `signoz-otel-collector` 0.144.11 con dos
    procesadores de trazas nuevos, y los atributos de mensajes de LLM pasan
    por defecto a las claves `gen_ai.*` de OpenTelemetry. Revisa las consultas
    guardadas y alertas que usan las claves antiguas.

    [OpenObserve](olap-databases.md) es otra opción orientada a observabilidad,
    cubierta allí junto al almacenamiento analítico. Compara recolección,
    almacenamiento e interacción de usuario en conjunto; ver menos servicios
    no demuestra por sí solo un menor coste operativo.

## Candidatos a seguir

Estos proyectos pueden cambiar la decisión, pero aún no tienen calificación:
cada uno necesita la misma revisión de edición abierta y operación que la
tabla de arriba.

- [ClickStack](https://clickhouse.com/docs/clickstack/overview) empaqueta
  ClickHouse, la interfaz [HyperDX](https://github.com/hyperdxio/hyperdx)
  (MIT; 2.39.1, publicada el 2026-09-19) y un colector OpenTelemetry para
  logs, trazas, métricas y session replay sobre un mismo almacén.
- [Coroot](https://github.com/coroot/coroot/tree/v1.26.7) (Apache-2.0; 1.26.7,
  publicada el 2026-09-18) recoge métricas, logs, trazas y perfiles mediante
  eBPF sin cambiar código, con alertas basadas en SLO; existe una edición
  Enterprise aparte.
- [GreptimeDB](https://github.com/GreptimeTeam/greptimedb/tree/v1.2.1)
  (Apache-2.0; 1.2.1, publicada el 2026-09-16) guarda métricas, logs y trazas
  en un único motor columnar sobre almacenamiento de objetos.

## Una prueba que puede cambiar la decisión

Usa un servicio con una dependencia, un despliegue fallido y un inquilino ruidoso.

1. **Cobertura:** detecta errores, latencia y telemetría ausente. Un colector
   que pierde datos no debe producir un panel engañosamente saludable.
2. **Investigación:** sigue una alerta hasta una traza, logs relevantes y
   un perfil cuando exista. Registra lagunas de evidencia y tiempo de investigación.
3. **Entrega de alertas:** interrumpe un backend y un receptor; comprueba
   reintentos, agrupación, silencios y una señal independiente del fallo.
4. **Recuperación y acceso:** restaura configuración y datos retenidos; prueba
   separación entre inquilinos, atributos depurados y credenciales caducadas.
5. **Coste:** mide series activas, cardinalidad de etiquetas, volumen de logs,
   spans muestreados, sobrecarga de perfiles, retención y esfuerzo con la misma carga.

## Sigue los datos

El [stack](../stack.md) ya distingue observabilidad de plataforma y de LLM
con Langfuse, Helicone y Arize Phoenix. Evaluación de modelos, contabilidad
de tokens y trazas de prompts añaden otra capa específica de la aplicación;
por sí solas no establecen la salud de la infraestructura.

La [orquestación](workflow-orchestrators.md) y la
[transformación](data-transformation.md) también necesitan controles de
frescura y corrección. [BI](business-intelligence.md) responde preguntas
del negocio, mientras los [presupuestos SLO](../projects/tools.md) ayudan
a convertir objetivos de servicio en decisiones operativas.
Elige primero las señales que responden esas preguntas.
