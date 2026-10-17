import type { RequestHandler } from "express";
import { getProjectPage, getYearbook, listProjects } from "../helpers/project.helper";
import { found, query, urlKey } from "../utils/public";

export const ProjectController = {
  /** GET /api/projects */
  list: (async (req, res) => {
    res.json(await query(req, listProjects));
  }) satisfies RequestHandler,

  /** GET /api/projects/:slug */
  get: (async (req, res) => {
    const slug = urlKey(req.params.slug);
    res.json(found(await query(req, (m) => getProjectPage(m, slug))));
  }) satisfies RequestHandler,

  /** GET /api/projects/:slug/yearbook */
  yearbook: (async (req, res) => {
    const slug = urlKey(req.params.slug);
    res.json(found(await query(req, (m) => getYearbook(m, slug))));
  }) satisfies RequestHandler,
};
