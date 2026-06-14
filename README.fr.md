<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop — enregistrez une fois, automatisez pour toujours. Automatisation de navigateur sans code et priorité au local." width="100%" />

# WebLoop — Automatisation de navigateur sans code et priorité au local

**Enregistrez une fois un flux de travail répétitif dans le navigateur. Rejouez-le ou planifiez-le pour toujours.**
L'alternative légère au RPA lourd pour les ERP hérités, les CRM, les systèmes OA, les intranets et les portails de reporting — sans code, sans cloud, sans LLM requis.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-technologie-et-architecture)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · **Français** · [Deutsch](./README.de.md) · [Português](./README.pt-BR.md) · [Русский](./README.ru.md)

</div>

---

## 😩 Le problème

La plupart des logiciels métiers internes — ERP, CRM, OA, intranets, portails de
reporting — **n'ont pas d'API**. Ce sont donc les humains qui deviennent l'API :
chaque matin, quelqu'un ouvre la même page, sélectionne la date de la veille,
applique les mêmes filtres, clique sur *Rechercher*, attend qu'un tableau lent
s'affiche, clique sur *Exporter* et envoie le fichier par e-mail. Tous. Les. Jours.

Les suites RPA lourdes (UiPath, Power Automate) sont coûteuses, nécessitent une
formation et exigent une installation sur le poste de travail. Les purs « agents
IA » hallucinent et ne sont pas déterministes. Les enregistreurs cloud qui exigent
de *« lire toutes vos données »* sont rejetés par la sécurité informatique.

## 💡 La solution

> **WebLoop traite le DOM du navigateur comme l'API.** Si vous pouvez cliquer dessus, vous pouvez l'automatiser.

Une extension Chrome légère qui **enregistre vos vrais clics une seule fois** et
les rejoue de manière déterministe — à la demande ou selon une planification —
entièrement **sur votre machine**.

<div align="center">
<img src="docs/assets/screens.svg" alt="Panneau latéral de WebLoop : enregistrement d'un flux de travail avec ses étapes, et le panneau des autorisations par site." width="100%" />
<sub><i>Interface illustrative du panneau latéral de WebLoop (enregistrement d'un flux et panneau des autorisations par site).</i></sub>
</div>

---

## ✨ Fonctionnalités (disponibles dès aujourd'hui)

| | Fonctionnalité | Ce qu'elle fait |
| :-- | :--- | :--- |
| ✅ | **Enregistrement sans code** | Capture les clics, les saisies, les sélections, les survols, les double-clics, les cases à cocher et les téléchargements. |
| ✅ | **Relecture déterministe** | Éléments à localisateurs multiples (CSS, XPath, texte stable, aria-label) + score de confiance — pas d'agents qui hallucinent. |
| ✅ | **Variables de date dynamiques** | `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{date:-7}}` — les rapports interrogent toujours la bonne période. |
| ✅ | **Étapes de fiabilité** | Attente d'un texte / d'un élément / de la stabilité de la page ; nettoyage automatique du flux ; audit statique du flux qui signale les pièges courants. |
| ✅ | **Planification** | Manuelle, quotidienne, jours ouvrés ou toutes les N minutes. |
| ✅ | **Captures d'écran et notifications** | En cas de succès, d'échec ou lorsqu'une intervention humaine est requise (2FA / CAPTCHA / approbation). |
| ✅ | **Priorité au local et confidentiel** | Les tâches, les journaux et les paramètres restent dans votre navigateur. Sauvegarde/restauration au format JSON. |
| ✅ | **Panneau d'autorisations par site** | Consultez, accordez et révoquez l'accès aux hôtes un site à la fois. |
| ✅ | **IA optionnelle** | Connectez OpenAI / Anthropic / Gemini / DeepSeek / Ollama / Groq — désactivée par défaut, à titre consultatif uniquement. |

➡️ Consultez la **[feuille de route](ROADMAP.md)** complète pour voir ce qui est livré et ce qui est prévu (adaptateurs de fiabilité, reprise à partir d'une étape, réparation par IA, synchronisation d'équipe).

---

## 🆚 WebLoop face au RPA lourd

| | WebLoop | RPA traditionnel |
| :--- | :--- | :--- |
| **Empreinte** | Extension Chrome | Installation sur poste / VM |
| **Courbe d'apprentissage** | Enregistrer en cliquant | Formation et certification |
| **Coût** | Gratuit et open source (MIT) | Licences coûteuses |
| **Confidentialité** | Priorité au local, accès par site | Souvent cloud / accès étendu |
| **Compatibilité web** | Conçu pour le DOM d'entreprise désordonné | Fragile sur les applications web |
| **IA** | Optionnelle, cœur déterministe | Greffée par-dessus |

---

## 📖 Comment ça marche

1. **Enregistrez** — ouvrez votre page cible, cliquez sur *Démarrer l'enregistrement* dans le panneau latéral et effectuez la tâche une fois.
2. **Affinez** — ajoutez des attentes, transformez les dates en variables et laissez l'audit du flux signaler les points faibles.
3. **Testez** — exécutez-le une fois (ou à partir de n'importe quelle étape) et lisez les journaux étape par étape.
4. **Planifiez et détendez-vous** — choisissez *Quotidien / Jours ouvrés / Intervalle* ; WebLoop s'exécute en arrière-plan et vous prévient.

Tutoriel complet : **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

---

## 🛠 Installation

Le panneau latéral de WebLoop est une application React + TypeScript construite avec Vite. Compilez une fois, puis chargez le dossier `dist/` généré.

```bash
npm install
npm run build      # type-checks, builds the side panel, assembles dist/
```

1. Ouvrez `chrome://extensions/`
2. Activez le **Mode développeur**
3. **Charger l'extension non empaquetée** → sélectionnez le dossier **`dist/`** généré

> Le cœur déterministe (`service_worker.js`, `content_script.js`) est du JavaScript pur, copié dans `dist/` **tel quel** — seule l'interface est empaquetée.

### 🧑‍💻 Développement

```bash
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build → dist/
npm run package    # build + zip a store-ready archive
```

---

## 🔐 Autorisations et confidentialité

WebLoop donne la **priorité au local** et ne demande jamais d'accès étendu du
type *« lire toutes vos données »*. Il demande l'accès **un site à la fois**,
uniquement lorsque vous y enregistrez ou exécutez quelque chose, et chaque
autorisation est révocable depuis l'onglet **Autorisations** de l'application.
Chaque autorisation de base est expliquée ligne par ligne dans
**[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**.

---

## 🧱 Technologie et architecture

- **Panneau latéral :** React 18 + TypeScript, empaqueté avec Vite.
- **Cœur d'automatisation :** un service worker + content script Chrome **Manifest V3** en JavaScript pur et à faibles dépendances, copié dans `dist/` sans modification pour faciliter l'audit.
- **Stockage :** `chrome.storage.local` — pas de backend, pas de télémétrie.

Détails : **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Contribuer : **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## ❓ FAQ (également pour la recherche IA / GEO)

**Qu'est-ce que WebLoop ?**
WebLoop est une extension Chrome gratuite et open source d'**automatisation de
navigateur sans code** qui enregistre et rejoue des flux de travail web répétitifs
— remplissage de formulaires, filtrage, clics, téléchargements de fichiers,
captures d'écran et notifications — en tant qu'alternative **RPA légère et avec
priorité au local** pour les applications web d'entreprise et héritées.

**A-t-elle besoin d'une API ou d'un LLM ?**
Non. La boucle principale d'enregistrement et de relecture est entièrement
déterministe et s'exécute localement sans aucune API ni LLM. L'assistance par IA
est optionnelle et à titre consultatif uniquement.

**Mes données sont-elles envoyées quelque part ?**
Par défaut, rien ne quitte votre navigateur. Ce n'est que si vous activez
explicitement l'assistant IA optionnel qu'un extrait nettoyé est envoyé au
fournisseur que *vous* configurez.

**En quoi est-elle différente d'UiPath / Power Automate / Automa / Bardeen ?**
WebLoop est volontairement petit et ciblé : priorité au local, déterministe, avec
des autorisations par site et une observabilité de premier ordre pour les pages
d'entreprise désordonnées — ce n'est pas un IDE RPA complet.

**Sur quels sites fonctionne-t-elle ?**
Sur toute page `http(s)` que vous autorisez — systèmes ERP/OA/CRM, intranets,
portails de reporting et autres applications web sans API exploitable.

---

## 🔍 Mots-clés

automatisation de navigateur sans code · enregistreur de flux de travail Chrome · extension RPA légère
· outil d'automatisation web · automatisation du remplissage de formulaires · automatisation planifiée du navigateur ·
automatisation des téléchargements Excel/CSV/PDF · automatisation d'intranet et d'ERP · automatisation d'applications web héritées
· agent de navigateur avec priorité au local · enregistrer et rejouer des tâches du navigateur.

---

## 📄 Licence

[MIT](LICENSE) — conçu pour l'opérateur moderne. Propulsé par la simplicité.
