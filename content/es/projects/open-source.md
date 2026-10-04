---
description: "Software de código abierto de Fernando Landero: ZDX, una suite de desarrollo para Zsh basada en fzf, y el pipeline auditado que construye este sitio."
hide:
  - toc
icon: material/source-branch
---

# :material-source-branch: Código abierto

> Dos proyectos públicos: una caja de herramientas para la terminal que uso a
> diario y el pipeline que construye este sitio.

## ZDX — Zsh Developer Experience Suite

**Qué es.** Un conjunto de menús interactivos para la terminal Zsh. En lugar
de recordar comandos largos, eliges una tarea en una lista filtrable (`fzf`),
ves lo que va a hacer y confirmas. Se instala junto a Oh My Zsh.

### Tres comandos para empezar

| Comando | Qué hace |
| :--- | :--- |
| `zdx` | Explora todas las suites, filtra y previsualiza sus comandos |
| `dev-menu` | Abre una suite directamente: controles, auditorías, limpiezas |
| `zdx doctor` | Detecta dependencias faltantes antes de necesitarlas |

### Qué incluye

La versión 0.1.0 tiene 251 comandos en 15 suites, y cada suite se carga solo
la primera vez que la usas.

| Área | Ejemplos |
| :--- | :--- |
| Proyectos | Repositorios e identidades Git, controles de calidad y auditorías de seguridad, tareas de `Justfile`, `package.json` o `Makefile`, ejecuciones de GitHub Actions |
| Archivos y entornos | Archivos comprimidos, operaciones masivas de archivos, perfiles `.env` leídos sin `source` ni `eval`, entornos virtuales de Python con uv |
| Sistema y red | Diagnósticos, recursos de Docker, comprobaciones de red, túneles WireGuard |
| IA y hardware | Asistentes de IA locales y declaraciones MCP, el Hugging Face Hub, telemetría de GPU NVIDIA |
| Extender ZDX | `zdx doctor` y un gestor de plugins para tus propios menús en `~/.config/zdx` |

### Seguro por defecto

* Todo lo que cambia estado lista sus objetivos exactos y ofrece una
  ejecución de prueba y una confirmación antes de actuar.
* El instalador solo enlaza una copia que tú has revisado: no descarga nada
  ni toca tu archivo de arranque del shell.
* Tus propios plugins son código Zsh que se ejecuta en tu shell, así que
  revísalos antes de cargarlos.

**Calidad.** Pruebas BATS; `shellcheck`, `gitleaks`, `actionlint`, `zizmor` y
`zsh -n` en pre-commit y CI; releases con suma SHA-256 y procedencia de
compilación firmada; OpenSSF Best Practices Silver. Funciona en Linux y WSL2,
y macOS cubre los flujos básicos. Licencia MIT.

<!-- markdownlint-disable MD013 -->
[:material-github: Ver ZDX en GitHub](https://github.com/landerox/zdx-suite){ .md-button .md-button--primary target="_blank" }
[:material-tag-outline: Notas de la versión 0.1.0](https://github.com/landerox/zdx-suite/releases/tag/v0.1.0){ .md-button target="_blank" }
<!-- markdownlint-enable MD013 -->

## Este sitio — landerox.github.io

El [repositorio de este sitio](https://github.com/landerox/landerox.github.io)
es público: el contenido en Markdown, la compilación bilingüe con Zensical y
los controles que debe pasar cada cambio, como Actions fijadas por SHA, CodeQL,
Lighthouse CI y pruebas de navegador.
[`docs/decisions.md`](https://github.com/landerox/landerox.github.io/blob/main/docs/decisions.md)
explica cada elección de herramienta y las alternativas descartadas.

<!-- markdownlint-disable MD013 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "ZDX (Zsh Developer Experience Suite)",
  "description": "Flujos de desarrollo interactivos basados en fzf y un cargador de plugins para Zsh, pensado como complemento de Oh My Zsh.",
  "codeRepository": "https://github.com/landerox/zdx-suite",
  "programmingLanguage": "Shell",
  "runtimePlatform": "Zsh",
  "license": "https://opensource.org/licenses/MIT",
  "version": "0.1.0",
  "author": { "@type": "Person", "@id": "https://landerox.com/#person", "name": "Fernando Landero" }
}
</script>
<!-- markdownlint-enable MD013 -->
