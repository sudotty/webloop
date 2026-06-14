<div align="center">

<img src="docs/assets/hero.svg" alt="WebLoop — grave uma vez, automatize para sempre. Automação de navegador sem código, local e sem nuvem." width="100%" />

# WebLoop — Automação de Navegador Sem Código, Local e Sem Nuvem

**Grave um fluxo de trabalho repetitivo do navegador uma vez. Reproduza ou agende para sempre.**
A alternativa enxuta ao RPA pesado para ERPs legados, CRMs, sistemas OA, intranets e portais de relatórios — sem código, sem nuvem, sem necessidade de LLM.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.0-success.svg)](CHANGELOG.md)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)
[![Built with React + TS](https://img.shields.io/badge/built%20with-React%20%2B%20TypeScript-3178C6.svg)](#-tecnologia--arquitetura)
[![Local-first](https://img.shields.io/badge/privacy-local--first-07824a.svg)](docs/PERMISSIONS.md)
[![Roadmap](https://img.shields.io/badge/status-active%20roadmap-orange.svg)](ROADMAP.md)

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md) · [Español](./README.es.md) · [Français](./README.fr.md) · [Deutsch](./README.de.md) · **Português** · [Русский](./README.ru.md)

</div>

---

## 😩 O problema

A maioria dos softwares corporativos internos — ERPs, CRMs, OA, intranets, portais de relatórios —
**não tem API**. Então as pessoas viram a API: toda manhã alguém abre a mesma
página, seleciona a data de ontem, aplica os mesmos filtros, clica em *Consultar*, espera por
uma tabela lenta, clica em *Exportar* e envia o arquivo por e-mail. Todo. Santo. Dia.

Suítes de RPA pesadas (UiPath, Power Automate) são caras, exigem treinamento e querem uma
instalação no desktop. "Agentes de IA" puros alucinam e não são determinísticos. Gravadores
em nuvem que exigem *"ler todos os seus dados"* são rejeitados pela InfoSec.

## 💡 A solução

> **O WebLoop trata o DOM do navegador como a API.** Se você consegue clicar, consegue automatizar.

Uma extensão leve para o Chrome que **grava seus cliques reais uma vez** e os reproduz
de forma determinística — sob demanda ou agendada — inteiramente **na sua máquina**.

<div align="center">
<img src="docs/assets/screens.svg" alt="Painel lateral do WebLoop: gravando um fluxo de trabalho com etapas e o painel de permissões por site." width="100%" />
<sub><i>Interface ilustrativa do painel lateral do WebLoop (gravando um fluxo e o painel de permissões por site).</i></sub>
</div>

---

## ✨ Recursos (disponíveis hoje)

| | Recurso | O que faz |
| :-- | :--- | :--- |
| ✅ | **Gravação sem código** | Captura cliques, entradas, seleções, hovers, cliques duplos, caixas de seleção e downloads. |
| ✅ | **Reprodução determinística** | Elementos com múltiplos localizadores (CSS, XPath, texto estável, aria-label) + pontuação de confiança — sem agentes que alucinam. |
| ✅ | **Variáveis de data dinâmicas** | `{{today}}`, `{{yesterday}}`, `{{month_start}}`, `{{date:-7}}` — os relatórios sempre consultam o período certo. |
| ✅ | **Etapas de confiabilidade** | Aguardar por texto / elemento / página estável; limpeza automática do fluxo; auditoria estática do fluxo que sinaliza armadilhas comuns. |
| ✅ | **Agendamento** | Manual, diário, dias úteis ou a cada N minutos. |
| ✅ | **Capturas de tela e notificações** | Em caso de sucesso, falha ou quando é necessária intervenção humana (2FA / CAPTCHA / aprovação). |
| ✅ | **Local e privado** | Tarefas, logs e configurações permanecem no seu navegador. Backup/restauração em JSON. |
| ✅ | **Painel de permissões por site** | Veja, conceda e revogue o acesso a hosts um site por vez. |
| ✅ | **IA opcional** | Conecte OpenAI / Anthropic / Gemini / DeepSeek / Ollama / Groq — desativada por padrão, apenas consultiva. |

➡️ Veja o **[Roadmap](ROADMAP.md)** completo para saber o que já foi entregue e o que está planejado (adaptadores de confiabilidade, retomada a partir da etapa, reparo por IA, sincronização de equipe).

---

## 🆚 WebLoop vs. RPA pesado

| | WebLoop | RPA tradicional |
| :--- | :--- | :--- |
| **Footprint** | Extensão do Chrome | Instalação no desktop / VM |
| **Curva de aprendizado** | Gravar clicando | Treinamento e certificação |
| **Custo** | Gratuito e de código aberto (MIT) | Licenciamento caro |
| **Privacidade** | Local, acesso por site | Frequentemente nuvem / acesso amplo |
| **Compatibilidade web** | Feito para o DOM corporativo bagunçado | Frágil em aplicações web |
| **IA** | Opcional, núcleo determinístico | Acoplada por cima |

---

## 📖 Como funciona

1. **Gravar** — abra a página de destino, clique em *Iniciar gravação* no painel lateral e execute a tarefa uma vez.
2. **Refinar** — adicione esperas, transforme datas em variáveis e deixe a auditoria do fluxo sinalizar pontos fracos.
3. **Testar** — execute uma vez (ou a partir de qualquer etapa) e leia os logs de cada etapa.
4. **Agendar e relaxar** — escolha *Diário / Dias úteis / Intervalo*; o WebLoop roda em segundo plano e notifica você.

Tutorial completo: **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)**.

---

## 🛠 Instalação

O painel lateral do WebLoop é um app React + TypeScript construído com Vite. Compile uma vez e depois carregue a pasta `dist/` gerada.

```bash
npm install
npm run build      # type-checks, builds the side panel, assembles dist/
```

1. Abra `chrome://extensions/`
2. Ative o **Modo de desenvolvedor**
3. **Carregar sem compactação** → selecione a pasta **`dist/`** gerada

> O núcleo determinístico (`service_worker.js`, `content_script.js`) é JavaScript puro, copiado para `dist/` **literalmente** — apenas a interface é empacotada.

### 🧑‍💻 Desenvolvimento

```bash
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build → dist/
npm run package    # build + zip a store-ready archive
```

---

## 🔐 Permissões e privacidade

O WebLoop é **local** e nunca solicita acesso amplo do tipo *"ler todos os seus dados"*.
Ele pede **um site por vez**, apenas quando você grava ou executa ali, e cada
concessão é revogável na aba **Permissões** dentro do app. Cada permissão de base
é explicada linha por linha em **[docs/PERMISSIONS.md](docs/PERMISSIONS.md)**.

---

## 🧱 Tecnologia e arquitetura

- **Painel lateral:** React 18 + TypeScript, empacotado pelo Vite.
- **Núcleo de automação:** service worker + content script de **Manifest V3** do Chrome, em JS puro e com poucas dependências, copiado para `dist/` sem alterações para fins de auditoria.
- **Armazenamento:** `chrome.storage.local` — sem backend, sem telemetria.

Detalhes: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Como contribuir: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## ❓ FAQ (também para busca por IA / GEO)

**O que é o WebLoop?**
O WebLoop é uma extensão do Chrome de **automação de navegador sem código**, gratuita e de código aberto,
que grava e reproduz fluxos de trabalho repetitivos da web — preenchimento de formulários, filtragem,
cliques, downloads de arquivos, capturas de tela e notificações — como uma alternativa de **RPA leve e
local** para aplicações web corporativas e legadas.

**Precisa de uma API ou de um LLM?**
Não. O ciclo central de gravar e reproduzir é totalmente determinístico e roda localmente
sem qualquer API ou LLM. A assistência de IA é opcional e apenas consultiva.

**Meus dados são enviados para algum lugar?**
Por padrão, nada sai do seu navegador. Somente se você ativar explicitamente o
assistente de IA opcional é que um trecho higienizado é enviado ao provedor que *você* configurar.

**Em que ele difere de UiPath / Power Automate / Automa / Bardeen?**
O WebLoop é intencionalmente pequeno e focado: local, determinístico, com
permissões por site e observabilidade de primeira classe para páginas corporativas bagunçadas —
não é uma IDE completa de RPA.

**Em quais sites ele funciona?**
Em qualquer página `http(s)` que você autorize — sistemas ERP/OA/CRM, intranets, portais de
relatórios e outras aplicações web sem uma API utilizável.

---

## 🔍 Palavras-chave

automação de navegador sem código · gravador de fluxos de trabalho do Chrome · extensão de RPA leve
· ferramenta de automação web · automação de preenchimento de formulários · automação agendada de navegador ·
automação de download de Excel/CSV/PDF · automação de intranet e ERP · automação de aplicações web
legadas · agente de navegador local · gravar e reproduzir tarefas do navegador.

---

## 📄 Licença

[MIT](LICENSE) — feito para o operador moderno. Movido pela simplicidade.
