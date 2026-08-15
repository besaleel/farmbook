import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import { SettingsService } from './settings.service';

/**
 * IDs de produção (ESPECIFICACAO § 7).
 * Em desenvolvimento usamos os IDs de teste do Google: clicar nos próprios
 * anúncios de produção causa suspensão da conta.
 *
 * ⚠️ O bloco de produção precisa ser do formato **Banner**. O primeiro bloco
 * criado (`ca-app-pub-3480885465464323/5761468840`,
 * FARMBOOK_NATIVE_RODAPE) era *Native advanced*: `showBanner()` nunca
 * preenche nele, e a falha era engolida em silêncio — nenhum anúncio
 * aparecia e nenhum erro era registrado. Ver BACKLOG 6.12.
 */
const BLOCO_PRODUCAO = 'ca-app-pub-3480885465464323/1903961766';
const BLOCO_TESTE = 'ca-app-pub-3940256099942544/6300978111';

/** Marca o bloco de produção ainda não cadastrado (ver BLOCO_PRODUCAO). */
const BLOCO_PRODUCAO_PENDENTE = !BLOCO_PRODUCAO.startsWith('ca-app-pub-');

@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly settings = inject(SettingsService);

  /** Verdadeiro quando o banner está de fato ocupando espaço na tela. */
  readonly bannerVisivel = signal(false);

  private iniciado = false;

  /**
   * Inicializa o SDK.
   *
   * O Farm Book é dirigido a crianças, então os anúncios são sempre
   * **não personalizados** (`npa`). O sinal `tagForChildDirectedTreatment`
   * é aplicado no nível nativo, via AndroidManifest — o plugin não o expõe
   * pela API JS (ver ESPECIFICACAO § 6.1).
   */
  async iniciar(): Promise<void> {
    if (this.iniciado || !Capacitor.isNativePlatform()) return;
    try {
      await AdMob.initialize({ initializeForTesting: !this.producao() });
      this.iniciado = true;
    } catch (erro) {
      // Sem AdMob disponível o jogo segue normalmente — é offline-first.
      console.warn('[AdMob] falha ao inicializar o SDK:', erro);
    }
  }

  async mostrarBanner(): Promise<void> {
    if (this.settings.removeAds() || !Capacitor.isNativePlatform()) return;

    if (this.producao() && BLOCO_PRODUCAO_PENDENTE) {
      // Melhor não exibir nada do que requisitar um ID inválido.
      console.error(
        '[AdMob] BLOCO_PRODUCAO não configurado — crie um bloco do tipo ' +
          'Banner no painel do AdMob e substitua o valor em ads.service.ts.'
      );
      this.bannerVisivel.set(false);
      return;
    }

    await this.iniciar();
    if (!this.iniciado) return;

    const opcoes: BannerAdOptions = {
      adId: this.producao() ? BLOCO_PRODUCAO : BLOCO_TESTE,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: !this.producao(),
      // Obrigatório para público infantil: nunca personalizar.
      npa: true,
    };

    try {
      await AdMob.showBanner(opcoes);
      this.bannerVisivel.set(true);
    } catch (erro) {
      // Sem rede ou sem preenchimento: o espaço é recolhido e o jogo
      // continua (ESPECIFICACAO § 6 — offline-first).
      //
      // O log é o único sinal de que algo está errado na configuração:
      // um bloco de formato incorreto falha exatamente como "sem rede".
      console.warn('[AdMob] banner não exibido:', erro);
      this.bannerVisivel.set(false);
    }
  }

  async removerBanner(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
    } catch {
      // Já removido: nada a fazer. Não é erro — não polui o log.
    }
    this.bannerVisivel.set(false);
  }

  /**
   * ⚠️ CHAVE ÚNICA que alterna entre anúncios de teste e de produção.
   *
   * **Histórico:** 1.0.0 e 1.0.1 saíram com esta chave em `false` — exibiam
   * "This is a test ad" e não monetizavam. A 1.0.2 ligou a chave, mas
   * apontava para um bloco *Native advanced*, incompatível com
   * `showBanner()`: nenhum anúncio chegou a ser exibido. A monetização só
   * passa a valer com o bloco Banner em `BLOCO_PRODUCAO` (BACKLOG 6.12).
   *
   * **Nunca clique nos próprios anúncios.** Com os IDs de produção o Google
   * interpreta o clique como fraude e **suspende a conta AdMob**. Para testar
   * o app com segurança, volte esta função para `false` no build local.
   *
   * No navegador (`npm start`) segue desligada: o SDK só existe no nativo.
   */
  private producao(): boolean {
    return Capacitor.isNativePlatform();
  }
}
