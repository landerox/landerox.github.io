---
description: "Seis herramientas locales para políticas de reintentos, memoria de inferencia, SQL, presupuestos SLO, cambios de esquema y archivos de tabla."
hide:
  - toc
icon: material/tools
---

# :material-tools: Herramientas interactivas

Explora un fallo, compara un supuesto o examina un contrato de datos. Seis
herramientas se ejecutan en tu navegador; no se conectan a infraestructura ni
envían tus entradas a un servicio de IA. Empieza con un ejemplo y despliega los
supuestos cuando necesites más detalle.

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

    Compara dos políticas de reintentos ante el mismo incidente de 30 segundos.
    La segunda añade jitter reproducible con semilla al backoff. La cronología
    muestra mensajes completados, en cola, rechazados y fallidos; no se presupone
    qué política ganará. El simulador manual conserva su política sin jitter.

    </div>

    Consulta los patrones: [reintentos acotados y backoff](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
    y [colas de mensajes fallidos](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).

=== "Planificador de memoria"

    <div class="interactive-lab-embed" id="interactive-llm-calculator" markdown>

    ## Planifica la memoria de inferencia

    Activa JavaScript para dimensionar los tres pesos publicados de Qwen3.8:
    el denso de 27B, el Flash-Next de 180B y la mezcla de expertos 2.4T-A95B.
    Los tres usan atención híbrida: solo una de cada cuatro capas guarda caché
    KV y las otras tres son capas Gated DeltaNet con estado fijo por petición.

    Sin la herramienta: bytes de pesos = parámetros totales × bits / 8,
    contando a 2 bytes los parámetros que un checkpoint FP8 deja en BF16.
    Bytes KV = 2 × capas de atención completa × cabezas KV × dimensión ×
    tokens × peticiones × bytes KV. Estado lineal = capas lineales × cabezas de
    valor × dimensión de clave × dimensión de valor × bytes de estado ×
    peticiones. Divide entre 2³⁰ para obtener GiB. Un modelo MoE mantiene
    todos los expertos residentes aunque cada token use solo unos pocos.

    Es una estimación de planificación, no una garantía de capacidad por GPU.
    Los buffers del motor, los indexadores de atención dispersa y la
    distribución requieren medición.

    Guarda una referencia A, cambia el contexto, las peticiones o la precisión
    y compara el escenario B por pesos, caché, estado y reserva. Menos memoria
    no mide calidad ni velocidad.

    </div>

=== "Explorador SQL"

    <div class="interactive-lab-embed" id="interactive-sql-sandbox" markdown>

    ## Explora datos con SQL

    Activa JavaScript para explorar dos tablas con 16 filas ficticias:
    escenarios de inferencia y pipelines batch/streaming. Empieza con una
    pregunta guiada; la ayuda explica cada columna con unidades y ejemplos.

    Combina filtros AND/OR, IN, BETWEEN y LIKE; agrupa y ordena por varias
    columnas, elimina duplicados con DISTINCT o limita resultados.
    Copia la consulta o descarga su resultado CSV. Solo se permite SELECT
    sobre una tabla a la vez: sin joins, subconsultas ni escrituras.

    Es un intérprete didáctico local, no DuckDB ni una conexión a datos reales.
    No permite extraer conclusiones sobre rendimiento de motores.

    El recorrido de la consulta explica los conteos reales de filas y grupos
    en cada etapa lógica. No es un planificador de consultas ni un perfil del
    rendimiento de un motor de bases de datos.

    </div>

=== "SLO y presupuesto de error"

    <div class="interactive-lab-embed" id="interactive-slo-budget" markdown>

    ## ¿Cuánto fallo puede tolerar este servicio?

    Activa JavaScript para comparar un objetivo de nivel de servicio con los
    errores o minutos de caída observados. La disponibilidad por solicitudes
    y por tiempo son modos distintos; no se convierten solicitudes en minutos.

    Presupuesto de error = solicitudes elegibles o minutos de ventana ×
    (1 − objetivo). Tasa de consumo = fracción de fallos observada ÷
    (1 − objetivo). Sin observaciones, o con un objetivo del 100%, los cocientes
    indefinidos no se presentan como valores válidos. Proyectar una ventana
    parcial exige supuestos explícitos, no promesas sobre tráfico o disponibilidad.

    </div>

    Método: [Google SRE — alertas sobre SLO](https://sre.google/workbook/alerting-on-slos/).

=== "Comparador de esquemas"

    <div class="interactive-lab-embed" id="interactive-schema-diff" markdown>

    ## ¿Qué cambia entre estos dos contratos de datos?

    Activa JavaScript para comparar dos esquemas planos de tabla localmente.
    Empieza con el ejemplo y revisa columnas nuevas o eliminadas, cambios de
    tipos y nulabilidad. Descarga el informe para revisar una migración.

    Cada entrada es un objeto JSON con un array `columns`. Cada columna tiene
    un `name` único, un `type` permitido y un booleano `nullable` explícito.
    Es un formato sencillo de esquema de tabla, no un validador completo de
    JSON Schema, un parser SQL ni un comprobador de compatibilidad de registros
    de esquemas. No se suben datos.

    Los riesgos dependen de la dirección: lectores antiguos consumiendo datos
    nuevos y datos antiguos cumpliendo restricciones nuevas son comprobaciones
    distintas. Un renombrado aparece como baja y alta; admitir nulos no implica
    que el campo pueda omitirse.

    </div>

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

Las preguntas y los criterios de investigación siguen en los [Laboratorios de investigación](labs.md).
