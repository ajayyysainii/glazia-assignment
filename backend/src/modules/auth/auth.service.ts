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
    throw new AppError("Email already registered", 409);
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
    throw new AppError("Invalid email or password", 401);
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
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await RefreshToken.findOne({
    tokenHash,
    user: payload.sub,
  });

  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Rotate refresh token
  await stored.deleteOne();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError("User not found", 401);
  }

  const tokens = await issueTokenPair(user);
  return {
    user: toUserResponse(user),
    ...tokens,
  };
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.deleteOne({ tokenHash });
}

export async function logoutAllSessions(userId: string) {
  await RefreshToken.deleteMany({ user: userId });
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toUserResponse(user);
}
