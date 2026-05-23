import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Custom assertion helpers that produce descriptive failure messages.
 * Import these in tests instead of chaining raw expect() calls.
 */

export async function assertPageTitle(page: Page, expected: string): Promise<void> {
  await expect(page, `Page title should be "${expected}"`).toHaveTitle(expected);
}

export async function assertURL(page: Page, pattern: string | RegExp): Promise<void> {
  await expect(page, `URL should match ${pattern}`).toHaveURL(pattern);
}

export async function assertVisible(locator: Locator, description = ''): Promise<void> {
  await expect(locator, description || 'Element should be visible').toBeVisible();
}

export async function assertHidden(locator: Locator, description = ''): Promise<void> {
  await expect(locator, description || 'Element should be hidden').toBeHidden();
}

export async function assertText(locator: Locator, expected: string): Promise<void> {
  await expect(locator, `Element should have text "${expected}"`).toHaveText(expected);
}

export async function assertContainsText(locator: Locator, expected: string): Promise<void> {
  await expect(locator, `Element should contain text "${expected}"`).toContainText(expected);
}

export async function assertCount(locator: Locator, count: number): Promise<void> {
  await expect(locator, `Element count should be ${count}`).toHaveCount(count);
}

export async function assertEnabled(locator: Locator, description = ''): Promise<void> {
  await expect(locator, description || 'Element should be enabled').toBeEnabled();
}

export async function assertDisabled(locator: Locator, description = ''): Promise<void> {
  await expect(locator, description || 'Element should be disabled').toBeDisabled();
}

export async function assertInputValue(locator: Locator, expected: string): Promise<void> {
  await expect(locator, `Input value should be "${expected}"`).toHaveValue(expected);
}

/**
 * Asserts an array is sorted in ascending order.
 */
export function assertSortedAscending(values: string[], label = 'values'): void {
  const sorted = [...values].sort((a, b) => a.localeCompare(b));
  expect(values, `${label} should be sorted A→Z`).toEqual(sorted);
}

/**
 * Asserts a numeric array is in non-decreasing order.
 */
export function assertSortedNumericAscending(values: number[], label = 'values'): void {
  for (let i = 1; i < values.length; i++) {
    expect(values[i], `${label}[${i}] (${values[i]}) should be ≥ ${label}[${i - 1}] (${values[i - 1]})`
    ).toBeGreaterThanOrEqual(values[i - 1]);
  }
}
