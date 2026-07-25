/** Identificadores dos animais — usados como chave de asset e de tradução. */
export type AnimalId = 'cavalo' | 'galinha' | 'gatinha' | 'ovelha' | 'porco' | 'vaca';

export interface Animal {
  id: AnimalId;

  /** Caminho da imagem WebP com transparência. */
  imagem: string;

  /** Caminho do efeito sonoro. */
  som: string;

  /**
   * Posição do centro do animal no palco, em porcentagem.
   * Percentual (e não pixel) para a composição sobreviver a qualquer
   * proporção de tela — ver ESPECIFICACAO § 5.
   */
  x: number;
  y: number;

  /** Largura do animal em % da largura do palco. A altura segue a proporção. */
  largura: number;

  /**
   * Enquadramento do rosto no círculo da faixa, via `object-position`
   * (ESPECIFICACAO § 4.2).
   *
   * Atenção: `object-position` usa porcentagem do **excedente** recortado
   * pelo `object-fit: cover`, não da imagem. Como os PNGs são retrato
   * (~474x768) dentro de um círculo quadrado, o excedente vertical é de
   * poucas dezenas de pixels — por isso `rostoY` fica em 0% para quase
   * todos: a cabeça já está no topo.
   *
   * Valores calibrados medindo a silhueta real de cada animal
   * (`tools/` + análise do canal alfa), não estimados.
   */
  rostoX: number;
  rostoY: number;

  /**
   * Zoom sobre o rosto já enquadrado, para a cabeça ocupar ~78% do círculo.
   * Fica entre 1,0 e ~1,4: animais de cabeça larga (vaca, porco, ovelha)
   * não precisam de zoom; os de cabeça estreita ou deslocada (galinha,
   * gatinha, cavalo) precisam de um pouco.
   */
  rostoZoom: number;

  /** Duração da animação idle, em segundos. Variada para não pulsarem juntos. */
  idleDuracao: number;

  /** Atraso inicial da animação idle, em segundos. */
  idleAtraso: number;
}
