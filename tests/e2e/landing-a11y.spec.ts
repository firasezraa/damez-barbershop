import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Ambang aksesibilitas R2: 0 violation critical/serious di dua halaman publik,
 * diuji di kedua viewport (ponsel 390x844 dan tablet 1024x768) karena proyek
 * Playwright menjalankan setiap spec dua kali.
 */
const PAGES = [
  { path: "/", name: "landing" },
  { path: "/booking", name: "booking" },
];

for (const page of PAGES) {
  test(`${page.name} has no critical or serious accessibility violations`, async ({ page: browser }) => {
    await browser.goto(page.path);
    await browser.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page: browser })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );

    const summary = blocking.map(
      (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
    );

    expect(summary).toEqual([]);
  });
}

test("touch targets on the booking wizard are at least 44px tall", async ({ page: browser }) => {
  await browser.goto("/booking");

  const sizes = await browser.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => Math.round(button.getBoundingClientRect().height)),
  );

  expect(sizes.length).toBeGreaterThan(0);
  expect(sizes.filter((height) => height < 44)).toEqual([]);
});
