/**
 * URLs dos documentos legais publicados.
 *
 * Precisam ser públicas e estáveis: a Google Play Console exige a URL da
 * política de privacidade na ficha do app, e ela é verificada na revisão.
 *
 * Hospedadas em bza.tec.br, que concentra os documentos de todos os apps —
 * daí o prefixo `farmbook-` no caminho. Os documentos do Florest Book vivem
 * no mesmo domínio com o prefixo `florestbook-`: ao mexer aqui, confira que
 * a URL é a do app certo.
 */
export const URL_TERMOS = 'https://bza.tec.br/farmbook-termos-de-uso';

export const URL_PRIVACIDADE =
  'https://bza.tec.br/farmbook-politica-privacidade';

/**
 * Ficha do Florest Book na Play Store, usada pelo anúncio interno da tela
 * inicial (CrossPromoComponent). Aberta no navegador do sistema, atrás de
 * uma barreira parental.
 */
export const URL_FLOREST_BOOK =
  'https://play.google.com/store/apps/details?id=com.florestbook.app';
