function getSameSiteValue() {
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();

  if (!["lax", "strict", "none"].includes(sameSite)) {
    return "lax";
  }

  return sameSite;
}

function getSecureValue() {
  if (process.env.COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.COOKIE_SECURE === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getSharedCookieOptions() {
  return {
    httpOnly: true,
    secure: getSecureValue(),
    sameSite: getSameSiteValue(),
    path: "/",
  };
}

export function getAuthCookieOptions() {
  const expiresInDays = Number(process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 7);

  return {
    ...getSharedCookieOptions(),

    maxAge: expiresInDays * 24 * 60 * 60 * 1000,
  };
}

export function getClearCookiesOptions() {
  return getSharedCookieOptions();
}
