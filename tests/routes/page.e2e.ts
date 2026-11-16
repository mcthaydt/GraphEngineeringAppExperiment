import { expect, test, type Page } from '@playwright/test';

// Waits on the app's own readiness flag, never on a sleep.
async function openApp(page: Page) {
	await page.goto('/');
	await expect(page.locator('main[data-ready="true"]')).toBeVisible();
}

test('add, tick off, remove and put back a todo, and keep them after a reload', async ({ page }, testInfo) => {
	await openApp(page);

	// Load-time budget, measured in the page: ready within 2 seconds.
	const readyMs = Number(await page.locator('main').getAttribute('data-ready-ms'));
	expect(readyMs).toBeLessThan(2000);

	await expect(page.getByText('Nothing on your list yet. Type something above and press Add.')).toBeVisible();
	await page.screenshot({ path: testInfo.outputPath('1-empty.png'), fullPage: true });

	const box = page.getByLabel('What do you need to do?');
	const addButton = page.getByRole('button', { name: 'Add', exact: true });

	// Blank text is refused with a plain note.
	await addButton.click();
	await expect(page.getByText('Type something first, then press Add.')).toBeVisible();

	// Keyboard only: type, press Enter, focus stays in the box for the next one.
	await box.focus();
	await page.keyboard.type('Buy milk');
	await page.keyboard.press('Enter');
	await expect(box).toBeFocused();
	await expect(box).toHaveValue('');
	await expect(page.getByText('Type something first, then press Add.')).toBeHidden();

	await box.fill('Call Mum');
	await addButton.click();
	const items = page.getByRole('listitem');
	await expect(items).toHaveText([/Buy milk/, /Call Mum/]);

	// Tick off with the keyboard.
	const milk = page.getByRole('checkbox', { name: 'Buy milk' });
	await milk.focus();
	await page.keyboard.press('Space');
	await expect(milk).toBeChecked();
	await page.screenshot({ path: testInfo.outputPath('2-list.png'), fullPage: true });

	// Still there after a reload.
	await page.reload();
	await expect(page.locator('main[data-ready="true"]')).toBeVisible();
	await expect(items).toHaveText([/Buy milk/, /Call Mum/]);
	await expect(page.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked();

	// Remove, then put it back in the same place.
	await page.getByRole('button', { name: 'Remove Buy milk' }).click();
	await expect(items).toHaveText([/Call Mum/]);
	const putBack = page.getByRole('button', { name: 'Put it back' });
	await expect(putBack).toBeFocused();
	await page.screenshot({ path: testInfo.outputPath('3-removed.png'), fullPage: true });
	await putBack.click();
	await expect(items).toHaveText([/Buy milk/, /Call Mum/]);
	await expect(box).toBeFocused();
});
