import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test("file upload submits successfully", async ({ page }) => {
  await page.goto(`${BASE}/daftar`);
  await page.waitForSelector('input[name="full_name"]');

  await page.fill('input[name="full_name"]', "E2E Full Test");
  await page.fill('input[name="wa_number"]', "081199887766");
  await page.setInputFiles('input[name="proof_transfer"]', "/tmp/test_proof.png");

  await page.click('button[type="submit"]');
  await page.waitForURL("**/daftar/sukses**", { timeout: 15000 });

  await expect(page.locator("text=Pendaftaran Berhasil")).toBeVisible();
});

test("email is optional — submits without it", async ({ page }) => {
  await page.goto(`${BASE}/daftar`);
  await page.waitForSelector('input[name="full_name"]');

  await page.fill('input[name="full_name"]', "No Email E2E");
  await page.fill('input[name="wa_number"]', "081177665544");
  await page.setInputFiles('input[name="proof_transfer"]', "/tmp/test_proof.png");

  await page.click('button[type="submit"]');
  await page.waitForURL("**/daftar/sukses**", { timeout: 15000 });
});

test("oversized file shows client-side error", async ({ page }) => {
  await page.goto(`${BASE}/daftar`);
  await page.waitForSelector('input[name="full_name"]');

  await page.setInputFiles('input[name="proof_transfer"]', "/tmp/large_proof.png");
  await expect(page.locator("text=Ukuran file maksimal 400KB")).toBeVisible({ timeout: 5000 });
});
