// Del en lenke fra nettleseren: telefonens delemeny (Web Share API) når den
// finnes, ellers kopiering til utklippstavlen. Kun nettleser.

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Åpner delemenyen, eller kopierer `url` hvis delemenyen mangler/avvises.
 *  «cancelled» = brukeren lukket delemenyen selv. */
export async function shareLink({ title, url }: { title?: string; url: string }): Promise<ShareResult> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // NotAllowedError o.l. (f.eks. utløpt brukerhandling): prøv kopiering.
    }
  }
  return (await copyText(url)) ? "copied" : "failed";
}

/** Kopierer tekst til utklippstavlen. false hvis nettleseren nekter. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
