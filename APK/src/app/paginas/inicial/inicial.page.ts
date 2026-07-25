import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';

import { AudioService } from '../../core/services/audio.service';
import { I18nService } from '../../core/services/i18n.service';
import { IdiomaId, SettingsService } from '../../core/services/settings.service';
import { AnimalService } from '../../core/services/animal.service';

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

  async comecar(): Promise<void> {
    await this.settings.definirNome(this.nome());
    // A primeira interação do usuário destrava o autoplay do navegador.
    await this.audio.iniciarMusica();
    await this.router.navigateByUrl('/celeiro');
  }
}
