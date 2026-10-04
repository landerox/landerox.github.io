---
description: "Reference architectures for cloud, data and AI, with workload fit, operating trade-offs and concrete production readiness gates."
hide:
  - toc
icon: material/hexagon-multiple-outline
---

<!-- markdownlint-disable MD013 -->

# :material-hexagon-multiple-outline: Production Blueprints

> Architecture starts with a workload, an operating model and an acceptance test.

I build on official Google Cloud, AWS and Red Hat baselines, then adapt the
data and AI layers to the actual security, reliability and cost constraints.
The references below are upstream starting points, not implementations I
have released.

<p class="research-meta">Technical review · September 2026 · Reference → adaptation → validation → operations</p>

<div class="reading-panel" markdown="block">

## Choose the Smallest Suitable Foundation

A short recommendation first; the full reasoning and sources follow.

<div class="comparison-source" data-comparison="blueprints" markdown="block">

<div class="comparison-entry" data-category="Cloud" data-label="Start with one provider" data-summary="Organize cloud accounts, access, networks and billing around clear ownership." markdown="block">

### Cloud Foundations

**Scope:** Organization/account structure, identity federation, networking,
central logs and billing ownership. Use Terraform/OpenTofu modules validated
for the selected provider; portability means consistent contracts and tests,
not identical provider resources.

**Controls:** Short-lived CI credentials, separate plan/apply authority,
reviewed policy exceptions, protected state, restore drills and drift
detection. VPC Service Controls are a Google Cloud control; AWS requires its
own service and organization policies.

**Trade-off:** A full enterprise landing zone has operating overhead. For a
small deployment, preserve the identity and audit boundaries while reducing
the number of environments and shared services.

</div>

<div class="comparison-entry" data-category="Private" data-label="Plan who will operate it" data-summary="Run private applications or virtual machines with an explicit recovery and capacity plan." markdown="block">

### Private and Hybrid Cloud

**Scope:** OpenShift and GitOps for estates that need private execution or
already have an operating model for clusters. Validate virtualization and AI
operators against the supported platform matrix. For virtual-machine IaaS,
evaluate OpenStack/Kolla as a separately operated alternative; it is not a
drop-in replacement for an application platform.

**Controls:** Cluster and storage recovery, network segmentation, registry
provenance, workload identity, operator upgrades and capacity ownership.
A disconnected environment also needs an image and model distribution plan.

**Trade-off:** Private hosting changes where data runs; it does not itself
establish isolation, compliance or low operating cost. Include storage,
hardware lifecycle and the people who restore it.

</div>

<div class="comparison-entry" data-category="Data" data-label="Check tools agree on the data" data-summary="Share analytical data without changing its meaning across the tools that use it." markdown="block">

### Analytical Platforms

**Scope:** Prototype transformations with DuckDB/Polars and explicit data
contracts. Add Iceberg plus a catalog for a tested multi-engine requirement,
or evaluate DuckLake's SQL catalog model.

**Controls:** Reader/writer compatibility, schema evolution, data quality,
CDC replay, snapshot/retention policy and restore validation. Test row-level
access and deletion propagation across derived datasets.

**Trade-off:** Open storage does not eliminate SQL dialect differences,
catalog authorization or engine feature gaps. Promote to BigQuery, Snowflake
or Databricks only after comparing result semantics and operating cost.

</div>

<div class="comparison-entry" data-category="AI" data-label="Start with one model endpoint" data-summary="Serve model responses with clear quality, response-time and spending limits." markdown="block">

### AI Serving

**Scope:** A model endpoint behind identity, rate limits and per-tenant
budgets. Establish quality, TTFT and inter-token latency goals before adding
vLLM/SGLang, KV-aware routing or a disaggregated llm-d/Dynamo deployment.

**Controls:** Version model weights, tokenizer and serving configuration;
canary against held-out tasks; test overload, cancellation, fallback limits
and cache isolation. Observe costs and redact sensitive payloads.

**Trade-off:** Kubernetes, DRA and an inference gateway suit a shared fleet.
For one endpoint, a managed service or one server may meet the same SLO with
less operational work. A classifier complements authorization; it cannot
replace it.

</div>

<div class="comparison-entry" data-category="Agents" data-label="Set permissions first" data-summary="Let agents use tools through bounded steps that can resume safely after failure." markdown="block">

### Agent Workflows

**Scope:** Structured tools and explicit state transitions. Introduce
LangGraph/Pydantic AI persistence for workflows that must resume; use MCP
for tool integration and A2A for independently owned agent boundaries.

**Controls:** Caller and tenant verification, validated tool arguments,
sandboxed execution, deadlines, idempotency keys, durable checkpoints and
approval tied to a specific action. Test retries across an external write.

**Trade-off:** Model decisions remain probabilistic. Deterministic control
flow can bound execution, but cycles, memory and delegation need evidence
that their additional failure modes buy useful capability.

</div>

</div>

Complete the foundation with the [shared Ops model](#ops) and [UX/UI principles](#ux-ui): named owners, reviewed changes, clear tasks and understandable states.

</div>

## Reference Catalog {#recommended-cloud-baselines}

These are the primary official frameworks I recommend and leverage:

=== "Google Cloud (GCP)"

    * **[Enterprise Foundations Blueprint](
      https://github.com/terraform-google-modules/terraform-example-foundation
      ){ target="_blank" }**:
      Google's Terraform implementation of a multi-environment organization,
      landing zones, and secure-by-default networking and IAM.
    * **[Google Cloud Security Foundations Guide](
      https://cloud.google.com/security/foundations
      ){ target="_blank" }**:
      Official security and identity guidance for Google Cloud foundations;
      adapt scope and evidence to the organization's requirements.
    * **[GCP Cloud Foundation Fabric](
      https://github.com/GoogleCloudPlatform/cloud-foundation-fabric
      ){ target="_blank" }**:
      Google's official, highly modular Terraform-based framework for rapid
      prototyping and production-ready organization landing zones.
    * **[GCP Cloud Architecture Center](
      https://cloud.google.com/architecture
      ){ target="_blank" }**:
      Google's official catalog of cross-industry reference architectures,
      design patterns, and best practices.
    * **[Enterprise Generative AI & MLOps Blueprint](
      https://docs.cloud.google.com/architecture/blueprints/genai-mlops-blueprint
      ){ target="_blank" }**:
      An enterprise reference connecting cloud foundations, data, model
      development and AI operations. Adapt controls and deployment to the workload.
    * **[Agent Starter Pack](
      https://github.com/GoogleCloudPlatform/agent-starter-pack
      ){ target="_blank" }**:
      Agent starting templates with Terraform, CI/CD, evaluation and
      observability for Cloud Run and Agent Engine. Validate permissions,
      dependencies and recovery before deployment.
    * **[Gemini Enterprise Agent Platform — Agent Engine](
      https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
      ){ target="_blank" }**:
      The managed agent runtime — sessions, memory, code execution, and
      evaluation tooling — behind the Vertex AI agent stack.

=== "AWS"

    * **[AWS Landing Zone Accelerator (LZA)](
      https://github.com/awslabs/landing-zone-accelerator-on-aws
      ){ target="_blank" }**:
      Multi-account AWS foundation automation with configurable controls.
      Deploying it does not certify regulatory compliance.
    * **[AWS Security Reference Architecture (SRA)](
      https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/introduction.html
      ){ target="_blank" }**:
      Multi-account security architecture guidance with controls and companion
      examples. IaC samples implement parts of the reference, not the whole design.
    * **[AWS Well-Architected Tool & Catalog](
      https://aws.amazon.com/architecture/well-architected/
      ){ target="_blank" }**:
      The definitive framework for evaluating cloud architectures against cost,
      security, reliability, and operational excellence standards.
    * **[Well-Architected Generative AI Lens](
      https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html
      ){ target="_blank" }**:
      Design principles and eight architecture scenarios for generative AI
      workloads, from model selection to multi-tenant serving.
    * **[Well-Architected Agentic AI Lens](
      https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html
      ){ target="_blank" }**:
      The companion lens for autonomous agents — tool authorization, memory,
      isolation, and cost control.
    * **[Amazon Bedrock AgentCore Samples](
      https://github.com/awslabs/amazon-bedrock-agentcore-samples
      ){ target="_blank" }**:
      Reference implementations for the managed agent runtime, gateway,
      memory, and identity services on Bedrock.
    * **[AWS Generative AI Application Builder](
      https://aws.amazon.com/solutions/implementations/generative-ai-application-builder-on-aws/
      ){ target="_blank" }**:
      AWS's official reference blueprint and infrastructure-as-code
      patterns for building secure, multi-tenant generative AI applications
      on Amazon Bedrock.

=== "Private & hybrid"

    * **[OpenStack / Kolla: production architecture](
      https://docs.openstack.org/kolla-ansible/2026.1/admin/production-architecture-guide.html
      ){ target="_blank" }**:
      An IaaS reference separating control, compute, networking and storage.
      Select a compatible release, design high availability and rehearse
      restoration; the single-node quickstart is not a production architecture.
    * **[Red Hat OpenShift Platform Plus](
      https://www.redhat.com/en/technologies/cloud-computing/openshift/platform-plus
      ){ target="_blank" }**:
      The private-cloud baseline — OpenShift with Advanced Cluster Management,
      Advanced Cluster Security, Quay, and Data Foundation — for fleets that
      span datacenter, edge, and public cloud.
    * **[OpenShift Virtualization](
      https://www.redhat.com/en/technologies/cloud-computing/openshift/virtualization
      ){ target="_blank" }**:
      Runs virtual machines and containers on one KubeVirt-based platform,
      one consolidation option for on-premises estates.
    * **[Validated Pattern: Multicloud GitOps](
      https://validatedpatterns.io/patterns/multicloud-gitops/
      ){ target="_blank" }**:
      Red Hat's tested, GitOps-driven reference for managing clusters,
      applications, and policies from one console across clouds.
    * **[Validated Pattern: RAG-LLM GitOps](
      https://validatedpatterns.io/patterns/rag-llm-gitops/
      ){ target="_blank" }**:
      An OpenShift AI RAG pattern covering serving, retrieval and application
      delivery through GitOps. Check versions and the pattern's validation scope.
    * **[Red Hat OpenShift AI](
      https://www.redhat.com/en/products/ai/openshift-ai
      ){ target="_blank" }**:
      The Kubernetes-native AI platform — model serving on vLLM, pipelines,
      registries, and GPU scheduling with dynamic resource allocation.
    * **[llm-d](
      https://llm-d.ai/
      ){ target="_blank" }**:
      The open source, Kubernetes-native distributed inference stack —
      disaggregated prefill/decode, KV-cache-aware routing, and multi-tenant
      flow control — that OpenShift AI ships.
    * **[Red Hat AI Inference Server](
      https://www.redhat.com/en/products/ai/inference
      ){ target="_blank" }**:
      A supported vLLM distribution with LLM Compressor. Check the model,
      accelerator and platform compatibility matrix for the chosen release.
    * **[RHEL AI and InstructLab](
      https://www.redhat.com/en/products/ai/enterprise-linux-ai
      ){ target="_blank" }**:
      A bootable foundation-model platform with the open InstructLab
      workflow for tuning models on private data.

=== "AI Platforms"

    * **[NVIDIA AI Blueprints](
      https://build.nvidia.com/blueprints
      ){ target="_blank" }**:
      Reference workflows built on NIM microservices — enterprise RAG,
      multimodal PDF extraction, digital humans — with deployment and
      accelerator requirements specific to each workflow.
    * **[Kubernetes Gateway API Inference Extension](
      https://gateway-api-inference-extension.sigs.k8s.io/
      ){ target="_blank" }**:
      The Kubernetes-native inference gateway — model-name routing, LoRA
      adapter awareness, and endpoint health for shared model server pools.
    * **[CNCF Cloud Native AI Whitepaper](
      https://www.cncf.io/reports/cloud-native-artificial-intelligence-whitepaper/
      ){ target="_blank" }**:
      The CNCF reference for running AI workloads on cloud native
      infrastructure — scheduling, storage, networking, and observability.
    * **[OpenTelemetry GenAI Semantic Conventions](
      https://github.com/open-telemetry/semantic-conventions-genai
      ){ target="_blank" }**:
      The shared vocabulary for LLM, agent, and MCP telemetry — spans,
      events, and metrics — maintained in a dedicated repository. Pin a
      revision and check stability per signal before instrumenting it.
    * **[Model Context Protocol (MCP)](
      https://modelcontextprotocol.io
      ){ target="_blank" }**:
      An open protocol for tool and context integration. Version negotiation,
      authorization and safe execution require an explicit implementation;
      the protocol does not make model reasoning deterministic.
    * **[Agent2Agent Protocol (A2A)](
      https://a2a-protocol.org/
      ){ target="_blank" }**:
      The Linux Foundation standard for agents discovering each other and
      delegating tasks across runtimes — the counterpart to MCP.

=== "Standards & Governance"

    * **[CIS Benchmarks (Center for Internet Security)](
      https://www.cisecurity.org/cis-benchmarks
      ){ target="_blank" }**:
      The global configuration standards for securing cloud platforms,
      Kubernetes clusters (GKE/EKS/OpenShift), databases, and operating
      systems.
    * **[Cloud Security Alliance (CSA) Cloud Controls Matrix](
      https://cloudsecurityalliance.org/research/cloud-controls-matrix/
      ){ target="_blank" }**:
      The cybersecurity control framework for cloud computing, mapping to major
      industry standards (ISO 27001, SOC 2, NIST SP 800-53).
    * **[Open Policy Agent (OPA)](
      https://www.openpolicyagent.org
      ){ target="_blank" }**:
      A CNCF policy engine for explicit rules in applications, Kubernetes
      and IaC. It is not a compliance standard or proof of correct controls.
    * **[OWASP Top 10 for LLM Applications](
      https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final
      ){ target="_blank" }**:
      The 2026 LLM application risk list, covering prompt injection, unsafe
      output handling, excessive agency and unbounded consumption.
    * **[NIST AI Risk Management Framework](
      https://www.nist.gov/itl/ai-risk-management-framework
      ){ target="_blank" }**:
      A voluntary Govern–Map–Measure–Manage framework for AI risk.
      Use it to organize controls and evidence, not as a certification.
    * **[MITRE ATLAS](
      https://atlas.mitre.org/
      ){ target="_blank" }**:
      The adversary tactics and techniques knowledge base for AI systems,
      the threat-modeling counterpart to ATT&CK.
    * **[MCP Security Best Practices](
      https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices
      ){ target="_blank" }**:
      The protocol's own guidance on token passthrough, confused-deputy
      attacks, session hijacking, and authorization for MCP servers.

## Production Readiness Gates

A reference becomes a deployable design only after these checks have an
owner, a recorded result and a rollback decision.

| Gate | Required evidence |
| :--- | :--- |
| Correctness | Representative tasks, data contracts, reader/writer compatibility and regression results |
| Security | Threat model, least-privilege identities, negative authorization tests and audited exceptions |
| Reliability | Stated SLO/RTO/RPO, load/overload behavior, restored data and a rehearsed rollback |
| Supply chain | Pinned dependencies and images, verified provenance, vulnerability review and model terms |
| Economics | Cost per accepted outcome, idle capacity, retries, data movement and operating effort |
| Ownership | Runbook, escalation path, retention/deletion policy and responsibility for upgrades |

For changing protocols and tool versions, consult the
[Tech Radar](explorations.md). For experiment design and publication
requirements, use the [Research Labs evidence contract](labs.md#evidence-contract).

## One Operating Model Across Ops {#ops}

These disciplines share a delivery loop: version the change, test it,
authorize deployment, observe the outcome and rehearse recovery. They are
responsibilities, not eight mandatory platforms.

| Discipline | What it protects | Evidence to keep / reference |
| :--- | :--- | :--- |
| DevOps / Platform / DevEx | A repeatable path from change to usable service | Build provenance, deployment and recovery feedback; [DORA delivery metrics](https://dora.dev/guides/dora-metrics/) |
| DevSecOps / GitOps | Reviewed, least-privilege changes and reconciled configuration | Threat model, policy exceptions, drift and restore tests; [NIST SSDF](https://csrc.nist.gov/projects/ssdf) |
| DataOps | Trustworthy batch and streaming datasets | Contracts, lineage, freshness, quality and replay results; [OpenLineage](https://openlineage.io/docs/) |
| MLOps | Reproducible training and controlled model promotion | Dataset/model versions, evaluation, drift monitoring and rollback; [Google enterprise AI/MLOps blueprint](https://docs.cloud.google.com/architecture/blueprints/genai-mlops-blueprint) |
| LLMOps / AgentOps | Evaluated model behavior and bounded tool authority | Prompt/model/tool revisions, held-out tasks, approval and replay traces; [AWS Agentic AI Lens](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html) |
| SRE | Reliability under normal load and failure | SLO/error-budget policy, incident review and restore drills; [SRE Workbook](https://sre.google/workbook/table-of-contents/) |
| AIOps | Assisted investigation of operational signals | Source-linked hypotheses, false-positive review and a human-approved runbook; [CloudWatch investigations](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations.html) |
| FinOps | Accountable cost per useful outcome | Allocated bills, idle capacity, budgets and unit economics; [FinOps Framework](https://www.finops.org/framework/) |

**Shared governance:** Name the owner of each dataset, model and service.
Keep identity, retention/deletion, supply-chain provenance and exceptions in
one reviewable control model. An AI diagnosis does not authorize remediation;
a dashboard does not enforce a budget; a framework is not a compliance certificate.

## UX/UI for Engineering Tools {#ux-ui}

This static Zensical site is a small case study in making technical ideas
usable. The design should reveal the next action without requiring visitors
to already know the vocabulary.

1. **Explain progressively.** A plain-language question leads to an example,
   then advanced SQL details. Keep the recommendation visible and supporting
   context optional. Can a first-time visitor run a useful query and explain
   its result?
2. **Show state and recovery.** Failure Lab separates waiting, saved, retried
   and rejected work. Can someone distinguish a stopped service from
   permanently lost work?
3. **Suggest without acting.** CLI ghost text and examples fill the input;
   Enter executes. Check keyboard, touch, caret position and accidental
   execution.
4. **Keep a coherent visual language.** Use shared color tokens, quiet
   surfaces and restrained hover feedback. Check light/dark contrast, visible
   focus, zoom and narrow screens.
5. **Preserve control and privacy.** Tools run locally, network actions are
   explicit, motion can be reduced and content remains readable without
   JavaScript. Check keyboard escape, focus return, input handling and
   network requests.

The format should follow the content. [USWDS table guidance](https://designsystem.digital.gov/components/table/)
recommends brief, scannable cells; longer reasoning belongs under headings
or in expandable content. [USWDS card guidance](https://designsystem.digital.gov/components/card/)
discourages cards used only as decorative borders. Following
[GOV.UK details guidance](https://design-system.service.gov.uk/components/details/),
keep essential information visible and reserve disclosures for supporting
context that only some visitors need.

Use [WCAG 2.2 (W3C publication source)](https://github.com/w3c/wcag/tree/WCAG22-20241212) as the accessibility
reference and [WAI disclosure guidance (official source)](https://github.com/w3c/aria-practices/blob/main/content/patterns/disclosure/disclosure-pattern.html)
for expandable help. Automated checks and browser tests catch defects;
they do not replace assistive-technology review or usability sessions.

The implementation and constraints live in the
[design system](https://github.com/landerox/landerox.github.io/blob/main/docs/design.md).
[Interactive Tools](tools.md) is the practical example; the planned
[Tool Usability](labs.md#experience-lab-experience-lab) study will
test comprehension with technical and non-technical visitors. No completed
user study or accessibility certification is claimed here.
