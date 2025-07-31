import { test } from '@playwright/test'

test.describe('ML Demo Showcase', () => {
    test('open and showcase the ML demo', async ({ page }) => {
        console.log('Opening ML Demo in browser...')
        
        // Navigate to the page
        await page.goto('http://localhost:5173')
        
        // Wait for loading to complete
        await page.waitForSelector('#loading-indicator', { state: 'hidden', timeout: 30000 })
        
        console.log('Page loaded successfully!')
        console.log('All simulations are running automatically.')
        console.log('\nYou can interact with:')
        console.log('- Vehicle trajectories (add more vehicles, clear)')
        console.log('- Anomaly detection (inject anomalies, adjust threshold)')
        console.log('- Object detection (simulate complex scenes)')
        console.log('- Continuous learning (train iterations)')
        console.log('- Sensor fusion (toggle sensors)')
        
        // Keep the browser open for 60 seconds so you can interact with it
        console.log('\nBrowser will stay open for 60 seconds...')
        await page.waitForTimeout(60000)
    })
})