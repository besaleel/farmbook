import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type IdiomaId = 'pt' | 'en' | 'es' | 'fr' | 'it' | 'de';

export type BackgroundId =
  | 'standard'
  | 'halloween'
  | 'natalino'
  | 'pascoa'
  | 'thanksgiving'
  | 'festejunina';

export const IDIOMAS: { id: IdiomaId; rotulo: string; bandeira: string }[] = [
  { id: 'pt', rotulo: 'Português', bandeira: '🇧🇷' },
  { id: 'en', rotulo: 'English', bandeira: '🇺🇸' },
  { id: 'es', rotulo: 'Español', bandeira: '🇪🇸' },
  { id: 'fr', rotulo: 'Français', bandeira: '🇫🇷' },
  { id: 'it', rotulo: 'Italiano', bandeira: '🇮🇹' },
  { id: 'de', rotulo: 'Deutsch', bandeira: '🇩🇪' },
];

const CHAVES = {
  nome: 'fb_nome',
  idioma: 'fb_idioma',
  som: 'fb_som',
  musica: 'fb_musica',
  background: 'fb_background',
  backgroundManual: 'fb_background_manual',
  removeAds: 'fb_remove_ads',
} as const;

/**
 * Preferências persistidas do jogo.
 *
 * Usa Capacitor Preferences (nativo) e expõe signals para a UI reagir.
 * Tudo fica apenas no aparelho — nenhum dado sai do dispositivo, o que é
 * exigência da política Designed for Families (ESPECIFICACAO § 6).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly nome = signal<string>('');
  readonly idioma = signal<IdiomaId>('en');
  readonly som = signal<boolean>(true);
  readonly musica = signal<boolean>(true);
  readonly background = signal<BackgroundId>('standard');

  /**
   * Verdadeiro assim que o usuário escolhe um background pelo seletor.
   * A partir daí o tema sazonal nunca sobrescreve a escolha
   * — ver ESPECIFICACAO § 4.4.
   */
  readonly backgroundManual = signal<boolean>(false);

  readonly removeAds = signal<boolean>(false);

  /**
   * Falso até `carregar()` terminar. A UI usa isto para não exibir nada que
   * dependa de uma preferência ainda desconhecida — sem ele, quem comprou
   * "remover anúncios" veria a publicidade piscar antes de sumir.
   */
  readonly carregado = signal<boolean>(false);

  private pronto = false;

  async carregar(): Promise<void> {
    if (this.pronto) return;

    const [nome, idioma, som, musica, bg, bgManual, ads] = await Promise.all([
      Preferences.get({ key: CHAVES.nome }),
      Preferences.get({ key: CHAVES.idioma }),
      Preferences.get({ key: CHAVES.som }),
      Preferences.get({ key: CHAVES.musica }),
      Preferences.get({ key: CHAVES.background }),
      Preferences.get({ key: CHAVES.backgroundManual }),
      Preferences.get({ key: CHAVES.removeAds }),
    ]);

    if (nome.value) this.nome.set(nome.value);
    this.idioma.set(this.idiomaValido(idioma.value) ?? this.idiomaDoAparelho());
    if (som.value !== null) this.som.set(som.value === 'true');
    if (musica.value !== null) this.musica.set(musica.value === 'true');
    if (bg.value) this.background.set(bg.value as BackgroundId);
    this.backgroundManual.set(bgManual.value === 'true');
    this.removeAds.set(ads.value === 'true');

    this.pronto = true;
    this.carregado.set(true);
  }

  async definirNome(valor: string): Promise<void> {
    const limpo = valor.trim().slice(0, 20);
    this.nome.set(limpo);
    await Preferences.set({ key: CHAVES.nome, value: limpo });
  }

  async definirIdioma(valor: IdiomaId): Promise<void> {
    this.idioma.set(valor);
    await Preferences.set({ key: CHAVES.idioma, value: valor });
  }

  async definirSom(ativo: boolean): Promise<void> {
    this.som.set(ativo);
    await Preferences.set({ key: CHAVES.som, value: String(ativo) });
  }

  async definirMusica(ativa: boolean): Promise<void> {
    this.musica.set(ativa);
    await Preferences.set({ key: CHAVES.musica, value: String(ativa) });
  }

  /**
   * Troca feita pelo usuário no seletor. Marca a escolha como manual,
   * blindando-a contra a troca automática por época do ano.
   */
  async definirBackground(valor: BackgroundId): Promise<void> {
    this.background.set(valor);
    this.backgroundManual.set(true);
    await Promise.all([
      Preferences.set({ key: CHAVES.background, value: valor }),
      Preferences.set({ key: CHAVES.backgroundManual, value: 'true' }),
    ]);
  }

  /**
   * Troca automática por sazonalidade. Não marca como manual, para que o
   * tema continue acompanhando as épocas enquanto o usuário não escolher.
   */
  async aplicarBackgroundSazonal(valor: BackgroundId): Promise<void> {
    if (this.backgroundManual()) return;
    this.background.set(valor);
    await Preferences.set({ key: CHAVES.background, value: valor });
  }

  async definirRemoveAds(comprado: boolean): Promise<void> {
    this.removeAds.set(comprado);
    await Preferences.set({ key: CHAVES.removeAds, value: String(comprado) });
  }

  private idiomaValido(valor: string | null): IdiomaId | null {
    return IDIOMAS.some((i) => i.id === valor) ? (valor as IdiomaId) : null;
  }

  /** Idioma do aparelho no primeiro uso; recuo para EN (ESPECIFICACAO § 2.6). */
  private idiomaDoAparelho(): IdiomaId {
    const bruto = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return this.idiomaValido(bruto) ?? 'en';
  }
}
