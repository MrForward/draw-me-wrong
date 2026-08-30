import { env } from "cloudflare:workers";
import { AnalyticsPayload } from "../app/analytics-events";

interface AnalyticsStatement {
  bind(...values: Array<string | number>): AnalyticsStatement;
  run(): Promise<unknown>;
}

interface AnalyticsDatabase {
  prepare(query: string): AnalyticsStatement;
}

export async function incrementAnalytics(payload: AnalyticsPayload): Promise<void> {
  const database = (env as unknown as { DB?: AnalyticsDatabase }).DB;
  if (!database) throw new Error("Analytics database binding is unavailable");

  const day = new Date().toISOString().slice(0, 10);
  await database.prepare(`
    INSERT INTO analytics_daily (day, event, variant, count, updated_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(day, event, variant) DO UPDATE SET
      count = count + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(day, payload.event, payload.variant).run();
}
