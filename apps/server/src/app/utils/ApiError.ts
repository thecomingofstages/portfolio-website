/**
 * Throw this anywhere to answer with a status and `{ "error": "<message>" }`
 * (docs/API.md "Rules for every public response").
 * The message goes to the caller: never put names, photos or secrets in it.
 */
export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message = "Bad request") { return new ApiError(400, message); }
  static unauthorized(message = "Unauthorized") { return new ApiError(401, message); }
  static notFound(message = "Not found") { return new ApiError(404, message); }
  static conflict(message = "Conflict") { return new ApiError(409, message); }
  static unavailable(message = "Service unavailable") { return new ApiError(503, message); }
}
