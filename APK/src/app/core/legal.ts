/**
 * URLs dos documentos legais publicados.
 *
 * Precisam ser públicas e estáveis: a Google Play Console exige a URL da
 * política de privacidade na ficha do app, e ela é verificada na revisão.
 *
 * Observação: o caminho contém "bananaking" por reaproveitar a hospedagem de
 * outro projeto. O conteúdo dos arquivos é o do Farm Book — conferido contra
 * os originais em DEPLOY/.
 */
export const URL_TERMOS =
  'https://contaasbencaos.com.br/bananaking/termos-de-uso.html';

export const URL_PRIVACIDADE =
  'https://contaasbencaos.com.br/bananaking/politica-privacidade.html';

/**
 * Ficha do Florest Book na Play Store, usada pelo anúncio interno da tela
 * inicial (CrossPromoComponent). Aberta no navegador do sistema, atrás de
 * uma barreira parental.
 */
export const URL_FLOREST_BOOK =
  'https://play.google.com/store/apps/details?id=com.florestbook.app';
