import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PurchaseService } from '../../core/services/purchase.service';

/**
 * Tela de remoção de anúncios.
 *
 * Abre com uma **barreira parental** — uma conta simples que uma criança em
 * pré-alfabetização não resolve — porque a compra é uma ação de adulto
 * (ESPECIFICACAO § 6.1). Só depois de passar é que a compra fica acessível.
 */
@Component({
  selector: 'fb-pagamento',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './pagamento.component.html',
  styleUrls: ['./pagamento.component.scss'],
})
export class PagamentoComponent {
  readonly compras = inject(PurchaseService);
  readonly fechar = output<void>();

  /** Parcelas da conta da barreira parental, sorteadas na abertura. */
  readonly a = signal(this.sortear());
  readonly b = signal(this.sortear());
  readonly resposta = signal('');
  readonly erro = signal(false);
  readonly liberado = signal(false);

  readonly mensagem = signal('');

  readonly precoExibido = computed(() => this.compras.preco() || '—');

  verificarBarreira(): void {
    const esperado = this.a() + this.b();
    if (Number(this.resposta()) === esperado) {
      this.liberado.set(true);
      this.erro.set(false);
    } else {
      this.erro.set(true);
      this.resposta.set('');
      this.a.set(this.sortear());
      this.b.set(this.sortear());
    }
  }

  async comprar(): Promise<void> {
    const ok = await this.compras.comprar();
    if (!ok) this.mensagem.set('pagamento.erro');
  }

  async restaurar(): Promise<void> {
    await this.compras.restaurar();
  }

  /** Parcelas de 2 a 9: soma sempre acima da capacidade do público-alvo. */
  private sortear(): number {
    return 2 + Math.floor(Math.random() * 8);
  }
}
