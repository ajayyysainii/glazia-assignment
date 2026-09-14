import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string;
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type" | "jti">) {
  return jwt.sign(
    { ...payload, type: "refresh", jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return payload;
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
  ) as RefreshTokenPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload;
}

/** Convert values like 15m / 7d / 1h into milliseconds. */
export function durationToMs(duration: string) {
  const match = /^(\d+)([smhd])$/i.exec(duration.trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? multipliers.d);
}

export function getRefreshTokenExpiryDate() {
  return new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));
}
