import { RefreshToken } from "../../models/RefreshToken.js";
import { User } from "../../models/User.js";
import { AppError } from "../../utils/AppError.js";
import { hashToken } from "../../utils/hashToken.js";
import {
  getRefreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

function toUserResponse(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function issueTokenPair(user: {
  _id: import("mongoose").Types.ObjectId;
  email: string;
}) {
  const userId = user._id.toString();
  const accessToken = signAccessToken({ sub: userId, email: user.email });
  const refreshToken = signRefreshToken({ sub: userId });
  const tokenHash = hashToken(refreshToken);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt: getRefreshTokenExpiryDate(),
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw AppError.conflict("Email already registered");
  }

  const user = await User.create(input);
  const tokens = await issueTokenPair(user);

  return {
    user: toUserResponse(user),
    ...tokens,
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user || !(await user.comparePassword(input.password))) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const tokens = await issueTokenPair(user);
  return {
    user: toUserResponse(user),
    ...tokens,
  };
}

export async function refreshTokens(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      throw AppError.unauthorized("Refresh token expired");
    }
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({
    tokenHash,
    user: payload.sub,
  });

  if (!stored) {
    throw AppError.unauthorized("Refresh token revoked or unknown");
  }

  if (stored.expiresAt.getTime() < Date.now()) {
    await stored.deleteOne();
    throw AppError.unauthorized("Refresh token expired");
  }

  // Rotate refresh token
  await stored.deleteOne();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw AppError.unauthorized("User no longer exists");
  }

  const tokens = await issueTokenPair(user);
  return {
    user: toUserResponse(user),
    ...tokens,
  };
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const deleted = await RefreshToken.deleteOne({ tokenHash });

  if (deleted.deletedCount === 0) {
    // Idempotent logout: treat unknown token as already logged out
    return { revoked: false };
  }

  return { revoked: true };
}

export async function logoutAllSessions(userId: string) {
  const result = await RefreshToken.deleteMany({ user: userId });
  return { revokedCount: result.deletedCount ?? 0 };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return toUserResponse(user);
}
