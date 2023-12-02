import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notespro.app',
  appName: 'Notespro',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    url: 'http://192.168.0.106:3000',
    cleartext: true 
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
