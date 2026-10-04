---
reviewed: 2026-09-23
description: "Comparativa de Airflow, Dagster, Prefect, Kestra y Argo Workflows: modelo de ejecución, licencias open source, recuperación y coste operativo."
hide:
  - toc
icon: material/source-branch
---

<!-- markdownlint-disable MD013 -->

# :material-source-branch: Orquestadores de workflows

> Elige según el trabajo que necesitas repetir de forma segura.

Una carga nocturna del warehouse, un producto de datos particionado y un
entrenamiento en contenedores requieren coordinaciones distintas. Elegiría
primero el modelo de ejecución y después compararía programación,
recuperación y la edición que el equipo puede operar.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del núcleo | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Airflow 3.3.2](https://github.com/apache/airflow/tree/3.3.2) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Flujos de datos programados con dependencias explícitas entre tareas | Scheduler, base de metadatos e infraestructura de ejecución requieren actualizaciones coordinadas. |
| [Argo Workflows 4.1.4](https://github.com/argoproj/argo-workflows/tree/v4.1.4) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Apache-2.0 | Pasos en contenedores sobre una plataforma Kubernetes existente | La elección incluye operar Kubernetes y el almacenamiento de artefactos. |
| [Dagster 1.13.24](https://github.com/dagster-io/dagster/tree/1.13.24) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Activos de datos cuyas dependencias y materializaciones importan | Adoptar el modelo de activos requiere ingeniería, además de cambiar el scheduler. |
| [Prefect 3.8.6](https://github.com/PrefectHQ/prefect/tree/3.8.6) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Workflows Python con su flujo de control habitual | Los despliegues de producción necesitan servidor y plan de ejecución y recuperación. |
| [Kestra 2.0.3](https://github.com/kestra-io/kestra/tree/v2.0.3) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Flujos declarativos que conectan scripts, servicios y eventos | Plugins, metadatos y almacenamiento interno forman parte de la operación. |
| [Windmill 1.817.0](https://github.com/windmill-labs/windmill/tree/v1.817.0) | <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span> | Compilación AGPLv3; excepciones | Scripts, automatización interna e interfaces para operadores | Los binarios Community Edition incluyen código propietario y condiciones adicionales. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Airflow | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Argo Workflows | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | Dagster | 1 | 0,5 | 1 | 0,5 | 1 | 4 |
    | Temporal | 1 | 1 | 1 | 0,5 | 0,5 | 4 |
    | Prefect | 1 | 0,5 | 1 | 0,5 | 0,5 | 3,5 |
    | Kestra | 1 | 0,5 | 1 | 0,5 | 0,5 | 3,5 |
    | Windmill | 1 | 0,5 | 0,5 | 0,5 | 0,5 | 3 |

[AGPLv3 es una licencia open source](https://spdx.org/licenses/AGPL-3.0-only.html).
Forma parte de la comparación junto con las licencias permisivas. Una
descarga gratuita no demuestra que la distribución sea open source; más
abajo detallo el caso de Windmill.

## Empieza por la carga

- **Una instalación Airflow existente:** mantendría Airflow entre las
  opciones cuando sus integraciones y el conocimiento operativo ya resuelven
  el problema. Exigiría una mejora concreta en recuperación o esfuerzo de
  desarrollo antes de migrar todos los DAG.
- **Un warehouse organizado alrededor de tablas y modelos:** empezaría con
  Dagster cuando los operadores necesitan entender qué datos existen, sus
  dependencias y qué particiones reconstruir. Compararía Airflow cuando las
  tareas representan mejor la responsabilidad operativa.
- **Una aplicación Python que pasa a ser un pipeline gestionado:** empezaría
  con Prefect. Mantendría la composición habitual de Python y definiría
  despliegues, estado de tareas, persistencia de resultados y cancelación.
- **Varios lenguajes y automatización por eventos:** compararía los flujos
  declarativos de Kestra con el enfoque de scripts de Windmill. Verificaría
  la edición exacta para identidad, auditoría y requisitos de despliegue.
- **Una plataforma basada en Kubernetes:** compararía Argo Workflows cuando
  cada paso encaja naturalmente en un contenedor. Incluiría arranque de pods,
  cuotas, cuentas de servicio y retención de artefactos en la evaluación.

Son preselecciones, no fronteras excluyentes de funcionalidades. Airflow
también admite activos y Dagster también ofrece jobs y ops. La distinción
está en el modelo que haría central en la práctica operativa del equipo.

## Versiones y notas operativas

??? info faq-item "Airflow — responsabilidades del plano de control y las tareas"
    La [arquitectura de Airflow](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html)
    separa programación, procesamiento de DAG, servidor API, metadatos y
    ejecución de tareas. El executor cambia dónde corre el trabajo; los
    demás componentes siguen necesitando responsables.

    Ensayaría el fallo de una tarea cuya escritura externa ya se completó.
    Comprobaría el destino, además del estado verde del DAG. Limitaría los
    backfills simultáneos para que reconstruir datos antiguos no bloquee
    las ejecuciones actuales. Fijaría los paquetes de providers junto con
    la versión de Airflow.

??? info faq-item "Dagster — modelar los datos que deben existir"
    Los [activos](https://docs.dagster.io/guides/build/assets) describen
    objetos persistidos y el código que los produce. Así, dependencias y
    materializaciones son unidades relevantes para la plataforma de datos.

    Probaría una reconstrucción parcial tras cambiar la lógica de origen:
    qué particiones se ejecutan, qué salidas se reemplazan y qué controles
    bloquean el trabajo dependiente. Presupuestaría la adopción del modelo.
    Distinguiría las capacidades OSS de las marcadas como Dagster+.

??? info faq-item "Prefect — el flujo Python necesita contratos operativos"
    Los [flows](https://docs.prefect.io/v3/concepts/flows) envuelven funciones
    Python con estado registrado, parámetros, reintentos y capacidades de
    despliegue. Es útil cuando la composición y las bifurcaciones ya están
    expresadas en Python.

    Probaría la desaparición de un worker, la cancelación y un despliegue con
    una versión incorrecta del código. Definiría dónde sobreviven resultados
    y logs al proceso. Una función local exitosa no prueba el servidor ni la
    infraestructura de las ejecuciones programadas en producción.

??? info faq-item "Kestra — incluir plugins y almacenamiento"
    La [referencia de arquitectura](https://kestra.io/docs/architecture)
    distingue backends JDBC y Kafka, componentes de ejecución y
    almacenamiento interno. Hay que ajustarlos a la edición OSS o enterprise
    elegida. [Kestra 2.0](https://github.com/kestra-io/kestra/releases/tag/v2.0.0)
    se publicó el 2026-09-07 (aquí se revisa 2.0.3) y 1.3.x sigue recibiendo
    parches. Rompe clientes de la API: los errores usan ahora RFC 9457
    (`application/problem+json`) y los `pluginDefaults` a nivel de flujo
    pierden la opción `forced`. Prueba integraciones y valores por defecto
    antes de actualizar.

    Versionaría juntos definición del flujo y plugins, y restauraría tanto
    los metadatos como los artefactos referenciados. Ensayaría un evento
    duplicado, un secreto ausente y una actualización de plugin que cambie
    la estructura de salida.

??? info faq-item "Argo Workflows — el clúster forma parte del producto"
    [Argo Workflows](https://argo-workflows.readthedocs.io/en/latest/)
    representa workflows de contenedores como recursos Kubernetes, con pasos
    o dependencias DAG. Es un proyecto separado de Argo CD y su
    reconciliación de despliegues.

    Probaría la expulsión de un pod, una cuota de namespace agotada y un
    bucket de artefactos inaccesible. Mantendría los datasets grandes fuera
    de los metadatos del workflow. Reiniciar el controlador, conservar los
    artefactos y reintentar la aplicación son problemas distintos.

??? info faq-item "Windmill — revisar la licencia del artefacto"
    El [LICENSE revisado](https://github.com/windmill-labs/windmill/blob/v1.804.0/LICENSE)
    establece AGPLv3 para la compilación sin enterprise, con áreas de clientes
    bajo Apache. Las imágenes y binarios Community Edition publicados
    también incorporan código propietario y restricciones adicionales.
    Esos artefactos tienen un alcance de licencia distinto.

    La [introducción del producto](https://www.windmill.dev/docs/intro)
    describe scripts, flujos y aplicaciones. Lo evaluaría para automatización
    con interfaces para operadores, incluyendo aislamiento de workers y
    gestión de secretos en la prueba.

## Dónde encaja Temporal

[Temporal Server 1.32.0](https://github.com/temporalio/temporal/tree/v1.32.0) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
utiliza la licencia MIT. Su modelo de
[ejecución durable y replay](https://docs.temporal.io/workflow-execution)
aborda procesos de aplicación que deben continuar tras un fallo. Lo
evaluaría para un proceso de pedidos o aprovisionamiento de larga duración,
con temporizadores e interacciones externas.

Esto cambia la comparación: el código del workflow debe respetar las
restricciones de replay y las actividades necesitan reintentos seguros.
Un proceso de negocio reanudable y un catálogo de activos de datos resuelven
problemas operativos distintos. Define cuál necesitas antes de tratar
Temporal como reemplazo de Airflow.

## Candidatos a seguir

[Flyte](https://github.com/flyteorg/flyte/tree/v2.0.49) (Apache-2.0; 2.0.49,
publicada el 2026-09-18) es un proyecto graduado de LF AI & Data para flujos de
datos e IA. Su README indica que el backend open source de Flyte 2 todavía
está por llegar y remite a Union.ai para un backend de producción hoy, así que
aún no califico Flyte 2 frente a los orquestadores autogestionados de arriba.
Lo revisaría cuando ese backend se publique.

## Una prueba que pueda cambiar la decisión

Usa un pipeline representativo: ingerir archivos, validar una partición,
cargar una tabla analítica y actualizar un índice de búsqueda. Fija la
versión del código y la instantánea de entrada; registra estos resultados
para cada candidato:

1. **Repetibilidad:** ejecuta dos veces la misma partición y cuenta los
   efectos externos. Define un [contrato de idempotencia](../glossary.md#idempotency)
   para las escrituras.
2. **Recuperación:** termina un worker después de escribir y antes de
   registrar la finalización. Restaura la base de control y localiza la salida
   que sobrevivió.
3. **Aislamiento de backfills:** reconstruye un periodo antiguo mientras
   continúan las ejecuciones actuales. Mide espera en cola y contención por
   recursos por separado.
4. **Cambios seguros:** despliega una nueva versión con ejecuciones antiguas
   en curso; ensaya reversión, rotación de credenciales y cancelación.
5. **Coste operativo:** registra servicios en reposo, almacenamiento,
   arranque de workers, mantenimiento y tiempo para diagnosticar un fallo.

Fija umbrales aceptables antes del ensayo. Un scheduler puede lanzar trabajo
que incumpla todos los objetivos de frescura; define el
[SLO](../glossary.md#slo) sobre la salida utilizable.

## Completa el recorrido de los datos

Combina el orquestador con el
[almacenamiento de objetos](object-storage.md),
[motor OLAP](olap-databases.md) y
[sistema de búsqueda vectorial](vector-databases.md) adecuados.
El [Failure Lab](../projects/tools.md#failure-lab) ilustra reintentos acotados
y backoff localmente; es un modelo educativo, no un benchmark de estos proyectos.

Compara [herramientas de transformación](data-transformation.md) para cambios
de modelos y backfills, y [observabilidad](observability.md) para detectar
fallos y salidas desactualizadas a lo largo del pipeline.
