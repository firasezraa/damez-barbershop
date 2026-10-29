import { describe, expect, it } from "vitest";
import {
  checksum,
  splitSqlStatements,
  sortMigrationFiles,
} from "../../scripts/migrate-lib.ts";

const FUNCTION_FIXTURE = `-- create the hold function
CREATE OR REPLACE FUNCTION public.fn_x() RETURNS int AS $$
BEGIN
  PERFORM 1;
  RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- second statement
SELECT 1;
`;

describe("splitSqlStatements", () => {
  it("keeps a dollar-quoted function body in a single statement", () => {
    const statements = splitSqlStatements(FUNCTION_FIXTURE);

    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain("PERFORM 1;");
    expect(statements[0]).toContain("RETURN 1;");
    expect(statements[0]).toContain("$$ LANGUAGE plpgsql");
  });

  it("treats a tagged dollar quote as a single statement", () => {
    const statements = splitSqlStatements(
      "CREATE FUNCTION f() RETURNS int AS $fn$ SELECT 1; SELECT 2; $fn$ LANGUAGE sql;",
    );

    expect(statements).toHaveLength(1);
    expect(statements[0]).toContain("SELECT 2;");
  });

  it("strips line and block comments and drops empty statements", () => {
    const statements = splitSqlStatements(
      "-- leading comment\n/* block\n   comment */\nSELECT 1;\n\n;\n-- trailing\n",
    );

    expect(statements).toHaveLength(1);
    expect(statements[0]).toBe("SELECT 1");
  });

  it("does not split on a semicolon inside a string literal", () => {
    const statements = splitSqlStatements("INSERT INTO t VALUES ('a;b');");

    expect(statements).toHaveLength(1);
  });

  it("returns no statements for an empty or comment-only file", () => {
    expect(splitSqlStatements("")).toEqual([]);
    expect(splitSqlStatements("-- nothing here\n")).toEqual([]);
  });
});

describe("sortMigrationFiles", () => {
  it("orders by numeric prefix, not lexicographically", () => {
    expect(
      sortMigrationFiles(["0010_b.sql", "0002_a.sql", "0001_core_schema.sql"]),
    ).toEqual(["0001_core_schema.sql", "0002_a.sql", "0010_b.sql"]);
  });

  it("does not mutate the array it is given", () => {
    const input = ["0002_a.sql", "0001_b.sql"];
    sortMigrationFiles(input);

    expect(input).toEqual(["0002_a.sql", "0001_b.sql"]);
  });
});

describe("checksum", () => {
  it("is stable for identical input and differs for different input", () => {
    expect(checksum("SELECT 1;")).toBe(checksum("SELECT 1;"));
    expect(checksum("SELECT 1;")).not.toBe(checksum("SELECT 2;"));
    expect(checksum("SELECT 1;")).toMatch(/^[0-9a-f]{64}$/);
  });
});
