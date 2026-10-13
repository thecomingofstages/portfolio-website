/**
 * Checks a request against zod schemas before the controller runs, and replaces
 * params/query/body with the parsed values. A failure answers 400 through ErrorHandler.
 *
 *   router.get("/projects/:slug", Validate({ params: slugParams }), ProjectController.get);
 */
import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

type Schemas = { params?: ZodTypeAny; query?: ZodTypeAny; body?: ZodTypeAny };

export function Validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    // req.query is a getter in Express 5: keep the parsed query on res.locals.
    if (schemas.query) res.locals.query = schemas.query.parse(req.query);
    next();
  };
}
