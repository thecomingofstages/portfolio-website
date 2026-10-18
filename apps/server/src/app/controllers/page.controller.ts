import type { RequestHandler } from "express";
import { getPage } from "../helpers/page.helper";
import { found, query } from "../utils/public";

export const PageController = {
  /** GET /api/pages/home */
  home: (async (req, res) => {
    res.json(found(await query(req, (m) => getPage(m, "home"))));
  }) satisfies RequestHandler,
};
