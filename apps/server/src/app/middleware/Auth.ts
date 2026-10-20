/**
 * Guards every /api/admin/* route (task S5): needs `Authorization: Bearer <token>`
 * with a valid admin JWT, else 401.
 *
 * Every failure gets the same answer, so callers learn nothing about why.
 * The token is never logged.
 */
import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import { getConfig } from "../utils/config";
import { verifyAdminToken } from "../utils/JWT";

const BEARER = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

export const Auth: RequestHandler = async (req, res, next) => {
  const token = BEARER.exec(req.get("authorization") ?? "")?.[1];
  try {
    if (!token) throw new Error("missing");
    res.locals.admin = await verifyAdminToken(token, getConfig(req).JWT_SECRET);
  } catch {
    res.set("WWW-Authenticate", 'Bearer realm="admin"');
    return next(ApiError.unauthorized());
  }
  next();
};
