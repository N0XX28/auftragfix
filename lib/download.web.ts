export async function downloadText(
  name: string,
  text: string,
  mime: string,
): Promise<void> {
  const url = URL.createObjectURL(
    new Blob([text], { type: mime + ";charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
