---
reviewed: 2026-09-23
description: "Compara Qdrant, Milvus, Weaviate, pgvector, Chroma, LanceDB, Vespa y Redis: licencias open source, búsqueda con filtros, despliegue y recuperación."
hide:
  - toc
icon: material/vector-polyline
---

<!-- markdownlint-disable MD013 -->

# :material-vector-polyline: Bases de datos vectoriales open source

> Elige probando filtros, permisos y recuperación desde el principio.

Una consulta exitosa de vecinos cercanos es un punto de partida. Un servicio
de recuperación de información también debe excluir documentos no autorizados,
reflejar actualizaciones y mantener la calidad bajo carga. Haría explícitos
esos requisitos antes de elegir un servidor vectorial o ampliar una base
existente.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Cada calificación (1–5) es una nota editorial de
preparación para el encaje de su fila; el desglose está bajo la tabla y el
[método](index.md#como-califico-las-herramientas), en el índice del Blog.

| Proyecto | Calificación | Licencia del núcleo | Lo preseleccionaría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Qdrant 1.19.1](https://github.com/qdrant/qdrant/tree/v1.19.1) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Apache-2.0 | Recuperación vectorial dedicada con filtros de metadatos | Índices de payload, distribución de shards y recuperación requieren diseño explícito. |
| [Redis 8.10.2](https://github.com/redis/redis/tree/8.10.2) | <span class="tool-rating" data-rating="5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">5/5</span></span> | Opción AGPLv3; alternativas RSALv2/SSPLv1 | Búsqueda vectorial cuando Redis ya forma parte de la plataforma | Verificar licencia elegida, memoria y capacidades exactas de consulta y despliegue. |
| [Weaviate 1.39.6](https://github.com/weaviate/weaviate/tree/v1.39.6) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | BSD-3-Clause | Colecciones de objetos, búsqueda híbrida y cargas por tenant | Módulos, ciclo de vida de tenants y cobertura de backups deben ajustarse al despliegue. |
| [pgvector 0.8.6](https://github.com/pgvector/pgvector/tree/v0.8.6) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | Licencia PostgreSQL | Vectores junto a datos transaccionales que ya están en PostgreSQL | Los índices ANN compiten por recursos; los filtros selectivos necesitan ajustes. |
| [Milvus 3.0.2](https://github.com/milvus-io/milvus/tree/v3.0.2) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Una plataforma vectorial con capacidad de ingesta y consulta separadas | Los despliegues standalone y distribuido tienen alcances operativos distintos. |
| [Chroma 1.5.9](https://github.com/chroma-core/chroma/tree/1.5.9) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Desarrollo local y una API de recuperación basada en colecciones | Arquitecturas local, de un nodo y distribuida son despliegues distintos. |
| [LanceDB 0.39.0](https://github.com/lancedb/lancedb/tree/v0.39.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Recuperación multimodal embebida sobre almacenamiento local o de objetos | Integrar OSS no incluye la capa de servicio gestionada de Enterprise. |
| [Vespa 8.753.16](https://github.com/vespa-engine/vespa/tree/v8.753.16) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Aplicaciones que combinan recuperación y ranking propio | Esquemas, perfiles de ranking e infraestructura de consulta necesitan responsables. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Qdrant | 1 | 1 | 1 | 1 | 1 | 5 |
    | Redis | 1 | 1 | 1 | 1 | 1 | 5 |
    | Weaviate | 1 | 1 | 1 | 0,5 | 1 | 4,5 |
    | pgvector | 1 | 1 | 0,5 | 1 | 1 | 4,5 |
    | Milvus | 1 | 1 | 1 | 0 | 1 | 4 |
    | Chroma | 1 | 0,5 | 0,5 | 1 | 0,5 | 3,5 |
    | LanceDB | 1 | 0,5 | 0,5 | 1 | 0,5 | 3,5 |
    | Vespa | 1 | 1 | 1 | 0 | 0,5 | 3,5 |

La [licencia de pgvector](https://github.com/pgvector/pgvector/blob/v0.8.6/LICENSE)
es la licencia permisiva PostgreSQL. El
[archivo de licencia de Redis 8](https://github.com/redis/redis/blob/8.10.1/LICENSE.txt)
ofrece AGPLv3, RSALv2 o SSPLv1 como alternativas. La
[opción AGPLv3 es open source](https://spdx.org/licenses/AGPL-3.0-only.html);
no traslades una suposición de licencia de Redis 7.x a una decisión sobre Redis 8.

## Empieza por la carga

- **Aplicación PostgreSQL existente:** empezaría con pgvector cuando importan
  joins, transacciones y un único ámbito de recuperación. Compararía un
  servicio dedicado cuando la carga representativa justifique separarlo.
- **Recuperación dedicada con filtros restrictivos de metadatos:** empezaría
  con Qdrant e incluiría esos filtros desde el primer ensayo. Compararía
  Milvus para una plataforma distribuida con ingesta y consulta dimensionadas
  de forma independiente.
- **Colecciones, búsqueda híbrida y muchos tenants:** incluiría Weaviate.
  Aislamiento y ciclo de vida deben ser criterios de aceptación; el nombre
  de una colección no los demuestra.
- **Desarrollo local o recuperación embebida en un servicio:** compararía
  Chroma y LanceDB. Definiría pronto si producción necesita una biblioteca
  embebida, un servidor único o un servicio distribuido.
- **El ranking es una capacidad central de la aplicación:** incluiría Vespa.
  Si Redis ya conserva datos relevantes, probaría su búsqueda vectorial
  antes de añadir otro servicio únicamente por la búsqueda de similitud.

En [RAG](../glossary.md#rag), la base de datos es una parte de la recuperación.
Fragmentación, modelo de embeddings, coincidencia léxica, reranking y reglas
de acceso pueden cambiar la calidad manteniendo el mismo motor.

## Versiones y notas operativas

??? info faq-item "Qdrant — indexar filtros además de vectores"
    Qdrant documenta [filtros de payload](https://qdrant.tech/documentation/search/filtering/)
    y [consultas híbridas por etapas](https://qdrant.tech/documentation/search/hybrid-queries/).
    Los índices de payload deben reflejar los campos usados para restringir
    las búsquedas.

    Mediría filtros de tenant, estado del documento y fecha combinados, con
    la selectividad esperada. Probaría actualizaciones y visibilidad de
    borrados con lecturas concurrentes. Registraría replicación y
    consistencia elegidas y verificaría la recuperación en esa topología.

??? info faq-item "Milvus — elegir el despliegue antes de estimar su coste"
    La [referencia de componentes](https://milvus.io/docs/main_components.md)
    separa consulta y coordinación de las dependencias de almacenamiento.
    También advierte que migrar de standalone a clúster no es una
    actualización online.

    Dimensionaría y probaría la arquitectura de la versión exacta, evitando
    copiar diagramas de otra versión mayor. Ensayaría juntos recuperación
    de metadatos, datos almacenados y registro de escritura. Una prueba
    local no mide el coste operativo de un despliegue distribuido.

??? info faq-item "Weaviate — el estado del tenant afecta a la recuperación"
    Las [guías operativas](https://docs.weaviate.io/weaviate/guides)
    cubren búsqueda híbrida, colecciones y replicación. La
    [guía actual de backups](https://docs.weaviate.io/deploy/configuration/backups)
    incluye tenants activos e inactivos, pero excluye los descargados a
    almacenamiento externo, u offloaded.

    Verificaría todos los estados durante una restauración con el proveedor
    de backup real. Fijaría versiones de cliente y servidor juntas. Si un
    vectorizador llama a un modelo externo, incluiría sus credenciales,
    flujo de datos y comportamiento ante fallos en la arquitectura.

??? info faq-item "pgvector — ANN con filtros necesita un plan real"
    El [README revisado](https://github.com/pgvector/pgvector/tree/v0.8.6)
    documenta búsqueda exacta, HNSW, IVFFlat y escaneos iterativos del índice.
    Un escaneo aproximado puede devolver pocos resultados cuando el filtro
    elimina candidatos; importan los ajustes y la exploración iterativa.

    Inspeccionaría el plan real con filtros por tenant, escrituras
    concurrentes y mantenimiento de índices. Incluiría backup y recuperación
    PostgreSQL en la prueba. Una extensión evita un segundo servicio,
    pero no aporta capacidad ilimitada a la base.

??? info faq-item "Chroma — mantener la API y reevaluar el despliegue"
    La [descripción de arquitectura](https://docs.trychroma.com/reference/architecture/overview)
    distingue modos local, de un nodo y distribuido. Empezar fácilmente en
    local ayuda; cada despliegue conserva su propio alcance de durabilidad.

    Probaría persistencia tras perder el proceso, borrado de colecciones y
    actualizaciones. Después documentaría autenticación y recuperación en
    producción. Compararía la versión de servidor y API del cliente exactas
    utilizadas por la aplicación.

??? info faq-item "LanceDB — distinguir almacenamiento embebido y servicio gestionado"
    OSS puede usar [almacenamiento local o de objetos cloud](https://docs.lancedb.com/storage/configuration).
    La [comparación con Enterprise](https://docs.lancedb.com/enterprise)
    distingue integrar OSS en tu servicio de la consulta distribuida y
    operación gestionadas.

    Mediría lecturas al object store, latencia en frío y mantenimiento de
    índices en el entorno previsto. Usar S3 no aporta por sí solo
    autenticación de aplicación, un servicio de consultas ni una política
    de recuperación para el servicio que integra la biblioteca.

??? info faq-item "Vespa — recuperación y ranking forman una aplicación"
    La [referencia de vecinos cercanos](https://github.com/vespa-engine/documentation/blob/master/en/querying/nearest-neighbor-search.md)
    combina recuperación vectorial con filtros y perfiles de ranking.
    Es útil cuando la aplicación necesita controlar la selección y
    puntuación de candidatos.

    Probaría el pipeline completo de ranking, incluida inferencia si se
    utiliza, con la mezcla real de consultas. Presupuestaría evolución del
    esquema, alimentación de documentos y operación del clúster.

??? info faq-item "Redis — precisar la ruta de consulta vectorial"
    La [referencia de búsqueda vectorial](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)
    documenta índices y distancias. Redis ofrece varias capacidades
    relacionadas; especifica los comandos e índices que necesita la aplicación.

    Verificaría memoria, persistencia, política de expulsión y enrutamiento de
    consultas en el despliegue elegido. Comprobaría el soporte OSS de cada
    función, sin asumir paridad con un servicio comercial. Fijaría juntas
    versión de Redis y licencia elegida.

## Una prueba que pueda cambiar la decisión

Mantén constantes documentos, modelo de embeddings, dimensiones, métrica de
distancia y consultas. Compara configuraciones con un objetivo de calidad
explícito.

1. **Dos medidas de calidad:** mide recall ANN frente a vecinos exactos del
   mismo dataset filtrado. Evalúa por separado la relevancia con documentos
   juzgados; los vecinos vectoriales exactos no son automáticamente respuestas
   útiles.
2. **Permisos:** prueba filtros restrictivos por tenant y documento antes de
   que los resultados salgan del servicio. Un tenant enviado por el cliente
   no establece por sí solo un límite de autorización.
3. **Visibilidad de cambios:** inserta, actualiza y borra durante las
   consultas. Mide cuándo se refleja el cambio, también tras fallar una réplica.
4. **Recuperación y migración del modelo:** restaura en un entorno limpio.
   Conserva documentos fuente, IDs de fragmentos y versiones de embeddings;
   ensaya reconstruir el índice con otro modelo sin mezclar vectores
   incompatibles.
5. **Coste a igual calidad:** compara latencia p95 y rendimiento durante la
   ingesta, incluyendo índices, réplicas, payloads y almacenamiento frío.

Como referencia de escala, un millón de vectores float32 de 768 dimensiones
ocupan unos **2,86 GiB de valores brutos**. Excluye índices, metadatos,
réplicas, logs y sobrecarga de ejecución; no es una recomendación de memoria RAM.

## Completa el recorrido de los datos

Usa [almacenamiento de objetos](object-storage.md) para material fuente y
artefactos de recuperación, un [orquestador](workflow-orchestrators.md) para
ingesta versionada y un [motor OLAP](olap-databases.md) cuando la pregunta
requiere agregación analítica. Elige cada capa por un requisito medido.

El [glosario técnico](../glossary.md#rag) explica RAG y conceptos relacionados
con ejemplos y fuentes primarias.

Las [bases de grafos](graph-databases.md) complementan la búsqueda por
similitud con relaciones explícitas y recorridos. Esa comparativa también
cubre Graph RAG y sus necesidades de procedencia y control de acceso.
