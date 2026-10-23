/**
 * Thin HTTP layer for the admin API (task S6): one handler set per spec.
 * create answers 201 with the saved document or item; delete answers 204.
 */
import type { Request, RequestHandler, Router } from "express";
import type { WriteContext } from "../../helpers/admin/checks.helper";
import * as crud from "../../helpers/admin/crud.helper";
import type { DocSpec, ItemSpec } from "../../helpers/admin/crud.helper";
import { getConfig } from "../../utils/config";
import { query } from "../../utils/public";

const ctx = (req: Request): WriteContext => {
  const config = getConfig(req);
  return { bucket: config.MEDIA_BUCKET, mediaBaseUrl: config.MEDIA_BASE_URL };
};
const p = (req: Request, name: string) => String(req.params[name]);

/** GET, POST on `path`; GET, PUT, PATCH, DELETE on `path/:id`. */
export function docRoutes(router: Router, path: string, spec: DocSpec) {
  const one = `${path}/:id`;
  router.get(path, (async (req, res) => {
    res.json(await query(req, (m) => crud.listDocs(m, spec)));
  }) satisfies RequestHandler);
  router.post(path, (async (req, res) => {
    res.status(201).json(await query(req, (m) => crud.createDoc(m, ctx(req), spec, req.body)));
  }) satisfies RequestHandler);
  router.get(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.getDoc(m, spec, p(req, "id"))));
  }) satisfies RequestHandler);
  router.put(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.replaceDoc(m, ctx(req), spec, p(req, "id"), req.body, false)));
  }) satisfies RequestHandler);
  router.patch(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.replaceDoc(m, ctx(req), spec, p(req, "id"), req.body, true)));
  }) satisfies RequestHandler);
  router.delete(one, (async (req, res) => {
    await query(req, (m) => crud.deleteDoc(m, ctx(req), spec, p(req, "id")));
    res.status(204).end();
  }) satisfies RequestHandler);
}

/** The same six routes for one list inside a document: `path` contains `:id`, items are `/:itemId`. */
export function itemRoutes(router: Router, path: string, spec: ItemSpec) {
  const one = `${path}/:itemId`;
  router.get(path, (async (req, res) => {
    res.json(await query(req, (m) => crud.listItems(m, spec, p(req, "id"))));
  }) satisfies RequestHandler);
  router.post(path, (async (req, res) => {
    res.status(201).json(await query(req, (m) => crud.createItem(m, ctx(req), spec, p(req, "id"), req.body)));
  }) satisfies RequestHandler);
  router.get(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.getItem(m, spec, p(req, "id"), p(req, "itemId"))));
  }) satisfies RequestHandler);
  router.put(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.replaceItem(m, ctx(req), spec, p(req, "id"), p(req, "itemId"), req.body, false)));
  }) satisfies RequestHandler);
  router.patch(one, (async (req, res) => {
    res.json(await query(req, (m) => crud.replaceItem(m, ctx(req), spec, p(req, "id"), p(req, "itemId"), req.body, true)));
  }) satisfies RequestHandler);
  router.delete(one, (async (req, res) => {
    await query(req, (m) => crud.deleteItem(m, ctx(req), spec, p(req, "id"), p(req, "itemId")));
    res.status(204).end();
  }) satisfies RequestHandler);
}

/** GET and PUT the whole blocks array: `path` contains `:id`. */
export function blockRoutes(router: Router, path: string, spec: DocSpec) {
  router.get(path, (async (req, res) => {
    res.json(await query(req, (m) => crud.getBlocks(m, spec, p(req, "id"))));
  }) satisfies RequestHandler);
  router.put(path, (async (req, res) => {
    res.json(await query(req, (m) => crud.saveBlocks(m, spec, p(req, "id"), req.body)));
  }) satisfies RequestHandler);
}
