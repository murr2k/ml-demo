import { test, expect } from '@playwright/test'

test.describe('Debug Chart Loading', () => {
    test('check chart containers', async ({ page }) => {
        console.log('Navigating to page...')
        await page.goto('http://localhost:5173/')
        
        // Wait for basic page load
        await page.waitForLoadState('networkidle')
        
        // Check if chart containers exist
        const chartContainers = await page.locator('.chart-container').count()
        console.log(`Found ${chartContainers} chart containers`)
        
        // Check for any canvas elements (LightningChart renders to canvas)
        const canvasElements = await page.locator('canvas').count()
        console.log(`Found ${canvasElements} canvas elements`)
        
        // Check for lcjs-chart class
        const lcjsCharts = await page.locator('.lcjs-chart').count()
        console.log(`Found ${lcjsCharts} elements with lcjs-chart class`)
        
        // Wait and check again
        await page.waitForTimeout(2000)
        
        const canvasElementsAfter = await page.locator('canvas').count()
        console.log(`After wait: Found ${canvasElementsAfter} canvas elements`)
        
        // Get console messages
        page.on('console', msg => console.log('Browser console:', msg.text()))
        page.on('pageerror', error => console.log('Browser error:', error.message))
        
        // Check if charts were initialized
        const chartsInitialized = await page.evaluate(() => {
            return window.charts !== undefined && window.charts !== null
        })
        console.log('Charts initialized in window:', chartsInitialized)
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-charts.png', fullPage: true })
        
        // Expect at least chart containers to exist
        expect(chartContainers).toBeGreaterThan(0)
    })
})