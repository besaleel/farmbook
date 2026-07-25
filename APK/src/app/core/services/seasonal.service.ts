import { Injectable, inject } from '@angular/core';
import { BackgroundId, IdiomaId, SettingsService } from './settings.service';

interface Janela {
  tema: BackgroundId;
  inicio: Date;
  fim: Date;
  /** Se definido, o tema só entra automaticamente nesse idioma. */
  idioma?: IdiomaId;
}

/**
 * Seleção automática do cenário conforme a época do ano.
 *
 * Roda inteiramente offline, a partir da data local do aparelho
 * (ESPECIFICACAO § 4.4). A escolha manual do usuário sempre tem
 * precedência — este serviço nunca sobrescreve o que ele escolheu.
 */
@Injectable({ providedIn: 'root' })
export class SeasonalService {
  private readonly settings = inject(SettingsService);

  /**
   * Domingo de Páscoa pelo computus gregoriano (Meeus/Jones/Butcher).
   * Verificado contra as datas reais de 2024 a 2032.
   */
  domingoDePascoa(ano: number): Date {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
  }

  /**
   * Thanksgiving: 4ª quinta-feira de novembro.
   * Verificado para 2024–2028.
   */
  thanksgiving(ano: number): Date {
    const primeiro = new Date(ano, 10, 1);
    const desloca = (4 - primeiro.getDay() + 7) % 7; // 4 = quinta-feira
    return new Date(ano, 10, 1 + desloca + 21);
  }

  /**
   * Carnaval: terça-feira, 47 dias antes da Páscoa.
   * Ainda sem asset — mantido para uso futuro (ESPECIFICACAO § 4.4).
   */
  carnaval(ano: number): Date {
    const pascoa = this.domingoDePascoa(ano);
    return this.somaDias(pascoa, -47);
  }

  /**
   * Tema correspondente à data. Retorna `standard` fora de qualquer janela.
   * Havendo sobreposição, vence a janela mais curta (a mais específica).
   */
  temaDaData(data: Date, idioma: IdiomaId): BackgroundId {
    const dia = this.soData(data);
    const ano = dia.getFullYear();
    const pascoa = this.domingoDePascoa(ano);

    const janelas: Janela[] = [
      {
        tema: 'pascoa',
        inicio: this.somaDias(pascoa, -7),
        fim: this.somaDias(pascoa, 1),
      },
      {
        tema: 'festejunina',
        inicio: new Date(ano, 5, 1),
        fim: new Date(ano, 5, 30),
        idioma: 'pt',
      },
      {
        tema: 'halloween',
        inicio: new Date(ano, 9, 24),
        fim: new Date(ano, 9, 31),
      },
      {
        tema: 'thanksgiving',
        inicio: this.somaDias(this.thanksgiving(ano), -7),
        fim: this.thanksgiving(ano),
        idioma: 'en',
      },
      {
        tema: 'natalino',
        inicio: new Date(ano, 11, 1),
        fim: new Date(ano, 11, 31),
      },
    ];

    const ativas = janelas
      .filter((j) => !j.idioma || j.idioma === idioma)
      .filter((j) => dia >= this.soData(j.inicio) && dia <= this.soData(j.fim))
      .sort((x, y) => this.duracao(x) - this.duracao(y));

    return ativas.length ? ativas[0].tema : 'standard';
  }

  /**
   * Aplica o tema da data atual, respeitando a escolha manual do usuário.
   * Chamado na abertura do app e ao voltar do segundo plano.
   */
  async aplicar(agora: Date = new Date()): Promise<void> {
    if (this.settings.backgroundManual()) return;
    const tema = this.temaDaData(agora, this.settings.idioma());
    await this.settings.aplicarBackgroundSazonal(tema);
  }

  private duracao(j: Janela): number {
    return this.soData(j.fim).getTime() - this.soData(j.inicio).getTime();
  }

  private soData(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private somaDias(d: Date, dias: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);
  }
}
