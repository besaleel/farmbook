import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SettingsService } from './settings.service';
import { AdsService } from './ads.service';

/** Produto único não-consumível (ESPECIFICACAO § 4.5). */
export const PRODUTO_REMOVE_ADS = 'remove_ads';

declare const CdvPurchase: any;

/**
 * Compra da remoção de anúncios via Google Play Billing.
 *
 * O preço exibido vem **sempre do Google Play** — nunca fixo no código —,
 * para respeitar moeda e conversão locais (ESPECIFICACAO § 4.5). US$ 1,90 é
 * apenas a referência de cadastro.
 */
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private readonly settings = inject(SettingsService);
  private readonly ads = inject(AdsService);

  /** Preço formatado pelo Google Play (ex.: "R$ 9,90"). Vazio se indisponível. */
  readonly preco = signal('');
  readonly disponivel = signal(false);
  readonly processando = signal(false);

  private iniciado = false;

  async iniciar(): Promise<void> {
    if (this.iniciado || !Capacitor.isNativePlatform()) return;
    if (typeof CdvPurchase === 'undefined') return;

    try {
      const { store, ProductType, Platform } = CdvPurchase;

      store.register([
        {
          id: PRODUTO_REMOVE_ADS,
          type: ProductType.NON_CONSUMABLE,
          platform: Platform.GOOGLE_PLAY,
        },
      ]);

      store.when().productUpdated((produto: any) => {
        if (produto.id !== PRODUTO_REMOVE_ADS) return;
        const oferta = produto.getOffer?.();
        // O preço vem formatado pela loja, na moeda local.
        this.preco.set(oferta?.pricingPhases?.[0]?.price ?? '');
        this.disponivel.set(produto.canPurchase === true);
      });

      store.when().approved((transacao: any) => transacao.verify());
      store.when().verified((recibo: any) => recibo.finish());

      store.when().finished(async (transacao: any) => {
        const comprou = transacao.products?.some(
          (p: any) => p.id === PRODUTO_REMOVE_ADS
        );
        if (comprou) await this.concluir();
        this.processando.set(false);
      });

      store.error(() => this.processando.set(false));

      await store.initialize([Platform.GOOGLE_PLAY]);
      // Restaura automaticamente: o produto é não-consumível e o usuário
      // pode ter comprado em outro aparelho.
      await store.restorePurchases();

      this.iniciado = true;
    } catch {
      // Billing indisponível não pode quebrar o jogo — ele é offline-first.
      this.disponivel.set(false);
    }
  }

  async comprar(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || typeof CdvPurchase === 'undefined') {
      return false;
    }
    await this.iniciar();

    try {
      this.processando.set(true);
      const produto = CdvPurchase.store.get(
        PRODUTO_REMOVE_ADS,
        CdvPurchase.Platform.GOOGLE_PLAY
      );
      const oferta = produto?.getOffer();
      if (!oferta) {
        this.processando.set(false);
        return false;
      }
      await oferta.order();
      return true;
    } catch {
      this.processando.set(false);
      return false;
    }
  }

  /** Exigido para reinstalação ou troca de aparelho (ESPECIFICACAO § 4.5). */
  async restaurar(): Promise<void> {
    if (!Capacitor.isNativePlatform() || typeof CdvPurchase === 'undefined') {
      return;
    }
    await this.iniciar();
    try {
      this.processando.set(true);
      await CdvPurchase.store.restorePurchases();
    } finally {
      this.processando.set(false);
    }
  }

  private async concluir(): Promise<void> {
    await this.settings.definirRemoveAds(true);
    await this.ads.removerBanner();
  }
}
