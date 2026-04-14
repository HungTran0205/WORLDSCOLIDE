# Playwright Test Patterns

Common patterns for writing maintainable Playwright tests.

## Login Flow Pattern

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Load config
  const config = JSON.parse(
    await fs.readFile('docs/website-test-config.json', 'utf-8')
  );
  const site = config.websites.find(w => w.defaultFlag);
  
  // Navigate and login
  await page.goto(site.url);
  await page.fill('[name="username"]', site.username);
  await page.fill('[name="password"]', site.password);
  if (site.additionalFields?.customerNumber) {
    await page.fill('[name="customerNumber"]', site.additionalFields.customerNumber);
  }
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Page Object Pattern

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page, private config: WebsiteConfig) {}
  
  async login() {
    await this.page.goto(this.config.url);
    await this.page.fill('[data-testid="username"]', this.config.username);
    await this.page.fill('[data-testid="password"]', this.config.password);
    await this.page.click('[data-testid="login-btn"]');
  }
}
```

## Assertion Patterns

```typescript
// Wait for element
await expect(page.locator('.success-message')).toBeVisible();

// Check text content
await expect(page.locator('h1')).toHaveText('Dashboard');

// Check URL
await expect(page).toHaveURL(/\/dashboard$/);

// Check count
await expect(page.locator('.item')).toHaveCount(5);
```

## Locator Strategies (Priority Order)

1. **data-testid** - Most stable
2. **role + name** - Accessible and semantic
3. **text** - User-facing but fragile
4. **CSS selectors** - Last resort

```typescript
// Best: data-testid
page.locator('[data-testid="submit-button"]')

// Good: role + name
page.getByRole('button', { name: 'Submit' })

// OK: text
page.getByText('Submit')

// Avoid: CSS classes/IDs
page.locator('.btn-primary')
```

## Error Handling

```typescript
test('handles error gracefully', async ({ page }) => {
  await page.goto('/form');
  await page.fill('[name="email"]', 'invalid');
  await page.click('button[type="submit"]');
  
  // Check error message appears
  await expect(page.locator('.error')).toContainText('Invalid email');
});
```

## Network Mocking

```typescript
test('mocks API response', async ({ page }) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ users: [] })
    });
  });
  
  await page.goto('/users');
  await expect(page.locator('.empty-state')).toBeVisible();
});
```
