export class TestRecorder {
    constructor() {
        this.actions = []
        this.isRecording = false
        this.startTime = null
    }

    inject() {
        // Inject recording script into the page
        return `
            window.__testRecorder = {
                actions: [],
                isRecording: false,
                startTime: null,
                
                start() {
                    this.isRecording = true;
                    this.startTime = Date.now();
                    this.actions = [];
                    this.attachListeners();
                    console.log('🔴 Test recording started');
                },
                
                stop() {
                    this.isRecording = false;
                    this.removeListeners();
                    console.log('⏹️ Test recording stopped');
                    return this.actions;
                },
                
                attachListeners() {
                    // Click events
                    document.addEventListener('click', this.handleClick, true);
                    
                    // Input events
                    document.addEventListener('input', this.handleInput, true);
                    document.addEventListener('change', this.handleChange, true);
                    
                    // Navigation
                    window.addEventListener('popstate', this.handleNavigation);
                    
                    // Keyboard events
                    document.addEventListener('keydown', this.handleKeyboard, true);
                },
                
                removeListeners() {
                    document.removeEventListener('click', this.handleClick, true);
                    document.removeEventListener('input', this.handleInput, true);
                    document.removeEventListener('change', this.handleChange, true);
                    window.removeEventListener('popstate', this.handleNavigation);
                    document.removeEventListener('keydown', this.handleKeyboard, true);
                },
                
                handleClick: (e) => {
                    if (!window.__testRecorder.isRecording) return;
                    
                    const target = e.target;
                    const selector = window.__testRecorder.getSelector(target);
                    
                    window.__testRecorder.actions.push({
                        type: 'click',
                        selector,
                        timestamp: Date.now() - window.__testRecorder.startTime,
                        text: target.textContent?.trim().substring(0, 50),
                        tagName: target.tagName,
                        attributes: {
                            id: target.id,
                            class: target.className,
                            'data-testid': target.getAttribute('data-testid'),
                        }
                    });
                },
                
                handleInput: (e) => {
                    if (!window.__testRecorder.isRecording) return;
                    
                    const target = e.target;
                    const selector = window.__testRecorder.getSelector(target);
                    
                    // Debounce input events
                    clearTimeout(window.__testRecorder.inputTimeout);
                    window.__testRecorder.inputTimeout = setTimeout(() => {
                        window.__testRecorder.actions.push({
                            type: 'fill',
                            selector,
                            value: target.value,
                            timestamp: Date.now() - window.__testRecorder.startTime,
                        });
                    }, 500);
                },
                
                handleChange: (e) => {
                    if (!window.__testRecorder.isRecording) return;
                    
                    const target = e.target;
                    if (target.tagName === 'SELECT') {
                        const selector = window.__testRecorder.getSelector(target);
                        window.__testRecorder.actions.push({
                            type: 'select',
                            selector,
                            value: target.value,
                            timestamp: Date.now() - window.__testRecorder.startTime,
                        });
                    }
                },
                
                handleKeyboard: (e) => {
                    if (!window.__testRecorder.isRecording) return;
                    
                    // Record special keys
                    if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'Escape') {
                        window.__testRecorder.actions.push({
                            type: 'keyboard',
                            key: e.key,
                            timestamp: Date.now() - window.__testRecorder.startTime,
                        });
                    }
                },
                
                handleNavigation: () => {
                    if (!window.__testRecorder.isRecording) return;
                    
                    window.__testRecorder.actions.push({
                        type: 'navigation',
                        url: window.location.href,
                        timestamp: Date.now() - window.__testRecorder.startTime,
                    });
                },
                
                getSelector(element) {
                    // Priority: data-testid > id > unique class > tag + text
                    if (element.getAttribute('data-testid')) {
                        return \`[data-testid="\${element.getAttribute('data-testid')}"]\`;
                    }
                    
                    if (element.id) {
                        return \`#\${element.id}\`;
                    }
                    
                    // Try to find a unique class combination
                    const classes = Array.from(element.classList);
                    if (classes.length > 0) {
                        const selector = \`.\${classes.join('.')}\`;
                        if (document.querySelectorAll(selector).length === 1) {
                            return selector;
                        }
                    }
                    
                    // Use text content for buttons and links
                    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
                        const text = element.textContent.trim();
                        if (text) {
                            return \`text="\${text}"\`;
                        }
                    }
                    
                    // Generate path-based selector
                    return window.__testRecorder.getPathSelector(element);
                },
                
                getPathSelector(element) {
                    const path = [];
                    let current = element;
                    
                    while (current && current !== document.body) {
                        let selector = current.tagName.toLowerCase();
                        
                        // Add nth-child if needed
                        const siblings = Array.from(current.parentNode?.children || []);
                        const index = siblings.indexOf(current);
                        
                        if (siblings.length > 1) {
                            selector += \`:nth-child(\${index + 1})\`;
                        }
                        
                        path.unshift(selector);
                        current = current.parentNode;
                    }
                    
                    return path.join(' > ');
                },
                
                // Assertion helpers
                captureAssertion(type, value) {
                    if (!this.isRecording) return;
                    
                    this.actions.push({
                        type: 'assertion',
                        assertionType: type,
                        value,
                        timestamp: Date.now() - this.startTime,
                    });
                },
                
                captureScreenshot(name) {
                    if (!this.isRecording) return;
                    
                    this.actions.push({
                        type: 'screenshot',
                        name,
                        timestamp: Date.now() - this.startTime,
                    });
                }
            };
        `
    }

    generateTest(actions, testName = 'Generated Test') {
        const imports = `import { test, expect } from '@playwright/test'`

        const testBody = actions
            .map(action => {
                switch (action.type) {
                    case 'click':
                        return `    await page.click('${action.selector}')`

                    case 'fill':
                        return `    await page.fill('${action.selector}', '${action.value}')`

                    case 'select':
                        return `    await page.selectOption('${action.selector}', '${action.value}')`

                    case 'keyboard':
                        return `    await page.keyboard.press('${action.key}')`

                    case 'navigation':
                        return `    await page.goto('${action.url}')`

                    case 'assertion':
                        return this.generateAssertion(action)

                    case 'screenshot':
                        return `    await expect(page).toHaveScreenshot('${action.name}.png')`

                    default:
                        return `    // Unknown action: ${action.type}`
                }
            })
            .join('\n')

        const delays = this.calculateDelays(actions)
        const testWithDelays = this.insertDelays(testBody, delays)

        return `${imports}

test('${testName}', async ({ page }) => {
    await page.goto('/')
    
${testWithDelays}
})`
    }

    generateAssertion(action) {
        switch (action.assertionType) {
            case 'visible':
                return `    await expect(page.locator('${action.value}')).toBeVisible()`

            case 'text':
                return `    await expect(page).toContainText('${action.value}')`

            case 'url':
                return `    await expect(page).toHaveURL('${action.value}')`

            case 'title':
                return `    await expect(page).toHaveTitle('${action.value}')`

            default:
                return `    // Assertion: ${action.assertionType}`
        }
    }

    calculateDelays(actions) {
        const delays = []

        for (let i = 1; i < actions.length; i++) {
            const timeDiff = actions[i].timestamp - actions[i - 1].timestamp

            // Only add delays for gaps > 1 second
            if (timeDiff > 1000) {
                delays.push({
                    afterIndex: i - 1,
                    duration: Math.min(timeDiff, 5000), // Cap at 5 seconds
                })
            }
        }

        return delays
    }

    insertDelays(testBody, delays) {
        const lines = testBody.split('\n')
        const result = []

        let lineIndex = 0
        for (const line of lines) {
            result.push(line)

            const delay = delays.find(d => d.afterIndex === lineIndex)
            if (delay) {
                result.push(`    await page.waitForTimeout(${delay.duration})`)
            }

            lineIndex++
        }

        return result.join('\n')
    }

    async generateSmartTest(page, userFlow) {
        // Analyze the user flow and generate a more intelligent test
        const enhancedActions = []

        for (const action of userFlow) {
            // Add wait conditions before actions
            if (action.type === 'click') {
                enhancedActions.push({
                    type: 'wait',
                    selector: action.selector,
                    state: 'visible',
                })
            }

            enhancedActions.push(action)

            // Add assertions after key actions
            if (action.type === 'click' && action.selector.includes('btn-')) {
                // Detect state changes after button clicks
                const stateChange = await this.detectStateChange(page, action)
                if (stateChange) {
                    enhancedActions.push(stateChange)
                }
            }
        }

        return this.generateTest(enhancedActions, 'Smart Generated Test')
    }

    async detectStateChange(page, action) {
        // Detect what changed after an action
        await page.waitForTimeout(500)

        // Check for new elements
        const newElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-new], .new, .added')
            return elements.length > 0
        })

        if (newElements) {
            return {
                type: 'assertion',
                assertionType: 'visible',
                value: '[data-new]',
                timestamp: action.timestamp + 500,
            }
        }

        return null
    }

    generateTestSuite(recordedFlows) {
        // Generate a complete test suite from multiple recorded flows
        const tests = recordedFlows.map((flow, index) =>
            this.generateTest(flow.actions, flow.name || `User Flow ${index + 1}`)
        )

        return `import { test, expect } from '@playwright/test'

test.describe('Recorded User Flows', () => {
${tests.map(test => '    ' + test.split('\n').slice(2, -1).join('\n    ')).join('\n\n')}
})`
    }
}

// Helper for recording in Playwright tests
export async function recordUserActions(page, callback) {
    const recorder = new TestRecorder()

    // Inject recorder
    await page.evaluate(recorder.inject())

    // Start recording
    await page.evaluate(() => window.__testRecorder.start())

    // Execute user actions
    await callback()

    // Stop recording and get actions
    const actions = await page.evaluate(() => window.__testRecorder.stop())

    // Generate test
    const generatedTest = recorder.generateTest(actions)

    return {
        actions,
        test: generatedTest,
    }
}

export default TestRecorder
