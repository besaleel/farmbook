import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

const VOLUME_MUSICA = 0.25;
const VOLUME_MUSICA_DUCK = 0.06;
const CAMINHO_MUSICA = 'assets/sounds/background-music.mp3';

/**
 * Áudio do jogo: efeitos dos animais e música de fundo.
 *
 * Regras (ESPECIFICACAO § 3.4):
 *  - um som por vez: tocar outro animal interrompe o anterior;
 *  - a música abaixa de volume (duck) enquanto o animal soa;
 *  - respeita os interruptores de som e música;
 *  - tudo local, sem rede.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly settings = inject(SettingsService);

  private readonly efeitos = new Map<string, HTMLAudioElement>();
  private tocando: HTMLAudioElement | null = null;
  private musica: HTMLAudioElement | null = null;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;

  /** Carrega os efeitos na memória para o toque responder sem atraso. */
  precarregar(caminhos: string[]): void {
    for (const caminho of caminhos) {
      if (this.efeitos.has(caminho)) continue;
      const a = new Audio(caminho);
      a.preload = 'auto';
      a.load();
      this.efeitos.set(caminho, a);
    }
  }

  tocarEfeito(caminho: string): void {
    if (!this.settings.som()) return;

    // Interrompe o som anterior — nunca dois animais ao mesmo tempo.
    if (this.tocando) {
      this.tocando.pause();
      this.tocando.currentTime = 0;
    }

    const audio = this.efeitos.get(caminho) ?? new Audio(caminho);
    this.efeitos.set(caminho, audio);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Navegador pode bloquear áudio antes da primeira interação: ignorar.
    });
    this.tocando = audio;

    this.duck(audio);
  }

  async iniciarMusica(): Promise<void> {
    if (!this.settings.musica()) return;
    if (!this.musica) {
      this.musica = new Audio(CAMINHO_MUSICA);
      this.musica.loop = true;
      this.musica.volume = VOLUME_MUSICA;
    }
    try {
      await this.musica.play();
    } catch {
      // Sem música disponível ainda (asset pendente) ou bloqueio de autoplay.
    }
  }

  pararMusica(): void {
    this.musica?.pause();
  }

  async alternarMusica(ativa: boolean): Promise<void> {
    await this.settings.definirMusica(ativa);
    if (ativa) await this.iniciarMusica();
    else this.pararMusica();
  }

  /** Silencia tudo — usado quando o app vai a segundo plano. */
  pausarTudo(): void {
    this.tocando?.pause();
    this.musica?.pause();
  }

  async retomar(): Promise<void> {
    if (this.settings.musica()) await this.iniciarMusica();
  }

  /** Abaixa a música enquanto o efeito toca e restaura ao terminar. */
  private duck(efeito: HTMLAudioElement): void {
    if (!this.musica || this.musica.paused) return;

    this.musica.volume = VOLUME_MUSICA_DUCK;
    if (this.duckTimer) clearTimeout(this.duckTimer);

    const restaurar = () => {
      if (this.musica) this.musica.volume = VOLUME_MUSICA;
    };

    // `duration` pode ser NaN antes dos metadados carregarem; 3 s cobre o
    // maior efeito (galinha, 2,99 s).
    const dur = Number.isFinite(efeito.duration) ? efeito.duration : 3;
    this.duckTimer = setTimeout(restaurar, dur * 1000 + 150);
  }
}
