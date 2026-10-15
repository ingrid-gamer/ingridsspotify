import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("package.json define los comandos principales", async () => {
  const content = await readFile(
    new URL("../package.json", import.meta.url),
    "utf8"
  );

  const pkg = JSON.parse(content);

  assert.ok(pkg.scripts.import, "Falta el comando import");
  assert.ok(pkg.scripts.sync, "Falta el comando sync");
  assert.ok(pkg.scripts.covers, "Falta el comando covers");
  assert.ok(pkg.scripts.auth, "Falta el comando auth");
  assert.ok(pkg.scripts.check, "Falta el comando check");
});

test("existe el script de importación del historial", async () => {
  const file = new URL(
    "../impor-history/import-history.js",
    import.meta.url
  );

  await assert.doesNotReject(
    readFile(file, "utf8")
  );
});
