import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['line'],
    ],

    use: {
        baseURL: process.env.DEPLOYMENT_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // Advanced settings for autonomous testing
        actionTimeout: 10000,
        navigationTimeout: 30000,

        // Context options
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,

        // Artifacts
        testIdAttribute: 'data-testid',
    },

    // Test timeout
    timeout: 30000,

    // Global setup/teardown
    globalSetup: './tests/global-setup.js',
    globalTeardown: './tests/global-teardown.js',

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Store screenshots for visual regression
                contextOptions: {
                    recordVideo: {
                        dir: 'test-results/videos',
                    },
                },
            },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: true,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },

    // Folder for test artifacts
    outputDir: 'test-results',

    // Advanced pattern matching for tests
    testMatch: ['**/*.spec.js', '**/*.test.js'],

    // Visual regression settings
    expect: {
        // Threshold for screenshot comparison (0-1)
        toHaveScreenshot: {
            threshold: 0.2,
            maxDiffPixels: 100,
            animations: 'disabled',
        },
        timeout: 10000,
    },
})
