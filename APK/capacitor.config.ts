import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.farmbook.app',
  appName: 'Farm Book',
  webDir: 'www',
  android: {
    // O jogo é offline; nenhum conteúdo remoto é carregado.
    allowMixedContent: false
  }
};

export default config;
