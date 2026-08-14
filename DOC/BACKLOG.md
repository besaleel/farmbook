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
- [x] **1.11** Origem única de logo/ícones: **tudo derivado de
      `PROJECT/assets/logo.png`** via `npm run icons` — ícone Android (5
      densidades), favicon do WebView, apple-touch-icon, splash e ícone 512
      da loja. Substituído o favicon genérico do Ionic; `<title>` corrigido
      de "Ionic App" para "Farm Book".
      **`farmbook.ico` não é embarcado** — o formato `.ico` não é suportado
      pelo Android (ver ESPECIFICACAO § 3.2.1)
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
- [x] **1.9** Música de fundo adicionada e processada — 59,4 s em loop.
      Normalizada (RMS −42,8 → −26,4 dB: no volume original seria inaudível
      a 25%), mono 96 kbps: 1.856 → 696 KB

## Fase 2 — Núcleo do app

- [x] **2.1** `AnimalService` — catálogo dos 6 animais com posição em %,
      calibração do rosto (medida por animal) e tempos de idle defasados
- [x] **2.2** `SettingsService` com Capacitor Preferences + signals, incluindo
      `backgroundManual`
- [x] **2.3** `@ngx-translate` **v18** (`provideTranslateService` +
      `provideTranslateHttpLoader`), JSON local
- [x] **2.4** Traduções dos 6 idiomas — 38 chaves idênticas em todos (validado)
- [x] **2.5** Nomes silabados por idioma. Monossílabos (EN `COW`, DE `KUH`)
      ficam **sem hífen** — separá-los seria incorreto
- [x] **2.6** Idioma do aparelho no primeiro uso, com recuo para EN

## Fase 3 — Tela inicial

- [x] **3.1** Layout: logo, boas-vindas, botão "Começar" grande
- [x] **3.2** Campo de nome da criança (persistido, opcional)
- [x] **3.3** Seletor de idioma com bandeiras, troca imediata
- [x] **3.4** Botão de música de fundo (liga/desliga, persistido)
- [x] **3.5** Navegação para a tela principal

## Fase 4 — Tela principal (celeiro)

- [x] **4.1** Palco responsivo mantendo a proporção do background
- [x] **4.2** Posicionar os 6 animais em percentuais, sem sobreposição de
      áreas de toque
- [x] **4.3** Barra superior: avatar + nome (esquerda); idioma, background,
      som (direita)
- [x] **4.4** Seletor de background (5 opções, 6 após 4B.10; sempre todas
      disponíveis em qualquer idioma e época,
      persistido; marca `backgroundEscolhidoManualmente = true`)
- [x] **4.5** Área reservada do banner no rodapé (recolhe se não houver anúncio)
- [x] **4.6** Botão "Remover Anúncio" acima do banner
- [x] **4.7** Animação **idle** por CSS (respiração/balanço, defasada por animal)
- [x] **4.8** Animação de **reação ao toque** (~600 ms, squash & stretch)
- [x] **4.9** Respeitar `prefers-reduced-motion`

## Fase 4B — Backgrounds sazonais automáticos

Regras completas em [ESPECIFICACAO.md § 4.4](ESPECIFICACAO.md). Depende de
2.2 (`SettingsService`) e 4.4 (seletor manual).

- [x] **4B.1** Adicionar `backgroundEscolhidoManualmente` (booleano) ao
      `SettingsService`
- [x] **4B.2** `SeasonalService.domingoDePascoa(ano)` — computus gregoriano
      (Meeus/Jones/Butcher), offline
- [x] **4B.3** `SeasonalService.thanksgiving(ano)` — 4ª quinta-feira de novembro
- [x] **4B.4** `temaDaData(data, idioma)`: aplica as 5 janelas (Páscoa −7/+1;
      **Festa Junina 01–30/06**; Halloween 24–31/10; Thanksgiving −7/+0;
      Natal 01–31/12), retornando `standard` fora de época e resolvendo
      sobreposição pela janela mais curta
- [x] **4B.5** Restringir por idioma os temas culturais: **Thanksgiving só em
      EN**, **Festa Junina só em PT**. Nos demais idiomas seguem disponíveis
      apenas na troca manual
- [x] **4B.6** Aplicar na abertura do app e ao retornar do segundo plano,
      **somente** se `backgroundEscolhidoManualmente == false`
- [x] **4B.7** Testes unitários das datas: validar Páscoa 2024–2032
      (31/03, 20/04, 05/04, 28/03, 16/04, 01/04, 21/04, 13/04, 28/03) e
      Thanksgiving 2024–2028 (28/11, 27/11, 26/11, 25/11, 23/11)
- [x] **4B.8** Testar bordas: primeiro e último dia de cada janela, virada de
      ano (31/12 → 01/01) e ano bissexto
- [ ] **4B.9** Verificação manual com a data do aparelho alterada, confirmando
      que a escolha manual nunca é sobrescrita
- [x] **4B.10** ~~Criar o asset da Festa Junina~~ — **entregue** como
      `background-festejunina.png` (1024×1536 RGB). Sem `.svg`, o que é
      suficiente (ver ESPECIFICACAO § 3.1). A janela de junho está desbloqueada
- [x] **4B.11** Garantir o recuo seguro: tema cujo asset não exista é ignorado,
      caindo em `background-standard` sem erro (proteção para temas futuros)
- [x] **4B.12** Incluir o novo background no seletor manual (passa de 5 para 6
      opções), usando a chave exata **`festejunina`** (sem hífen)

## Fase 5 — Faixa do nome e áudio

- [x] **5.1** Componente da faixa: fundo branco sólido, círculo com o rosto do
      animal à esquerda, nome silabado em caixa alta
- [x] **5.2** Posicionar imediatamente acima do banner, sem sobreposição
- [x] **5.3** Fade in / fade out
- [x] **5.4** Timer de 3 s, reiniciado ao tocar outro animal
- [x] **5.5** `AudioService`: pré-carregar sons, tocar um por vez
- [x] **5.6** Música de fundo em loop, volume suave, com *ducking* durante o
      som do animal
- [x] **5.7** Pausar áudio quando o app vai a segundo plano
- [x] **5.8** ~~Sons definitivos dos animais~~ — **entregues e processados**
      (ver 1.7); nenhum corte em tempo de reprodução é necessário, pois todos
      já cabem nos 3 s da faixa
- [x] **5.9** Música de fundo integrada (ver 1.9). Cadeia de áudio verificada
      no navegador: toca em loop a 25%, faz ducking para 6% durante o som do
      animal e restaura depois. Pontas em silêncio — o loop emenda sem estalo
- [ ] **5.10** Validar em aparelho real que o som termina antes ou junto com o
      fim da faixa de 3 s (maior som: galinha, 2,99 s)

## Fase 6 — Monetização

- [x] **6.1** Integrar plugin AdMob no Capacitor
- [x] **6.1a** ⚠️ **Configurar AdMob para público infantil** —
      `tagForChildDirectedTreatment`, anúncios **não personalizados** e filtro
      de conteúdo restrito. Exigido pela Política para Famílias
      (ESPECIFICACAO § 6.1); sem isso o app é **reprovado na revisão**
- [x] **6.2** Banner **Nativo Avançado** no rodapé (IDs de **teste** no dev)
- [x] **6.3** Tratar ausência de rede: recolher o banner sem quebrar o layout
- [x] **6.4** Integrar Google Play Billing
- [x] **6.5** Fluxo de compra do produto `remove_ads`
- [x] **6.6** Exibir preço **vindo do Google Play** (nunca fixo no código)
- [x] **6.7** Remover banner e botão após a compra (estado persistido)
- [x] **6.8** **Restaurar compra** (obrigatório para reinstalação)
- [x] **6.9** Barreira parental antes da tela de pagamento
- [x] **6.10** **IDs de produção do AdMob ativados** — feito na v1.0.2
      (versionCode 3).

      `producao()` em `APK/src/app/core/services/ads.service.ts` retorna
      `Capacitor.isNativePlatform()`; `adId`, `isTesting` e
      `initializeForTesting` derivam dessa flag.

      | | Teste | Produção (atual) |
      |---|---|---|
      | Bloco de anúncios | `ca-app-pub-3940256099942544/6300978111` (público do Google) | `ca-app-pub-3480885465464323/5761468840` (FARMBOOK_NATIVE_RODAPE) |
      | `isTesting` | `true` | `false` |

      O **App ID** (`ca-app-pub-3480885465464323~8822746451`, no
      AndroidManifest) sempre foi o de produção — só o bloco alterna.

      ⚠️ **Nunca toque nos próprios anúncios**: o Google trata cliques do
      próprio desenvolvedor como fraude e suspende a conta AdMob. Para testar
      no aparelho, volte `producao()` para `false` no build local.

      > As versões 1.0.0 e 1.0.1, já publicadas, saíram com os IDs de teste —
      > exibiam "This is a test ad" e não geraram receita.

- [x] **6.11** Anúncio interno do Florest Book na tela inicial
      (`CrossPromoComponent`), abaixo do botão "Começar".

      Cross-promotion dentro de app infantil é publicidade, então o cartão traz
      o selo "Publicidade" e a Play Store só abre depois da mesma barreira
      parental usada na compra (6.9), no navegador do sistema.

      Some junto com o banner para quem comprou `remove_ads` — cobrar por um
      app "sem anúncios" que segue anunciando seria propaganda enganosa. O
      cartão só renderiza depois de `settings.carregado()`, senão a
      publicidade pisca na tela de quem já pagou.

      ⚠️ Depende de o **Florest Book** ser classificado para público
      equivalente na Play Console — anunciar app de faixa etária maior dentro
      de um app do programa Famílias é motivo de reprovação.

## Fase 7 — Publicação

- [x] **7.1** Termo de Uso em HTML → `DEPLOY/termos-de-uso.html`
- [x] **7.2** Política de Privacidade em HTML → `DEPLOY/politica-privacidade.html`
      (deve declarar: nome fica só no aparelho; uso do AdMob)
- [x] **7.2a** Nos dois documentos, declarar explicitamente o **Compromisso com
      a Política para Famílias do Google Play** e a ausência de coleta de
      dados de crianças (ESPECIFICACAO § 6.1)
- [x] **7.3** Documentos publicados e verificados (HTTP 200, conteúdo idêntico
      ao gerado em `DEPLOY/`):
      - https://contaasbencaos.com.br/bananaking/termos-de-uso.html
      - https://contaasbencaos.com.br/bananaking/politica-privacidade.html
      *(o caminho contém "bananaking" por reaproveitar a hospedagem; o
      conteúdo é do Farm Book)*
- [x] **7.3a** Links para os dois documentos na **tela inicial**, abrindo no
      navegador do sistema via Capacitor Browser — exigência da Política para
      Famílias para links externos
- [x] **7.4** Keystore **criado e configurado** pelo cliente:
      `farmbook-release.jks`, alias `farmbook`, RSA 2048/SHA384, válido até
      **2053**. Assinatura confirmada no APK de release
      (`CN=Besaleel Vieira, OU=Maratimba Games`)
- [x] **7.5** Definir `versionCode` / `versionName` iniciais
- [x] **7.6** Ícone 512×512 → `DEPLOY/store-assets/icon-512.png`
- [x] **7.7** Feature graphic 1024×500 + screenshots
- [x] **7.8** Descrições da loja nos 6 idiomas
- [ ] **7.9** Questionário **Segurança dos Dados** declarando "nenhum dado
      coletado", e marcar na Play Console a exibição da mensagem
      **"Compromisso com a Política para Famílias do Google Play"** na seção
      Segurança dos dados — decisão confirmada pelo cliente
- [x] **7.10** AAB assinado gerado: `DEPLOY/farmbook-release-v01.aab`
      (12,3 MB, versionCode 1 / versionName 1.0.0)
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
