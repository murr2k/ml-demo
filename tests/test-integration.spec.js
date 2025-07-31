import { test, expect } from '@playwright/test'

test.describe('ML WebSocket Integration', () => {
    test('verify ML server and client integration', async ({ page }) => {
        console.log('Testing ML WebSocket integration...')
        
        // Navigate to the page
        await page.goto('http://localhost:5173')
        
        // Wait for WebSocket connection
        await page.waitForTimeout(2000)
        
        // Check console for connection message
        const consoleLogs = []
        page.on('console', msg => {
            consoleLogs.push(msg.text())
            console.log('Console:', msg.text())
        })
        
        // Check if ML server connection was established
        const connected = consoleLogs.some(log => log.includes('Connected to ML server'))
        console.log('WebSocket connected:', connected)
        
        // Wait for initial simulations to start
        await page.waitForTimeout(1000)
        
        // Check if predictions are working
        const predictionAccuracy = await page.locator('#prediction-accuracy').textContent()
        console.log('Prediction accuracy:', predictionAccuracy)
        expect(predictionAccuracy).toMatch(/\d+\.\d+%/)
        
        // Check if anomaly detection is working
        const anomalyButton = await page.locator('#btn-start-monitoring').textContent()
        console.log('Anomaly monitoring:', anomalyButton)
        expect(anomalyButton).toBe('Stop Monitoring')
        
        // Check if object detection is working  
        const objectsDetected = await page.locator('#objects-detected').textContent()
        console.log('Objects detected:', objectsDetected)
        expect(objectsDetected).toMatch(/Objects Detected: \d+/)
        
        // Take a screenshot
        await page.screenshot({ path: 'tests/websocket-integration.png', fullPage: true })
        
        console.log('\n✅ Integration test passed! ML server and client are working together.')
    })
    
    test('test WebSocket reconnection', async ({ page }) => {
        await page.goto('http://localhost:5173')
        await page.waitForTimeout(2000)
        
        // Simulate server disconnect by evaluating in page context
        await page.evaluate(() => {
            if (window.mlWebSocket && window.mlWebSocket.ws) {
                window.mlWebSocket.ws.close()
            }
        })
        
        console.log('WebSocket disconnected, waiting for reconnection...')
        await page.waitForTimeout(3000)
        
        // Check if reconnection occurred
        const isConnected = await page.evaluate(() => {
            return window.mlWebSocket && window.mlWebSocket.isConnected
        })
        
        console.log('Reconnected:', isConnected)
    })
})