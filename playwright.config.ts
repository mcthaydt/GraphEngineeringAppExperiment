import { defineConfig, devices } from '@playwright/test';

// Device profiles emulate screen size, user agent and touch. They are emulation evidence,
// not proof of how a physical device performs. Chromium runs every profile.
export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.e2e.ts',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: { baseURL: 'http://localhost:4173', trace: 'off' },
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{ name: 'small-phone', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
		{ name: 'tablet', use: { ...devices['iPad Mini'], browserName: 'chromium' } },
		{ name: 'computer', use: { ...devices['Desktop Chrome'] } }
	]
});
