export function parseOAuthReturnTo(
  raw: string | undefined,
  uiUrl: string,
): URL | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const uiOrigin = new URL(uiUrl).origin;
    if (url.origin === uiOrigin) {
      return url;
    }

    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

export function cookieSecureForUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
