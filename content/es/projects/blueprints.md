---
description: "Arquitecturas de referencia cloud, datos e IA, con casos de uso, compromisos operativos y criterios concretos para pasar a producción."
hide:
  - toc
icon: material/hexagon-multiple-outline
---

<!-- markdownlint-disable MD013 -->

# :material-hexagon-multiple-outline: Blueprints de Producción

> La arquitectura parte de una carga, un modelo operativo y una prueba de aceptación.

Parto de bases oficiales de Google Cloud, AWS y Red Hat y adapto las capas
de datos e IA a restricciones reales de seguridad, fiabilidad y coste.
Las referencias son puntos de partida upstream, no implementaciones que yo
haya publicado.

<p class="research-meta">Revisión técnica · septiembre de 2026 · Referencia → adaptación → validación → operación</p>

<div class="reading-panel" markdown="block">

## Elegir una Base Adecuada al Alcance

Primero, una recomendación breve; después, el razonamiento completo y sus fuentes.

<div class="comparison-source" data-comparison="blueprints" markdown="block">

<div class="comparison-entry" data-category="Nube" data-label="Empezar con un proveedor" data-summary="Organizar cuentas, accesos, redes y facturación cloud con responsables claros." markdown="block">

### Fundaciones Cloud

**Alcance:** Estructura de organización/cuentas, identidad federada, redes,
logs centralizados y responsabilidad de facturación. Usar módulos
Terraform/OpenTofu validados para el proveedor; portabilidad significa
contratos y pruebas consistentes, no recursos idénticos entre proveedores.

**Controles:** Credenciales CI de corta duración, autoridad separada para
plan/apply, excepciones revisadas, estado protegido, restauración y
detección de deriva. VPC Service Controls es un control de Google Cloud;
AWS necesita sus propias políticas de servicio y organización.

**Compromiso:** Una landing zone empresarial completa tiene coste operativo.
En despliegues pequeños, conservar identidad y auditoría y reducir
entornos y servicios compartidos.

</div>

<div class="comparison-entry" data-category="Privada" data-label="Definir quién lo operará" data-summary="Ejecutar aplicaciones o máquinas virtuales privadas con un plan explícito de recuperación y capacidad." markdown="block">

### Nube Privada e Híbrida {#nube-privada-e-hibrida}

**Alcance:** OpenShift y GitOps cuando se necesita ejecución privada o ya
existe un modelo operativo de clústeres. Validar operadores de virtualización
e IA contra la matriz de soporte de la plataforma. Para IaaS de máquinas
virtuales, evaluar OpenStack/Kolla como alternativa con operación propia;
no es un sustituto directo de una plataforma de aplicaciones.

**Controles:** Recuperación de clúster y almacenamiento, segmentación,
procedencia de imágenes, identidad de cargas, actualización de operadores
y capacidad. Un entorno desconectado también requiere distribución de
imágenes y modelos.

**Compromiso:** El hosting privado cambia dónde se ejecutan los datos;
no demuestra por sí solo aislamiento, cumplimiento o bajo coste operativo.
Incluir almacenamiento, ciclo del hardware y responsables de restaurarlo.

</div>

<div class="comparison-entry" data-category="Datos" data-label="Comprobar que los datos coinciden" data-summary="Compartir datos analíticos sin cambiar su significado entre herramientas." markdown="block">

### Plataformas Analíticas {#plataformas-analiticas}

**Alcance:** Prototipar transformaciones con DuckDB/Polars y contratos de
datos. Añadir Iceberg con catálogo ante una necesidad multi-motor probada,
o evaluar el modelo de catálogo SQL de DuckLake.

**Controles:** Compatibilidad lector/escritor, evolución de esquema, calidad,
replay de CDC, política de snapshots/retención y restauración. Probar acceso
por fila y propagación de borrados a datasets derivados.

**Compromiso:** El almacenamiento abierto no elimina diferencias SQL,
autorización de catálogo ni carencias del motor. Promover a BigQuery,
Snowflake o Databricks tras comparar semántica y coste de operación.

</div>

<div class="comparison-entry" data-category="IA" data-label="Empezar con un endpoint" data-summary="Ofrecer respuestas de modelos con límites claros de calidad, tiempo y gasto." markdown="block">

### Serving de IA

**Alcance:** Un endpoint tras identidad, límites de solicitudes y
presupuestos por tenant. Definir calidad, TTFT y latencia entre tokens antes
de añadir vLLM/SGLang, enrutamiento KV o separación con llm-d/Dynamo.

**Controles:** Versionar pesos, tokenizer y configuración; despliegue canary
con tareas reservadas; probar sobrecarga, cancelación, límites de fallback
y aislamiento de caché. Observar costes y omitir contenido sensible.

**Compromiso:** Kubernetes, DRA y un gateway encajan en una flota compartida.
Un servicio gestionado o un único servidor puede cumplir el mismo SLO con
menos operación. Un clasificador complementa autorización; no la sustituye.

</div>

<div class="comparison-entry" data-category="Agentes" data-label="Definir permisos primero" data-summary="Permitir herramientas a agentes mediante pasos acotados que se reanudan con seguridad ante fallos." markdown="block">

### Flujos de Agentes

**Alcance:** Herramientas estructuradas y transiciones de estado explícitas.
Incorporar persistencia LangGraph/Pydantic AI para reanudar flujos; usar MCP
para herramientas y A2A entre agentes con responsables distintos.

**Controles:** Verificar identidad y tenant, validar argumentos, aislar
ejecución, fijar plazos, claves de idempotencia, checkpoints duraderos y
aprobaciones vinculadas a una acción concreta. Probar reintentos alrededor
de una escritura externa.

**Compromiso:** Las decisiones del modelo siguen siendo probabilísticas.
El control determinista puede acotar ejecución, pero ciclos, memoria y
delegación deben demostrar que compensan sus modos de fallo adicionales.

</div>

</div>

Completar la base con el [modelo Ops compartido](#ops) y las [premisas de UX/UI](#ux-ui): responsables, cambios revisados, tareas claras y estados comprensibles.

</div>

## Catálogo de Referencias {#baselines-de-nube-recomendados}

Estos son los principales marcos oficiales que recomiendo y utilizo:

=== "Google Cloud (GCP)"

    * **[Enterprise Foundations Blueprint](
      https://github.com/terraform-google-modules/terraform-example-foundation
      ){ target="_blank" }**:
      La implementación en Terraform de Google de una organización
      multi-entorno, zonas de aterrizaje y redes e IAM seguros por defecto.
    * **[Google Cloud Security Foundations Guide](
      https://cloud.google.com/security/foundations
      ){ target="_blank" }**:
      Guía oficial de controles de seguridad e identidad para fundaciones
      Google Cloud; adaptar alcance y evidencia a los requisitos propios.
    * **[GCP Cloud Foundation Fabric](
      https://github.com/GoogleCloudPlatform/cloud-foundation-fabric
      ){ target="_blank" }**:
      El framework modular oficial de Google basado en Terraform para
      desplegar de forma ágil zonas de aterrizaje empresariales y entornos
      de prueba.
    * **[GCP Cloud Architecture Center](
      https://cloud.google.com/architecture
      ){ target="_blank" }**:
      El catálogo oficial de Google para arquitecturas de referencia, patrones de
      diseño y mejores prácticas globales.
    * **[Enterprise Generative AI & MLOps Blueprint](
      https://docs.cloud.google.com/architecture/blueprints/genai-mlops-blueprint
      ){ target="_blank" }**:
      Referencia empresarial que conecta fundaciones cloud, datos, desarrollo
      de modelos y operación de IA. Adaptar controles y despliegue a cada carga.
    * **[Agent Starter Pack](
      https://github.com/GoogleCloudPlatform/agent-starter-pack
      ){ target="_blank" }**:
      Plantillas iniciales de agentes con Terraform, CI/CD, evaluación y
      observabilidad para Cloud Run y Agent Engine. Validar permisos,
      dependencias y recuperación antes de desplegar.
    * **[Gemini Enterprise Agent Platform — Agent Engine](
      https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
      ){ target="_blank" }**:
      El runtime administrado de agentes — sesiones, memoria, ejecución de
      código y herramientas de evaluación — detrás del stack de agentes de
      Vertex AI.

=== "AWS"

    * **[AWS Landing Zone Accelerator (LZA)](
      https://github.com/awslabs/landing-zone-accelerator-on-aws
      ){ target="_blank" }**:
      Automatización de fundaciones AWS multi-cuenta con controles
      configurables. Su despliegue no certifica cumplimiento normativo.
    * **[AWS Security Reference Architecture (SRA)](
      https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/introduction.html
      ){ target="_blank" }**:
      Guía de arquitectura de seguridad multi-cuenta, con controles y ejemplos
      asociados. Los ejemplos de IaC implementan partes de la referencia.
    * **[AWS Well-Architected Tool & Catalog](
      https://aws.amazon.com/architecture/well-architected/
      ){ target="_blank" }**:
      El marco de referencia oficial para evaluar arquitecturas en la nube según
      costos, seguridad, confiabilidad y excelencia operativa.
    * **[Well-Architected Generative AI Lens](
      https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html
      ){ target="_blank" }**:
      Principios de diseño y ocho escenarios de arquitectura para cargas de
      IA generativa, desde la selección de modelos hasta el serving
      multi-tenant.
    * **[Well-Architected Agentic AI Lens](
      https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html
      ){ target="_blank" }**:
      La lente complementaria para agentes autónomos — autorización de
      herramientas, memoria, aislamiento y control de costos.
    * **[Amazon Bedrock AgentCore Samples](
      https://github.com/awslabs/amazon-bedrock-agentcore-samples
      ){ target="_blank" }**:
      Implementaciones de referencia para el runtime administrado de agentes,
      gateway, memoria e identidad sobre Bedrock.
    * **[AWS Generative AI Application Builder](
      https://aws.amazon.com/solutions/implementations/generative-ai-application-builder-on-aws/
      ){ target="_blank" }**:
      El plano de arquitectura oficial y patrones de infraestructura como código
      de AWS para construir aplicaciones de IA generativa en Amazon Bedrock.

=== "Privada e híbrida"

    * **[OpenStack / Kolla: arquitectura de producción](
      https://docs.openstack.org/kolla-ansible/2026.1/admin/production-architecture-guide.html
      ){ target="_blank" }**:
      Referencia IaaS para separar control, cómputo, redes y almacenamiento.
      Elegir una versión compatible, diseñar alta disponibilidad y ensayar
      restauración; el quickstart de un nodo no es una arquitectura de producción.
    * **[Red Hat OpenShift Platform Plus](
      https://www.redhat.com/en/technologies/cloud-computing/openshift/platform-plus
      ){ target="_blank" }**:
      El baseline de nube privada — OpenShift con Advanced Cluster
      Management, Advanced Cluster Security, Quay y Data Foundation — para
      flotas que abarcan centro de datos, edge y nube pública.
    * **[OpenShift Virtualization](
      https://www.redhat.com/en/technologies/cloud-computing/openshift/virtualization
      ){ target="_blank" }**:
      Ejecuta máquinas virtuales y contenedores en una sola plataforma basada
      en KubeVirt, una opción de consolidación para parques on-premises.
    * **[Validated Pattern: Multicloud GitOps](
      https://validatedpatterns.io/patterns/multicloud-gitops/
      ){ target="_blank" }**:
      La referencia probada de Red Hat, guiada por GitOps, para gestionar
      clústeres, aplicaciones y políticas desde una sola consola entre nubes.
    * **[Validated Pattern: RAG-LLM GitOps](
      https://validatedpatterns.io/patterns/rag-llm-gitops/
      ){ target="_blank" }**:
      Patrón RAG sobre OpenShift AI con serving, recuperación y aplicación
      gestionados mediante GitOps. Revisar versiones y alcance de validación.
    * **[Red Hat OpenShift AI](
      https://www.redhat.com/en/products/ai/openshift-ai
      ){ target="_blank" }**:
      La plataforma de IA nativa de Kubernetes — serving de modelos sobre
      vLLM, pipelines, registros y planificación de GPU con asignación
      dinámica de recursos.
    * **[llm-d](
      https://llm-d.ai/
      ){ target="_blank" }**:
      El stack open source de inferencia distribuida nativo de Kubernetes —
      prefill/decode desagregado, enrutamiento consciente de la caché KV y
      control de flujo multi-tenant — que OpenShift AI incorpora.
    * **[Red Hat AI Inference Server](
      https://www.redhat.com/en/products/ai/inference
      ){ target="_blank" }**:
      Distribución vLLM con soporte y LLM Compressor. Comprobar la matriz
      de modelos, aceleradores y plataformas de la versión elegida.
    * **[RHEL AI e InstructLab](
      https://www.redhat.com/en/products/ai/enterprise-linux-ai
      ){ target="_blank" }**:
      Una plataforma arrancable de modelos fundacionales con el flujo abierto
      de InstructLab para ajustar modelos con datos privados.

=== "Plataformas de IA"

    * **[NVIDIA AI Blueprints](
      https://build.nvidia.com/blueprints
      ){ target="_blank" }**:
      Flujos de referencia construidos sobre microservicios NIM — RAG
      empresarial, extracción multimodal de PDF, humanos digitales —
      con requisitos de despliegue y acelerador propios de cada flujo.
    * **[Kubernetes Gateway API Inference Extension](
      https://gateway-api-inference-extension.sigs.k8s.io/
      ){ target="_blank" }**:
      El gateway de inferencia nativo de Kubernetes — enrutamiento por nombre
      de modelo, conciencia de adaptadores LoRA y salud de endpoints para
      pools compartidos de servidores de modelos.
    * **[CNCF Cloud Native AI Whitepaper](
      https://www.cncf.io/reports/cloud-native-artificial-intelligence-whitepaper/
      ){ target="_blank" }**:
      La referencia de la CNCF para ejecutar cargas de IA sobre
      infraestructura cloud native — planificación, almacenamiento, red y
      observabilidad.
    * **[OpenTelemetry GenAI Semantic Conventions](
      https://github.com/open-telemetry/semantic-conventions-genai
      ){ target="_blank" }**:
      El vocabulario compartido para la telemetría de LLMs, agentes y MCP —
      spans, eventos y métricas — mantenido en un repositorio propio. Fijar
      revisión y comprobar estabilidad por señal antes de instrumentar.
    * **[Model Context Protocol (MCP)](
      https://modelcontextprotocol.io
      ){ target="_blank" }**:
      Protocolo abierto para integrar herramientas y contexto. Negociación
      de versión, autorización y ejecución segura necesitan implementación
      explícita; el protocolo no vuelve determinista al razonamiento.
    * **[Agent2Agent Protocol (A2A)](
      https://a2a-protocol.org/
      ){ target="_blank" }**:
      El estándar de la Linux Foundation para que los agentes se descubran y
      deleguen tareas entre runtimes — la contraparte de MCP.

=== "Estándares y Gobernanza"

    * **[CIS Benchmarks (Center for Internet Security)](
      https://www.cisecurity.org/cis-benchmarks
      ){ target="_blank" }**:
      Los estándares de configuración de seguridad global para plataformas
      en la nube, clusters de Kubernetes (GKE/EKS/OpenShift), bases de datos
      y sistemas operativos.
    * **[Cloud Security Alliance (CSA) Cloud Controls Matrix](
      https://cloudsecurityalliance.org/research/cloud-controls-matrix/
      ){ target="_blank" }**:
      El marco de controles de ciberseguridad definitivo para computación
      en la nube, mapeado con los principales estándares (ISO 27001,
      SOC 2, NIST SP 800-53).
    * **[Open Policy Agent (OPA)](
      https://www.openpolicyagent.org
      ){ target="_blank" }**:
      Motor de políticas CNCF para aplicar reglas explícitas en aplicaciones,
      Kubernetes e IaC. No es un estándar de cumplimiento ni garantiza
      que los controles estén correctamente diseñados.
    * **[OWASP Top 10 for LLM Applications](
      https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/main/2026/final
      ){ target="_blank" }**:
      La lista 2026 de riesgos LLM: inyección de prompts, tratamiento inseguro
      de salidas, autoridad excesiva y consumo sin límites.
    * **[NIST AI Risk Management Framework](
      https://www.nist.gov/itl/ai-risk-management-framework
      ){ target="_blank" }**:
      Marco voluntario Govern–Map–Measure–Manage para organizar el riesgo
      de IA. Usarlo para asignar controles y evidencia, no como certificación.
    * **[MITRE ATLAS](
      https://atlas.mitre.org/
      ){ target="_blank" }**:
      La base de conocimiento de tácticas y técnicas adversarias contra
      sistemas de IA, la contraparte de ATT&CK para el modelado de amenazas.
    * **[MCP Security Best Practices](
      https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices
      ){ target="_blank" }**:
      La guía del propio protocolo sobre reenvío de tokens, ataques de
      *confused deputy*, secuestro de sesión y autorización para servidores
      MCP.

## Criterios para Producción

Una referencia se convierte en diseño desplegable cuando estas comprobaciones
tienen responsable, resultado registrado y decisión de rollback.

| Criterio | Evidencia necesaria |
| :--- | :--- |
| Corrección | Tareas representativas, contratos de datos, compatibilidad y regresión |
| Seguridad | Modelo de amenazas, mínimo privilegio, pruebas de denegación y excepciones auditadas |
| Fiabilidad | SLO/RTO/RPO, carga/sobrecarga, datos restaurados y rollback ensayado |
| Cadena de suministro | Dependencias e imágenes fijadas, procedencia, vulnerabilidades y términos de modelos |
| Economía | Coste por resultado aceptado, capacidad ociosa, reintentos, movimiento de datos y operación |
| Responsabilidad | Runbook, escalamiento, retención/borrado y responsable de actualizaciones |

Para protocolos y versiones cambiantes, consultar el
[Radar tecnológico](explorations.md). Para diseñar experimentos,
usar el [contrato de evidencia de los Laboratorios de investigación](labs.md#contrato-de-evidencia).

## Un Modelo Operativo entre Disciplinas Ops {#ops}

Estas disciplinas comparten un ciclo: versionar el cambio, probarlo, autorizar
el despliegue, observar el resultado y ensayar la recuperación. Son
responsabilidades, no ocho plataformas obligatorias.

| Disciplina | Qué protege | Evidencia que conservar / referencia |
| :--- | :--- | :--- |
| DevOps / Platform / DevEx | Un camino repetible del cambio al servicio útil | Procedencia del build, despliegue y recuperación; [métricas DORA](https://dora.dev/guides/dora-metrics/) |
| DevSecOps / GitOps | Cambios revisados con mínimo privilegio y configuración reconciliada | Amenazas, excepciones, deriva y restauración; [NIST SSDF](https://csrc.nist.gov/projects/ssdf) |
| DataOps | Datos batch y streaming confiables | Contratos, linaje, frescura, calidad y replay; [OpenLineage](https://openlineage.io/docs/) |
| MLOps | Entrenamiento reproducible y promoción controlada de modelos | Versiones de datos/modelos, evaluación, deriva y rollback; [blueprint empresarial AI/MLOps de Google](https://docs.cloud.google.com/architecture/blueprints/genai-mlops-blueprint) |
| LLMOps / AgentOps | Comportamiento evaluado y autoridad acotada de herramientas | Revisiones de prompts/modelos/herramientas, tareas reservadas, aprobación y replay; [AWS Agentic AI Lens](https://docs.aws.amazon.com/wellarchitected/latest/agentic-ai-lens/agentic-ai-lens.html) |
| SRE | Fiabilidad con carga normal y ante fallos | SLO, presupuesto de error, revisión de incidentes y restauración; [SRE Workbook](https://sre.google/workbook/table-of-contents/) |
| AIOps | Investigación asistida de señales operativas | Hipótesis con fuentes, revisión de falsos positivos y runbook aprobado por una persona; [CloudWatch investigations](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations.html) |
| FinOps | Coste atribuible por resultado útil | Facturas asignadas, capacidad ociosa, presupuestos y economía unitaria; [FinOps Framework](https://www.finops.org/framework/) |

**Gobernanza común:** Asignar responsables a datos, modelos y servicios.
Mantener identidad, retención/borrado, procedencia y excepciones en un modelo
de controles revisable. Un diagnóstico de IA no autoriza remediación; un
dashboard no aplica presupuestos; un marco no certifica cumplimiento.

## UX/UI para Herramientas de Ingeniería {#ux-ui}

Este sitio estático Zensical es un pequeño caso de diseño para hacer útiles
las ideas técnicas. La interfaz debe mostrar la próxima acción sin exigir
que el visitante conozca ya todo el vocabulario.

1. **Explicar por niveles.** Una pregunta sencilla lleva a un ejemplo y luego
   a los detalles SQL avanzados. Mantener la recomendación visible y el
   contexto adicional opcional. ¿Un visitante nuevo puede ejecutar una
   consulta útil y explicar el resultado?
2. **Mostrar estado y recuperación.** Failure Lab separa espera, guardados,
   reintentos y rechazos. ¿Se distingue un servicio detenido de trabajo
   perdido definitivamente?
3. **Sugerir sin ejecutar.** El texto tenue y los ejemplos CLI completan la
   entrada; Enter ejecuta. Comprobar teclado, táctil, posición del cursor y
   ejecución accidental.
4. **Mantener coherencia visual.** Usar tokens de color comunes, superficies
   discretas y hover contenido. Comprobar contraste claro/oscuro, foco
   visible, zoom y pantallas pequeñas.
5. **Conservar control y privacidad.** Herramientas locales, red explícita,
   movimiento reducido y contenido legible sin JavaScript. Comprobar Escape,
   devolución del foco, tratamiento de entradas y solicitudes de red.

El formato debe responder al contenido. La [guía de tablas de USWDS](https://designsystem.digital.gov/components/table/)
recomienda celdas breves y fáciles de recorrer; el razonamiento extenso
encaja bajo encabezados o en contenido desplegable. La
[guía de tarjetas de USWDS](https://designsystem.digital.gov/components/card/)
desaconseja usarlas solo como bordes decorativos. Siguiendo la
[guía de detalles de GOV.UK](https://design-system.service.gov.uk/components/details/),
mantener visible la información esencial y reservar los desplegables para
contexto adicional que solo algunos visitantes necesitan.

Usar [WCAG 2.2 (fuente publicada por W3C)](https://github.com/w3c/wcag/tree/WCAG22-20241212) como referencia de
accesibilidad y la [guía WAI de contenido desplegable (fuente oficial)](https://github.com/w3c/aria-practices/blob/main/content/patterns/disclosure/disclosure-pattern.html)
para la ayuda. Las comprobaciones automáticas y de navegador detectan
defectos; no sustituyen la revisión con ayudas técnicas ni las sesiones de uso.

El código y sus restricciones están en el
[sistema de diseño](https://github.com/landerox/landerox.github.io/blob/main/docs/design.md).
[Herramientas interactivas](tools.md) es el ejemplo práctico; el estudio
[Usabilidad de herramientas](labs.md#experience-lab-experience-lab) propone comprobar
comprensión con visitantes técnicos y no técnicos. No se afirma haber
realizado ese estudio ni obtenido una certificación de accesibilidad.
