# Como gerar o AAB de release (Farm Book)

Passo a passo para gerar o pacote `.aab` assinado, pronto para upload na Google
Play Console, e deixá-lo em `DEPLOY/`.

> Rode todos os comandos a partir da pasta `APK/` do projeto, exceto onde indicado.

---

## 1. Pré-requisitos (uma vez só)

- Node.js e npm instalados. *(verificado neste ambiente: Node v24.15.0, npm 11.12.1)*
- JDK 17+ — o JDK embutido no Android Studio funciona:
  `C:\Program Files\Android\Android Studio\jbr` *(presente)*
- Android SDK instalado via Android Studio *(presente em
  `%LOCALAPPDATA%\Android\Sdk`)* e um arquivo `APK/android/local.properties`
  apontando para ele:
  ```properties
  sdk.dir=C:/Users/SEU_USUARIO/AppData/Local/Android/Sdk
  ```
  Use barras `/`, não `\`, senão o Gradle falha com `Invalid file path`.
  Esse arquivo é local e fica no `.gitignore`.

## 2. Criar o keystore de assinatura (uma vez só, e guardar para sempre)

O keystore é a identidade do app na Play Store. **Se ele for perdido, não é
possível publicar atualizações do `com.farmbook.app` — nunca.** Não existe
recuperação pelo Google.

Gere-o com o `keytool` do JDK:

```powershell
Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
& "$Env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore "C:\Sistemas\FARMBOOK\farmbook-release.jks" `
  -alias farmbook `
  -keyalg RSA -keysize 2048 -validity 10000
```

O comando pede, interativamente:

1. **Senha do keystore** (anote — é a `storePassword`).
2. Nome, organização, cidade, estado, código do país (ex.: `BR`).
   Podem ser dados pessoais/da empresa; não aparecem para o usuário final.
3. Confirmação (`sim`/`yes`).
4. **Senha da chave** — pressione Enter para usar a mesma do keystore
   (é o mais simples; então `keyPassword` = `storePassword`).

`-validity 10000` (~27 anos) é a recomendação do Google: a chave precisa
sobreviver a toda a vida do app.

### Guardar o keystore com segurança

- **Não** versione o `.jks` no git (por isso o caminho acima está fora de `APK/`).
- Faça backup em pelo menos **dois lugares** (ex.: cofre de senhas + drive
  privado), junto com as senhas e o alias.
- Registre o alias usado: `farmbook`.

> Recomendado ativar também o **Play App Signing** na Console. Nesse modelo o
> Google guarda a chave final de assinatura e o seu `.jks` passa a ser a chave
> de *upload* — se ela for perdida, dá para pedir substituição ao Google. Sem
> Play App Signing, a perda é definitiva.

## 3. Configurar as credenciais do keystore no projeto

Crie o arquivo `APK/android/keystore.properties` (também ignorado pelo git):

```properties
storeFile=C:/Sistemas/FARMBOOK/farmbook-release.jks
storePassword=SENHA_DO_KEYSTORE
keyAlias=farmbook
keyPassword=SENHA_DA_CHAVE
```

`storeFile` pode ser caminho absoluto (recomendado, mantendo o `.jks` fora do
repositório) ou relativo à pasta `APK/android`. Use barras `/`.

> Sem esse arquivo, o Gradle assina o release com a chave de **debug** — útil
> para testar o processo, mas esse AAB **não pode ser enviado à Play Store**.
>
> ✅ `APK/android/app/build.gradle` **já está configurado** para ler
> `keystore.properties` quando ele existir. Se o arquivo estiver ausente, o
> build imprime o aviso:
> `AVISO: keystore.properties nao encontrado — o release sera assinado com a
> chave de DEBUG...`
> Procure por essa linha na saída do Gradle antes de subir qualquer artefato.

## 4. Build de produção do Angular + sync Android

```powershell
Set-Location "C:\Sistemas\FARMBOOK\APK"
npm run build
npx cap sync android
```

Isso gera `APK/www` (build otimizado) e copia para
`APK/android/app/src/main/assets/public`.

> Antes do build de release, confirme que os **IDs de produção do AdMob** estão
> ativos no lugar dos IDs de teste (Backlog 6.10).

## 5. Gerar o AAB assinado

```powershell
Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
Set-Item -Path Env:PATH -Value "$Env:JAVA_HOME\bin;$Env:PATH"
Set-Location "C:\Sistemas\FARMBOOK\APK\android"
.\gradlew bundleRelease
```

O arquivo assinado sai em:
```
APK\android\app\build\outputs\bundle\release\app-release.aab
```

### Conferir que não foi assinado com a chave de debug

Diferente do APK, o `.aab` **não guarda os arquivos de assinatura dentro do
zip** — por isso `keytool -printcert -jarfile` não retorna nada para bundles.
A verificação correta é observar a saída do Gradle:

- Se aparecer `AVISO: keystore.properties nao encontrado`, o bundle foi
  assinado com a chave de **debug** e será **rejeitado** pela Play Store.
- Sem esse aviso, o keystore de release foi usado.

Para inspecionar um **APK** (aí sim é possível):

```powershell
& "$Env:JAVA_HOME\bin\keytool.exe" -printcert -jarfile `
  "C:\Sistemas\FARMBOOK\APK\android\app\build\outputs\apk\release\app-release.apk"
```

## 6. Copiar para DEPLOY

```powershell
Copy-Item "C:\Sistemas\FARMBOOK\APK\android\app\build\outputs\bundle\release\app-release.aab" `
          "C:\Sistemas\FARMBOOK\DEPLOY\farmbook-release-v01.aab"
```

`DEPLOY/*.aab` fica no `.gitignore` — o binário permanece só local.

## 7. Antes de cada novo release

- **Suba a versão sempre que gerar um `.aab` que ainda não foi publicado** —
  `versionCode` e `versionName` em `APK/android/app/build.gradle`.
  `versionCode` é inteiro e deve **sempre aumentar**; `versionName` é o texto
  visível (ex.: `"1.0.0"`). O Google Play rejeita `versionCode` já usado.
- **Nome do arquivo em `DEPLOY/`:** padrão `farmbook-release-vNN.aab`
  (ex.: `-v02.aab`), incrementando a cada build.
- Repita os passos 4–6.
- Use **sempre o mesmo keystore** do passo 2 — nunca gere um novo para o
  `com.farmbook.app`.

### Histórico de releases

| Arquivo | versionCode | versionName | Observações |
|---------|-------------|-------------|-------------|
| _(nenhum release gerado até o momento)_ | | | |

---

## Checklist rápido (releases seguintes, keystore já existe)

```powershell
Set-Location "C:\Sistemas\FARMBOOK\APK"
npm run build
npx cap sync android

Set-Item -Path Env:JAVA_HOME -Value "C:\Program Files\Android\Android Studio\jbr"
Set-Item -Path Env:PATH -Value "$Env:JAVA_HOME\bin;$Env:PATH"
Set-Location "C:\Sistemas\FARMBOOK\APK\android"
.\gradlew bundleRelease

Copy-Item "app\build\outputs\bundle\release\app-release.aab" `
          "C:\Sistemas\FARMBOOK\DEPLOY\farmbook-release-vNN.aab"
```

## Assets de loja

Situação atual: a pasta `DEPLOY/` está **vazia** — todos os itens abaixo ainda
precisam ser gerados (Backlog 7.6–7.8).

- [ ] Ícone 512×512 → `DEPLOY/store-assets/icon-512.png`
      (gerar a partir de `PROJECT/assets/logo.png`, que é 1254×1254)
- [ ] Feature graphic 1024×500
- [ ] Screenshots do celular (mínimo 2; recomendado 4–8)
- [ ] Termo de uso e política de privacidade em HTML (Backlog 7.1–7.2)
