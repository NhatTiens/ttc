import assert from "node:assert/strict";
import test from "node:test";
import { isTransactionConflict } from "../../packages/domain/src/errors.ts";

test("retry serialization/deadlock conflicts from both Prisma and raw SQL", () => {
  assert.equal(isTransactionConflict({ code: "P2034" }), true);
  assert.equal(isTransactionConflict({ code: "P2010", meta: { code: "40001" } }), true);
  assert.equal(isTransactionConflict({ code: "P2010", meta: { code: "40P01" } }), true);
  assert.equal(isTransactionConflict({ code: "P2010", meta: { driverAdapterError: { cause: { originalCode: "40001" } } } }), true);
  assert.equal(isTransactionConflict({ code: "P2002" }), false);
  assert.equal(isTransactionConflict({ code: "P2010", meta: { code: "23514" } }), false);
  assert.equal(isTransactionConflict(null), false);
});
