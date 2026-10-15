import { Asset } from "expo-asset";

export function loadInvoiceFontAssets(): Promise<Asset[]> {
  return Asset.loadAsync([
    require("../assets/fonts/DejaVuSans.ttf"),
    require("../assets/fonts/DejaVuSans-Bold.ttf"),
  ]);
}
