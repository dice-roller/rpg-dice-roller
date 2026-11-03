/// <reference types="node" />

import { execFileSync, spawn } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

interface SidebarItem {
  text: string;
  link?: string | null;
  collapsible?: boolean;
  children?: SidebarItem[];
}

describe("public API documentation", () => {
  const output = mkdtempSync(join(process.cwd(), "docs", ".typedoc-test-"));
  const read = (file: string) => readFileSync(join(output, file), "utf8");

  const generate = () => {
    execFileSync(
      process.execPath,
      ["node_modules/typedoc/bin/typedoc", "--out", output],
      {
        cwd: process.cwd(),
        stdio: "pipe",
      },
    );
  };

  beforeAll(generate, 60000);

  afterAll(() => rmSync(output, { recursive: true, force: true }));

  test("documents root exports, types, and namespace members", () => {
    expect(read("functions/roll.md")).toContain(
      "Shorthand for `new Roll(input, options)`",
    );
    expect(read("functions/roll.md")).toContain("ExpressionNode");
    expect(read("classes/Roll.md")).toContain("Class: Roll");
    expect(read("interfaces/RollOptions.md")).toContain("RollOptions");
    expect(
      read("rpg-dice-roller/namespaces/dice/classes/DieRegistry.md"),
    ).toContain("DieRegistry");
    expect(read("index.md")).toContain("The technical API");
    expect(read("classes/Evaluator.md")).toContain("Class: Evaluator");
    expect(existsSync(join(output, "parser/generated"))).toBe(false);
  });

  test("exports a nested VuePress sidebar whose links resolve", () => {
    const sidebar = JSON.parse(read("typedoc-sidebar.json")) as SidebarItem[];
    const prefix = `/${relative(resolve("docs"), output).split(sep).join("/")}/`;
    expect(Array.isArray(sidebar)).toBe(true);
    expect(sidebar.length).toBeGreaterThan(0);
    let nested = false;
    const visit = (items: SidebarItem[]) => {
      for (const item of items) {
        if (item.link) {
          expect(item.link.startsWith(prefix)).toBe(true);
          let target = decodeURI(item.link.slice(prefix.length).split("#")[0]);
          if (!target || target.endsWith("/")) target += "index.md";
          expect(existsSync(join(output, target))).toBe(true);
        }
        if (item.children?.length) {
          expect(item.collapsible).toBe(true);
          nested = true;
          visit(item.children);
        }
      }
    };
    visit(sidebar);
    expect(nested).toBe(true);
  });

  test("clean build removes stale and hand-maintained files", () => {
    writeFileSync(join(output, "stale.md"), "stale");
    writeFileSync(join(output, "hand-maintained.md"), "keep");
    generate();
    expect(existsSync(join(output, "stale.md"))).toBe(false);
    expect(existsSync(join(output, "hand-maintained.md"))).toBe(false);
    expect(read("functions/roll.md")).toContain("Shorthand");
    expect(JSON.parse(read("typedoc-sidebar.json"))).toEqual(expect.any(Array));
  }, 60000);

  test("generated Markdown links resolve to pages", () => {
    const markdownPages = (directory: string): string[] =>
      readdirSync(join(output, directory), { withFileTypes: true }).flatMap(
        (entry) => {
          const path = join(directory, entry.name);
          return entry.isDirectory()
            ? markdownPages(path)
            : entry.isFile() && path.endsWith(".md")
              ? [path]
              : [];
        },
      );
    const pages = markdownPages("");
    expect(pages).toContain("index.md");
    for (const page of pages) {
      for (const match of read(page).matchAll(/]\(([^)]+\.md)(?:#[^)]*)?\)/g)) {
        const target = decodeURI(match[1]);
        if (target.startsWith("../guide/")) continue;
        expect(existsSync(resolve(dirname(join(output, page)), target))).toBe(
          true,
        );
      }
    }
  });

  test("watch regenerates pages and navigation", async () => {
    const root = mkdtempSync(join(process.cwd(), "docs", ".typedoc-watch-"));
    const input = join(root, "entry.ts");
    const dest = join(root, "api");
    writeFileSync(input, "export function first() {}\n");
    writeFileSync(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true, skipLibCheck: true, types: [] },
        files: ["entry.ts"],
      }),
    );
    const child = spawn(
      process.execPath,
      [
        "node_modules/typedoc/bin/typedoc",
        input,
        "--out",
        dest,
        "--watch",
        "--tsconfig",
        join(root, "tsconfig.json"),
      ],
      { stdio: "ignore" },
    );
    const waitFor = async (condition: () => boolean) => {
      for (let i = 0; i < 200; i++) {
        if (condition()) return;
        if (child.exitCode !== null)
          throw new Error("TypeDoc watch exited early");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error("Timed out waiting for TypeDoc watch");
    };
    try {
      await waitFor(
        () =>
          existsSync(join(dest, "typedoc-sidebar.json")) &&
          readFileSync(join(dest, "typedoc-sidebar.json"), "utf8").includes(
            "first",
          ) &&
          existsSync(join(dest, "functions/first.md")),
      );
      writeFileSync(input, "export function second() {}\n");
      await waitFor(
        () =>
          readFileSync(join(dest, "typedoc-sidebar.json"), "utf8").includes(
            "second",
          ) && existsSync(join(dest, "functions/second.md")),
      );
      expect(
        readFileSync(join(dest, "typedoc-sidebar.json"), "utf8"),
      ).not.toContain("first");
      expect(existsSync(join(dest, "functions/first.md"))).toBe(false);
      expect(existsSync(join(dest, "functions/second.md"))).toBe(true);
    } finally {
      child.kill();
      await new Promise<void>((resolve) => child.once("exit", () => resolve()));
      rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
