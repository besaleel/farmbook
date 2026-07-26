import { Injectable } from '@angular/core';
import { Animal, AnimalId } from '../models/animal.model';

/**
 * Catálogo dos animais do jogo.
 *
 * As posições são percentuais da área jogável — a caixa 2:3 do cenário menos
 * a tira coberta pelo rodapé — para a composição sobreviver a qualquer
 * proporção de aparelho (ESPECIFICACAO § 5). Ancorar no cenário, e não na
 * tela, é o que impede os animais de descolarem da cerca em telas mais
 * altas; descontar o rodapé é o que faz `y: 50%` cair no centro do que se vê.
 *
 * Os valores vêm da calibração original, deslocados 2 pontos (~25px) para
 * baixo: os animais assentam melhor no chão um pouco abaixo de onde estavam.
 *
 * `rostoX` / `rostoY` foram calibrados por animal a partir da posição real
 * da cabeça em cada imagem já recortada — as proporções variam bastante
 * (o cavalo é estreito e alto; a gatinha, larga e baixa).
 */
@Injectable({ providedIn: 'root' })
export class AnimalService {
  private readonly animais: Animal[] = [
    {
      id: 'vaca',
      imagem: 'assets/animais/vaca.webp',
      som: 'assets/sounds/vaca.mp3',
      x: 24,
      y: 55,
      largura: 19,
      rostoX: 49,
      rostoY: 0,
      rostoZoom: 1.0,
      idleDuracao: 3.4,
      idleAtraso: 0,
    },
    {
      id: 'cavalo',
      imagem: 'assets/animais/cavalo.webp',
      som: 'assets/sounds/cavalo.mp3',
      x: 75,
      y: 58,
      largura: 15,
      rostoX: 42,
      rostoY: 0,
      rostoZoom: 1.09,
      idleDuracao: 4.1,
      idleAtraso: 0.7,
    },
    {
      id: 'porco',
      imagem: 'assets/animais/porco.webp',
      som: 'assets/sounds/porco.mp3',
      x: 23,
      y: 75,
      largura: 19,
      rostoX: 50,
      rostoY: 0,
      rostoZoom: 1.0,
      idleDuracao: 3.7,
      idleAtraso: 1.4,
    },
    {
      id: 'ovelha',
      imagem: 'assets/animais/ovelha.webp',
      som: 'assets/sounds/ovelha.mp3',
      x: 50,
      y: 64,
      largura: 18,
      rostoX: 55,
      rostoY: 0,
      rostoZoom: 1.0,
      idleDuracao: 4.5,
      idleAtraso: 2.1,
    },
    {
      id: 'gatinha',
      imagem: 'assets/animais/gatinha.webp',
      som: 'assets/sounds/gatinha.mp3',
      x: 78,
      y: 78,
      largura: 16,
      rostoX: 42,
      rostoY: 0,
      rostoZoom: 1.15,
      idleDuracao: 3.9,
      idleAtraso: 0.35,
    },
    {
      id: 'galinha',
      imagem: 'assets/animais/galinha.webp',
      som: 'assets/sounds/galinha.mp3',
      x: 47,
      y: 89,
      largura: 14,
      rostoX: 71,
      rostoY: 0,
      rostoZoom: 1.41,
      idleDuracao: 3.1,
      idleAtraso: 1.8,
    },
  ];

  listar(): Animal[] {
    return this.animais;
  }

  porId(id: AnimalId): Animal | undefined {
    return this.animais.find((a) => a.id === id);
  }

  /** Caminhos de todos os sons — usado para pré-carregar o áudio. */
  caminhosDeSom(): string[] {
    return this.animais.map((a) => a.som);
  }
}
