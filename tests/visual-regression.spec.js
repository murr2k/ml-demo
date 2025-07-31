import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        // Wait for app to fully load
        await page.waitForSelector('.lcjs-chart', { state: 'visible' })
        await page.waitForTimeout(1000) // Allow charts to stabilize
    })

    test('homepage layout matches baseline', async ({ page }) => {
        await expect(page).toHaveScreenshot('homepage-layout.png', {
            fullPage: true,
            animations: 'disabled',
        })
    })

    test('trajectory prediction panel renders correctly', async ({ page }) => {
        const trajectoryPanel = page.locator('#trajectory-panel')

        // Initial state
        await expect(trajectoryPanel).toHaveScreenshot('trajectory-panel-initial.png')

        // Add vehicle
        await page.click('#btn-add-vehicle')
        await page.waitForTimeout(500)

        // Verify vehicle added
        await expect(trajectoryPanel).toHaveScreenshot('trajectory-panel-with-vehicle.png')

        // Start prediction
        await page.click('#btn-predict')
        await page.waitForTimeout(1000)

        // Verify prediction visualization
        await expect(trajectoryPanel).toHaveScreenshot('trajectory-panel-predicting.png')
    })

    test('anomaly detection panel visual states', async ({ page }) => {
        const anomalyPanel = page.locator('#anomaly-panel')

        // Initial state
        await expect(anomalyPanel).toHaveScreenshot('anomaly-panel-initial.png')

        // Start monitoring
        await page.click('#btn-start-monitoring')
        await page.waitForTimeout(2000)

        // Capture normal operation
        await expect(anomalyPanel).toHaveScreenshot('anomaly-panel-monitoring.png')

        // Inject anomaly
        await page.click('#btn-inject-anomaly')
        await page.waitForTimeout(1000)

        // Capture anomaly state
        await expect(anomalyPanel).toHaveScreenshot('anomaly-panel-with-anomaly.png', {
            // Higher threshold for dynamic content
            threshold: 0.3,
        })
    })

    test('object detection visualization', async ({ page }) => {
        const detectionPanel = page.locator('#detection-panel')

        // Start detection
        await page.click('#btn-start-detection')
        await page.waitForTimeout(1000)

        await expect(detectionPanel).toHaveScreenshot('detection-panel-active.png')

        // Generate complex scene
        await page.click('#btn-complex-scene')
        await page.waitForTimeout(1000)

        await expect(detectionPanel).toHaveScreenshot('detection-panel-complex.png', {
            threshold: 0.25, // Allow for variation in random object placement
        })
    })

    test('continuous learning progress visualization', async ({ page }) => {
        const learningPanel = page.locator('#learning-panel')

        // Initial state
        await expect(learningPanel).toHaveScreenshot('learning-panel-initial.png')

        // Start training
        await page.click('#btn-train')
        await page.waitForTimeout(500)

        // Run multiple iterations
        for (let i = 0; i < 3; i++) {
            await page.click('#btn-train-iteration')
            await page.waitForTimeout(500)
        }

        await expect(learningPanel).toHaveScreenshot('learning-panel-training.png', {
            threshold: 0.3, // Charts will have slight variations
        })
    })

    test('sensor fusion 3D visualization', async ({ page }) => {
        const fusionPanel = page.locator('#fusion-panel')

        // Skip if 3D not supported
        const is3DSupported = await page.evaluate(() => {
            return typeof window.lightningChart?.Chart3D === 'function'
        })

        if (!is3DSupported) {
            test.skip()
            return
        }

        // Start fusion
        await page.click('#btn-start-fusion')
        await page.waitForTimeout(2000)

        await expect(fusionPanel).toHaveScreenshot('fusion-panel-active.png', {
            threshold: 0.35, // 3D visualizations have more variation
        })
    })

    test('performance metrics dashboard', async ({ page }) => {
        const performancePanel = page.locator('#performance-panel')

        // Let metrics accumulate
        await page.waitForTimeout(3000)

        await expect(performancePanel).toHaveScreenshot('performance-panel.png', {
            threshold: 0.25,
            mask: [page.locator('.metric-value')], // Mask dynamic values
        })
    })

    test('responsive design - mobile view', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 })
        await page.waitForTimeout(1000)

        await expect(page).toHaveScreenshot('mobile-view.png', {
            fullPage: true,
        })
    })

    test('dark mode visual consistency', async ({ page }) => {
        // The app is already in dark mode by default
        // Capture full page in dark mode
        await expect(page).toHaveScreenshot('dark-mode-full.png', {
            fullPage: true,
        })

        // Test individual components maintain visual consistency
        const panels = [
            '#trajectory-panel',
            '#anomaly-panel',
            '#detection-panel',
            '#performance-panel',
            '#learning-panel',
            '#fusion-panel',
        ]

        for (const panel of panels) {
            const element = page.locator(panel)
            if (await element.isVisible()) {
                await expect(element).toHaveScreenshot(`dark-mode-${panel.slice(1)}.png`)
            }
        }
    })

    test('loading states and transitions', async ({ page }) => {
        // Reload page to capture loading states
        await page.reload()

        // Capture initial loading
        await expect(page).toHaveScreenshot('loading-state.png', {
            fullPage: true,
            animations: 'disabled',
        })

        // Wait for full load
        await page.waitForSelector('.lcjs-chart', { state: 'visible' })
        await page.waitForTimeout(1000)

        // Verify loaded state
        await expect(page).toHaveScreenshot('loaded-state.png', {
            fullPage: true,
        })
    })
})
