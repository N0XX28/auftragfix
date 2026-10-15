import { Share } from "react-native";
export async function downloadText(
  name: string,
  text: string,
  _mime: string,
): Promise<void> {
  await Share.share({ title: name, message: text });
}
