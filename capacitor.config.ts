import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.datetasks.app',
  appName: 'DateTask',
  webDir: 'build',
  /* server: {
    androidScheme: 'https',
    url: '127.0.0.1:5175',
    cleartext: true 
  }, */
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
