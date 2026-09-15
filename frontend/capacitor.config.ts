import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.gbgym.platform",
  appName: "GB Gym",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
}

export default config