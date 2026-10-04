---
reviewed: 2026-09-23
description: "Comparativa de almacenamiento de objetos open source para instalaciones pequeñas, cloud privada y datos: encaje, mantenimiento, límites S3 y recuperación."
hide:
  - toc
icon: material/database-outline
---

<!-- markdownlint-disable MD013 -->

# :material-database-outline: Almacenamiento de Objetos Open Source

> Elige el sistema que tu equipo pueda recuperar, actualizar y operar.

Respaldos, archivos de aplicaciones, datasets y modelos pueden compartir una
interfaz S3 sin tener las mismas necesidades operativas. Estas son las opciones
por las que empezaría y las condiciones que descartarían cada una.

## Comparación de un vistazo

**Fuentes revisadas: septiembre de 2026**, a partir de repositorios, versiones
y documentación oficiales. Silo es el [fork independiente de MinIO mantenido
por PGSTY](https://github.com/pgsty/silo). Cada calificación (1–5) es una nota
editorial de preparación para el encaje de su fila; el desglose está bajo la
tabla y el [método](index.md#como-califico-las-herramientas), en el índice del
Blog.

| Proyecto | Calificación | Licencia del servidor | Lo consideraría para | Restricción principal |
| :--- | :--- | :--- | :--- | :--- |
| [Silo (PGSTY)](https://github.com/pgsty/silo) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4,5/5</span></span> | AGPLv3 | Todo el conjunto de funciones de MinIO sin nivel de pago, y continuidad para instalaciones MinIO existentes | Fork de mantenimiento independiente con un año de trayectoria; validar migración y reversión. |
| [Garage](https://github.com/deuxfleurs-org/garage/tree/v2.4.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 | Aplicaciones pequeñas con almacenamiento distribuido | Sin versionado S3 ni Object Lock; permisos propios. |
| [Ceph RGW](https://github.com/ceph/ceph/tree/v20.2.4) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | LGPL 2.1/3, con excepciones | Cloud privada con equipo de operaciones de almacenamiento | Se opera un clúster Ceph, no solo un endpoint S3. |
| [OpenStack Swift](https://github.com/openstack/swift/tree/2.38.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Entornos con operaciones Swift/OpenStack existentes | S3 pasa por middleware; esa ruta necesita sus propias pruebas. |
| [SeaweedFS](https://github.com/seaweedfs/seaweedfs/tree/4.47) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Objetos pequeños y acceso compartido a archivos/objetos | El scrub de bitrot, la reparación automática de EC y la recuperación puntual están en la edición Enterprise de pago; el gateway S3 no tiene replicación ni notificaciones. |
| [Apache Ozone](https://github.com/apache/ozone/tree/ozone-2.2.1) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Plataformas Hadoop que necesitan acceso a objetos | Gateway S3 separado, con diferencias documentadas en la API. |
| [RustFS](https://github.com/rustfs/rustfs/tree/1.0.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span> | Apache-2.0 | Evaluación aislada de un servidor S3 más reciente | 1.0.0 (2026-09-16) es su primera versión de disponibilidad general; su historial empieza ahí. |
| [MinIO community](https://github.com/minio/minio) | <span class="tool-rating" data-rating="1"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">1/5</span></span> | AGPLv3 | Evaluar la salida de una instalación existente | Archivado y sin mantenimiento del upstream. |

??? info faq-item "Cómo se calculó cada calificación"
    Cinco criterios de 0, 0,5 o 1 punto. Topes: upstream archivado 1, sin
    versión estable en 18 meses 2, sin versión de disponibilidad general 2,5.
    "Edición abierta" puntúa lo que incluye la edición open source sin nivel
    de pago. Puntuado en septiembre de 2026 con el repositorio, las versiones y la
    documentación oficiales; el método está en el
    [índice del Blog](index.md#como-califico-las-herramientas).

    | Proyecto | Mantenimiento | Edición abierta | Madurez | Operación | Interoperabilidad | Calificación |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Silo (PGSTY) | 1 | 1 | 0,5 | 1 | 1 | 4,5 |
    | Garage | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | Ceph RGW | 1 | 1 | 1 | 0 | 1 | 4 |
    | OpenStack Swift | 1 | 1 | 1 | 0,5 | 0,5 | 4 |
    | Versity Gateway | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | CloudServer | 1 | 1 | 0,5 | 0,5 | 1 | 4 |
    | S3Proxy | 1 | 1 | 0,5 | 1 | 0,5 | 4 |
    | SeaweedFS | 1 | 0,5 | 1 | 0,5 | 0,5 | 3,5 |
    | Apache Ozone | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | NVIDIA AIStore | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | RustFS | 1 | 1 | 0,5 | 0,5 | 0,5 | 3,5 |
    | CubeFS | 0,5 | 1 | 1 | 0 | 0,5 | 3 |
    | MinIO community | 0 | 0 | 1 | 0,5 | 1 | 1 (tope desde 2,5) |

Las licencias identifican el código del servidor revisado, no todas sus
dependencias, componentes empaquetados u ofertas comerciales. El archivo
[COPYING de Ceph](https://github.com/ceph/ceph/blob/v20.2.4/COPYING) detalla la
elección LGPL y sus excepciones por archivo. Revisa los términos de la
distribución concreta al adoptarla; gratuito y open source no son sinónimos.

## Empieza por la carga

Para una instalación nueva pequeña, compararía primero **Garage y Silo**:
Garage por la menor superficie operativa y Silo cuando hacen falta versionado,
Object Lock, replicación o consola de administración, porque su edición
abierta no tiene funciones bloqueadas. **SeaweedFS** entra para cargas
compartidas de archivos y objetos, contando el coste de sus funciones de
día 2 de pago. Si ya existe un sistema de archivos protegido, **Versity
Gateway** es otra opción ligera: añade una interfaz S3, no una capa nueva de
durabilidad. En un despliegue existente de MinIO, **Silo** también plantea
una vía de continuidad, pero hay que ensayar la actualización. **Ceph, Ozone y Swift** entran cuando
su modelo de plataforma aporta valor, no solo porque ofrecen S3.
**RustFS alcanzó disponibilidad general el 2026-09-16** y el repositorio original de
**MinIO community está archivado**. Un endpoint compatible con S3 no promete
todas las funciones de Amazon S3 ni el mismo comportamiento ante fallos.

- **Una aplicación pequeña o varias ubicaciones independientes:** empieza
  por Garage si sus permisos por bucket/clave y la ausencia de versionado
  encajan. Compara SeaweedFS si necesitas una interfaz de archivos o su modelo
  de filer. Un proceso sobre un disco resulta cómodo; no es alta disponibilidad.
- **Respaldos que deben resistir borrados:** no elijas por una subida
  exitosa. Exige las semánticas de Object Lock que soporte el cliente de
  backup, retención efectiva y un ensayo de restauración. Garage no encaja
  si Object Lock de S3 es obligatorio; las carencias S3 documentadas de Ozone
  también lo excluyen.
- **Una instalación existente de MinIO:** evalúa Silo sobre una copia
  recuperable con la versión de origen, topología, cifrado y clientes reales.
  Conserva una vía de recuperación verificada antes de cambiar cualquier
  binario en producción.
- **Una plataforma de almacenamiento en cloud privada:** empieza por
  Ceph RGW si el equipo ya opera Ceph o necesita sus otros servicios.
  Mantén Swift donde la organización ya conozca su operación. Ninguno
  justifica crear un equipo de almacenamiento para un bucket pequeño.
- **Un data lake o una carga de IA:** compara SeaweedFS y Ceph con los
  lectores, escritores y catálogo concretos. Añade Ozone en un entorno
  centrado en Hadoop. Un endpoint S3 no implementa por sí solo transacciones
  Iceberg, autorización del catálogo ni todo el flujo de datos de entrenamiento.

## Otras capas y candidatos a seguir

Estos proyectos son relevantes para la decisión, pero no todos sustituyen un
almacén de objetos distribuido. Separar las capas evita comparar una interfaz
con el sistema responsable de conservar los bytes.

- **Sistema de archivos existente:** [Versity Gateway 1.8.0](https://github.com/versity/versitygw/tree/v1.8.0) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  (Apache-2.0; publicado el 2026-09-04) traduce S3 a POSIX, ScoutFS, Azure u
  otro backend S3. Es mi candidato para una instalación pequeña si ya están
  resueltos el sistema de archivos, los respaldos y la recuperación. Su
  directorio de versiones POSIX no crea redundancia de discos ni un respaldo
  independiente.
- **Plataformas especializadas de datos:** [NVIDIA AIStore 1.5.0](https://github.com/NVIDIA/aistore/tree/v1.5.0) <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3,5/5</span></span>
  (MIT; publicada el 2026-08-21) combina almacenamiento nativo, acceso a datos remotos y caché
  configurable para cargas intensivas. [CubeFS 3.6.0](https://github.com/cubefs/cubefs/tree/v3.6.0) <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span>
  (Apache-2.0) combina interfaces de archivos y objetos distribuidos.
  Considéralos por el flujo de datos completo o la necesidad de archivos, no
  como respuesta predeterminada a un bucket pequeño. Fija la documentación
  que corresponde a la versión elegida.
- **Interfaz S3 sobre otros backends:** [CloudServer 9.4.3](https://github.com/scality/cloudserver/tree/9.4.3) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  y [S3Proxy 4.1.1](https://github.com/gaul/s3proxy/tree/s3proxy-4.1.1) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  (Apache-2.0) conectan aplicaciones con almacenamiento existente. Evalúa
  por separado la durabilidad del backend y la compatibilidad del gateway;
  ejecutar una interfaz no equivale a operar toda la plataforma comercial
  de Scality.
- **Desarrollo descartable y CI:** [local-s3](https://github.com/shyim/local-s3)
  (MIT) está orientado expresamente a pruebas locales rápidas. Puede ser la
  opción más sencilla para ese propósito, no para durabilidad o replicación
  en producción.
- **Candidatos tempranos:** [Alarik](https://github.com/achtungsoftware/alarik)
  y [FractalBits](https://github.com/fractalbits-labs/fractalbits)
  (Apache-2.0) se presentan como beta. Déjalos en evaluación; sus cifras de
  rendimiento o cantidad de funciones no sustituyen pruebas de recuperación,
  seguridad y actualización. Ser más nuevos no los coloca por encima de
  alternativas mantenidas.

## Versiones y notas operativas

Abre un proyecto para consultar las fuentes que delimitan la recomendación.
Una publicación reciente demuestra actividad, no fiabilidad para tu carga.

??? info faq-item "Garage — distribución pequeña, superficie S3 más acotada"
    **Versión revisada: [v2.4.1](https://github.com/deuxfleurs-org/garage/tree/v2.4.1),
    publicada el 2026-09-08.** Este parche corrige el panic al arrancar que
    2.4.0 sufría con el descubrimiento por Consul o Kubernetes; no cambia
    nada más.
    Garage está orientado a despliegues autogestionados pequeños y medianos;
    puede distribuir réplicas entre ubicaciones físicas sin una base de datos
    externa. Resulta útil cuando reducir el alcance operativo importa más
    que reproducir todo el plano de control de AWS.

    Su [referencia de compatibilidad S3](https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/)
    declara que faltan versionado de buckets, Object Lock y políticas de
    buckets S3; utiliza permisos propios por bucket y clave. No adoptes las
    comparaciones de terceros que aparecen en esa página: revisa cada
    upstream. Prueba el modo de replicación elegido, la pérdida de una sede
    y la reparación de nodos con la
    [guía de recuperación](https://garagehq.deuxfleurs.fr/documentation/operations/recovering/).

??? info faq-item "SeaweedFS — incluye los metadatos en el diseño"
    **Versión revisada: [4.47, publicada el 2026-09-14](https://github.com/seaweedfs/seaweedfs/releases/tag/4.47).**
    El [gateway S3](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API)
    se apoya en un filer y servidores de volúmenes. Un comando de inicio
    compacto no elimina esas responsabilidades cuando se despliegan por
    separado.

    Protege tanto los metadatos del filer como los bytes de los objetos;
    restaurar solo uno no recupera el servicio completo. El proyecto documenta
    el [respaldo de metadatos](https://github.com/seaweedfs/seaweedfs/wiki/Async-Filer-Metadata-Backup)
    por separado. Valida el backend elegido, replicación/erasure coding,
    autenticación interna y llamadas S3 del cliente real. Las configuraciones
    de desarrollo que permiten acceso anónimo no deben quedar en redes
    compartidas. La [edición Enterprise](https://seaweedfs.com/), con licencia
    por terabyte, reserva el almacenamiento autorreparable, la reparación
    automática de erasure coding, el scrub de bitrot, la recuperación puntual,
    la recuperación de archivos borrados, la consola con OIDC y el QoS S3
    multi-tenant. La edición abierta conserva versionado, Object Lock, IAM,
    políticas de bucket y cifrado en servidor, pero su gateway S3 no
    implementa replicación de buckets ni notificaciones de eventos.

??? info faq-item "Silo (PGSTY) — una continuidad con límites explícitos"
    **Versión revisada: [RELEASE.2026-09-16T00-00-00Z](https://github.com/pgsty/silo/releases/tag/RELEASE.2026-09-16T00-00-00Z),
    publicada el 2026-09-16.** El repositorio cambió de nombre desde
    `pgsty/minio` en agosto. Sus
    [notas de compatibilidad](https://silo.pgsty.com/compatibility/)
    describen el protocolo y formato de disco conservados de MinIO; eso no
    demuestra que cualquier instalación pueda cambiar sin riesgo. Silo
    restaura la consola completa que el upstream redujo a un esbozo en 2025,
    publica binarios, paquetes e imágenes firmados, conserva versionado,
    Object Lock, IAM, replicación entre sitios, cifrado y ciclo de vida, y
    declara que no tiene nivel de pago ni funciones bloqueadas.

    Revisa las instrucciones de actualización coordinada, los artefactos y
    límites de esa versión. Ensaya la reversión conservando versiones,
    claves de cifrado, replicación y retención. El
    [manifiesto de mantenimiento](https://silo.pgsty.com/about/manifesto/)
    acota el compromiso a una línea mantenida, seguridad y correcciones
    puntuales; no promete toda la hoja de ruta del upstream ni un SLA de
    resolución.

??? info faq-item "Ceph RGW — una decisión de plataforma, no de contenedor"
    **Versión revisada: [Tentacle 20.2.4, publicada el 2026-08-19](https://docs.ceph.com/en/latest/releases/).**
    RGW expone APIs de objetos sobre el clúster de almacenamiento Ceph.
    Encaja cuando ubicación de datos, capacidad, dominios de fallo y operación
    ya tienen responsables de plataforma. Revisa el
    [modelo de despliegue RGW](https://docs.ceph.com/en/tentacle/cephadm/services/rgw/)
    y la [API S3](https://docs.ceph.com/en/tentacle/radosgw/s3/), no una
    etiqueta genérica de compatibilidad.

    Prueba el crecimiento del índice de buckets, lecturas/escrituras
    degradadas y tráfico de recuperación. Multi-site añade clústeres y
    sincronización que operar; mide retraso y conmutación, no lo trates como
    un respaldo instantáneo. Consulta el
    [modelo multi-site](https://docs.ceph.com/en/tentacle/radosgw/multisite/).
    Un operador Kubernetes automatiza despliegues,
    pero no sustituye la experiencia para restaurar el almacenamiento.

??? info faq-item "Apache Ozone — separa las funciones nativas de S3"
    **Versión revisada: [2.2.1, publicada el 2026-08-27](https://github.com/apache/ozone/releases/tag/ozone-2.2.1).**
    Ozone combina almacenamiento de objetos distribuido con acceso de sistema
    de archivos Hadoop. Su gateway S3 es un servicio adicional, no toda la
    plataforma.

    La [referencia S3 de 2.2.1](https://ozone.apache.org/docs/user-guide/client-interfaces/s3/s3-api/)
    indica que faltan versionado de buckets y Object Lock, además de políticas
    y ACL incompletas y otras diferencias. Disponer de snapshots o cifrado
    nativos no demuestra soporte para sus equivalentes S3. Incluye Ozone
    Manager, Storage Container Manager y sus metadatos en los ensayos de
    fallo y recuperación; no dimensiones solo los nodos de datos.

??? info faq-item "OpenStack Swift — prueba la ruta del middleware"
    **Versión revisada: [2.38.1](https://github.com/openstack/swift/tree/2.38.1),
    con tag del 2026-08-20.**
    Swift sigue siendo un proyecto de almacenamiento de objetos distribuido.
    Su [middleware s3api y la documentación integrada](https://github.com/openstack/swift/blob/2.38.1/swift/common/middleware/s3api/__init__.py)
    traduce solicitudes S3 a Swift; los componentes habilitados y la cadena
    de autenticación condicionan ese contrato. La fuente está fijada al tag
    revisado, no a documentación de la rama en desarrollo.

    Si el equipo ya opera Swift, conviene evaluar esa ruta antes de añadir
    otra plataforma. Prueba cargas multipart, manejo de versiones,
    credenciales y políticas con el cliente de producción. La distribución
    mediante rings, las reparaciones y los proxies siguen teniendo un
    responsable. No hace falta desplegar todos los servicios de OpenStack
    para almacenar objetos con Swift.

??? info faq-item "RustFS — una primera versión GA aún no es un historial"
    **Versión revisada: [1.0.0, publicada el 2026-09-16](https://github.com/rustfs/rustfs/releases/tag/1.0.0).**
    Es la primera versión de disponibilidad general tras las release
    candidates de 1.0.0, así que ya no aplica el tope de versión preliminar;
    las versiones frecuentes y una comunidad grande elevan mantenimiento y
    madurez. La licencia Apache-2.0 y el enfoque S3
    justifican evaluarlo, pero ni Rust ni las cifras publicadas por el
    proyecto demuestran un comportamiento seguro para otra carga.

    Usa datos de prueba reemplazables. Comprueba autorización, checksums,
    multipart, operación degradada y límites de actualización de la versión
    concreta. Revisa los
    [avisos de seguridad](https://github.com/rustfs/rustfs/security/advisories)
    y el alcance de las pruebas de compatibilidad. Entre junio y agosto de
    2026 el proyecto publicó avisos altos y críticos, incluidos un salto de
    Object Lock, fallos en condiciones IAM y un XSS en la consola. No lo convertiría en la
    única copia de datos importantes por haber completado una demo de
    instalación.

??? info faq-item "MinIO community — el upstream archivado cambia la decisión"
    **Estado revisado: [repositorio archivado](https://github.com/minio/minio),
    de solo lectura desde el 2026-04-25.** El README declara que el proyecto
    ya no se mantiene. La última release publicada en GitHub es
    [RELEASE.2025-10-15T17-29-55Z](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z).

    El código AGPL existente no desaparece, pero un upstream archivado no es
    un canal de parches activo. Haz un inventario de versiones desplegadas,
    servicios expuestos y opciones de soporte o migración. AIStor es una oferta
    separada, con sus propios términos; una edición gratuita no es el mismo
    proyecto open source. Para una instalación nueva, compara alternativas
    mantenidas en lugar de adoptar un tutorial antiguo de MinIO como opción
    predeterminada.

## Antes de usar datos en cloud privada

Usa un entorno descartable con la topología y los clientes previstos. Define
los criterios de aceptación antes de medir:

1. **Compatibilidad:** subir, listar, leer rangos, copiar y borrar; cargas
   multipart interrumpidas; URLs prefirmadas; checksums y escrituras
   condicionales. Prueba claves Unicode, metadatos y el cliente de backup o
   lakehouse. Un `PutObject` exitoso no valida toda la API S3.
2. **Seguridad:** deniega acceso anónimo y entre tenants, rota credenciales,
   aísla interfaces administrativas e internas y prueba TLS y recuperación de
   claves. Si aplica, prueba retención y legal hold con roles de aplicación
   y privilegiados. Alojar en privado no demuestra aislamiento ni cumplimiento.
3. **Recuperación:** pierde un disco, nodo y servicio de metadatos; llena
   la capacidad; interrumpe un enlace y restaura un despliegue limpio desde
   una copia independiente. Compara bytes, versiones, metadatos y permisos.
   Registra pérdida tolerable y tiempo de recuperación; replicar no basta
   para demostrarlo.
4. **Actualización y salida:** fija versiones de servidor/cliente y digests
   de artefactos. Ensaya la actualización soportada y una vía de recuperación
   si no se admite downgrade. Una copia puede omitir versiones, retención o
   políticas. No montes otro motor sobre discos activos sin soporte explícito.
5. **Coste bajo fallos:** mide tamaños reales de objetos, mezcla de
   solicitudes, concurrencia y latencias p95/p99 durante la reparación, no
   solo en estado estable. Cuenta capacidad útil tras réplicas/paridad,
   reserva libre, RAM, red, energía, respaldos independientes y las personas
   que atienden incidentes.

Si nadie se responsabiliza de esas pruebas y de la recuperación, un servicio
gestionado es una referencia válida aunque autogestionarlo parezca más barato
al principio. Revisa la comparación cuando una versión, el mantenimiento,
un requisito S3 o una prueba de fallo cambien las opciones.

Para las capas que utilizan los objetos almacenados, compara
[formatos de tabla y catálogos lakehouse](lakehouse-table-formats.md) y
[orquestadores de workflows](workflow-orchestrators.md). La
[comparativa de observabilidad](observability.md) explica métricas, logs
y trazas para investigar su comportamiento.
