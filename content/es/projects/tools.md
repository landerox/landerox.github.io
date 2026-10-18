---
description: "Cuatro herramientas locales para plataformas de datos e ingeniería de IA: reintentos durante una caída, archivos de tabla y compactación, recuperación de agentes y estadística de evaluación."
hide:
  - toc
icon: material/tools
---

# :material-tools: Herramientas interactivas

> Cuatro herramientas locales, una pregunta cada una, salidas de mi trabajo en
> plataformas de datos y sistemas de IA.

Cada herramienta abre con un ejemplo resuelto e incluye escenarios
predefinidos para modos de fallo y compromisos de dimensionamiento habituales.
Cambia cualquier valor y el resultado lo sigue; todo se calcula en tu
navegador, no se llama a ningún modelo y nada de lo que escribes sale de la
página.

<!-- The anchors live on the tools' own blocks inside the tabs. -->
<!-- markdownlint-disable MD013 MD051 -->

| Herramienta | La pregunta que responde |
| :--- | :--- |
| [Failure Lab](#failure-lab) | ¿Qué hace una cola durante una caída y qué política de reintentos la vacía mejor? |
| [Archivos de tabla](#interactive-table-planner) | ¿Cuántos archivos conservará una tabla y cuántos dejará la compactación? |
| [Repetición de agente](#interactive-agent-run) | ¿Qué repite un agente tras una caída y cuándo aplica dos veces una escritura? |
| [Estadística de evaluación](#interactive-eval-stats) | ¿Cuánto dice un resultado de evaluación y cuántos ejemplos necesita una comparación? |

<!-- markdownlint-enable MD013 MD051 -->

=== "Failure Lab"

    <div class="interactive-lab-embed" id="failure-lab" markdown>

    ## Failure Lab { #failure-lab-model }

    Activa JavaScript para recorrer un pipeline simulado:
    **Productor → Cola → Workers → Almacén**. Detén workers, interrumpe las
    escrituras o inyecta una ráfaga y después restaura el servicio.

    El modelo admite 3 eventos por segundo simulado (12 en una ráfaga),
    permite 5 intentos por paso y almacena 24 mensajes en cola.
    Un mensaje tiene como máximo 3 intentos totales antes de ir a la cola
    de fallidos. Backoff espera 1 segundo y después 2; no se modela jitter.
    Las llegadas se admiten antes de procesar; los reintentos pendientes
    también ocupan espacio en cola.

    Es un modelo didáctico determinista, no un benchmark ni un inyector real
    de fallos. No se recuperan automáticamente mensajes rechazados o fallidos.

    Bajo el simulador, dos políticas de reintentos enfrentan el mismo incidente
    de 30 segundos; la segunda añade al backoff jitter reproducible con
    semilla. No se presupone qué política ganará.

    </div>

    Consulta los patrones: [reintentos acotados y backoff](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
    y [colas de mensajes fallidos](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

=== "Archivos de tabla"

    <div class="interactive-lab-embed" id="interactive-table-planner" markdown>

    ## ¿Cuántos archivos conservará esta tabla?

    Activa JavaScript para planificar los archivos que escribe una tabla en un
    formato de tabla abierto: volumen diario, commits por día, particiones por
    día u hora, buckets de hash, tamaño objetivo y retención. Compara los
    archivos que quedan sin compactar con los que deja compactar cada
    partición al tamaño objetivo.

    Sin la herramienta: archivos por commit = particiones tocadas × max(1,
    ⌈datos por commit ÷ particiones tocadas ÷ objetivo⌉). Tras compactar, cada
    partición conserva max(1, ⌈tamaño de la partición ÷ objetivo⌉) archivos.
    Iceberg escribe hacia `write.target-file-size-bytes`, 512 MiB por defecto.

    Es una estimación para una tabla de solo inserciones con datos repartidos
    de forma uniforme, no un benchmark. Los escritores en paralelo, los
    borrados y el orden de escritura suelen añadir archivos; los archivos
    antiguos siguen en el almacenamiento hasta que expiran sus snapshots.

    </div>

    Fuentes: [propiedades de escritura de Iceberg](https://iceberg.apache.org/docs/latest/configuration/)
    y [mantenimiento de tablas](https://iceberg.apache.org/docs/latest/maintenance/).

=== "Repetición de agente"

    <div class="interactive-lab-embed" id="interactive-agent-run" markdown>

    ## ¿Qué repite un agente después de una caída?

    Activa JavaScript para reproducir un incidente con cuatro estrategias de
    recuperación: reiniciar desde la primera llamada a herramienta o reanudar
    desde el último checkpoint, con y sin claves de idempotencia. La tabla
    muestra las llamadas que repite cada estrategia y si alguna escritura se
    aplica dos veces.

    Sin la herramienta: el checkpoint se registra cuando la llamada devuelve,
    así que una caída entre el efecto de una escritura y su registro hace que
    esa escritura se ejecute otra vez. Solo una clave de idempotencia que
    recuerde la herramienta dueña de la escritura convierte la repetición en
    una consulta.

    Es un modelo didáctico determinista de una sola caída, no un motor de
    ejecución durable. No se modelan un plan que cambia tras el reinicio, los
    efectos parciales ni los almacenes de claves que caducan.

    </div>

    Consulta el patrón: [Temporal — por qué las actividades deben ser idempotentes](https://docs.temporal.io/activity-definition#idempotency).

=== "Estadística de evaluación"

    <div class="interactive-lab-embed" id="interactive-eval-stats" markdown>

    ## ¿Cuánto dice un resultado de evaluación?

    Activa JavaScript para calcular el intervalo de Wilson de una tasa de
    acierto, dimensionar una comparación entre dos variantes o medir el
    acuerdo entre dos jueces con la kappa de Cohen.

    Sin la herramienta: 42 aciertos de 50 son un 84%, con un intervalo del
    95% entre 71,5% y 91,7%. Distinguir un 80% de un 85% con confianza del 95%
    y potencia del 80% exige 906 ejemplos independientes por variante. Dos
    jueces que coinciden en 85 de 100 ejemplos, con tasas de aprobado del 45%
    y el 50%, alcanzan una kappa de 0,70.

    Los ejemplos se tratan como independientes; las preguntas que comparten
    documento están agrupadas y necesitan intervalos más anchos. Una
    comparación pareada sobre los mismos ejemplos suele necesitar menos que
    la estimación independiente.

    </div>

    Método: [NIST — intervalos de confianza para una proporción](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).
    Para profundizar: [Miller (2024) — Adding Error Bars to Evals](https://arxiv.org/abs/2411.00640).

Las preguntas y los criterios de investigación siguen en los [Laboratorios de investigación](labs.md).
