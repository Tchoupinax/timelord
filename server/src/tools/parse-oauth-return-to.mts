export const localOAuthRedirectUri = "http://localhost:9988/callback";

export function isLocalOAuthReturnTo(url: URL): boolean {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

export function resolveOAuthRedirectUri(
  returnTo: URL | null,
  apiUrl: string,
): string {
  if (returnTo && isLocalOAuthReturnTo(returnTo)) {
    return localOAuthRedirectUri;
  }

  const normalizedApiUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
  return `${normalizedApiUrl}/callback`;
}

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
