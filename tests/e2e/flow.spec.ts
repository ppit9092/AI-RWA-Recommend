import { expect, test } from "@playwright/test";

test("full flow: recommend -> submit -> buy", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("risk-select").selectOption("medium");
  await page.getByTestId("duration-input").fill("12");
  await page.getByTestId("yield-input").fill("10");

  await page.getByTestId("recommend-btn").click();
  await expect(page.getByText("Recommendation Result")).toBeVisible();
  await expect(page.getByTestId("model-name")).toBeVisible();

  await page.getByTestId("onchain-btn").click();
  await expect(page.getByTestId("chain-status")).toHaveText(/Submitted/);

  await page.getByTestId("buy-btn").click();
  await expect(page.getByTestId("buy-status")).toHaveText(/Mint success/);
});
