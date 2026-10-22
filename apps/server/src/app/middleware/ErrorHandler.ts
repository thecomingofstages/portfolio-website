/**
 * The last middleware. Known errors get their status; anything else is a 500 with
 * a generic message, so stack traces and database details never reach the caller.
 */
import type { ErrorRequestHandler, RequestHandler } from "express";
import { MongoServerError } from "mongodb";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { Logger } from "../utils/Logger";

export const NotFound: RequestHandler = (_req, _res, next) => {
  next(ApiError.notFound());
};

export const ErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const send = (status: number, error: string) => res.status(status).json({ error });

  if (err instanceof ApiError) return send(err.status, err.message);

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const where = issue?.path.join(".");
    // Unknown fields have no path; their message names them ("Unrecognized key(s) in object: 'phone'").
    return send(400, where ? `${where}: ${issue?.message}` : (issue?.message ?? "Invalid request"));
  }

  // Document failed validation (docs/API.md "Database access").
  if (err instanceof MongoServerError && err.code === 121) return send(400, "Document failed validation");
  // Unique index (slug, key): two writes raced for the same value.
  if (err instanceof MongoServerError && err.code === 11000) return send(409, "Already exists");

  // From express.json().
  if (err?.type === "entity.parse.failed") return send(400, "Invalid JSON");
  if (err?.type === "entity.too.large") return send(413, "Request body too large");

  Logger.error("Unhandled error", err, { method: req.method, path: req.path });
  return send(500, "Internal server error");
};
