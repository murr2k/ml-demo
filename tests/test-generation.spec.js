import { test, expect } from '@playwright/test'
import { TestRecorder, recordUserActions } from './test-recorder.js'

test.describe('Test Generation from User Interactions', () => {
    let recorder

    test.beforeEach(async ({ page }) => {
        recorder = new TestRecorder()
        await page.goto('/')
        await page.waitForSelector('.lcjs-chart')
    })

    test('can record and generate test from user interactions', async ({ page }) => {
        // Inject test recorder
        await page.evaluate(recorder.inject())

        // Start recording
        await page.evaluate(() => window.__testRecorder.start())

        // Simulate user interactions
        await page.click('#btn-add-vehicle')
        await page.waitForTimeout(500)

        await page.click('#btn-predict')
        await page.waitForTimeout(1000)

        await page.click('#btn-start-monitoring')
        await page.waitForTimeout(500)

        // Add manual assertion
        await page.evaluate(() => {
            window.__testRecorder.captureAssertion('visible', '#trajectory-chart')
        })

        // Stop recording
        const actions = await page.evaluate(() => window.__testRecorder.stop())

        // Generate test
        const generatedTest = recorder.generateTest(actions, 'Vehicle Trajectory Test')

        // Verify recording captured actions
        expect(actions).toHaveLength(4)
        expect(actions[0].type).toBe('click')
        expect(actions[0].selector).toContain('btn-add-vehicle')

        // Verify generated test contains expected code
        expect(generatedTest).toContain("test('Vehicle Trajectory Test'")
        expect(generatedTest).toContain('await page.click')
        expect(generatedTest).toContain('await expect')

        console.log('Generated Test:')
        console.log(generatedTest)
    })

    test('generates smart tests with automatic assertions', async ({ page }) => {
        const result = await recordUserActions(page, async () => {
            // User flow for anomaly detection
            await page.click('#btn-start-monitoring')
            await page.waitForTimeout(1000)

            await page.click('#btn-inject-anomaly')
            await page.waitForTimeout(500)

            await page.click('#btn-stop-monitoring')
        })

        // Verify smart test generation
        expect(result.actions).toHaveLength(3)
        expect(result.test).toContain('await page.click')
        expect(result.test).toContain('waitForTimeout')

        // Save generated test
        console.log('Smart Generated Test:')
        console.log(result.test)
    })

    test('captures complex user flows with multiple panels', async ({ page }) => {
        await page.evaluate(recorder.inject())
        await page.evaluate(() => window.__testRecorder.start())

        // Complex user flow across multiple ML panels
        // 1. Trajectory prediction
        await page.click('#btn-add-vehicle')
        await page.click('#btn-add-pedestrian')
        await page.click('#btn-predict')
        await page.waitForTimeout(1000)

        // 2. Object detection
        await page.click('#btn-start-detection')
        await page.waitForTimeout(500)
        await page.click('#btn-complex-scene')
        await page.waitForTimeout(500)

        // 3. Continuous learning
        await page.click('#btn-train')
        await page.waitForTimeout(500)

        for (let i = 0; i < 3; i++) {
            await page.click('#btn-train-iteration')
            await page.waitForTimeout(300)
        }

        // 4. Capture screenshot assertion
        await page.evaluate(() => {
            window.__testRecorder.captureScreenshot('ml-dashboard-active')
        })

        const actions = await page.evaluate(() => window.__testRecorder.stop())
        const generatedTest = recorder.generateTest(actions, 'Complete ML Dashboard Flow')

        // Verify comprehensive test generation
        expect(actions.length).toBeGreaterThan(8)
        expect(generatedTest).toContain('btn-add-vehicle')
        expect(generatedTest).toContain('btn-train-iteration')
        expect(generatedTest).toContain('toHaveScreenshot')

        console.log(`Generated ${actions.length} test steps from user flow`)
    })

    test('generates test suite from multiple recordings', async ({ page }) => {
        const flows = []

        // Record flow 1: Trajectory prediction
        await page.evaluate(recorder.inject())
        await page.evaluate(() => window.__testRecorder.start())

        await page.click('#btn-add-vehicle')
        await page.click('#btn-predict')

        flows.push({
            name: 'Trajectory Prediction Flow',
            actions: await page.evaluate(() => window.__testRecorder.stop()),
        })

        // Record flow 2: Anomaly detection
        await page.evaluate(() => window.__testRecorder.start())

        await page.click('#btn-start-monitoring')
        await page.click('#btn-inject-anomaly')

        flows.push({
            name: 'Anomaly Detection Flow',
            actions: await page.evaluate(() => window.__testRecorder.stop()),
        })

        // Generate complete test suite
        const testSuite = recorder.generateTestSuite(flows)

        expect(testSuite).toContain("test.describe('Recorded User Flows'")
        expect(testSuite).toContain('Trajectory Prediction Flow')
        expect(testSuite).toContain('Anomaly Detection Flow')

        console.log('Generated Test Suite:')
        console.log(testSuite)
    })

    test('handles dynamic selectors intelligently', async ({ page }) => {
        await page.evaluate(recorder.inject())

        // Test selector generation with different element types
        const selectorTests = await page.evaluate(() => {
            const results = []

            // Test data-testid
            const testIdElement = document.createElement('button')
            testIdElement.setAttribute('data-testid', 'my-test-button')
            document.body.appendChild(testIdElement)
            results.push({
                type: 'data-testid',
                selector: window.__testRecorder.getSelector(testIdElement),
            })

            // Test ID selector
            const idElement = document.createElement('div')
            idElement.id = 'unique-id'
            document.body.appendChild(idElement)
            results.push({
                type: 'id',
                selector: window.__testRecorder.getSelector(idElement),
            })

            // Test text selector for button
            const textButton = document.createElement('button')
            textButton.textContent = 'Click Me'
            document.body.appendChild(textButton)
            results.push({
                type: 'text',
                selector: window.__testRecorder.getSelector(textButton),
            })

            // Cleanup
            testIdElement.remove()
            idElement.remove()
            textButton.remove()

            return results
        })

        // Verify smart selector generation
        expect(selectorTests[0].selector).toBe('[data-testid="my-test-button"]')
        expect(selectorTests[1].selector).toBe('#unique-id')
        expect(selectorTests[2].selector).toBe('text="Click Me"')

        console.log('Selector generation test results:', selectorTests)
    })

    test('preserves timing information for realistic playback', async ({ page }) => {
        await page.evaluate(recorder.inject())
        await page.evaluate(() => window.__testRecorder.start())

        // Actions with deliberate delays
        await page.click('#btn-add-vehicle')
        await page.waitForTimeout(2000) // 2 second delay

        await page.click('#btn-predict')
        await page.waitForTimeout(500) // 0.5 second delay

        await page.click('#btn-clear')

        const actions = await page.evaluate(() => window.__testRecorder.stop())
        const generatedTest = recorder.generateTest(actions)

        // Verify timing is preserved
        expect(generatedTest).toContain('waitForTimeout(2000)')
        expect(generatedTest).not.toContain('waitForTimeout(500)') // Too short, should be ignored

        // Verify action timestamps
        expect(actions[1].timestamp).toBeGreaterThan(actions[0].timestamp + 1500)
    })
})
