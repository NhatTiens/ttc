function databaseIdentity(value) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Database URL must use PostgreSQL.");
  const host = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ? "loopback" : url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!database) throw new Error("Database URL must specify a database name.");
  return { database, identity: `${host}:${url.port || "5432"}/${database}` };
}

export function assertSafeTestDatabaseUrl(testUrl, primaryUrl) {
  if (!testUrl) throw new Error("TEST_DATABASE_URL is required for integration tests.");
  const test = databaseIdentity(testUrl);
  if (!/(^test[_-]|[_-]test$)/i.test(test.database)) {
    throw new Error("Refusing destructive tests: TEST_DATABASE_URL database name must start with test_ or end with _test.");
  }
  if (primaryUrl && test.identity === databaseIdentity(primaryUrl).identity) {
    throw new Error("Refusing destructive tests: TEST_DATABASE_URL points to the same database as DATABASE_URL.");
  }
  return testUrl;
}
