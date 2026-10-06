import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeTestDatabaseUrl } from "../test-database-safety.mjs";

test("test database must be explicit PostgreSQL and test-labelled", () => {
  for (const invalid of [undefined, "not-a-url", "sqlite://localhost/project_test", "postgresql://localhost/project"]) assert.throws(() => assertSafeTestDatabaseUrl(invalid));
  assert.equal(assertSafeTestDatabaseUrl("postgresql://localhost/project_test"), "postgresql://localhost/project_test");
});

test("credentials, localhost aliases, default ports and schemas cannot disguise the primary database", () => {
  assert.throws(() => assertSafeTestDatabaseUrl("postgresql://test-user@127.0.0.1:5432/project_test?schema=tests", "postgres://app-user@localhost/project_test?schema=public"));
  assert.throws(() => assertSafeTestDatabaseUrl("postgresql://[::1]/project_test", "postgresql://localhost/project_test"));
  assert.doesNotThrow(() => assertSafeTestDatabaseUrl("postgresql://localhost/project_test", "postgresql://localhost/project"));
});
