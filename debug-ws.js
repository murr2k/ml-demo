import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable detailed console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.error('❌ ERROR:', text);
        } else if (type === 'warning') {
            console.warn('⚠️  WARN:', text);
        } else {
            console.log(`📝 ${type.toUpperCase()}:`, text);
        }
    });
    
    page.on('pageerror', err => {
        console.error('🔥 PAGE ERROR:', err);
    });
    
    // Monitor WebSocket traffic
    page.on('websocket', ws => {
        console.log('🔌 WebSocket created:', ws.url());
        
        ws.on('framesent', evt => {
            console.log('📤 WS SENT:', evt.payload);
        });
        
        ws.on('framereceived', evt => {
            console.log('📥 WS RECEIVED:', evt.payload);
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket closed');
        });
    });
    
    console.log('Opening page...\n');
    await page.goto('http://localhost:5173');
    
    // Wait a bit to see initial activity
    await page.waitForTimeout(3000);
    
    // Check WebSocket connection status
    const wsStatus = await page.evaluate(() => {
        if (window.mlWebSocket) {
            return {
                connected: window.mlWebSocket.isConnected,
                wsState: window.mlWebSocket.ws ? window.mlWebSocket.ws.readyState : 'no ws object',
                wsUrl: window.mlWebSocket.ws ? window.mlWebSocket.ws.url : 'no url'
            };
        }
        return { error: 'mlWebSocket not found' };
    });
    
    console.log('\n🔍 WebSocket Status:', wsStatus);
    
    // Check chart status
    const chartStatus = await page.evaluate(() => {
        if (window.charts) {
            return Object.keys(window.charts).map(key => ({
                name: key,
                exists: !!window.charts[key]
            }));
        }
        return { error: 'charts not found' };
    });
    
    console.log('\n📊 Chart Status:', chartStatus);
    
    // Check if simulations are running
    const simStatus = await page.evaluate(() => {
        return {
            activeAgents: document.getElementById('active-agents')?.textContent,
            isPredicting: document.getElementById('btn-predict')?.textContent,
            isMonitoring: document.getElementById('btn-start-monitoring')?.textContent,
            isDetecting: document.getElementById('btn-start-detection')?.textContent
        };
    });
    
    console.log('\n🎮 Simulation Status:', simStatus);
    
    // Try to manually trigger a WebSocket message
    console.log('\n📨 Sending test WebSocket message...');
    await page.evaluate(() => {
        if (window.mlWebSocket && window.mlWebSocket.ws) {
            window.mlWebSocket.send({
                message_type: 'heartbeat',
                payload: { timestamp: new Date().toISOString() }
            });
        }
    });
    
    await page.waitForTimeout(2000);
    
    // Keep browser open
    console.log('\n🔧 Browser will stay open for debugging. Check the console for any errors.');
    await new Promise(() => {});
})();