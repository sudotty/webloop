<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop — graba una vez, automatiza para siempre. Automatización de navegador sin código y con prioridad local." width="100%" />

# WebLoop — Automatización de navegador sin código y con prioridad local

**Graba un flujo de trabajo repetitivo del navegador una sola vez. Reprodúcelo o prográmalo para siempre.**
La alternativa ligera al RPA pesado para ERP, CRM, sistemas OA, intranets y portales de informes heredados — sin código, sin nube y sin necesidad de LLM.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-tecnología--arquitectura)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · **Español** · [Français](./README.fr.md) · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md)

</div>

---

## 😩 El problema

La mayoría del software empresarial interno — ERP, CRM, OA, intranets, portales de
informes — **no tiene API**. Así que las personas se convierten en la API: cada
mañana alguien abre la misma página, elige la fecha de ayer, aplica los mismos
filtros, hace clic en *Consultar*, espera a que cargue una tabla lenta, hace clic
en *Exportar* y envía el archivo por correo. Cada. Santo. Día.

Las suites de RPA pesadas (UiPath, Power Automate) son caras, requieren formación y
exigen una instalación de escritorio. Los "agentes de IA" puros alucinan y no son
deterministas. Los grabadores en la nube que exigen *"leer todos tus datos"* son
rechazados por los equipos de seguridad de la información.

## 💡 La solución

> **WebLoop trata el DOM del navegador como la API.** Si puedes hacer clic en ello, puedes automatizarlo.

Una extensión ligera de Chrome que **graba tus clics reales una sola vez** y los
reproduce de forma determinista — bajo demanda o según una programación —
completamente **en tu propio equipo**.

<div align="center">
<img src="docs/assets/screens.svg" alt="Panel lateral de WebLoop: grabando un flujo de trabajo con sus pasos y el panel de permisos por sitio." width="100%" />
<sub><i>UI ilustrativa del panel lateral de WebLoop (grabando un flujo y el panel de permisos por sitio).</i></sub>
</div>

---

## ✨ Funciones (disponibles hoy)

| | Función | Qué hace |
| :-- | :--- | :--- |
| ✅ | **Grabación sin código** | Captura clics, entradas, selecciones, hovers, dobles clics, casillas de verificación y descargas. |
| ✅ | **Reproducción determinista** | Elementos con múltiples localizadores (CSS, XPath, texto estable, aria-label) + puntuación de confianza — sin agentes que alucinan. |
| ✅ | **Variables de fecha dinámicas** | `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{date:-7}}` — los informes siempre consultan el periodo correcto. |
| ✅ | **Pasos de fiabilidad** | Esperar por texto / elemento / estabilidad de la página; limpieza automática del flujo; auditoría estática del flujo que señala los errores más comunes. |
| ✅ | **Programación** | Manual, diaria, días laborables o cada N minutos. |
| ✅ | **Capturas y notificaciones** | En caso de éxito, error o cuando se necesita intervención humana (2FA / CAPTCHA / aprobación). |
| ✅ | **Prioridad local y privacidad** | Tareas, registros y ajustes permanecen en tu navegador. Copia de seguridad/restauración en JSON. |
| ✅ | **Panel de permisos por sitio** | Consulta, concede y revoca el acceso a los hosts sitio por sitio. |
| ✅ | **IA opcional** | Conecta OpenAI / Anthropic / Gemini / DeepSeek / Ollama / Groq — desactivada por defecto y solo de carácter consultivo. |

➡️ Consulta el **[Roadmap](ROADMAP.md)** completo para ver qué ya está disponible y qué está previsto (adaptadores de fiabilidad, reanudar desde un paso, reparación con IA, sincronización de equipos).

---

## 🆚 WebLoop frente al RPA pesado

| | WebLoop | RPA tradicional |
| :--- | :--- | :--- |
| **Huella** | Extensión de Chrome | Instalación de escritorio / VM |
| **Curva de aprendizaje** | Grabar haciendo clic | Formación y certificación |
| **Coste** | Gratis y de código abierto (MIT) | Licencias costosas |
| **Privacidad** | Prioridad local, acceso por sitio | A menudo en la nube / acceso amplio |
| **Compatibilidad web** | Diseñado para el caótico DOM empresarial | Frágil en aplicaciones web |
| **IA** | Opcional, núcleo determinista | Añadida a posteriori |

---

## 📖 Cómo funciona

1. **Graba** — abre la página de destino, pulsa *Iniciar grabación* en el panel lateral y realiza la tarea una vez.
2. **Refina** — añade esperas, convierte las fechas en variables y deja que la auditoría del flujo señale los puntos débiles.
3. **Prueba** — ejecútalo una vez (o desde cualquier paso) y revisa los registros paso a paso.
4. **Programa y relájate** — elige *Diario / Días laborables / Intervalo*; WebLoop se ejecuta en segundo plano y te avisa.

Guía completa: **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

---

## 🛠 Instalación

El panel lateral de WebLoop es una aplicación React + TypeScript construida con Vite. Compílala una vez y luego carga la carpeta `dist/` generada.

```bash
npm install
npm run build      # type-checks, builds the side panel, assembles dist/
```

1. Abre `chrome://extensions/`
2. Activa el **Modo de desarrollador**
3. **Cargar descomprimida** → selecciona la carpeta **`dist/`** generada

> El núcleo determinista (`service_worker.js`, `content_script.js`) es JavaScript puro, copiado en `dist/` **tal cual** — solo se empaqueta la interfaz.

### 🧑‍💻 Desarrollo

```bash
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build → dist/
npm run package    # build + zip a store-ready archive
```

---

## 🔐 Permisos y privacidad

WebLoop tiene **prioridad local** y nunca solicita un acceso amplio del tipo *"leer
todos tus datos"*. Pide permiso para **un sitio cada vez**, solo cuando grabas o
ejecutas algo allí, y cada concesión es revocable desde la pestaña **Permisos** de
la aplicación. Cada permiso básico se explica línea a línea en
**[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**.

---

## 🧱 Tecnología & arquitectura

- **Panel lateral:** React 18 + TypeScript, empaquetado con Vite.
- **Núcleo de automatización:** service worker + content script de Chrome **Manifest V3** en JS puro y con pocas dependencias, copiado en `dist/` sin cambios para facilitar su auditoría.
- **Almacenamiento:** `chrome.storage.local` — sin backend, sin telemetría.

Detalles: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Cómo contribuir: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## ❓ Preguntas frecuentes (también para búsqueda con IA / GEO)

**¿Qué es WebLoop?**
WebLoop es una extensión de Chrome de **automatización de navegador sin código**,
gratuita y de código abierto, que graba y reproduce flujos de trabajo web
repetitivos — rellenar formularios, filtrar, hacer clic, descargar archivos, tomar
capturas y enviar notificaciones — como una alternativa de **RPA ligera y con
prioridad local** para aplicaciones web empresariales y heredadas.

**¿Necesita una API o un LLM?**
No. El bucle principal de grabar y reproducir es totalmente determinista y se
ejecuta localmente sin ninguna API ni LLM. La asistencia con IA es opcional y solo
de carácter consultivo.

**¿Se envían mis datos a algún sitio?**
De forma predeterminada, nada sale de tu navegador. Solo si activas explícitamente
el asistente de IA opcional se envía un fragmento depurado al proveedor que *tú*
configures.

**¿En qué se diferencia de UiPath / Power Automate / Automa / Bardeen?**
WebLoop es deliberadamente pequeño y enfocado: prioridad local, determinista, con
permisos por sitio y una observabilidad de primer nivel para las caóticas páginas
empresariales — no es un IDE completo de RPA.

**¿En qué sitios funciona?**
En cualquier página `http(s)` que autorices — sistemas ERP/OA/CRM, intranets,
portales de informes y otras aplicaciones web sin una API utilizable.

---

## 🔍 Palabras clave

automatización de navegador sin código · grabador de flujos de trabajo de Chrome ·
extensión RPA ligera · herramienta de automatización web · automatización de
rellenado de formularios · automatización programada del navegador ·
automatización de descargas Excel/CSV/PDF · automatización de intranet y ERP ·
automatización de aplicaciones web heredadas · agente de navegador con prioridad
local · grabar y reproducir tareas del navegador.

---

## 📄 Licencia

[MIT](LICENSE) — creado para el operador moderno. Impulsado por la simplicidad.
