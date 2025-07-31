import { chromium } from 'playwright';

(async () => {
    console.log('🚀 Starting ML Demo with Rust Backend\n');
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
        viewport: null
    });
    
    const page = await context.newPage();
    
    console.log('Opening http://localhost:5173...');
    await page.goto('http://localhost:5173');
    
    // Wait a moment for everything to initialize
    await page.waitForTimeout(3000);
    
    console.log('\n✅ ML Demo is running!\n');
    console.log('Architecture:');
    console.log('  🌐 Browser: Visualization only (LightningChart.js)');
    console.log('  🦀 Rust Server: ML inference (port 8080)');
    console.log('  🔌 WebSocket: Real-time bidirectional communication\n');
    
    console.log('What you should see:');
    console.log('  📊 Multiple real-time charts updating');
    console.log('  🚗 Vehicles moving with trajectory predictions');
    console.log('  🔍 Anomaly detection monitoring');
    console.log('  🎯 Object detection results');
    console.log('  📈 Performance metrics\n');
    
    console.log('Try these actions:');
    console.log('  • Add more vehicles with "Add Vehicle" button');
    console.log('  • Inject anomalies to see detection');
    console.log('  • Toggle sensors on/off');
    console.log('  • Train the continuous learning model\n');
    
    console.log('The browser will stay open. Close it when done.');
    
    // Keep the browser open
    await new Promise(() => {});
})();