import { test, expect } from '@playwright/test'

test.describe('ML Demo Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/')
        await page.waitForLoadState('networkidle')
    })

    test('page loads correctly', async ({ page }) => {
        await expect(page).toHaveTitle('Autonomous Vehicle ML Demo - Murray Kopit')
        const header = page.locator('h1')
        await expect(header).toContainText('Autonomous Vehicle ML Demo')
    })

    test('all panels are visible', async ({ page }) => {
        const panels = [
            'Trajectory Prediction',
            'Sensor Anomaly Detection',
            'Model Performance Metrics',
            'Object Detection Confidence',
            'Continuous Learning Progress',
            'Real-time Sensor Fusion',
        ]

        for (const panelTitle of panels) {
            const panel = page.locator(`h2:has-text("${panelTitle}")`)
            await expect(panel).toBeVisible()
        }
    })

    test('trajectory prediction controls work', async ({ page }) => {
        const predictBtn = page.locator('#btn-predict')
        await expect(predictBtn).toBeVisible()
        await expect(predictBtn).toHaveText('Start Prediction')

        await predictBtn.click()
        await expect(predictBtn).toHaveText('Stop Prediction')

        const addVehicleBtn = page.locator('#btn-add-vehicle')
        await addVehicleBtn.click()

        // Check if agent count updated
        const agentCount = page.locator('#active-agents')
        await expect(agentCount).not.toHaveText('0')
    })

    test('anomaly detection controls work', async ({ page }) => {
        const monitorBtn = page.locator('#btn-start-monitoring')
        await expect(monitorBtn).toBeVisible()
        await expect(monitorBtn).toHaveText('Start Monitoring')

        await monitorBtn.click()
        await expect(monitorBtn).toHaveText('Stop Monitoring')

        // Test threshold slider
        const slider = page.locator('#anomaly-threshold')
        await slider.fill('0.9')

        const thresholdValue = page.locator('#threshold-value')
        await expect(thresholdValue).toHaveText('0.9')
    })

    test('performance metrics update', async ({ page }) => {
        // Wait for initial metrics
        await page.waitForTimeout(1500)

        const inferenceTime = page.locator('#inference-time')
        const fps = page.locator('#fps-count')

        // Check that metrics have values
        const inferenceText = await inferenceTime.textContent()
        expect(inferenceText).toMatch(/\d+ms/)

        const fpsText = await fps.textContent()
        expect(parseInt(fpsText)).toBeGreaterThan(0)
    })

    test('continuous learning works', async ({ page }) => {
        const trainBtn = page.locator('#btn-train-iteration')
        await trainBtn.click()

        // Check epoch counter
        const epochs = page.locator('#training-epochs')
        await expect(epochs).toHaveText('1')

        // Train another iteration
        await trainBtn.click()
        await expect(epochs).toHaveText('2')
    })

    test('sensor fusion toggles work', async ({ page }) => {
        const lidarBtn = page.locator('#btn-toggle-lidar')
        const cameraBtn = page.locator('#btn-toggle-camera')
        const radarBtn = page.locator('#btn-toggle-radar')

        // Toggle sensors
        await lidarBtn.click()
        await cameraBtn.click()
        
        // Wait for UI update
        await page.waitForTimeout(500)

        // Check sensor health status
        const sensorHealth = page.locator('#sensor-health')
        await expect(sensorHealth).toHaveText('Degraded Performance')

        // Re-enable sensors
        await lidarBtn.click()
        await cameraBtn.click()
        await expect(sensorHealth).toHaveText('All Systems Operational')
    })
})

console.log('Test file created. Run with: npx playwright test')
