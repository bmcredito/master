import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1), REDIS_URL: z.string().min(1), APP_URL: z.string().url(),
  AUTH_SECRET: z.string().optional(), OPENAI_API_KEY: z.string().optional(),
  EVOLUTION_API_URL: z.string().url().optional(), EVOLUTION_API_KEY: z.string().optional(), ENCRYPTION_KEY: z.string().optional()
});
export const env = schema.parse(process.env);
