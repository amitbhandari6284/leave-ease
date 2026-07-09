import jwt from "jsonwebtoken";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return process.env.JWT_SECRET;
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}

export async function verifyAccessToken(token) {
  const decoded = await jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
  return decoded;
}
