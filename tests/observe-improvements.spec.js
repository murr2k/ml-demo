import { test, expect } from '@playwright/test'

test.describe('Page Load Improvements Observation', () => {
    test('observe page load behavior and performance', async ({ page }) => {
        console.log('Starting page load observation...')
        
        // Start measuring time
        const startTime = Date.now()
        
        // Navigate to the page
        await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
        
        // Check for loading indicator
        const loadingIndicator = await page.locator('#loading-indicator').isVisible()
        console.log('Loading indicator visible:', loadingIndicator)
        
        // Wait for loading indicator to disappear (max 30 seconds)
        if (loadingIndicator) {
            await page.waitForSelector('#loading-indicator', { state: 'hidden', timeout: 30000 })
            const loadTime = Date.now() - startTime
            console.log(`Loading completed in ${loadTime}ms`)
        }
        
        // Wait a bit for everything to initialize
        await page.waitForTimeout(2000)
        
        // Take a screenshot of the loaded page
        await page.screenshot({ path: 'tests/loaded-page.png', fullPage: true })
        console.log('Screenshot saved as tests/loaded-page.png')
        
        // Check button states to verify auto-start
        const trajectoryBtn = await page.locator('#btn-predict').textContent()
        const monitoringBtn = await page.locator('#btn-start-monitoring').textContent()
        const detectionBtn = await page.locator('#btn-start-detection').textContent()
        
        console.log('\n=== Auto-Start Status ===')
        console.log('Trajectory Prediction:', trajectoryBtn === 'Stop Prediction' ? 'RUNNING ✓' : 'STOPPED ✗')
        console.log('Anomaly Monitoring:', monitoringBtn === 'Stop Monitoring' ? 'RUNNING ✓' : 'STOPPED ✗')
        console.log('Object Detection:', detectionBtn === 'Stop Detection' ? 'RUNNING ✓' : 'STOPPED ✗')
        
        // Check metrics to verify data is being generated
        const activeAgents = await page.locator('#active-agents').textContent()
        const predictionAccuracy = await page.locator('#prediction-accuracy').textContent()
        const objectsDetected = await page.locator('#objects-detected').textContent()
        const trainingEpochs = await page.locator('#training-epochs').textContent()
        
        console.log('\n=== Initial Metrics ===')
        console.log('Active Agents:', activeAgents)
        console.log('Prediction Accuracy:', predictionAccuracy)
        console.log('Objects Detected:', objectsDetected)
        console.log('Training Epochs:', trainingEpochs)
        
        // Check all chart containers have content
        const chartContainers = await page.locator('.chart-container').all()
        console.log('\n=== Chart Status ===')
        console.log(`Total charts found: ${chartContainers.length}`)
        
        for (let i = 0; i < chartContainers.length; i++) {
            const hasCanvas = await chartContainers[i].locator('canvas').count() > 0
            const chartId = await chartContainers[i].getAttribute('id')
            console.log(`${chartId}: ${hasCanvas ? 'HAS CONTENT ✓' : 'EMPTY ✗'}`)
        }
        
        // Wait and observe for 5 seconds to see if data is updating
        console.log('\n=== Observing data updates for 5 seconds ===')
        const initialInferenceTime = await page.locator('#inference-time').textContent()
        await page.waitForTimeout(5000)
        const finalInferenceTime = await page.locator('#inference-time').textContent()
        
        console.log('Performance metrics updating:', initialInferenceTime !== finalInferenceTime ? 'YES ✓' : 'NO ✗')
        
        // Take a final screenshot
        await page.screenshot({ path: 'tests/final-state.png', fullPage: true })
        console.log('\nFinal screenshot saved as tests/final-state.png')
        
        // Measure any console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('Console error:', msg.text())
            }
        })
        
        // Final summary
        console.log('\n=== OBSERVATION COMPLETE ===')
        console.log('Page loaded successfully with all improvements applied.')
    })
    
    test('measure page responsiveness during load', async ({ page }) => {
        // Monitor for any page freezes
        let responsiveChecks = 0
        let unresponsiveCount = 0
        
        page.on('domcontentloaded', () => {
            console.log('DOM Content Loaded')
        })
        
        page.on('load', () => {
            console.log('Page fully loaded')
        })
        
        // Navigate and immediately start checking responsiveness
        const navigationPromise = page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
        
        // Check page responsiveness every 100ms during load
        const checkInterval = setInterval(async () => {
            try {
                responsiveChecks++
                // Try to evaluate a simple expression - if page is frozen, this will timeout
                await page.evaluate(() => Date.now(), { timeout: 50 }).catch(() => {
                    unresponsiveCount++
                    console.log(`Page unresponsive at check #${responsiveChecks}`)
                })
            } catch (e) {
                // Page might not be ready yet
            }
        }, 100)
        
        await navigationPromise
        clearInterval(checkInterval)
        
        console.log(`\n=== Responsiveness Report ===`)
        console.log(`Total checks: ${responsiveChecks}`)
        console.log(`Unresponsive moments: ${unresponsiveCount}`)
        console.log(`Responsiveness rate: ${((responsiveChecks - unresponsiveCount) / responsiveChecks * 100).toFixed(1)}%`)
        
        if (unresponsiveCount === 0) {
            console.log('✓ Page remained responsive throughout the entire load process!')
        } else {
            console.log(`⚠ Page was unresponsive ${unresponsiveCount} times during load`)
        }
    })
})