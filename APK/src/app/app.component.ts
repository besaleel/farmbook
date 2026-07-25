import { Component, inject, OnInit } from '@angular/core';
import { App } from '@capacitor/app';
import { I18nService } from './core/services/i18n.service';
import { SeasonalService } from './core/services/seasonal.service';
import { AudioService } from './core/services/audio.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly sazonal = inject(SeasonalService);
  private readonly audio = inject(AudioService);

  async ngOnInit(): Promise<void> {
    await this.i18n.iniciar();
    await this.sazonal.aplicar();

    // Ao voltar do segundo plano: reavalia a época e retoma a música;
    // ao sair: silencia tudo (ESPECIFICACAO § 3.4 e § 4.4).
    void App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        await this.sazonal.aplicar();
        await this.audio.retomar();
      } else {
        this.audio.pausarTudo();
      }
    });
  }
}
