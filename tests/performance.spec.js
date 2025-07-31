import { test, expect } from '@playwright/test'

test.describe('Performance Benchmarking', () => {
    test.beforeEach(async ({ page }) => {
        // Set up performance observers
        await page.evaluateOnNewDocument(() => {
            window.performanceMetrics = {
                renderTimes: [],
                interactionDelays: [],
                memorySnapshots: [],
                chartUpdateTimes: {},
            }

            // Monitor long tasks
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            // Tasks longer than 50ms
                            window.performanceMetrics.longTasks = window.performanceMetrics.longTasks || []
                            window.performanceMetrics.longTasks.push({
                                name: entry.name,
                                duration: entry.duration,
                                startTime: entry.startTime,
                            })
                        }
                    }
                })

                try {
                    observer.observe({ entryTypes: ['longtask'] })
                } catch (e) {
                    // Long task monitoring not supported
                }
            }
        })

        await page.goto('/')
        await page.waitForSelector('.lcjs-chart', { state: 'visible' })
    })

    test('initial page load performance', async ({ page }) => {
        const metrics = await page.evaluate(() => {
            const timing = performance.timing
            const navigation = performance.getEntriesByType('navigation')[0]

            return {
                // Page load metrics
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,

                // Resource metrics
                resources: performance.getEntriesByType('resource').map(r => ({
                    name: r.name.split('/').pop(),
                    duration: r.duration,
                    size: r.transferSize,
                    type: r.initiatorType,
                })),

                // Memory usage (if available)
                memory: performance.memory
                    ? {
                          usedJSHeapSize: performance.memory.usedJSHeapSize,
                          totalJSHeapSize: performance.memory.totalJSHeapSize,
                          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                      }
                    : null,
            }
        })

        // Performance assertions
        expect(metrics.domContentLoaded).toBeLessThan(3000) // DOM ready in 3s
        expect(metrics.loadComplete).toBeLessThan(5000) // Full load in 5s
        expect(metrics.firstContentfulPaint).toBeLessThan(1500) // FCP in 1.5s

        // Log performance summary
        console.log('📊 Page Load Performance:')
        console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`)
        console.log(`   Page Load Complete: ${metrics.loadComplete}ms`)
        console.log(`   First Paint: ${metrics.firstPaint.toFixed(0)}ms`)
        console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(0)}ms`)

        if (metrics.memory) {
            console.log(`   Memory Usage: ${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`)
        }
    })

    test('chart rendering performance', async ({ page }) => {
        const renderingMetrics = []

        // Test each chart panel
        const panels = [
            { id: 'btn-add-vehicle', panel: 'trajectory', action: 'render vehicle' },
            { id: 'btn-start-monitoring', panel: 'anomaly', action: 'start monitoring' },
            { id: 'btn-start-detection', panel: 'detection', action: 'start detection' },
            { id: 'btn-train', panel: 'learning', action: 'start training' },
            { id: 'btn-start-fusion', panel: 'fusion', action: 'start fusion' },
        ]

        for (const { id, panel, action } of panels) {
            const button = page.locator(`#${id}`)
            if (!(await button.isVisible())) continue

            const metrics = await page.evaluate(
                async ({ buttonId, panelName }) => {
                    const startTime = performance.now()

                    // Click button
                    document.querySelector(`#${buttonId}`).click()

                    // Wait for chart update
                    await new Promise(resolve => setTimeout(resolve, 1000))

                    const endTime = performance.now()
                    const duration = endTime - startTime

                    // Measure frame rate during update
                    let frameCount = 0
                    const frameStartTime = performance.now()

                    await new Promise(resolve => {
                        const countFrames = () => {
                            frameCount++
                            if (performance.now() - frameStartTime < 1000) {
                                requestAnimationFrame(countFrames)
                            } else {
                                resolve()
                            }
                        }
                        requestAnimationFrame(countFrames)
                    })

                    return {
                        panel: panelName,
                        renderTime: duration,
                        fps: frameCount,
                        memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
                    }
                },
                { buttonId: id, panelName: panel }
            )

            renderingMetrics.push(metrics)

            // Reset state
            await page.reload()
            await page.waitForSelector('.lcjs-chart', { state: 'visible' })
        }

        // Validate performance
        renderingMetrics.forEach(metric => {
            expect(metric.renderTime).toBeLessThan(2000) // Render in 2s
            expect(metric.fps).toBeGreaterThan(30) // At least 30 FPS
        })

        console.log('📈 Chart Rendering Performance:')
        renderingMetrics.forEach(m => {
            console.log(`   ${m.panel}: ${m.renderTime.toFixed(0)}ms, ${m.fps} FPS`)
        })
    })

    test('interaction responsiveness', async ({ page }) => {
        const interactions = []

        // Test button click responsiveness
        const buttons = await page.locator('button').all()

        for (const button of buttons.slice(0, 5)) {
            // Test first 5 buttons
            const buttonText = await button.textContent()

            const interactionTime = await page.evaluate(async btnText => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(btnText))

                if (!btn) return null

                const startTime = performance.now()

                // Create a promise that resolves when any DOM change occurs
                const domChanged = new Promise(resolve => {
                    const observer = new MutationObserver(() => {
                        observer.disconnect()
                        resolve()
                    })
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                    })
                })

                btn.click()

                // Wait for DOM change or timeout
                await Promise.race([domChanged, new Promise(resolve => setTimeout(resolve, 100))])

                return performance.now() - startTime
            }, buttonText)

            if (interactionTime !== null) {
                interactions.push({
                    button: buttonText,
                    responseTime: interactionTime,
                })
            }
        }

        // All interactions should be responsive
        interactions.forEach(interaction => {
            expect(interaction.responseTime).toBeLessThan(100) // Response in 100ms
        })

        console.log('⚡ Interaction Responsiveness:')
        interactions.forEach(i => {
            console.log(`   ${i.button}: ${i.responseTime.toFixed(0)}ms`)
        })
    })

    test('memory leak detection', async ({ page }) => {
        const memorySnapshots = []

        // Take initial memory snapshot
        const initialMemory = await page.evaluate(() => {
            if (performance.memory) {
                return performance.memory.usedJSHeapSize
            }
            return 0
        })

        // Perform repeated actions that could leak memory
        for (let i = 0; i < 10; i++) {
            // Add and remove vehicles
            await page.click('#btn-add-vehicle')
            await page.waitForTimeout(200)
            await page.click('#btn-clear')
            await page.waitForTimeout(200)

            // Start and stop monitoring
            await page.click('#btn-start-monitoring')
            await page.waitForTimeout(500)
            await page.click('#btn-stop-monitoring')
            await page.waitForTimeout(200)

            // Take memory snapshot
            const memory = await page.evaluate(() => {
                if (performance.memory) {
                    // Force garbage collection if available
                    if (window.gc) window.gc()
                    return performance.memory.usedJSHeapSize
                }
                return 0
            })

            memorySnapshots.push(memory)
        }

        // Check for memory leaks
        const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - initialMemory
        const avgMemory = memorySnapshots.reduce((a, b) => a + b) / memorySnapshots.length

        // Memory growth should be reasonable
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth

        console.log('💾 Memory Usage Analysis:')
        console.log(`   Initial: ${(initialMemory / 1024 / 1024).toFixed(1)}MB`)
        console.log(`   Final: ${(memorySnapshots[memorySnapshots.length - 1] / 1024 / 1024).toFixed(1)}MB`)
        console.log(`   Growth: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB`)
        console.log(`   Average: ${(avgMemory / 1024 / 1024).toFixed(1)}MB`)
    })

    test('concurrent operations performance', async ({ page }) => {
        // Start multiple operations simultaneously
        const concurrentMetrics = await page.evaluate(async () => {
            const startTime = performance.now()

            // Start all operations at once
            const operations = [
                document.querySelector('#btn-add-vehicle')?.click(),
                document.querySelector('#btn-start-monitoring')?.click(),
                document.querySelector('#btn-start-detection')?.click(),
                document.querySelector('#btn-train')?.click(),
                document.querySelector('#btn-start-fusion')?.click(),
            ]

            // Wait for all charts to update
            await new Promise(resolve => setTimeout(resolve, 2000))

            const endTime = performance.now()

            // Count active animations
            let activeAnimations = 0
            document.querySelectorAll('.lcjs-chart').forEach(chart => {
                if (chart.querySelector('canvas')) {
                    activeAnimations++
                }
            })

            return {
                totalTime: endTime - startTime,
                activeCharts: activeAnimations,
                longTasks: window.performanceMetrics?.longTasks || [],
            }
        })

        // System should handle concurrent operations efficiently
        expect(concurrentMetrics.totalTime).toBeLessThan(3000)
        expect(concurrentMetrics.activeCharts).toBeGreaterThan(0)
        expect(concurrentMetrics.longTasks.filter(t => t.duration > 100).length).toBeLessThan(5)

        console.log('🔄 Concurrent Operations:')
        console.log(`   Total time: ${concurrentMetrics.totalTime.toFixed(0)}ms`)
        console.log(`   Active charts: ${concurrentMetrics.activeCharts}`)
        console.log(`   Long tasks (>100ms): ${concurrentMetrics.longTasks.filter(t => t.duration > 100).length}`)
    })

    test('chart data update frequency', async ({ page }) => {
        // Monitor update frequency for real-time charts
        await page.click('#btn-start-monitoring')

        const updateMetrics = await page.evaluate(async () => {
            const updates = []
            let lastUpdateTime = performance.now()

            // Monitor for 5 seconds
            return new Promise(resolve => {
                const observer = new MutationObserver(() => {
                    const currentTime = performance.now()
                    const timeSinceLastUpdate = currentTime - lastUpdateTime

                    if (timeSinceLastUpdate > 50) {
                        // Ignore rapid successive updates
                        updates.push(timeSinceLastUpdate)
                        lastUpdateTime = currentTime
                    }
                })

                // Observe chart container
                const chartContainer = document.querySelector('#anomaly-chart')
                if (chartContainer) {
                    observer.observe(chartContainer, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                    })
                }

                setTimeout(() => {
                    observer.disconnect()

                    const avgUpdateInterval = updates.length > 0 ? updates.reduce((a, b) => a + b) / updates.length : 0

                    resolve({
                        updateCount: updates.length,
                        avgInterval: avgUpdateInterval,
                        minInterval: Math.min(...updates),
                        maxInterval: Math.max(...updates),
                    })
                }, 5000)
            })
        })

        // Validate update frequency
        expect(updateMetrics.updateCount).toBeGreaterThan(10) // At least 10 updates in 5s
        expect(updateMetrics.avgInterval).toBeLessThan(500) // Updates at least every 500ms

        console.log('📉 Chart Update Frequency:')
        console.log(`   Updates in 5s: ${updateMetrics.updateCount}`)
        console.log(`   Avg interval: ${updateMetrics.avgInterval.toFixed(0)}ms`)
        console.log(`   Min interval: ${updateMetrics.minInterval.toFixed(0)}ms`)
        console.log(`   Max interval: ${updateMetrics.maxInterval.toFixed(0)}ms`)
    })

    test('resource utilization', async ({ page }) => {
        const resources = await page.evaluate(() => {
            const resourceData = performance.getEntriesByType('resource')

            // Group by type
            const byType = {}
            resourceData.forEach(r => {
                const type = r.name.endsWith('.js')
                    ? 'javascript'
                    : r.name.endsWith('.css')
                      ? 'css'
                      : r.name.includes('font')
                        ? 'font'
                        : r.initiatorType

                if (!byType[type]) {
                    byType[type] = {
                        count: 0,
                        totalSize: 0,
                        totalDuration: 0,
                    }
                }

                byType[type].count++
                byType[type].totalSize += r.transferSize || 0
                byType[type].totalDuration += r.duration || 0
            })

            return {
                total: resourceData.length,
                byType,
                largestResources: resourceData
                    .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
                    .slice(0, 5)
                    .map(r => ({
                        name: r.name.split('/').pop(),
                        size: r.transferSize || 0,
                        duration: r.duration || 0,
                    })),
            }
        })

        console.log('📦 Resource Utilization:')
        console.log(`   Total resources: ${resources.total}`)
        Object.entries(resources.byType).forEach(([type, data]) => {
            console.log(`   ${type}: ${data.count} files, ${(data.totalSize / 1024).toFixed(1)}KB`)
        })
        console.log('\n   Largest resources:')
        resources.largestResources.forEach(r => {
            console.log(`   - ${r.name}: ${(r.size / 1024).toFixed(1)}KB in ${r.duration.toFixed(0)}ms`)
        })
    })
})
