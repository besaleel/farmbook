# BACKLOG — FARM BOOK

Lista de atividades derivada de [ESPECIFICACAO.md](ESPECIFICACAO.md).

**Legenda:** `[ ]` pendente · `[x]` concluído · `[~]` em andamento · 🔒 bloqueado

---

## Fase 0 — Fundação

- [x] **0.1** Repositório git inicializado com `.gitignore` protegendo
      `node_modules/`, `APK/www/`, `local.properties`, `keystore.properties`,
      `*.jks` e `DEPLOY/*.aab`
- [x] **0.2** Projeto criado em `APK/` — **Ionic 8 + Angular 20**
- [x] **0.3** Capacitor 8 + plataforma Android; `appId=com.farmbook.app`,
      `appName=Farm Book`
- [x] **0.4** Orientação travada em **retrato** (`android:screenOrientation`
      no `AndroidManifest.xml`)
- [x] **0.5** Build validado: `npm run build` + `npx cap sync` + `gradlew
      assembleDebug` → **app-debug.apk, 7,16 MB**
- [x] **0.6** APK instalado e aberto em aparelho real — validado pelo usuário

## Fase 1 — Pipeline de assets

- [x] **1.1** `APK/tools/build-assets.mjs` (`npm run assets`) — converte
      `PROJECT/assets/` → `APK/src/assets/` com sharp, WebP q85
- [x] **1.2** 6 animais em WebP 512×768 — **transparência conferida**
      (alpha 0–255, 63–71% de pixels transparentes), 346 KB no total
- [x] **1.3** 6 backgrounds em WebP 1080×1620 — 1.246 KB no total. Os `.svg`
      são ignorados pelo pipeline (ESPECIFICACAO § 3.1)
- [x] **1.4** `APK/tools/build-icons.mjs` (`npm run icons`) — ícones Android
      nas 5 densidades + foreground adaptativo (safe zone 66%) +
      `DEPLOY/store-assets/icon-512.png` sem alpha
- [x] **1.5** Peso conferido: **1,75 MB** de assets embarcados
      (meta era < 20 MB); APK debug completo com 7,16 MB
- [ ] **1.10** *(opcional, Fase 7)* Reduzir os ~398 KB de ícones SVG que o
      Ionic embarca por padrão, mantendo só os efetivamente usados
- [x] **1.6** ~~Placeholders silenciosos~~ — desnecessário: os sons dos animais
      foram entregues
- [x] **1.7** Processar os sons dos animais: cortar cavalo/galinha/gatinha em
      ponto de silêncio com fade-out, normalizar volume e reduzir para mono
      96 kbps → `PROJECT/assets/sounds/` (590 KB → 143 KB, todos ≤ 3 s).
      Comando de referência (ffmpeg), caso novos sons sejam entregues:
      ```
      ffmpeg -i <origem> [-t <corte>] \
        -af "loudnorm=I=-16:TP=-1.5:LRA=11[,afade=t=out:st=<corte-0.15>:d=0.15]" \
        -ac 1 -ar 44100 -b:a 96k <destino>
      ```
- [x] **1.8** Sons copiados para `APK/src/assets/sounds/` — automatizado
      dentro de `npm run assets` (144 KB)
- [ ] 🔒 **1.9** Adicionar a música de fundo — *pendente de entrega do cliente*

## Fase 2 — Núcleo do app

- [ ] **2.1** `AnimalService`: catálogo dos 6 animais (id, imagem, som,
      posição %, `object-position` do rosto para o círculo da faixa)
- [ ] **2.2** `SettingsService` com Capacitor Preferences (nome, idioma, som,
      música, background, `remove_ads`)
- [ ] **2.3** Configurar `@ngx-translate` + carregamento de JSON local
- [ ] **2.4** Traduções dos 6 idiomas (PT, EN, ES, FR, IT, DE) — textos de UI
- [ ] **2.5** Nomes dos animais **silabados por idioma** (ex.: PT `VA-CA`,
      EN `COW`, ES `VA-CA`, FR `VA-CHE`, IT `MUC-CA`, DE `KUH`)
- [ ] **2.6** Detectar idioma do aparelho no primeiro uso (fallback: EN)

## Fase 3 — Tela inicial

- [ ] **3.1** Layout: logo, boas-vindas, botão "Começar" grande
- [ ] **3.2** Campo de nome da criança (persistido, opcional)
- [ ] **3.3** Seletor de idioma com bandeiras, troca imediata
- [ ] **3.4** Botão de música de fundo (liga/desliga, persistido)
- [ ] **3.5** Navegação para a tela principal

## Fase 4 — Tela principal (celeiro)

- [ ] **4.1** Palco responsivo mantendo a proporção do background
- [ ] **4.2** Posicionar os 6 animais em percentuais, sem sobreposição de
      áreas de toque
- [ ] **4.3** Barra superior: avatar + nome (esquerda); idioma, background,
      som (direita)
- [ ] **4.4** Seletor de background (5 opções, 6 após 4B.10; sempre todas
      disponíveis em qualquer idioma e época,
      persistido; marca `backgroundEscolhidoManualmente = true`)
- [ ] **4.5** Área reservada do banner no rodapé (recolhe se não houver anúncio)
- [ ] **4.6** Botão "Remover Anúncio" acima do banner
- [ ] **4.7** Animação **idle** por CSS (respiração/balanço, defasada por animal)
- [ ] **4.8** Animação de **reação ao toque** (~600 ms, squash & stretch)
- [ ] **4.9** Respeitar `prefers-reduced-motion`

## Fase 4B — Backgrounds sazonais automáticos

Regras completas em [ESPECIFICACAO.md § 4.4](ESPECIFICACAO.md). Depende de
2.2 (`SettingsService`) e 4.4 (seletor manual).

- [ ] **4B.1** Adicionar `backgroundEscolhidoManualmente` (booleano) ao
      `SettingsService`
- [ ] **4B.2** `SeasonalService.domingoDePascoa(ano)` — computus gregoriano
      (Meeus/Jones/Butcher), offline
- [ ] **4B.3** `SeasonalService.thanksgiving(ano)` — 4ª quinta-feira de novembro
- [ ] **4B.4** `temaDaData(data, idioma)`: aplica as 5 janelas (Páscoa −7/+1;
      **Festa Junina 01–30/06**; Halloween 24–31/10; Thanksgiving −7/+0;
      Natal 01–31/12), retornando `standard` fora de época e resolvendo
      sobreposição pela janela mais curta
- [ ] **4B.5** Restringir por idioma os temas culturais: **Thanksgiving só em
      EN**, **Festa Junina só em PT**. Nos demais idiomas seguem disponíveis
      apenas na troca manual
- [ ] **4B.6** Aplicar na abertura do app e ao retornar do segundo plano,
      **somente** se `backgroundEscolhidoManualmente == false`
- [ ] **4B.7** Testes unitários das datas: validar Páscoa 2024–2032
      (31/03, 20/04, 05/04, 28/03, 16/04, 01/04, 21/04, 13/04, 28/03) e
      Thanksgiving 2024–2028 (28/11, 27/11, 26/11, 25/11, 23/11)
- [ ] **4B.8** Testar bordas: primeiro e último dia de cada janela, virada de
      ano (31/12 → 01/01) e ano bissexto
- [ ] **4B.9** Verificação manual com a data do aparelho alterada, confirmando
      que a escolha manual nunca é sobrescrita
- [x] **4B.10** ~~Criar o asset da Festa Junina~~ — **entregue** como
      `background-festejunina.png` (1024×1536 RGB). Sem `.svg`, o que é
      suficiente (ver ESPECIFICACAO § 3.1). A janela de junho está desbloqueada
- [ ] **4B.11** Garantir o recuo seguro: tema cujo asset não exista é ignorado,
      caindo em `background-standard` sem erro (proteção para temas futuros)
- [ ] **4B.12** Incluir o novo background no seletor manual (passa de 5 para 6
      opções), usando a chave exata **`festejunina`** (sem hífen)

## Fase 5 — Faixa do nome e áudio

- [ ] **5.1** Componente da faixa: fundo branco sólido, círculo com o rosto do
      animal à esquerda, nome silabado em caixa alta
- [ ] **5.2** Posicionar imediatamente acima do banner, sem sobreposição
- [ ] **5.3** Fade in / fade out
- [ ] **5.4** Timer de 3 s, reiniciado ao tocar outro animal
- [ ] **5.5** `AudioService`: pré-carregar sons, tocar um por vez
- [ ] **5.6** Música de fundo em loop, volume suave, com *ducking* durante o
      som do animal
- [ ] **5.7** Pausar áudio quando o app vai a segundo plano
- [x] **5.8** ~~Sons definitivos dos animais~~ — **entregues e processados**
      (ver 1.7); nenhum corte em tempo de reprodução é necessário, pois todos
      já cabem nos 3 s da faixa
- [ ] 🔒 **5.9** Adicionar **música de fundo** sem direitos autorais
      — *pendente de entrega do cliente*
- [ ] **5.10** Validar em aparelho real que o som termina antes ou junto com o
      fim da faixa de 3 s (maior som: galinha, 2,99 s)

## Fase 6 — Monetização

- [ ] **6.1** Integrar plugin AdMob no Capacitor
- [ ] **6.2** Banner **Nativo Avançado** no rodapé (IDs de **teste** no dev)
- [ ] **6.3** Tratar ausência de rede: recolher o banner sem quebrar o layout
- [ ] **6.4** Integrar Google Play Billing
- [ ] **6.5** Fluxo de compra do produto `remove_ads`
- [ ] **6.6** Exibir preço **vindo do Google Play** (nunca fixo no código)
- [ ] **6.7** Remover banner e botão após a compra (estado persistido)
- [ ] **6.8** **Restaurar compra** (obrigatório para reinstalação)
- [ ] **6.9** Barreira parental antes da tela de pagamento
- [ ] **6.10** Trocar para os IDs de **produção** — *somente no release final*

## Fase 7 — Publicação

- [ ] **7.1** Termo de Uso em HTML → `DEPLOY/termos-de-uso.html`
- [ ] **7.2** Política de Privacidade em HTML → `DEPLOY/politica-privacidade.html`
      (deve declarar: nome fica só no aparelho; uso do AdMob)
- [ ] **7.3** Hospedar ambos em URL pública (exigido pela Play Console)
- [ ] **7.4** Criar o keystore de release e guardá-lo com segurança
- [ ] **7.5** Definir `versionCode` / `versionName` iniciais
- [ ] **7.6** Ícone 512×512 → `DEPLOY/store-assets/icon-512.png`
- [ ] **7.7** Feature graphic 1024×500 + screenshots
- [ ] **7.8** Descrições da loja nos 6 idiomas
- [ ] **7.9** Questionário **Designed for Families** e Segurança de Dados
- [ ] **7.10** Gerar o AAB seguindo [GERAR-AAB.md](GERAR-AAB.md)
- [ ] **7.11** Publicar em teste interno e validar em aparelho real

## Fase 8 — Melhorias (pós-lançamento)

- [ ] **8.1** Rig + animação dos `.glb` no Blender (MCP habilitado)
- [ ] **8.2** Renderizar sprite sheets (piscar, mexer orelha, levantar cabeça)
      e substituir o PNG estático — sem mudar a arquitetura do app
- [ ] **8.3** Mais animais
- [ ] **8.4** Avaliar versão iOS
- [ ] **8.5** Novos temas sazonais — a arquitetura da Fase 4B aceita novos temas
      apenas somando uma janela. Candidato já estudado: **Carnaval** (terça,
      47 dias antes da Páscoa; cálculo validado para 2024–2028 na
      ESPECIFICACAO § 4.4). Precisa apenas do asset.

---

## Pendências do cliente

| Item | Bloqueia | Situação |
|------|----------|----------|
| ~~Efeitos sonoros dos 6 animais~~ | 5.8 | ✅ **Entregue** (processado em 1.7) |
| ~~Asset da Festa Junina~~ | 4B.10 | ✅ **Entregue** (`background-festejunina.png`) |
| Música de fundo sem direitos autorais | 5.9 | A definir |
| Conta Google Play Console ativa | 7.11 | A confirmar |
| URL pública para termos/política | 7.3 | A definir |

> Com os sons entregues, a Fase 5 deixou de ter bloqueio — só a música de fundo
> segue pendente, e ela é independente dos sons dos animais. A Fase 4B pode ser
> implementada e testada por inteiro antes do asset da Festa Junina existir,
> graças ao recuo seguro de 4B.11.

## Ordem sugerida

`0 → 1 → 2 → 3 → 4 → 4B → 5 → 6 → 7`

Fase 6 pode correr em paralelo à 5. A Fase 7 começa cedo nos itens de
documento (7.1–7.3), que não dependem de código. A Fase 4B é pequena e
autocontida — pode ser feita a qualquer momento após 4.4.
