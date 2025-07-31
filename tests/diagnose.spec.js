import { test } from '@playwright/test'

test('diagnose page freezing', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()))
    page.on('pageerror', err => console.log('PAGE ERROR:', err))
    
    console.log('Navigating to page...')
    
    try {
        // Navigate with a short timeout to detect freezing
        await page.goto('http://localhost:5173', { 
            timeout: 5000,
            waitUntil: 'domcontentloaded' 
        })
        
        console.log('Page loaded successfully')
        
        // Check what script is being loaded
        const scriptSrc = await page.evaluate(() => {
            const script = document.querySelector('script[type="module"]')
            return script ? script.src : 'No module script found'
        })
        console.log('Script source:', scriptSrc)
        
        // Wait a bit and check if page is responsive
        await page.waitForTimeout(2000)
        
        // Try to evaluate something to check responsiveness
        const isResponsive = await page.evaluate(() => {
            return 'Page is responsive'
        }).catch(() => 'Page is frozen')
        
        console.log('Responsiveness check:', isResponsive)
        
        // Take a screenshot
        await page.screenshot({ path: 'tests/diagnose.png' })
        console.log('Screenshot saved')
        
    } catch (error) {
        console.error('Error during diagnosis:', error.message)
        
        // Try to get any info we can
        try {
            const title = await page.title().catch(() => 'Could not get title')
            console.log('Page title:', title)
        } catch (e) {
            console.log('Could not access page at all')
        }
    }
})