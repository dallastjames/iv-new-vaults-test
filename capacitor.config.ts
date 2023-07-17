import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.dallastjames.ionic.iv.newvault",
  appName: "iv-new-vault",
  webDir: "dist",
  server: {
    url: "http://192.168.1.176:5173",
    cleartext: true,
  },
};

export default config;
