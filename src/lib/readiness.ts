import { checkDatabaseConnection } from "@/lib/db";
import { checkRedisConnection } from "@/lib/redis";

export type ServiceReadiness = {
  status: "ok";
  service: "web";
  timestamp: string;
  dependencies: { database: "ok"; redis: "ok" };
};

export async function getReadiness(): Promise<ServiceReadiness> {
  await checkDatabaseConnection();
  await checkRedisConnection();

  return {
    status: "ok",
    service: "web",
    timestamp: new Date().toISOString(),
    dependencies: { database: "ok", redis: "ok" },
  };
}

