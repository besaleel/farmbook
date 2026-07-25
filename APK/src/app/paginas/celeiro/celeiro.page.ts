import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { Animal, AnimalId } from '../../core/models/animal.model';
import { AnimalService } from '../../core/services/animal.service';
import { AudioService } from '../../core/services/audio.service';
import { I18nService } from '../../core/services/i18n.service';
import {
  BackgroundId,
  IdiomaId,
  SettingsService,
} from '../../core/services/settings.service';
import { FaixaAnimalComponent } from '../../componentes/faixa-animal/faixa-animal.component';
import { PagamentoComponent } from '../../componentes/pagamento/pagamento.component';
import { AdsService } from '../../core/services/ads.service';
import { PurchaseService } from '../../core/services/purchase.service';

const BACKGROUNDS: BackgroundId[] = [
  'standard',
  'festejunina',
  'halloween',
  'thanksgiving',
  'natalino',
  'pascoa',
];

/** Tempo que a faixa do nome permanece visível (ESPECIFICACAO § 4.2). */
const DURACAO_FAIXA_MS = 3000;

/** Duração da animação de reação ao toque. */
const DURACAO_REACAO_MS = 600;

type PainelAberto = 'idioma' | 'background' | null;

@Component({
  selector: 'fb-celeiro',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    TranslatePipe,
    FaixaAnimalComponent,
    PagamentoComponent,
  ],
  templateUrl: './celeiro.page.html',
  styleUrls: ['./celeiro.page.scss'],
})
export class CeleiroPage implements OnInit, OnDestroy {
  private readonly animalService = inject(AnimalService);
  readonly settings = inject(SettingsService);
  readonly audio = inject(AudioService);
  readonly i18n = inject(I18nService);
  readonly ads = inject(AdsService);
  readonly compras = inject(PurchaseService);

  readonly mostrarPagamento = signal(false);

  readonly animais = this.animalService.listar();
  readonly backgrounds = BACKGROUNDS;

  readonly animalNaFaixa = signal<Animal | null>(null);
  readonly faixaVisivel = signal(false);
  readonly reagindo = signal<AnimalId | null>(null);
  readonly painel = signal<PainelAberto>(null);

  readonly caminhoDoFundo = computed(
    () => `assets/backgrounds/${this.settings.background()}.webp`
  );

  private timerFaixa: ReturnType<typeof setTimeout> | null = null;
  private timerReacao: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    await this.settings.carregar();
    this.audio.precarregar(this.animalService.caminhosDeSom());

    // Anúncios e billing nunca bloqueiam o jogo: falham em silêncio.
    void this.compras.iniciar();
    if (!this.settings.removeAds()) void this.ads.mostrarBanner();
  }

  ngOnDestroy(): void {
    this.limparTimers();
  }

  /**
   * Toque no animal: som + reação + faixa com o nome.
   * Tocar outro animal reinicia a faixa e interrompe o som anterior.
   */
  tocarAnimal(animal: Animal): void {
    this.audio.tocarEfeito(animal.som);

    this.reagindo.set(animal.id);
    if (this.timerReacao) clearTimeout(this.timerReacao);
    this.timerReacao = setTimeout(
      () => this.reagindo.set(null),
      DURACAO_REACAO_MS
    );

    this.animalNaFaixa.set(animal);
    this.faixaVisivel.set(true);
    if (this.timerFaixa) clearTimeout(this.timerFaixa);
    this.timerFaixa = setTimeout(
      () => this.faixaVisivel.set(false),
      DURACAO_FAIXA_MS
    );
  }

  alternarPainel(qual: Exclude<PainelAberto, null>): void {
    this.painel.set(this.painel() === qual ? null : qual);
  }

  async escolherIdioma(id: IdiomaId): Promise<void> {
    await this.i18n.usar(id);
    this.painel.set(null);
  }

  async escolherBackground(id: BackgroundId): Promise<void> {
    await this.settings.definirBackground(id);
    this.painel.set(null);
  }

  async alternarSom(): Promise<void> {
    await this.settings.definirSom(!this.settings.som());
  }

  /** Primeira letra do nome, usada no avatar. */
  readonly inicial = computed(() => {
    const nome = this.settings.nome().trim();
    return nome ? nome[0].toUpperCase() : '🙂';
  });

  private limparTimers(): void {
    if (this.timerFaixa) clearTimeout(this.timerFaixa);
    if (this.timerReacao) clearTimeout(this.timerReacao);
  }
}
