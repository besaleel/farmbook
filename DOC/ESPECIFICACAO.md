# ESPECIFICAÇÃO DO GAME FARM BOOK

## 1. Visão geral

Farm Book é um jogo infantil baseado no clássico livro de sons de animais: a
criança toca a figura de um animal e o jogo emite o som correspondente,
exibindo o nome do animal com as sílabas separadas.

- **Público-alvo:** crianças em fase pré-alfabetização (2–6 anos).
- **Plataforma inicial:** Android (Google Play).
- **Requisito central:** funcionar **100% offline**. A única funcionalidade que
  exige rede é o banner de anúncio e a compra de remoção de anúncios; a
  ausência de rede nunca pode quebrar o jogo.
- **Multi-idioma:** PT, EN, ES, FR, IT, DE.

### 1.1 Stack definida

| Camada | Escolha |
|--------|---------|
| Framework | Angular + Ionic |
| Empacotamento nativo | Capacitor |
| Renderização dos animais | 2D (PNG com transparência) + animação CSS |
| Áudio | HTML5 Audio / Web Audio API |
| i18n | `@ngx-translate/core` com arquivos JSON locais |
| Persistência | Capacitor Preferences (nome, idioma, som, background) |
| Anúncios | AdMob Native Advanced via plugin Capacitor |
| Compras | Google Play Billing (produto único, não-consumível) |

---

## 2. Decisões de arquitetura

### 2.1 Renderização 2D em vez de 3D (decisão firmada)

Os arquivos `.glb` em `PROJECT/assets/` **não serão embarcados no aplicativo**.
Motivos apurados na análise dos assets:

- Os 6 `.glb` somam **~255 MB**, acima do limite de 200 MB do AAB base do
  Google Play. Cerca de 90% do peso são texturas PNG não comprimidas
  (albedo + normal + metallic/roughness, 5 a 18 MB **cada**).
- Nenhum `.glb` possui **rig (`skins: 0`) nem animação (`animations: 0`)** —
  são malhas estáticas de mesh único. Animá-los exigiria rigging completo no
  Blender para os 6 animais, o item de maior esforço de todo o projeto.
- `gatinha-base.glb` tem ~2,4 milhões de vértices (10× os demais).
- Renderizar WebGL com esse volume tem risco alto de travamento em aparelhos
  Android de entrada — justamente o público que pega o celular dos pais.

**Os `.png` já existentes são adequados para uso direto:** 1024×1536, RGBA,
com o animal corretamente recortado (63–72% dos pixels são transparentes,
cantos com alpha = 0). Não é necessário trabalho de recorte.

Os `.glb` permanecem no repositório como **fonte de autoria**, úteis para
gerar novas poses ou sprites via Blender no futuro (ver Backlog, Fase 8).

### 2.2 Como os animais ganham vida sem 3D

O requisito "parecer estar vivo" é atendido por animação CSS sobre o PNG:

- **Idle (contínuo, sutil):** respiração via `transform: scale()` suave em
  loop, com leve balanço (`rotate` de 1–2°). Cada animal recebe `delay`
  e duração diferentes para que não pulsem em sincronia.
- **Ao toque:** animação curta de reação (~600 ms) — um "pulo" com squash &
  stretch, escala e rotação — disparada junto com o som.
- **Acessibilidade:** respeitar `prefers-reduced-motion`, reduzindo o idle.

Animações mais ricas (piscar, mexer orelha) ficam para a Fase 8, via sprites
pré-renderizados no Blender — sem alterar a arquitetura do app.

---

## 3. Assets

### 3.1 Backgrounds (`PROJECT/assets/`)

Todos em 1024×1536 (retrato), PNG sem alpha, com versão `.svg` disponível.

| Objeto | Uso |
|--------|-----|
| background-standard | Padrão, sempre disponível |
| background-halloween | Sazonal — ver 4.4 |
| background-natalino | Sazonal — ver 4.4 |
| background-pascoa | Sazonal — ver 4.4 |
| background-thanksgiving | Sazonal — ver 4.4 |
| **background-festejunina** | Sazonal — ver 4.4 |
| logo (1254×1254, alpha) | Tela inicial e ícone |

> Atenção ao nome real do arquivo: **`background-festejunina.png`**, sem hífen
> entre "feste" e "junina" — diferente do padrão dos demais. Usar exatamente
> essa grafia nas chaves de tema e no pipeline.

Todos os backgrounds ficam **sempre disponíveis** no seletor manual, em
qualquer época do ano. A sazonalidade afeta apenas qual deles é escolhido
automaticamente por padrão.

#### Os arquivos `.svg` não são usados no aplicativo

Os `.svg` presentes em `PROJECT/assets/` **não serão embarcados**. Eles não são
vetores desenhados à mão: são **auto-trace de imagens raster**, com 2.221 a
9.092 elementos `<path>` cada. Medição comparativa:

| Background | SVG | PNG | **WebP q85** | paths no SVG |
|------------|-----|-----|--------------|--------------|
| natalino | 2.979 KB | 2.337 KB | **196 KB** | 3.270 |
| standard | 1.296 KB | 1.983 KB | **137 KB** | 2.221 |
| festejunina | 5.699 KB | 2.675 KB | **326 KB** | **9.092** |

O SVG chega a ser **17× maior que o WebP** e ainda exige rasterizar milhares de
paths, competindo com as animações dos animais em aparelhos de entrada. Como o
jogo é de resolução fixa e travado em retrato, a escalabilidade do vetor não
traz benefício algum — só custo.

O caso do `festejunina` é o mais extremo: por ser a cena mais detalhada
(bandeirinhas, fogueira, girassóis, estrelas), o traçado automático gerou
9.092 paths. Seu SVG também declara `width="100%"` sem `height`, o que pode
colapsar a altura em WebView — risco inexistente no WebP.

**Consequência prática:** não é necessário gerar `.svg` para novos backgrounds
— o `.png` em 1024×1536 é suficiente, pois o pipeline (§ 3.3) converte tudo
para WebP. Os seis backgrounds em WebP somam **~1,3 MB**, contra 13,9 MB em PNG
e 15,0 MB em SVG.

Os `.svg` permanecem no repositório apenas como material de origem; o pipeline
os ignora.

### 3.2 Animais

Seis animais, cada um com `.png` 1024×1536 RGBA (usado no jogo) e
`.glb` (fonte de autoria, não embarcado).

| Animal | PNG | GLB (fonte) |
|--------|-----|-------------|
| Cavalo | cavalo.png | cavalo-base.glb |
| Galinha | galinha.png | galinha-base.glb |
| Gatinha | gatinha.png | gatinha-base.glb |
| Ovelha | ovelha.png | ovelha-base.glb |
| Porco | porco.png | porco-besa.glb |
| Vaca | vaca.png | vaca-base.glb |

### 3.3 Pipeline de otimização

Antes de entrar em `APK/src/assets/`, todo asset passa por:

1. Conversão para **WebP** (qualidade ~85, alpha preservado).
2. Redimensionamento: animais para ~512×768; backgrounds para ~1080×1620.
3. Meta de peso: **app final abaixo de 30 MB**.

Os originais em `PROJECT/assets/` nunca são sobrescritos.

### 3.4 Áudio

| Item | Formato | Situação |
|------|---------|----------|
| Som de cada animal (6) | `.mp3` mono, 96 kbps, ≤ 3 s | **Entregue e processado** |
| Música de fundo | `.mp3` em loop, sem direitos autorais | **Pendente** |

Nomenclatura fixa: `assets/sounds/<animal>.mp3` (`cavalo`, `galinha`,
`gatinha`, `ovelha`, `porco`, `vaca`) e `assets/sounds/background-music.mp3`.

> O arquivo entregue como `gato.mp3` foi renomeado para **`gatinha.mp3`**,
> alinhando-se ao nome usado no restante do projeto (`gatinha.png`).

#### Processamento aplicado

Os arquivos originais tinham durações de 0,68 s a 5,09 s, volumes bastante
desiguais e bitrate de 256 kbps (qualidade de música, desnecessária para
efeitos curtos). Os sons processados ficam em
`PROJECT/assets/sounds/`; os originais permanecem intactos na raiz de
`PROJECT/assets/`.

**Decisão: os arquivos são editados, e não cortados na reprodução.** Cortar via
`pause()` aos 2 s interromperia o som no meio, produzindo um clique audível, e
não reduziria o peso embarcado. A análise mostrou que os três arquivos longos
são **repetições do mesmo som**, com silêncio real entre elas — permitindo
cortar após a primeira repetição, em ponto natural e com fade-out de 150 ms.

| Animal | Original | Final | Corte |
|--------|----------|-------|-------|
| cavalo | 5,04 s | **2,14 s** | Após a 1ª relinchada (silêncio 2,05→2,95 s) |
| galinha | 5,09 s | **2,99 s** | Após o 1º cacarejo (silêncio 2,90→3,30 s) |
| gatinha | 5,09 s | **2,69 s** | Após os 2 primeiros miados (silêncio 2,55→3,50 s) |
| vaca | 2,32 s | 2,32 s | Integral |
| ovelha | 1,04 s | 1,04 s | Integral |
| porco | 0,68 s | 0,68 s | Integral |

Também aplicados a todos:

- **Normalização de volume** (`loudnorm I=-16 TP=-1.5`). Os originais variavam
  de −14,9 a 0,0 dBFS de pico — na prática, a criança levaria um susto no porco
  e mal ouviria a galinha. Após o processo, o RMS ficou entre −16 e −19 dB.
- **Mono, 96 kbps**: total de **590 KB → 143 KB**, sem diferença audível no
  alto-falante de um celular.

Todos os sons ficam **dentro dos 3 segundos** da faixa do nome do animal
(§ 4.2), dispensando qualquer corte em tempo de reprodução.

O comando de processamento está documentado no Backlog (1.7) para permitir
reprocessar caso novos sons sejam entregues.

**Regras de áudio:**
- Um som por vez: tocar um novo animal interrompe o anterior.
- A música de fundo abaixa de volume (duck) enquanto um som de animal toca.
- O áudio respeita o botão de som; o estado é persistido.
- Todo o áudio é local — nenhum download em tempo de execução.

---

## 4. Telas

### 4.1 Tela inicial

- Logo do jogo.
- Mensagem de boas-vindas com campo editável para o **nome da criança**
  (persistido; se vazio, o jogo funciona normalmente sem nome).
- **Botão grande "Começar"** — alvo de toque generoso, adequado à idade.
- Seletor de idioma: PT, EN, ES, FR, IT, DE (bandeiras + rótulo).
- Ícone para ligar/desligar a música de fundo.

### 4.2 Tela principal (o celeiro)

- **Fundo:** o background selecionado, cobrindo a tela.
- **Animais:** os 6 dispersos sobre o fundo, sem sobreposição de áreas de
  toque, com animação idle contínua.
- **Canto superior direito:** 3 ícones — Idioma, Background, Som.
- **Canto superior esquerdo:** avatar + nome da criança.
- **Rodapé:** banner de anúncio nativo ocupando 100% da largura.
- **Acima do banner:** texto/botão "Remover Anúncio".

#### Faixa do nome do animal

Ao tocar em um animal:

1. Toca o som do animal.
2. Dispara a animação de reação do animal tocado.
3. Exibe uma **faixa horizontal branca sólida**, posicionada **logo acima do
   banner de anúncio**, contendo:
   - o **rosto do animal dentro de um círculo**, alinhado à esquerda da faixa;
   - o **nome do animal com sílabas separadas por hífen**, no idioma ativo
     (ex.: `VA-CA`), em caixa alta e fonte grande.
4. A faixa desaparece após **3 segundos**.
5. Se outro animal for tocado antes disso, a faixa atual some e a do novo
   animal é exibida (o timer reinicia).
6. Entrada e saída com efeito **fade in / fade out**.

O círculo com o rosto é obtido por recorte da região da cabeça do PNG do
animal (`object-fit: cover` + `object-position` calibrado por animal), sem
necessidade de assets adicionais.

### 4.4 Backgrounds sazonais (automáticos)

O jogo seleciona automaticamente o background correspondente à época do ano,
mantendo todos os temas disponíveis para troca manual a qualquer momento.

#### Regra de prioridade

A **escolha manual do usuário sempre vence**. O tema sazonal é aplicado
somente enquanto o usuário **nunca trocou** o background:

| Estado | Resultado |
|--------|-----------|
| Usuário nunca trocou de background | Sazonal automático (ou padrão, fora de época) |
| Usuário escolheu qualquer background | A escolha dele, permanentemente |

Para isso, `SettingsService` guarda dois valores distintos: `background`
(o tema atual) e `backgroundEscolhidoManualmente` (booleano). O seletor
manual liga o booleano; nada volta a alterá-lo sozinho.

Essa regra evita que a tela mude sozinha entre uma sessão e outra — para uma
criança pequena, o cenário trocar sem motivo é confuso.

#### Janelas sazonais

A verificação ocorre na **abertura do app** e ao voltar do segundo plano,
usando a data local do aparelho. Fora de todas as janelas: `background-standard`.

| Tema | Janela | Cálculo | Idioma |
|------|--------|---------|--------|
| Páscoa | 7 dias antes até 1 dia depois do domingo de Páscoa | Data móvel — algoritmo (abaixo) | Todos |
| **Festa Junina** | **1 a 30 de junho** | **Fixo** | **Somente PT** |
| Halloween | 24 a 31 de outubro | Fixo | Todos |
| Thanksgiving | 7 dias antes até o próprio dia | 4ª quinta-feira de novembro | Somente EN |
| Natal | 1 a 31 de dezembro | Fixo | Todos |

Em caso de sobreposição entre janelas, vale a de **menor duração** (a mais
específica). Com as janelas acima, nenhuma colide.

**Festa Junina e Thanksgiving são exclusivas por idioma e nunca coexistem**
(junho × novembro), então a regra de idioma nunca produz conflito entre elas.

#### Páscoa — data móvel

A Páscoa muda de data todo ano, então precisa ser calculada. Usar o
**algoritmo de Meeus/Jones/Butcher (computus gregoriano)**, que roda offline e
vale para qualquer ano, sem manutenção:

```ts
function domingoDePascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}
```

Algoritmo **verificado** contra as datas reais de 2024 a 2032 (31/03/2024,
20/04/2025, 05/04/2026, 28/03/2027, 16/04/2028, 01/04/2029, 21/04/2030,
13/04/2031, 28/03/2032) — todas conferem.

#### Temas dependentes de idioma

Alguns temas são culturalmente específicos: exibi-los para quem não os celebra
não faz sentido para a criança. Esses temas entram **automaticamente apenas no
idioma correspondente**, mas seguem **sempre disponíveis no seletor manual em
todos os idiomas** — ninguém perde acesso a nenhum cenário.

| Tema | Automático em | Data |
|------|---------------|------|
| Thanksgiving | EN | 4ª quinta-feira de novembro |
| Festa Junina | PT | 1 a 30 de junho (fixo) |

**Thanksgiving** — data verificada para 2024–2028 (28/11, 27/11, 26/11, 25/11,
23/11).

**Festa Junina** — data fixa, sem cálculo. Junho inteiro, cobrindo Santo
Antônio (13), São João (24) e São Pedro (29). É o tema que melhor combina com o
cenário de fazenda do jogo (bandeirinhas, fogueira, milho).

> Asset **`background-festejunina.png`** ✅ **entregue** (1024×1536 RGB, mesmo
> padrão dos demais). Disponível apenas em `.png`, o que é suficiente — ver
> § 3.1 sobre os `.svg` não serem usados.

##### Carnaval — avaliado e não adotado agora

O Carnaval também foi considerado para PT. É calculável offline (terça-feira,
**47 dias antes** do domingo de Páscoa — verificado para 2024–2028: 13/02,
04/03, 17/02, 09/02, 29/02, inclusive no ano bissexto de 2028). Não foi adotado
por combinar menos com o cenário de fazenda. O cálculo fica registrado aqui
caso o tema seja incluído no futuro (Backlog 8.5).

#### Observações de implementação

- O cálculo usa a **data local do aparelho**, sem qualquer chamada de rede —
  compatível com o requisito offline.
- Se o usuário mudar de idioma durante uma janela de tema restrito (EN →
  Thanksgiving, PT → Festa Junina) e ainda não tiver escolhido background
  manualmente, o tema passa a valer na próxima verificação.
- Um tema cujo asset não exista é simplesmente ignorado, com recuo para
  `background-standard` — nunca gera erro nem tela em branco.
- Todos os backgrounds são embarcados no app, então a troca é instantânea e
  funciona offline.

### 4.5 Tela de pagamento

Acionada pelo botão "Remover Anúncio":

- Produto único não-consumível: **`remove_ads`**.
- Preço de referência: **US$ 1,90** — o valor exibido vem **sempre do Google
  Play** (moeda e conversão locais), nunca fixo no código.
- Após a compra, o banner é removido permanentemente e o botão deixa de ser
  exibido.
- Deve haver **"Restaurar compra"**, exigido para reinstalação/troca de
  aparelho.
- Falha ou cancelamento retorna ao jogo sem qualquer bloqueio.

---

## 5. Responsividade

O jogo será usado em celulares e tablets dos pais, em tamanhos variados.

- Orientação: **retrato**, coerente com os assets 1024×1536.
- O posicionamento dos animais é definido em **percentuais** do palco, não em
  pixels, preservando a composição em qualquer proporção de tela.
- O palco mantém a proporção do background; sobras recebem cor sólida
  harmônica.
- Alvos de toque com no mínimo 48 dp, considerando a imprecisão do toque
  infantil.
- Faixa e banner nunca se sobrepõem.

---

## 6. Requisitos não funcionais

- **Offline-first:** nenhuma tela depende de rede. Sem conexão, o espaço do
  banner é simplesmente recolhido.
- **Desempenho:** 60 fps em Android de entrada; animações apenas em
  `transform`/`opacity` (aceleradas por GPU).
- **Tamanho:** app final abaixo de 30 MB.
- **Público infantil:** o app se enquadra na política *Designed for Families*
  do Google Play. Isso obriga: anúncios com classificação apropriada, sem
  coleta de dados pessoais de crianças, e questionário de segurança de dados
  preenchido corretamente. O campo "nome" fica **apenas no aparelho**.
- **Barreira parental:** a compra é uma ação de adulto — avaliar proteção
  simples antes da tela de pagamento.

---

## 7. Dados do aplicativo

- **Nome do pacote:** `com.farmbook.app`
- **Nome de exibição:** Farm Book
- **Orientação:** retrato
- **AdMob:**
  1. Nome: `Farm Book`
  2. ID do aplicativo: `ca-app-pub-3480885465464323~8822746451`
  3. Formato: **Nativo avançado** — `FARMBOOK_NATIVE_RODAPE`
  4. ID do bloco de anúncios: `ca-app-pub-3480885465464323/5761468840`
- **Billing:** produto `remove_ads`, não-consumível, US$ 1,90 de referência.

> Durante o desenvolvimento, usar **sempre os IDs de teste do AdMob**. Clicar
> nos próprios anúncios de produção causa suspensão da conta.

---

## 8. Estrutura de pastas

```
FARMBOOK/
├── APK/                 Projeto Ionic/Angular + Capacitor (aplicativo)
├── DEPLOY/              Artefatos de publicação (.aab, termos, store assets)
├── DOC/                 Documentação (esta especificação, backlog, build)
└── PROJECT/assets/      Assets originais (fonte, nunca sobrescritos)
```

---

## 9. Escopo excluído desta versão

Registrado para evitar ambiguidade — não faz parte da primeira entrega:

- Renderização 3D em tempo real dos `.glb` (ver 2.1).
- Versão iOS.
- Minigames, pontuação ou progressão.
- Backend, contas de usuário ou sincronização em nuvem.
