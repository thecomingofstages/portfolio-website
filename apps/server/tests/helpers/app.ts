/**
 * buildTestApp(): the real Express app with a test config. It does not connect to
 * a database or listen; tests that need data mock the helpers (vi.mock).
 */
import type { Config } from "../../src/app/config/init";
import { buildApp } from "../../src/app/server";

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    MONGODB_URI: "mongodb://test.invalid/tcos",
    JWT_SECRET: "test-secret-test-secret-test-secret!!",
    REVALIDATE_SECRET: "test-revalidate-secret",
    REVALIDATE_URL: "http://client.test/api/revalidate",
    MEDIA_BASE_URL: "http://media.test",
    DOCS_ENABLED: "false",
    FILE_SIZE_LIMIT: 50,
    MEDIA_BUCKET: {} as R2Bucket,
    ...overrides,
  };
}

export function buildTestApp(overrides: Partial<Config> = {}) {
  return buildApp(testConfig(overrides));
}
