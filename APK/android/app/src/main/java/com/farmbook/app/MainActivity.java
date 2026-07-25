package com.farmbook.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;

/**
 * Atividade principal do Farm Book.
 *
 * Aplica os sinais exigidos pela Politica para Familias do Google Play
 * (ver DOC/ESPECIFICACAO.md secao 6.1). O plugin @capacitor-community/admob
 * nao expoe tagForChildDirectedTreatment pela API JavaScript, entao a
 * marcacao precisa ser feita aqui, no nivel nativo, antes de qualquer
 * requisicao de anuncio.
 *
 * Sem isto o app e reprovado na revisao da loja, mesmo funcionando.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        RequestConfiguration configuracao = MobileAds.getRequestConfiguration()
                .toBuilder()
                // App dirigido a criancas (COPPA).
                .setTagForChildDirectedTreatment(
                        RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                // Trata o usuario como abaixo da idade de consentimento (GDPR).
                .setTagForUnderAgeOfConsent(
                        RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
                // Apenas conteudo com classificacao livre.
                .setMaxAdContentRating(
                        RequestConfiguration.MAX_AD_CONTENT_RATING_G)
                .build();

        MobileAds.setRequestConfiguration(configuracao);
    }
}
