import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unimisk.kidzopedia',
  appName: 'Kidzopedia',
  // Capacitor bundles the SAME Vite build (dist/) — the UI is 100% identical to the web app.
  webDir: 'dist',
  android: {
    // Serve from https://localhost inside the WebView so Supabase (HTTPS) and
    // secure cookies/storage behave exactly like the deployed web app.
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
