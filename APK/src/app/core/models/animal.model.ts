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
   * Recorte do rosto para o círculo da faixa, em porcentagem da imagem.
   * Alimenta `object-position` no CSS, evitando gerar assets extras
   * — ver ESPECIFICACAO § 4.2.
   */
  rostoX: number;
  rostoY: number;

  /**
   * Escala do zoom aplicado no círculo do rosto. Valores maiores aproximam
   * mais a cabeça; calibrado por animal, pois as proporções variam.
   */
  rostoZoom: number;

  /** Duração da animação idle, em segundos. Variada para não pulsarem juntos. */
  idleDuracao: number;

  /** Atraso inicial da animação idle, em segundos. */
  idleAtraso: number;
}
