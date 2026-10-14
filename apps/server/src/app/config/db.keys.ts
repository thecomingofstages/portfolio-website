/** Database secrets. The URI holds the password: never log it. */
import { z } from "zod";

export const dbKeysSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
});
