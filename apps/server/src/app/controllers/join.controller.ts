import type { RequestHandler } from "express";
import { listOpenRounds } from "../helpers/join.helper";
import { query } from "../utils/public";

export const JoinController = {
  /** GET /api/join: [] when no round is open. */
  list: (async (req, res) => {
    const now = new Date();
    res.json(await query(req, (m) => listOpenRounds(m, now)));
  }) satisfies RequestHandler,
};
