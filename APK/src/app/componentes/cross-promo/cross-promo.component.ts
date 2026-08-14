import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { Browser } from '@capacitor/browser';

import { URL_FLOREST_BOOK } from '../../core/legal';

/**
 * Anúncio interno do Florest Book, exibido na tela inicial.
 *
 * Duas exigências da Política para Famílias moldam este componente
 * (ESPECIFICACAO § 6.1):
 *
 * 1. **Rótulo "Publicidade".** Promover outro app dentro de um app infantil
 *    é publicidade, mesmo sendo app próprio, e precisa estar identificado
 *    como tal — não pode se passar por conteúdo do jogo.
 * 2. **Barreira parental antes de sair.** Levar a criança à Play Store é
 *    ação de adulto, então reaproveitamos a mesma conta usada na compra
 *    (ver PagamentoComponent). O link só abre depois de acertá-la.
 *
 * A saída usa o navegador do sistema (Custom Tabs no Android), igual aos
 * links legais: o adulto enxerga a barra de endereço e sai do contexto do
 * jogo de forma explícita.
 */
@Component({
  selector: 'fb-cross-promo',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './cross-promo.component.html',
  styleUrls: ['./cross-promo.component.scss'],
})
export class CrossPromoComponent {
  /** Barreira parental aberta sobre o anúncio. */
  readonly mostrarBarreira = signal(false);

  readonly a = signal(this.sortear());
  readonly b = signal(this.sortear());
  readonly resposta = signal('');
  readonly erro = signal(false);

  abrirBarreira(): void {
    this.a.set(this.sortear());
    this.b.set(this.sortear());
    this.resposta.set('');
    this.erro.set(false);
    this.mostrarBarreira.set(true);
  }

  fecharBarreira(): void {
    this.mostrarBarreira.set(false);
  }

  async verificarBarreira(): Promise<void> {
    if (Number(this.resposta()) !== this.a() + this.b()) {
      this.erro.set(true);
      this.resposta.set('');
      this.a.set(this.sortear());
      this.b.set(this.sortear());
      return;
    }
    this.mostrarBarreira.set(false);
    await this.abrirLoja();
  }

  private async abrirLoja(): Promise<void> {
    try {
      await Browser.open({
        url: URL_FLOREST_BOOK,
        presentationStyle: 'popover',
      });
    } catch {
      // Sem navegador disponível (ou rodando no desktop durante o dev).
      window.open(URL_FLOREST_BOOK, '_blank', 'noopener');
    }
  }

  /** Parcelas de 2 a 9: soma sempre acima da capacidade do público-alvo. */
  private sortear(): number {
    return 2 + Math.floor(Math.random() * 8);
  }
}
