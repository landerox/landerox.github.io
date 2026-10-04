---
reviewed: 2026-09-23
description: "Compara Neo4j Community, Apache AGE, JanusGraph, LadybugDB, NebulaGraph, OrientDB y ArcadeDB: grafos, licencias open source, despliegue y recuperación."
hide:
  - toc
icon: material/graph-outline
---

<!-- markdownlint-disable MD013 -->

# :material-graph-outline: Bases de datos de grafos open source

> Elige según las relaciones que necesitas recorrer.

Rastrear propietarios de cuentas, explorar dependencias de servicios y
recuperar evidencia conectada son problemas de grafos. Una base de grafos
sitúa nodos, relaciones y recorridos en el centro del modelo. Merece una
comparativa propia junto con [OLAP](olap-databases.md) y
[bases vectoriales](vector-databases.md).

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del núcleo revisado | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Neo4j Community 2026.09.0](https://github.com/neo4j/neo4j/tree/2026.09.0) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | GPLv3 | Un servidor de grafos de propiedades y una aplicación Cypher | Community cubre una instancia; clustering y backup online pertenecen a Enterprise. |
| [LadybugDB 0.20.4](https://github.com/LadybugDB/ladybug/tree/v0.20.4) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | MIT | Analítica de grafos embebida en una aplicación o flujo local de datos | La aplicación controla concurrencia, archivos y recuperación; su alcance difiere de un servidor gestionado. |
| [OrientDB 3.2.56](https://github.com/orientechnologies/orientdb/tree/3.2.56) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Aplicaciones que combinan modelado documental y grafos | Modelo, lenguaje y despliegue necesitan un ensayo más amplio que un ejemplo de recorrido. |
| [ArcadeDB 26.9.1](https://github.com/ArcadeData/arcadedb/tree/26.9.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Un motor para consultas de grafos, documentos y vectores en Cypher, Gremlin o SQL | Comunidad menor; prueba tus consultas Cypher o Gremlin exactas, no la lista de protocolos. |
| [Apache AGE 1.8.0 para PostgreSQL 18](https://github.com/apache/age/releases/tag/PG18%2Fv1.8.0-rc0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Consultas de grafos junto a datos PostgreSQL existentes | Compatibilidad PostgreSQL/extensión y semántica de consultas requieren una matriz explícita. |
| [JanusGraph 1.1.0](https://github.com/JanusGraph/janusgraph/tree/v1.1.0) | <span class="tool-rating" data-rating="2"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">2/5</span></span> | Código Apache-2.0 | Grafos de propiedades distribuidos con TinkerPop/Gremlin | Almacenamiento e índices mixtos opcionales añaden responsabilidades operativas independientes. |
| [NebulaGraph 3.8.0](https://github.com/vesoft-inc/nebula/tree/v3.8.0) | <span class="tool-rating" data-rating="2"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">2/5</span></span> | Apache-2.0 | Un servicio distribuido con consulta, metadatos y almacenamiento separados | La versión revisada es de 2024; hay que evaluar mantenimiento, dependencias y soporte operativo. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Neo4j Community | 1 | 0,5 | 1 | 0,5 | 1 | 4 |
    | LadybugDB | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | OrientDB | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | ArcadeDB | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | Apache AGE | 0,5 | 1 | 0,5 | 1 | 0,5 | 3,5 |
    | JanusGraph | 0 | 1 | 1 | 0,5 | 1 | 2 (tope desde 3,5) |
    | NebulaGraph | 0 | 0,5 | 1 | 0,5 | 0,5 | 2 (tope desde 2,5) |

**Neo4j Community utiliza GPLv3, no AGPLv3.** Sus ediciones comerciales y
herramientas distribuidas por separado tienen límites propios. Una licencia
permisiva o copyleft no demuestra escalabilidad ni disponibilidad.

## Empieza por la carga

- **Una aplicación basada en recorridos Cypher:** empezaría con Neo4j
  Community para probar una instancia. Si necesitas clustering, compararía
  la edición correspondiente y alternativas distribuidas.
- **Una aplicación PostgreSQL con consultas de grafos:** evaluaría AGE
  antes de añadir otro servicio persistente. Incluiría contención con la
  carga transaccional existente y el proceso de actualizar la extensión.
- **Exploración analítica embebida:** probaría LadybugDB, ya presente en el
  [stack tecnológico](../stack.md). Compararía integración y consultas de
  grafos representativas, en lugar de contar funciones de servidor.
- **Un grafo que exige almacenamiento distribuido:** compararía JanusGraph
  y NebulaGraph con la topología prevista. Presupuestaría dependencias y
  establecería un plan aceptable de mantenimiento y recuperación.
- **Documentos y relaciones pertenecen al mismo modelo de aplicación:**
  incluiría OrientDB. Comprobaría que combinarlos simplifica la aplicación real.

Para una jerarquía pequeña y fija, probaría primero un modelo relacional y
consultas recursivas en la base ya operada. Añadir un servicio de grafos
debe resolver un problema demostrado de consultas o modelado.

## Versiones y notas operativas

??? info faq-item "Neo4j — la edición cambia el diseño de disponibilidad"
    El [manual operativo](https://neo4j.com/docs/operations-manual/current/introduction/)
    distingue Community de una instancia y Enterprise con clustering,
    failover y backups online. La [licencia del código](https://github.com/neo4j/neo4j/blob/2026.07.1/LICENSE.txt)
    cubre el código Community revisado.

    Ensaya importación, transacciones, restricciones y restauración con la
    edición real. Comprueba versión de Cypher y drivers. Incluir una
    capacidad de una demostración Enterprise en el plan Community dejaría
    un vacío precisamente cuando necesitas recuperar el servicio.

??? info faq-item "AGE — fijar la extensión con PostgreSQL"
    La [descripción del proyecto](https://age.apache.org/overview/) presenta
    consultas de grafos integradas en PostgreSQL. La [matriz de descargas](https://age.apache.org/download/)
    identifica versiones AGE para distintos PostgreSQL. Esta revisión usa la
    [versión 1.8.0 para PostgreSQL 18](https://github.com/apache/age/releases/tag/PG18%2Fv1.8.0-rc0),
    publicada en GitHub el 2026-07-09 con un tag que conserva el sufijo rc0;
    la página de descargas todavía mostraba 1.7.0 al revisar.

    Prueba composición SQL/Cypher, tipos, permisos y planes con esa
    combinación. Recupera datos relacionales y grafos; después ensaya la
    actualización de extensión y PostgreSQL. Soportar sintaxis Cypher no
    implica compatibilidad con todos los procedimientos o consultas Neo4j.

??? info faq-item "JanusGraph — el backend forma parte de la elección"
    [JanusGraph](https://docs.janusgraph.org/) utiliza grafos de propiedades
    mediante TinkerPop y Gremlin, con backends configurables de almacenamiento
    e índices. Su [licencia](https://github.com/JanusGraph/janusgraph/blob/v1.1.0/LICENSE.txt)
    distingue código Apache y licencias de documentación.

    Elige el backend antes de evaluar consistencia y fallos. Recupera datos
    e índices juntos; verifica recorridos durante reindexación. La versión
    1.1.0 revisada es de 2024: mantenimiento y versiones soportadas de las
    dependencias necesitan criterios explícitos de aceptación.

??? info faq-item "LadybugDB — el despliegue embebido cambia responsabilidades"
    El [manual](https://docs.ladybugdb.com/) describe un motor columnar de
    grafos de propiedades embebido, con Cypher y transacciones. Proceso y
    archivos de datos quedan bajo responsabilidad de la aplicación.

    Prueba peticiones concurrentes, presión de memoria e interrupción del
    proceso durante una escritura. Restaura archivos y reconcilia relaciones
    además de nodos. Evalúa las diferencias Cypher documentadas antes de
    tratar una aplicación Neo4j existente como portable.

??? info faq-item "NebulaGraph — consulta, metadatos y almacenamiento fallan distinto"
    El [manual 3.8](https://docs.nebula-graph.io/3.8.0/1.introduction/1.what-is-nebula-graph/)
    describe un grafo distribuido con nGQL y funciones de servicio separadas.
    Su sintaxis relacionada con openCypher requiere pruebas por función al migrar.

    Ensaya perder un nodo de almacenamiento y el servicio de metadatos, y
    mide el efecto de vértices con muchas conexiones. Verifica las herramientas
    de backup del despliegue exacto. Revisa antigüedad y soporte de dependencias;
    que el repositorio no esté archivado no resuelve esas preguntas.

??? info faq-item "OrientDB — validar el modelo combinado"
    El [proyecto](https://github.com/orientechnologies/orientdb/tree/3.2.56)
    combina modelos documental y de grafos. Su
    [documentación 3.2](https://orientdb.dev/docs/3.2.x/) cubre el servidor y
    el modelo operativo de la base.

    Prueba actualizar un documento cambiando relaciones y un recorrido que
    cruce clases documentales. Confirma límites transaccionales y restauración.
    Compara el modelo final de la aplicación, además de un recorrido aislado
    contra un producto configurado para otra carga.

??? info faq-item "ArcadeDB — muchos lenguajes de consulta, un solo conjunto de pruebas"
    **Versión revisada: [26.9.1, publicada el 2026-09-03](https://github.com/ArcadeData/arcadedb/tree/26.9.1).** Fork
    conceptual de OrientDB, ArcadeDB es un motor multimodelo con grafos,
    documentos, clave/valor, series temporales y vectores, consultado con SQL,
    OpenCypher, Gremlin y HTTP/JSON, y con los protocolos de PostgreSQL, MongoDB
    y Redis como módulos opcionales
    ([documentación](https://docs.arcadedb.com/)). El repositorio es
    Apache-2.0, con versiones mensuales y sin edición enterprise.

    Ejecuta los recorridos que realmente necesitas en el lenguaje que vas a
    usar; después restaura un backup y repítelos. La compatibilidad de
    protocolo es un punto de partida, no la prueba de que una carga de Neo4j
    o MongoDB se comporte igual.

## Otros nombres requieren revisar la licencia

La [licencia Memgraph revisada](https://github.com/memgraph/memgraph/blob/v3.12.0/LICENSE)
utiliza BSL y términos enterprise. [FalkorDB](https://github.com/FalkorDB/FalkorDB/blob/v4.20.4/LICENSE.txt)
utiliza SSPL, y la [licencia actual de ArangoDB](https://github.com/arangodb/arangodb/blob/devel/LICENSE)
utiliza BSL. Deben evaluarse con esos términos exactos, por separado de la
preselección open source anterior. Código público y descargas gratuitas
no establecen los mismos derechos de licencia.

## Grafos, vectores y Graph RAG

Un recorrido de grafo responde sobre relaciones explícitas. La búsqueda
vectorial encuentra candidatos por similitud. Algunos productos ofrecen
ambas capacidades, pero semántica y objetivos de evaluación siguen siendo distintos.

Para Graph RAG, prueba si las relaciones mejoran la recuperación con
preguntas juzgadas. Conserva procedencia de hechos extraídos, gestiona
afirmaciones contradictorias y aplica permisos al expandir caminos. Una
relación generada plausible no es un hecho autorizado. Compara con la misma
[referencia de recuperación vectorial](vector-databases.md).

## Una prueba que pueda cambiar la decisión

Usa cuentas, transacciones y propietarios con grados de conexión desbalanceados.

1. **Corrección:** incluye ciclos, relaciones duplicadas, nodos eliminados y
   cambios de varios pasos; verifica caminos y resultados transaccionales.
2. **Consultas:** prueba recorridos acotados, vértices muy conectados y
   filtros reales. Registra latencias p95/p99 con escrituras concurrentes
   e índices representativos.
3. **Autorización:** impide expandir caminos entre tenants y revisa
   exportaciones, procedimientos y consultas directas.
4. **Recuperación:** restaura nodos, relaciones, índices, esquema y permisos;
   después reconcilia contra los datos de origen.
5. **Salida:** exporta identidades y relaciones, migra consultas
   representativas y mide el esfuerzo para conservar su significado.

## Completa el recorrido de los datos

La [orquestación](workflow-orchestrators.md) coordina la ingesta;
la [transformación](data-transformation.md) normaliza entidades e identificadores.
Usa [observabilidad](observability.md) para detectar proyecciones de grafos
desactualizadas y [almacenamiento de objetos](object-storage.md) para fuentes y backups.
