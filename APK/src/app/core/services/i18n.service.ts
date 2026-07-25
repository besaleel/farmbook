import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IdiomaId, IDIOMAS, SettingsService } from './settings.service';

/**
 * Ponte entre as preferências e o ngx-translate.
 *
 * Os arquivos de tradução ficam em `assets/i18n/*.json` e são carregados
 * localmente — o jogo é offline (ESPECIFICACAO § 1).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly settings = inject(SettingsService);

  readonly idiomas = IDIOMAS;

  async iniciar(): Promise<void> {
    await this.settings.carregar();
    const idioma = this.settings.idioma();
    this.translate.addLangs(IDIOMAS.map((i) => i.id));
    await this.usar(idioma);
  }

  async usar(idioma: IdiomaId): Promise<void> {
    this.translate.use(idioma);
    document.documentElement.lang = idioma;
    await this.settings.definirIdioma(idioma);
  }

  instantaneo(chave: string, params?: Record<string, unknown>): string {
    return this.translate.instant(chave, params);
  }

  /** Nome do animal já silabado no idioma ativo (ex.: "VA-CA"). */
  nomeDoAnimal(id: string): string {
    return this.translate.instant(`animais.${id}`);
  }
}
