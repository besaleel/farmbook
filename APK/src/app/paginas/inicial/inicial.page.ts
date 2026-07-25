import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { Browser } from '@capacitor/browser';

import { AudioService } from '../../core/services/audio.service';
import { I18nService } from '../../core/services/i18n.service';
import { IdiomaId, SettingsService } from '../../core/services/settings.service';
import { AnimalService } from '../../core/services/animal.service';
import { URL_PRIVACIDADE, URL_TERMOS } from '../../core/legal';

@Component({
  selector: 'fb-inicial',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, TranslatePipe],
  templateUrl: './inicial.page.html',
  styleUrls: ['./inicial.page.scss'],
})
export class InicialPage implements OnInit {
  private readonly router = inject(Router);
  private readonly animais = inject(AnimalService);
  readonly settings = inject(SettingsService);
  readonly i18n = inject(I18nService);
  readonly audio = inject(AudioService);

  readonly nome = signal('');
  readonly mostrarIdiomas = signal(false);

  /** Bandeira do idioma ativo, exibida no botão de troca. */
  readonly bandeiraAtual = computed(
    () => this.i18n.idiomas.find((i) => i.id === this.settings.idioma())?.bandeira ?? '🌐'
  );

  async ngOnInit(): Promise<void> {
    await this.settings.carregar();
    this.nome.set(this.settings.nome());
    // Pré-carrega os efeitos aqui para o primeiro toque no celeiro
    // responder sem atraso perceptível.
    this.audio.precarregar(this.animais.caminhosDeSom());
  }

  async escolherIdioma(id: IdiomaId): Promise<void> {
    await this.i18n.usar(id);
    this.mostrarIdiomas.set(false);
  }

  async alternarMusica(): Promise<void> {
    await this.audio.alternarMusica(!this.settings.musica());
  }

  /**
   * Abre os documentos legais no **navegador do sistema**, e não dentro do
   * app. A Política para Famílias exige que links externos saiam do contexto
   * do jogo (ESPECIFICACAO § 6.1); o Capacitor Browser usa Custom Tabs no
   * Android, que deixa a barra de endereço visível para o adulto.
   */
  async abrirLegal(qual: 'termos' | 'privacidade'): Promise<void> {
    const url = qual === 'termos' ? URL_TERMOS : URL_PRIVACIDADE;
    try {
      await Browser.open({ url, presentationStyle: 'popover' });
    } catch {
      // Sem navegador disponível (ou rodando no desktop durante o dev).
      window.open(url, '_blank', 'noopener');
    }
  }

  async comecar(): Promise<void> {
    await this.settings.definirNome(this.nome());
    // A primeira interação do usuário destrava o autoplay do navegador.
    await this.audio.iniciarMusica();
    await this.router.navigateByUrl('/celeiro');
  }
}
