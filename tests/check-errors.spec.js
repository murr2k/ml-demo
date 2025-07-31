import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
        console.log(`${msg.type()}: ${msg.text()}`);
    });
    
    // Capture errors
    page.on('pageerror', err => {
        console.error('Page error:', err);
    });
    
    console.log('Opening http://localhost:5173...');
    await page.goto('http://localhost:5173');
    
    // Wait for potential errors
    await page.waitForTimeout(5000);
    
    // Check WebSocket connection
    const wsConnected = await page.evaluate(() => {
        return window.mlWebSocket && window.mlWebSocket.isConnected;
    });
    
    console.log('\nWebSocket connected:', wsConnected);
    
    // Check for chart errors
    const chartsLoaded = await page.evaluate(() => {
        return window.charts !== null && Object.keys(window.charts).length > 0;
    });
    
    console.log('Charts loaded:', chartsLoaded);
    
    // Get current state
    const currentState = await page.evaluate(() => {
        return {
            activeAgents: document.getElementById('active-agents')?.textContent,
            predictionBtn: document.getElementById('btn-predict')?.textContent,
            monitoringBtn: document.getElementById('btn-start-monitoring')?.textContent,
            detectionBtn: document.getElementById('btn-start-detection')?.textContent,
        };
    });
    
    console.log('\nCurrent state:', currentState);
    
    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
})();