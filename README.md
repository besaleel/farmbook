# Farm Book

Jogo infantil de sons de animais, inspirado no clássico livro sonoro: a criança
toca a figura de um animal e ouve o som correspondente, com o nome exibido em
sílabas separadas.

- **Público-alvo:** crianças em pré-alfabetização (2–6 anos)
- **Plataforma:** Android (Google Play)
- **Offline:** o jogo funciona 100% sem rede — só o banner de anúncio e a compra
  de remoção dependem de conexão, e a ausência delas nunca quebra o jogo
- **Idiomas:** português, inglês, espanhol, francês, italiano e alemão

## Stack

| Camada | Escolha |
|--------|---------|
| Framework | Angular 20 + Ionic 8 |
| Empacotamento nativo | Capacitor 8 |
| Animais | PNG com transparência + animação CSS (sem 3D) |
| Áudio | HTML5 Audio |
| i18n | `@ngx-translate/core` com JSON local |
| Persistência | Capacitor Preferences |
| Anúncios | AdMob via plugin Capacitor |
| Compras | Google Play Billing (produto único, não-consumível) |

## Por que 2D e não 3D

Os modelos `.glb` originais somavam ~255 MB — acima do limite de 200 MB do AAB
base do Google Play — sem rig nem animação, e com risco alto de travamento em
aparelhos Android de entrada, justamente o público que pega o celular dos pais.
Os animais são PNGs recortados animados por CSS: `transform` apenas, sem
disparar layout ou repaint, mantendo 60fps. Detalhes em
[DOC/ESPECIFICACAO.md](DOC/ESPECIFICACAO.md) § 2.

## Rodando localmente

```bash
cd APK
npm install
npm start            # servidor de desenvolvimento
```

Para gerar o app Android:

```bash
npm run build                       # build de produção do Angular
npx cap sync android                # copia o build para o projeto nativo
cd android && ./gradlew assembleDebug
```

O APK sai em `android/app/build/outputs/apk/debug/`.

## Estrutura

```
APK/src/app/
  paginas/celeiro/     tela principal — o cenário e os animais
  paginas/inicial/     entrada, onde a criança escreve o nome
  componentes/         faixa do nome do animal, tela de compra
  core/services/       animais, áudio, i18n, anúncios, sazonalidade
DOC/                   especificação e backlog
```

### Posicionamento dos animais

As coordenadas em `core/services/animal.service.ts` são percentuais da área
jogável — a caixa 2:3 do cenário menos a tira coberta pelo rodapé — e não da
tela. Ancorar na arte é o que mantém os animais pisando no chão desenhado em
qualquer resolução; medir contra a tela fazia com que descolassem da cerca em
aparelhos mais altos.

## Assets

As artes, áudios e modelos de autoria ficam fora deste repositório por peso.
O que o app embarca está em `APK/src/assets/`.

## Licença

[Apache 2.0](LICENSE).
