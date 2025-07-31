import { chromium } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'

async function globalSetup(config) {
    console.log('🚀 Starting global test setup...')

    // Create test results directory
    const testResultsDir = path.join(process.cwd(), 'test-results')
    await fs.mkdir(testResultsDir, { recursive: true })

    // Create screenshots directory for visual regression
    const screenshotsDir = path.join(process.cwd(), 'tests', 'screenshots')
    await fs.mkdir(screenshotsDir, { recursive: true })

    // Pre-warm the browser for faster first test
    if (!process.env.CI) {
        const browser = await chromium.launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        try {
            // Navigate to the app to trigger initial build
            await page.goto(config.use.baseURL, { waitUntil: 'networkidle' })
            console.log('✅ Application is ready for testing')
        } catch (error) {
            console.warn('⚠️  Could not pre-warm application:', error.message)
        } finally {
            await browser.close()
        }
    }

    // Store test metadata
    const metadata = {
        startTime: new Date().toISOString(),
        environment: process.env.CI ? 'ci' : 'local',
        baseURL: config.use.baseURL,
    }

    await fs.writeFile(path.join(testResultsDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

    console.log('✅ Global setup completed')
}

export default globalSetup
