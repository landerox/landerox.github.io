---
reviewed: 2026-09-23
description: "Compare open-source object stores for small deployments, private cloud and data platforms: fit, maintenance, S3 limits and recovery gates."
hide:
  - toc
icon: material/database-outline
---

<!-- markdownlint-disable MD013 -->

# :material-database-outline: Open-Source Object Storage

> Choose the system your team can recover, upgrade and afford to operate.

Backups, application files, datasets and models can share an S3 interface
without sharing the same operational needs. Here is where I would start,
and what would rule each option out.

## Comparison at a glance

**Sources reviewed: September 2026**, from official repositories, releases and
documentation. Silo is [PGSTY's independent MinIO
fork](https://github.com/pgsty/silo). Each rating (1–5) is an editorial
readiness score for the fit in its row; the breakdown sits under the table and
the [method](index.md#how-i-rate-tools) on the Blog index.

| Project | Rating | Server license | I would shortlist it for | Main constraint |
| :--- | :--- | :--- | :--- | :--- |
| [Silo (PGSTY)](https://github.com/pgsty/silo) | <span class="tool-rating" data-rating="4.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4.5/5</span></span> | AGPLv3 | The full MinIO feature set without a paid tier, and continuity for existing MinIO estates | Independent maintenance fork with a one-year track record; validate migration and rollback. |
| [Garage](https://github.com/deuxfleurs-org/garage/tree/v2.4.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | AGPLv3 | Small distributed application storage | No S3 versioning or Object Lock; its own access model. |
| [Ceph RGW](https://github.com/ceph/ceph/tree/v20.2.4) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | LGPL 2.1/3, with exceptions | Private cloud with a storage operations team | A Ceph cluster to operate, not just an S3 endpoint. |
| [OpenStack Swift](https://github.com/openstack/swift/tree/2.38.1) | <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span> | Apache-2.0 | Existing Swift/OpenStack operations | S3 runs through middleware; validate that path specifically. |
| [SeaweedFS](https://github.com/seaweedfs/seaweedfs/tree/4.47) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Small objects and shared file/object workloads | Bitrot scrub, automatic EC repair and point-in-time recovery sit in the paid Enterprise edition; the S3 gateway lacks replication and notifications. |
| [Apache Ozone](https://github.com/apache/ozone/tree/ozone-2.2.1) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Hadoop-oriented data platforms needing object access | Separate S3 gateway with documented API gaps. |
| [RustFS](https://github.com/rustfs/rustfs/tree/1.0.0) | <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span> | Apache-2.0 | Isolated evaluation of a newer S3 server | 1.0.0 (2026-09-16) is its first general-availability release; the track record starts there. |
| [MinIO community](https://github.com/minio/minio) | <span class="tool-rating" data-rating="1"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">1/5</span></span> | AGPLv3 | Assessing an existing deployment's exit path | Archived and no longer maintained upstream. |

??? info faq-item "How each rating was computed"
    Five criteria worth 0, 0.5 or 1 point each. Caps: archived upstream 1,
    no stable release in 18 months 2, no general-availability release 2.5.
    "Open edition" scores what the open-source edition includes without a
    paid tier. Scored in September 2026 from the official repository, releases
    and documentation; the method is on the
    [Blog index](index.md#how-i-rate-tools).

    | Project | Maintenance | Open edition | Maturity | Operations | Interoperability | Rating |
    | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
    | Silo (PGSTY) | 1 | 1 | 0.5 | 1 | 1 | 4.5 |
    | Garage | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | Ceph RGW | 1 | 1 | 1 | 0 | 1 | 4 |
    | OpenStack Swift | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
    | Versity Gateway | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | CloudServer | 1 | 1 | 0.5 | 0.5 | 1 | 4 |
    | S3Proxy | 1 | 1 | 0.5 | 1 | 0.5 | 4 |
    | SeaweedFS | 1 | 0.5 | 1 | 0.5 | 0.5 | 3.5 |
    | Apache Ozone | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | NVIDIA AIStore | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | RustFS | 1 | 1 | 0.5 | 0.5 | 0.5 | 3.5 |
    | CubeFS | 0.5 | 1 | 1 | 0 | 0.5 | 3 |
    | MinIO community | 0 | 0 | 1 | 0.5 | 1 | 1 (capped from 2.5) |

The license names identify the reviewed server code. They do not describe
every dependency, packaged component or commercial offering. Ceph's
[COPYING file](https://github.com/ceph/ceph/blob/v20.2.4/COPYING) lists its
LGPL choice and file-specific exceptions. Review the exact distribution's
terms as part of adoption; free of charge and open source are not synonyms.

## Start with the workload

For a small new installation, I would compare **Garage and Silo** first:
Garage for the smallest operating surface, Silo when versioning, Object Lock,
replication or the admin console are required, since its open edition has
no feature gate. **SeaweedFS** belongs on the list for shared file and
object workloads, with the paid Day 2 features priced in. If a protected
filesystem already exists, **Versity Gateway** is another small-footprint
candidate: it adds an S3 interface, not a new durability layer. For an
existing MinIO deployment, **Silo** also addresses continuity, but the
upgrade path still needs rehearsal. **Ceph, Ozone and Swift** belong on the
list when their broader platform model is useful, not simply because they
can expose S3. **RustFS reached general availability on 2026-09-16**, while the original
**MinIO community repository is archived**. An S3-compatible endpoint does
not promise every Amazon S3 feature or identical behavior under failure.

- **A small application or a few independent sites:** start with Garage
  if its simpler bucket/key permissions and lack of versioning fit. Compare
  SeaweedFS when a file interface or its filer model is useful. One process
  on one disk can be convenient; it is not high availability.
- **Backups that must resist deletion:** do not choose from a successful
  upload test. Require the backup client's supported Object Lock semantics,
  retention enforcement and a restore rehearsal. Garage is not a fit when
  S3 Object Lock is mandatory; Ozone's documented S3 gaps also exclude it.
- **An existing MinIO installation:** evaluate Silo on a recoverable copy
  with the exact source version, topology, encryption and client set.
  Retain a verified recovery path before changing any production binary.
- **A private-cloud storage platform:** start with Ceph RGW if the team
  already operates Ceph or needs its wider storage services. Keep Swift
  where the organization already owns Swift's operational model. Neither
  justifies a new storage team for one small bucket.
- **A data lake or AI workload:** compare SeaweedFS and Ceph against the
  actual readers, writers and catalog. Add Ozone for a Hadoop-centered
  environment. An S3 endpoint alone does not implement Iceberg transactions,
  catalog authorization or a complete training data pipeline.

## Other layers and candidates to watch

These projects are relevant to the decision, but they do not all replace a
distributed object store. Separating the layers avoids comparing an interface
with the system responsible for keeping the bytes safe.

- **Existing filesystem:** [Versity Gateway 1.8.0](https://github.com/versity/versitygw/tree/v1.8.0) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  (Apache-2.0; released 2026-09-04) translates S3 to POSIX, ScoutFS, Azure or
  another S3 backend. This is my small-installation candidate when the
  filesystem, backups and recovery are already owned. Its POSIX versioning
  directory is not automatic disk redundancy or a separate backup.
- **Specialized data platforms:** [NVIDIA AIStore 1.5.0](https://github.com/NVIDIA/aistore/tree/v1.5.0) <span class="tool-rating" data-rating="3.5"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3.5/5</span></span>
  (MIT; released 2026-08-21) combines native storage, remote data access and configurable caching
  for data-intensive workloads. [CubeFS 3.6.0](https://github.com/cubefs/cubefs/tree/v3.6.0) <span class="tool-rating" data-rating="3"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">3/5</span></span>
  (Apache-2.0) combines distributed file and object interfaces. Consider them
  for the wider data path or filesystem requirement, not as the default
  answer to a small S3 bucket. Pin the matching release documentation.
- **S3 interface over other backends:** [CloudServer 9.4.3](https://github.com/scality/cloudserver/tree/9.4.3) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  and [S3Proxy 4.1.1](https://github.com/gaul/s3proxy/tree/s3proxy-4.1.1) <span class="tool-rating" data-rating="4"><span class="tool-rating__stars" aria-hidden="true">★★★★★</span><span class="tool-rating__value">4/5</span></span>
  (Apache-2.0) can bridge applications to existing storage. Evaluate the
  backend's durability and the gateway's compatibility separately; running
  an interface is not operating the full commercial Scality platform.
- **Disposable development and CI:** [local-s3](https://github.com/shyim/local-s3)
  (MIT) deliberately targets quick local tests. That can be the simplest
  option for this purpose, not for production durability or replication.
- **Early candidates:** [Alarik](https://github.com/achtungsoftware/alarik)
  and [FractalBits](https://github.com/fractalbits-labs/fractalbits)
  (Apache-2.0) identify themselves as beta. Keep them on an evaluation list;
  claimed performance or feature counts do not replace recovery, security
  and upgrade evidence. They are not promoted above maintained alternatives
  solely because they are newer.

## Version and operational notes

Expand a project for the source boundary behind its recommendation. A recent
release is evidence of activity, not proof of reliability for your workload.

??? info faq-item "Garage — small distributed storage, narrower S3 surface"
    **Reviewed: [v2.4.1](https://github.com/deuxfleurs-org/garage/tree/v2.4.1),
    released 2026-09-08.** This patch fixes the start-up panic that 2.4.0
    hit with Consul or Kubernetes discovery; it changes nothing else.
    Garage targets small-to-medium self-hosted deployments and can spread
    replicas across physical locations without an external database service.
    That is useful when operational scope matters more than matching AWS's
    entire control plane.

    Its [S3 compatibility reference](https://garagehq.deuxfleurs.fr/documentation/reference-manual/s3-compatibility/)
    documents missing bucket versioning, Object Lock and S3 bucket policies;
    permissions use its bucket/access-key model instead. Do not inherit that
    page's comparisons of other products: check each upstream independently.
    Test the chosen replication mode, lost-site recovery and replacement-node
    repair using the [recovery guidance](https://garagehq.deuxfleurs.fr/documentation/operations/recovering/).

??? info faq-item "SeaweedFS — include the metadata layer in the design"
    **Reviewed: [4.47, released 2026-09-14](https://github.com/seaweedfs/seaweedfs/releases/tag/4.47).**
    The [S3 gateway](https://github.com/seaweedfs/seaweedfs/wiki/Amazon-S3-API)
    sits over a filer and volume servers. A compact startup command does not
    remove those responsibilities once they are deployed separately.

    Protect the filer metadata as well as object bytes; restoring one without
    the other is not a complete service recovery. The project documents
    [metadata backup](https://github.com/seaweedfs/seaweedfs/wiki/Async-Filer-Metadata-Backup)
    separately. Validate the selected metadata backend, replication/erasure
    coding, authenticated internal traffic and the exact client's S3 calls.
    Keep development configurations that allow anonymous access off shared
    networks. The [Enterprise edition](https://seaweedfs.com/), licensed per
    terabyte, holds self-healing storage, automatic erasure-coding repair,
    bitrot scrubbing, point-in-time recovery, restoring deleted files, the
    admin UI with OIDC and multi-tenant S3 QoS. The open edition keeps
    versioning, Object Lock, IAM, bucket policies and server-side encryption,
    but its S3 gateway does not implement bucket replication or event
    notifications.

??? info faq-item "Silo (PGSTY) — continuity is a bounded promise"
    **Reviewed: [RELEASE.2026-09-16T00-00-00Z](https://github.com/pgsty/silo/releases/tag/RELEASE.2026-09-16T00-00-00Z),
    published 2026-09-16.** The repository was renamed from `pgsty/minio` in
    August. Its [compatibility notes](https://silo.pgsty.com/compatibility/)
    describe the retained MinIO protocol and disk format; that is not evidence
    that every existing installation can switch safely. Silo restores the
    full admin console that upstream reduced to a stub in 2025, ships signed
    binaries, packages and images, keeps versioning, Object Lock, IAM, site
    replication, encryption and lifecycle, and states that it has no paid
    tier or feature gate.

    Review the exact release's coordinated-upgrade instructions, artifacts
    and known limitations. Rehearse rollback with versions, encryption keys,
    replication and retention rules intact. The
    [maintenance manifesto](https://silo.pgsty.com/about/manifesto/) limits the
    promise to a maintained release line, security and focused fixes; it does
    not promise the entire upstream roadmap or a fix-time SLA.

??? info faq-item "Ceph RGW — a platform decision, not a container choice"
    **Reviewed: [Tentacle 20.2.4, released 2026-08-19](https://docs.ceph.com/en/latest/releases/).**
    RGW exposes object APIs on Ceph's storage cluster. That makes sense when
    storage placement, capacity, failure domains and operations are already
    owned as a platform. Check the selected
    [RGW deployment model](https://docs.ceph.com/en/tentacle/cephadm/services/rgw/)
    and [S3 API](https://docs.ceph.com/en/tentacle/radosgw/s3/), not a generic
    compatibility badge.

    Exercise bucket-index growth, degraded reads/writes and recovery traffic.
    Multi-site adds separate clusters and synchronization to operate; measure
    lag and failover rather than treating it as an instantaneous backup.
    See the [multi-site model](https://docs.ceph.com/en/tentacle/radosgw/multisite/).
    A Kubernetes operator can automate deployment without replacing the
    expertise needed to restore the underlying storage.

??? info faq-item "Apache Ozone — distinguish native capabilities from S3"
    **Reviewed: [2.2.1, released 2026-08-27](https://github.com/apache/ozone/releases/tag/ozone-2.2.1).**
    Ozone combines a distributed object store with Hadoop file-system access.
    Its S3 gateway is an additional service, not the whole platform.

    The [2.2.1 S3 reference](https://ozone.apache.org/docs/user-guide/client-interfaces/s3/s3-api/)
    lists unsupported bucket versioning and Object Lock, incomplete policy/ACL
    behavior and other deviations. Native snapshots or encryption do not
    establish support for the corresponding S3 operations. Include Ozone
    Manager, Storage Container Manager and their metadata in failure and
    recovery drills; do not size only the data nodes.

??? info faq-item "OpenStack Swift — validate the middleware path"
    **Reviewed: [2.38.1](https://github.com/openstack/swift/tree/2.38.1),
    tagged 2026-08-20.**
    Swift remains a distributed object-storage project. Its
    [s3api middleware and its embedded documentation](https://github.com/openstack/swift/blob/2.38.1/swift/common/middleware/s3api/__init__.py)
    maps S3 requests onto Swift; enabled middleware and the authentication
    pipeline affect the resulting contract. This source is pinned to the
    reviewed tag rather than development documentation.

    Existing Swift teams should evaluate this path before adding a second
    object platform. Test multipart uploads, version handling, credentials
    and policy behavior using the production client. Ring placement, repair
    and proxy operations remain part of ownership. Swift does not require
    deploying every OpenStack service just to store objects.

??? info faq-item "RustFS — a first GA release is not yet a track record"
    **Reviewed: [1.0.0, released 2026-09-16](https://github.com/rustfs/rustfs/releases/tag/1.0.0).**
    It is the first general-availability release after the 1.0.0 release
    candidates, so the prerelease cap no longer applies; frequent releases and
    a large community raise maintenance and maturity. Its Apache-2.0 license and
    S3-focused design make it worth evaluating, but neither Rust nor upstream
    performance claims establish safe behavior for a different workload.

    Use replaceable test data. Verify the precise release's authorization,
    checksums, multipart behavior, degraded operation and upgrade boundaries.
    Review [security advisories](https://github.com/rustfs/rustfs/security/advisories)
    and the scope of its compatibility tests. Between June and August 2026
    the project published high and critical advisories, including an Object
    Lock bypass, IAM condition flaws and a console XSS. I would not make it the sole
    copy of important data on the strength of an installation demo.

??? info faq-item "MinIO community — archived upstream is a material constraint"
    **Reviewed: [archived repository](https://github.com/minio/minio),
    read-only since 2026-04-25.** Its README states that the project is no
    longer maintained. The last published GitHub release is
    [RELEASE.2025-10-15T17-29-55Z](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z).

    The existing AGPL source does not disappear, but an archived upstream is
    not an ongoing patch channel. Inventory deployed builds, exposed services
    and a support or migration path. AIStor is a separate offering with its
    own terms; the availability of a free edition does not make that edition
    the same open-source project. For a new deployment, compare maintained
    candidates instead of treating old MinIO tutorials as the default.

## Before using private-cloud data

Use a disposable environment with the intended topology and client versions.
Write acceptance criteria before measuring anything:

1. **Compatibility:** upload, list, range-read, copy and delete; interrupted
   multipart uploads; presigned URLs; checksums and conditional writes.
   Exercise Unicode keys, metadata and the backup or lakehouse client itself.
   A successful `PutObject` is not an S3 conformance test.
2. **Security:** deny anonymous and cross-tenant access, rotate credentials,
   isolate admin/internal endpoints and test TLS and key recovery. If required,
   test retention and legal hold with both application and privileged roles.
   Private hosting alone establishes neither isolation nor compliance.
3. **Recovery:** lose a disk, node and metadata service; fill capacity; break
   a network link; then restore to a clean deployment from an independent copy.
   Compare bytes, versions, metadata and permissions. Record tolerated data
   loss and restore time; replication alone is not that evidence.
4. **Upgrade and exit:** pin server/client versions and artifact digests.
   Exercise the supported upgrade path and a recovery route if downgrade is
   unsupported. A copy job may omit versions, retention or policy metadata.
   Do not mount a different engine on live disks without explicit support.
5. **Cost under failure:** measure the real object-size distribution, request
   mix, concurrency and tail latency during repair, not only steady state.
   Count usable capacity after replicas/parity, spare space, RAM, network,
   power, independent backups and the people handling incidents.

If no one owns those checks and the recovery procedure, a managed object
service is a valid baseline even when self-hosting initially looks cheaper.
Revisit this comparison when a release, maintenance policy, S3 requirement or
failure test changes the shortlist.

For the layers above stored objects, compare
[lakehouse table formats and catalogs](lakehouse-table-formats.md) and
[workflow orchestrators](workflow-orchestrators.md). The
[observability comparison](observability.md) explains metrics, logs and traces
for investigating their behavior.
