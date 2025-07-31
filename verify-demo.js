import { chromium } from 'playwright';

(async () => {
    console.log('🔍 Verifying ML Demo with WebSocket...\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Capture console
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌', msg.text());
        }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Check WebSocket connection
    const wsStatus = await page.evaluate(() => {
        return window.mlWebSocket && window.mlWebSocket.isConnected;
    });
    console.log('WebSocket connected:', wsStatus ? '✅' : '❌');
    
    // Check charts
    const chartStatus = await page.evaluate(() => {
        if (!window.charts) return null;
        return Object.entries(window.charts).map(([name, chart]) => ({
            name,
            exists: !!chart
        }));
    });
    
    console.log('\nChart Status:');
    if (chartStatus) {
        chartStatus.forEach(({ name, exists }) => {
            console.log(`  ${name}: ${exists ? '✅' : '❌'}`);
        });
    }
    
    // Check if data is flowing
    await page.waitForTimeout(2000);
    
    const dataStatus = await page.evaluate(() => {
        return {
            activeAgents: document.getElementById('active-agents')?.textContent,
            predictionAccuracy: document.getElementById('prediction-accuracy')?.textContent,
            objectsDetected: document.getElementById('objects-detected')?.textContent,
            inferenceTime: document.getElementById('inference-time')?.textContent
        };
    });
    
    console.log('\nData Flow:');
    console.log('  Active Agents:', dataStatus.activeAgents || '❌');
    console.log('  Prediction Accuracy:', dataStatus.predictionAccuracy || '❌');
    console.log('  Objects Detected:', dataStatus.objectsDetected || '❌');
    console.log('  Inference Time:', dataStatus.inferenceTime || '❌');
    
    console.log('\n✅ Demo is running! You can interact with it in the browser.');
    console.log('\nFeatures to try:');
    console.log('  - Click buttons to start/stop simulations');
    console.log('  - Add more vehicles');
    console.log('  - Adjust anomaly threshold');
    console.log('  - Toggle sensors');
    
    // Keep browser open
    await new Promise(() => {});
})();