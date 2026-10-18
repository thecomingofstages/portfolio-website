import type { RequestHandler } from "express";
import { getTrack, listTracks } from "../helpers/track.helper";
import { found, query, urlKey } from "../utils/public";

export const TrackController = {
  /** GET /api/tracks */
  list: (async (req, res) => {
    res.json(await query(req, listTracks));
  }) satisfies RequestHandler,

  /** GET /api/tracks/:key */
  get: (async (req, res) => {
    const key = urlKey(req.params.key);
    res.json(found(await query(req, (m) => getTrack(m, key))));
  }) satisfies RequestHandler,
};
