import { chromium } from 'playwright';

(async () => {
    console.log('Starting ML Demo...\n');
    
    // Check if servers are running
    console.log('Checking servers...');
    
    try {
        // Check ML server
        const mlResponse = await fetch('http://localhost:8080/health');
        console.log('✓ ML Server is running on port 8080');
    } catch (e) {
        console.log('✗ ML Server is not running. Please start it with: cd ml-server && cargo run');
        process.exit(1);
    }
    
    try {
        // Check Vite server
        const viteResponse = await fetch('http://localhost:5173');
        console.log('✓ Vite dev server is running on port 5173');
    } catch (e) {
        console.log('✗ Vite server is not running. Please start it with: npm run dev');
        process.exit(1);
    }
    
    console.log('\nOpening ML Demo in browser...');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: null
    });
    
    const page = await context.newPage();
    
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    console.log('\n✅ ML Demo is now running!');
    console.log('\nFeatures:');
    console.log('- Trajectory Prediction: Predicting vehicle paths in real-time');
    console.log('- Anomaly Detection: Monitoring sensor data for anomalies');
    console.log('- Object Detection: Detecting and classifying objects');
    console.log('- Sensor Fusion: Combining multiple sensor inputs');
    console.log('- Continuous Learning: Model improvement visualization');
    console.log('- Performance Metrics: Real-time system performance');
    
    console.log('\nThe browser will remain open. Close it when you\'re done.');
    
    // Keep the script running
    await new Promise(() => {});
})();