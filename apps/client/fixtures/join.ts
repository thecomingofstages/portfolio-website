import type { OpenRounds } from "@/types/api";
import { tcos2Round5 } from "./shared";

/** GET /api/join with some rounds open. (Home's `join` block has none open.) */
export const openRounds = [tcos2Round5] satisfies OpenRounds;
