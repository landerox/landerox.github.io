---
description: "Software de código abierto de Fernando Landero: flujos de terminal revisables con ZDX y el pipeline que construye este sitio."
hide:
  - toc
icon: material/source-branch
---

# :material-source-branch: Código abierto

> Dos proyectos públicos: una caja de herramientas para la terminal que uso a
> diario y el pipeline que construye este sitio.

## ZDX — Zsh Developer Experience Suite

Uso ZDX para inspeccionar y ejecutar tareas recurrentes de terminal desde
un menú con búsqueda. Está hecho para Zsh y Oh My Zsh, y usa `fzf` para
encontrar un flujo y mostrar sus detalles. Los cambios muestran sus destinos
y piden confirmación.

El recorrido público sigue una tarea de Git desde el menú hasta el plan y
la confirmación. Su transcripción y guía de reproducción explican qué ocurre
en cada paso.

<!-- markdownlint-disable MD013 -->
[:material-github: Ver ZDX en GitHub](https://github.com/landerox/zdx-suite){ .md-button .md-button--primary target="_blank" }
[:material-console: Ver el recorrido](https://github.com/landerox/zdx-suite/blob/main/docs/demo.md){ .md-button target="_blank" }
<!-- markdownlint-enable MD013 -->

### Tres comandos para empezar

| Comando | Qué hace |
| :--- | :--- |
| `zdx` | Explora todas las suites, filtra y previsualiza sus comandos |
| `dev-menu` | Abre una suite directamente: controles, auditorías, limpiezas |
| `zdx doctor` | Detecta dependencias faltantes antes de necesitarlas |

### Qué incluye

Cada suite se carga solo la primera vez que la usas. El
[README del proyecto](https://github.com/landerox/zdx-suite) documenta el
catálogo actual, los requisitos por plataforma y sus límites.

| Área | Ejemplos |
| :--- | :--- |
| Proyectos | Repositorios e identidades Git, stashes, controles de calidad y auditorías de seguridad |
| Archivos y entornos | Archivos comprimidos, limpieza de archivos revisada, variables de entorno enmascaradas, entornos virtuales de Python con uv |
| Sistema y red | Diagnóstico del equipo, mantenimiento del sistema y túneles WireGuard |
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

## Este sitio — landerox.github.io

El [repositorio de este sitio](https://github.com/landerox/landerox.github.io)
es público: el contenido en Markdown, la compilación bilingüe con Zensical y
los controles que debe pasar cada cambio, como Actions fijadas por SHA, CodeQL,
Lighthouse CI y pruebas de navegador.
[`docs/decisions.md`](https://github.com/landerox/landerox.github.io/blob/main/docs/decisions.md)
explica cada elección de herramienta y las alternativas descartadas.

### Premisas UX/UI {#ux-ui}

El sitio también es un pequeño caso de estudio para hacer útiles las ideas
técnicas sin exigir que el visitante conozca antes el vocabulario.

1. **Explicar por niveles.** Cada herramienta abre con un ejemplo resuelto y
   guarda sus fórmulas y límites en un solo desplegable.
2. **Mostrar estado y recuperación.** Failure Lab separa espera, guardados,
   reintentos y rechazos, para no confundir un servicio detenido con trabajo
   perdido.
3. **Sugerir sin ejecutar.** En la CLI, las sugerencias tenues y los ejemplos
   completan la entrada; solo Enter ejecuta un comando.
4. **Mantener un solo lenguaje visual.** Tokens de color comunes, superficies
   discretas y movimiento contenido, comprobados en contraste, foco, zoom y
   pantallas estrechas en ambas paletas.
5. **Conservar control y privacidad.** Las herramientas se ejecutan en local,
   el movimiento puede reducirse y el contenido se lee sin JavaScript.

El formato responde al contenido: celdas de tabla breves y fáciles de recorrer
([tablas de USWDS](https://designsystem.digital.gov/components/table/)),
tarjetas que llevan a una acción y no son solo un borde
([tarjetas de USWDS](https://designsystem.digital.gov/components/card/)) y
desplegables solo para el contexto que algunos visitantes necesitan
([detalles de GOV.UK](https://design-system.service.gov.uk/components/details/)).
[WCAG 2.2](https://github.com/w3c/wcag/tree/WCAG22-20241212) es la referencia
de accesibilidad. Las comprobaciones automáticas y de navegador detectan
defectos; no sustituyen las sesiones con visitantes reales, que el estudio
[Usabilidad de herramientas](labs.md#experience-lab-experience-lab) planifica
y aún no ha realizado. La implementación y sus restricciones están en el
[sistema de diseño](https://github.com/landerox/landerox.github.io/blob/main/docs/design.md).

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
  "author": { "@type": "Person", "@id": "https://landerox.com/#person", "name": "Fernando Landero" }
}
</script>
<!-- markdownlint-enable MD013 -->
