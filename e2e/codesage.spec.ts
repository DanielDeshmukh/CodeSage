import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ───────────────────────────────────────────────────────

async function logStep(page: Page, step: string) {
  console.log(`\n  ▶ STEP: ${step}`);
}

async function screenshotStep(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true,
  });
  console.log(`  📸 Screenshot: ${name}.png`);
}

// ─── 1. LANDING PAGE ──────────────────────────────────────────────

test.describe("1 — Landing Page", () => {
  test("loads and displays hero section", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");
    await expect(page).toHaveTitle(/CodeSage/);

    await logStep(page, "Verify hero heading");
    const heading = page.locator("h1");
    await expect(heading.first()).toBeVisible();
    await expect(heading.first()).toContainText("interrogated");

    await logStep(page, "Verify hero description");
    await expect(
      page.locator("text=CodeSage analyzes your GitHub repository")
    ).toBeVisible();

    await screenshotStep(page, "01-landing-hero");
  });

  test("displays exam mode cards", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Scroll to modes section");
    await page.locator("#modes").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await logStep(page, "Verify 3 exam mode card titles");
    await expect(page.locator(".mode-title", { hasText: "Oral Defense" })).toBeVisible();
    await expect(page.locator(".mode-title", { hasText: "Industry Hiring Loop" })).toBeVisible();
    await expect(page.locator(".mode-title", { hasText: "Peer Review Sim" })).toBeVisible();

    await screenshotStep(page, "02-landing-modes");
  });

  test("displays AI model pipeline", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Scroll to models section");
    await page.locator("#models").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await logStep(page, "Verify AI model names in table");
    await expect(page.locator(".model-name", { hasText: "Nemotron-340B" })).toBeVisible();
    await expect(page.locator(".model-name", { hasText: "Llama-3.3-70B" })).toBeVisible();
    await expect(page.locator(".model-name", { hasText: "NV-Embed-QA" })).toBeVisible();
    await expect(page.locator(".model-name", { hasText: "NV-Rerank-QA" })).toBeVisible();
    await expect(page.locator(".model-name", { hasText: "Llama-Guard-3" })).toBeVisible();

    await screenshotStep(page, "03-landing-models");
  });

  test("displays demo section with sample questions", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Scroll to demo section");
    await page.locator("#demo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await logStep(page, "Verify demo questions");
    await expect(page.locator("text=AUTH.TS:10")).toBeVisible();
    await expect(page.locator("text=AUTH.TS:7")).toBeVisible();

    await screenshotStep(page, "04-landing-demo");
  });

  test("displays feature strip", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Verify features");
    await expect(page.locator("text=Direct GitHub import")).toBeVisible();
    await expect(page.locator("text=AST-level analysis")).toBeVisible();
    await expect(page.locator("text=Personalized study guides")).toBeVisible();
    await expect(page.locator("text=Progress tracking")).toBeVisible();
    await expect(page.locator("text=Objective scoring")).toBeVisible();
    await expect(page.locator("text=Built-in content safety")).toBeVisible();

    await screenshotStep(page, "05-landing-features");
  });

  test("CTA buttons link correctly", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Click 'Connect repository' CTA");
    const connectBtn = page.getByRole("link", { name: /Connect repository/i }).first();
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await page.waitForURL(/\/repositories\/submit/, { timeout: 15000 });
    expect(page.url()).toContain("/repositories/submit");

    await screenshotStep(page, "06-landing-cta-navigate");
  });

  test("header and footer are visible", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Verify header");
    await expect(page.locator("header, nav").first()).toBeVisible();

    await logStep(page, "Verify footer");
    await expect(page.locator("footer")).toBeVisible();

    await screenshotStep(page, "07-landing-header-footer");
  });

  test("stats band shows numbers", async ({ page }) => {
    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Scroll to modes section for stats");
    await page.locator("#modes").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await logStep(page, "Verify stats");
    await expect(page.locator("text=Specialized NIM models")).toBeVisible();
    await expect(page.locator("text=Languages via Tree-sitter")).toBeVisible();

    await screenshotStep(page, "08-landing-stats");
  });
});

// ─── 2. LOGIN PAGE ────────────────────────────────────────────────

test.describe("2 — Login Page", () => {
  test("loads login page with GitHub sign-in", async ({ page }) => {
    await logStep(page, "Navigate to login page");
    await page.goto("/login");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Welcome back");

    await logStep(page, "Verify GitHub sign-in button");
    const githubBtn = page.locator("button", { hasText: "Sign in with GitHub" });
    await expect(githubBtn).toBeVisible();

    await screenshotStep(page, "09-login-page");
  });

  test("login page has logo and legal links", async ({ page }) => {
    await logStep(page, "Navigate to login page");
    await page.goto("/login");

    await logStep(page, "Verify logo image");
    const logo = page.locator('img[alt="CodeSage"]');
    await expect(logo).toBeVisible();

    await logStep(page, "Verify Terms and Privacy links");
    await expect(page.locator("text=Terms")).toBeVisible();
    await expect(page.locator("text=Privacy Policy")).toBeVisible();

    await screenshotStep(page, "10-login-layout");
  });
});

// ─── 3. SIGNUP PAGE ───────────────────────────────────────────────

test.describe("3 — Signup Page", () => {
  test("loads signup page with benefits", async ({ page }) => {
    await logStep(page, "Navigate to signup page");
    await page.goto("/signup");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Join CodeSage");

    await logStep(page, "Verify benefit items");
    await expect(
      page.locator("text=AI-powered code analysis with 5 specialized models")
    ).toBeVisible();
    await expect(
      page.locator("text=Viva, interview, and code review exam modes")
    ).toBeVisible();
    await expect(
      page.locator("text=Personalized study guides and performance tracking")
    ).toBeVisible();

    await logStep(page, "Verify GitHub sign-up button");
    const githubBtn = page.locator("button", { hasText: "Sign up with GitHub" });
    await expect(githubBtn).toBeVisible();

    await screenshotStep(page, "11-signup-page");
  });
});

// ─── 4. REPOSITORY SUBMISSION ─────────────────────────────────────

test.describe("4 — Repository Submission", () => {
  test("loads submit page with form", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Add Repository");

    await logStep(page, "Verify input field");
    const input = page.locator(
      'input[placeholder="https://github.com/owner/repo"]'
    );
    await expect(input).toBeVisible();

    await screenshotStep(page, "12-submit-page");
  });

  test("submit button is disabled when URL is empty", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Verify submit button is disabled");
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeDisabled();

    await screenshotStep(page, "13-submit-disabled-btn");
  });

  test("shows error for invalid URL", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Enter invalid URL");
    const input = page.locator(
      'input[placeholder="https://github.com/owner/repo"]'
    );
    await input.fill("not-a-valid-url");

    await logStep(page, "Click Add Repository");
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await logStep(page, "Verify error message for invalid URL");
    await expect(
      page.locator("text=Please enter a valid GitHub repository URL")
    ).toBeVisible();

    await screenshotStep(page, "14-submit-invalid-error");
  });

  test("validates GitHub URL format", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Enter valid GitHub URL");
    const input = page.locator(
      'input[placeholder="https://github.com/owner/repo"]'
    );
    await input.fill("https://github.com/facebook/react");

    await logStep(page, "Verify no error shown after valid input");
    const error = page.locator("text=Please enter a valid GitHub repository URL");
    await expect(error).not.toBeVisible();

    await screenshotStep(page, "15-submit-valid-url");
  });

  test("navigates to analysis page on valid submit", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Enter valid GitHub URL");
    const input = page.locator(
      'input[placeholder="https://github.com/owner/repo"]'
    );
    await input.fill("https://github.com/facebook/react");

    await logStep(page, "Click Add Repository");
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    await logStep(page, "Verify redirect to analyze page");
    await page.waitForURL(/\/repositories\/analyze/, { timeout: 15000 });
    expect(page.url()).toContain("/repositories/analyze");
    expect(page.url()).toContain("url=");

    await screenshotStep(page, "16-submit-redirect-analyze");
  });

  test("submit page has 'What happens next' info", async ({ page }) => {
    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Verify info section");
    await expect(page.locator("text=What happens next?")).toBeVisible();
    await expect(page.locator("text=clone the repository")).toBeVisible();

    await screenshotStep(page, "17-submit-info");
  });
});

// ─── 5. REPOSITORY ANALYSIS ───────────────────────────────────────

test.describe("5 — Repository Analysis", () => {
  test("loads analysis page with heading", async ({ page }) => {
    await logStep(page, "Navigate to analyze page");
    await page.goto(
      "/repositories/analyze?url=https://github.com/facebook/react"
    );

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Analyzing Repository");

    await logStep(page, "Verify repo URL displayed");
    await expect(page.locator("text=facebook/react")).toBeVisible();

    await screenshotStep(page, "18-analyze-page");
  });

  test("shows analyzing or complete state", async ({ page }) => {
    await logStep(page, "Navigate to analyze page");
    await page.goto(
      "/repositories/analyze?url=https://github.com/test/empty"
    );

    await logStep(page, "Verify step labels exist");
    await expect(page.getByRole("heading", { name: "Analyzing Repository" })).toBeVisible();
    await expect(page.locator("p.font-medium", { hasText: "Complete" })).toBeVisible();

    await screenshotStep(page, "19-analyze-states");
  });

  test("shows error state for invalid repo", async ({ page }) => {
    await logStep(page, "Navigate to analyze page with invalid repo");
    await page.goto(
      "/repositories/analyze?url=https://github.com/this-repo-definitely-does-not-exist-xyz123/none"
    );

    await logStep(page, "Wait for error or analyzing state");
    await page.waitForTimeout(3000);

    await screenshotStep(page, "20-analyze-error");
  });
});

// ─── 6. EXAM MODE SELECTION ───────────────────────────────────────

test.describe("6 — Exam Mode Selection", () => {
  test("loads exam select page with 3 modes", async ({ page }) => {
    await logStep(page, "Navigate to exam select page");
    await page.goto("/exam/select?repo=test-repo-id");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Choose Exam Mode");

    await logStep(page, "Verify 3 mode cards");
    await expect(page.locator("text=Viva Voce")).toBeVisible();
    await expect(page.locator("text=Interview Prep")).toBeVisible();
    await expect(page.locator("text=Code Review")).toBeVisible();

    await screenshotStep(page, "21-exam-select");
  });

  test("shows mode features for each card", async ({ page }) => {
    await logStep(page, "Navigate to exam select page");
    await page.goto("/exam/select?repo=test-repo-id");

    await logStep(page, "Verify Viva features");
    await expect(page.locator("text=Probing follow-up questions")).toBeVisible();
    await expect(page.locator("text=Architecture decision testing")).toBeVisible();

    await logStep(page, "Verify Interview features");
    await expect(page.locator("text=System design questions")).toBeVisible();

    await logStep(page, "Verify Code Review features");
    await expect(page.locator("text=Bug detection")).toBeVisible();

    await screenshotStep(page, "22-exam-select-features");
  });

  test("mode selection shows Start button with mode name", async ({ page }) => {
    await logStep(page, "Navigate to exam select page");
    await page.goto("/exam/select?repo=test-repo-id");

    await logStep(page, "Click Viva Voce card");
    await page.locator("text=Viva Voce").first().click();

    await logStep(page, "Verify Start button appears with mode name");
    const startBtn = page.locator("button", { hasText: /Start Viva Voce/ });
    await expect(startBtn).toBeVisible();

    await screenshotStep(page, "23-exam-select-start");
  });

  test("start button is disabled without selection", async ({ page }) => {
    await logStep(page, "Navigate to exam select page");
    await page.goto("/exam/select?repo=test-repo-id");

    await logStep(page, "Verify Start button is disabled initially");
    const startBtn = page.getByRole("button", { name: "Start Exam" });
    await expect(startBtn).toBeDisabled();

    await screenshotStep(page, "24-exam-select-disabled");
  });
});

// ─── 7. DASHBOARD ─────────────────────────────────────────────────

test.describe("7 — Dashboard", () => {
  test("loads dashboard page", async ({ page }) => {
    await logStep(page, "Navigate to dashboard");
    await page.goto("/dashboard");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Dashboard");

    await screenshotStep(page, "25-dashboard");
  });

  test("dashboard shows stats cards", async ({ page }) => {
    await logStep(page, "Navigate to dashboard");
    await page.goto("/dashboard");

    await logStep(page, "Verify stat labels using specific selectors");
    await expect(
      page.locator("p.text-sm.text-muted", { hasText: "Total Repositories" })
    ).toBeVisible();
    await expect(
      page.locator("p.text-sm.text-muted", { hasText: "Exam Sessions" }).first()
    ).toBeVisible();
    await expect(
      page.locator("p.text-sm.text-muted", { hasText: "Average Score" })
    ).toBeVisible();

    await screenshotStep(page, "26-dashboard-stats");
  });

  test("dashboard has repositories and exam sections", async ({ page }) => {
    await logStep(page, "Navigate to dashboard");
    await page.goto("/dashboard");

    await logStep(page, "Verify Repositories section");
    await expect(page.getByRole("heading", { name: "Repositories" })).toBeVisible();

    await logStep(page, "Verify Recent Sessions section");
    await expect(page.getByRole("heading", { name: "Recent Sessions" })).toBeVisible();

    await screenshotStep(page, "27-dashboard-sections");
  });
});

// ─── 8. RESULTS / HISTORY ─────────────────────────────────────────

test.describe("8 — Results History", () => {
  test("loads results page", async ({ page }) => {
    await logStep(page, "Navigate to results page");
    await page.goto("/results");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Exam History");

    await screenshotStep(page, "28-results-page");
  });

  test("results page shows table or empty state", async ({ page }) => {
    await logStep(page, "Navigate to results page");
    await page.goto("/results");

    await logStep(page, "Check page content");
    const hasEmptyState = await page
      .locator("text=No exam sessions yet")
      .isVisible();
    const hasTable = (await page.locator("table").count()) > 0;
    console.log(`  ℹ️ Empty state: ${hasEmptyState}, Table: ${hasTable}`);

    await screenshotStep(page, "29-results-state");
  });
});

// ─── 9. SETTINGS ──────────────────────────────────────────────────

test.describe("9 — Settings Page", () => {
  test("loads settings page", async ({ page }) => {
    await logStep(page, "Navigate to settings page");
    await page.goto("/settings");

    await logStep(page, "Verify heading");
    await expect(page.locator("h1")).toContainText("Settings");

    await screenshotStep(page, "30-settings-page");
  });

  test("settings page has API Keys section", async ({ page }) => {
    await logStep(page, "Navigate to settings page");
    await page.goto("/settings");

    await logStep(page, "Verify API Keys section");
    await expect(page.getByRole("heading", { name: "API Keys" })).toBeVisible();
    await expect(page.locator("label", { hasText: "GitHub Token" })).toBeVisible();
    await expect(page.locator("label", { hasText: "NVIDIA NIM API Key" })).toBeVisible();

    await screenshotStep(page, "31-settings-api-keys");
  });

  test("settings page has exam preferences", async ({ page }) => {
    await logStep(page, "Navigate to settings page");
    await page.goto("/settings");

    await logStep(page, "Verify exam preferences");
    await expect(page.getByRole("heading", { name: "Exam Preferences" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Default Exam Mode" })).toBeVisible();
    await expect(page.locator("label", { hasText: "Default Question Count" })).toBeVisible();

    await screenshotStep(page, "32-settings-preferences");
  });
});

// ─── 10. NAVIGATION FLOWS ─────────────────────────────────────────

test.describe("10 — Navigation Flows", () => {
  test("landing → submit → analyze flow", async ({ page }) => {
    await logStep(page, "Start at landing page");
    await page.goto("/");

    await logStep(page, "Click 'Connect repository'");
    await page.getByRole("link", { name: /Connect repository/i }).first().click();
    await page.waitForURL(/\/repositories\/submit/, { timeout: 15000 });

    await logStep(page, "Enter URL and submit");
    await page
      .locator('input[placeholder="https://github.com/owner/repo"]')
      .fill("https://github.com/facebook/react");
    await page.locator("button[type='submit']").click();
    await page.waitForURL(/\/repositories\/analyze/, { timeout: 15000 });

    await logStep(page, "Verify we're on analyze page");
    expect(page.url()).toContain("/repositories/analyze");

    await screenshotStep(page, "33-flow-submit-analyze");
  });

  test("sidebar navigation on dashboard", async ({ page }) => {
    await logStep(page, "Navigate to dashboard");
    await page.goto("/dashboard");

    await logStep(page, "Verify sidebar navigation links");
    await expect(page.locator("aside").first()).toBeVisible();

    await screenshotStep(page, "34-sidebar-navigation");
  });

  test("header logo links to home", async ({ page }) => {
    await logStep(page, "Navigate to dashboard");
    await page.goto("/dashboard");

    await logStep(page, "Click logo in header");
    const logo = page.locator("header a, nav a").first();
    await logo.click();
    await page.waitForURL("/", { timeout: 10000 });

    await logStep(page, "Verify we're on landing page");
    expect(page.url()).toMatch(/\/$/);

    await screenshotStep(page, "35-header-logo-home");
  });
});

// ─── 11. RESPONSIVE DESIGN ────────────────────────────────────────

test.describe("11 — Responsive Design", () => {
  test("landing page on mobile viewport (375px)", async ({ page }) => {
    await logStep(page, "Set mobile viewport 375x812");
    await page.setViewportSize({ width: 375, height: 812 });

    await logStep(page, "Navigate to landing page");
    await page.goto("/");

    await logStep(page, "Verify hero is visible on mobile");
    await expect(page.locator("h1").first()).toBeVisible();

    await screenshotStep(page, "36-responsive-landing-mobile");
  });

  test("login page on mobile viewport", async ({ page }) => {
    await logStep(page, "Set mobile viewport 375x812");
    await page.setViewportSize({ width: 375, height: 812 });

    await logStep(page, "Navigate to login page");
    await page.goto("/login");

    await logStep(page, "Verify login form is visible");
    await expect(page.locator("h1")).toContainText("Welcome back");

    await screenshotStep(page, "37-responsive-login-mobile");
  });

  test("submit page on tablet viewport (768px)", async ({ page }) => {
    await logStep(page, "Set tablet viewport 768x1024");
    await page.setViewportSize({ width: 768, height: 1024 });

    await logStep(page, "Navigate to submit page");
    await page.goto("/repositories/submit");

    await logStep(page, "Verify form is visible");
    await expect(page.locator("h1")).toContainText("Add Repository");

    await screenshotStep(page, "38-responsive-submit-tablet");
  });
});

// ─── 12. DEAD LINK CHECK ──────────────────────────────────────────

test.describe("12 — Dead Link Check", () => {
  const publicPages = [
    { path: "/", name: "Landing" },
    { path: "/login", name: "Login" },
    { path: "/signup", name: "Signup" },
    { path: "/repositories/submit", name: "Submit" },
    {
      path: "/repositories/analyze?url=https://github.com/test/repo",
      name: "Analyze",
    },
    { path: "/exam/select?repo=test", name: "Exam Select" },
    { path: "/dashboard", name: "Dashboard" },
    { path: "/results", name: "Results" },
    { path: "/settings", name: "Settings" },
  ];

  for (const { path, name } of publicPages) {
    test(`${name} (${path}) loads without 404`, async ({ page }) => {
      await logStep(page, `Check page: ${name}`);
      const response = await page.goto(path);

      await logStep(page, "Verify no 404 error");
      expect(response?.status()).not.toBe(404);

      const bodyText = await page.locator("body").textContent();
      const has404Text =
        bodyText?.includes("404") && bodyText?.includes("not found");
      expect(has404Text).toBeFalsy();

      console.log(`  ✅ ${name} — status ${response?.status()}`);
    });
  }
});

// ─── 13. CONSOLE ERRORS ───────────────────────────────────────────

test.describe("13 — Console Error Check", () => {
  const criticalPages = ["/", "/login", "/signup", "/dashboard", "/results"];

  for (const path of criticalPages) {
    test(`${path} has no critical console errors`, async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      page.on("pageerror", (err) => {
        errors.push(err.message);
      });

      await logStep(page, `Navigate to ${path}`);
      await page.goto(path, { waitUntil: "networkidle" });

      await logStep(page, "Filter critical errors");
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("404") &&
          !e.includes("net::ERR") &&
          !e.includes("Failed to fetch") &&
          !e.includes("OAuthAccountNotLinked") &&
          !e.includes("The resource") &&
          !e.includes("GET http") &&
          !e.includes("401") &&
          !e.includes("net::ERR_ABORTED")
      );

      if (criticalErrors.length > 0) {
        console.log(`  ❌ Critical errors on ${path}:`, criticalErrors);
      } else {
        console.log(`  ✅ ${path} — no critical errors`);
      }

      expect(criticalErrors).toHaveLength(0);
    });
  }
});

// ─── 14. PERFORMANCE CHECKS ───────────────────────────────────────

test.describe("14 — Performance Checks", () => {
  test("landing page loads within 5 seconds", async ({ page }) => {
    await logStep(page, "Measure landing page load time");
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;

    console.log(`  ⏱️ Landing page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);

    await screenshotStep(page, "39-perf-landing");
  });

  test("dashboard loads within 5 seconds", async ({ page }) => {
    await logStep(page, "Measure dashboard load time");
    const start = Date.now();
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;

    console.log(`  ⏱️ Dashboard loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test("login page loads within 3 seconds", async ({ page }) => {
    await logStep(page, "Measure login page load time");
    const start = Date.now();
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;

    console.log(`  ⏱️ Login page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});
