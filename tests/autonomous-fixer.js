import fs from 'fs/promises'
import path from 'path'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'

export class AutonomousFixer {
    constructor() {
        this.fixes = []
        this.patterns = {
            selectors: new Map(),
            timeouts: new Map(),
            assertions: new Map(),
        }
    }

    async analyzeTestFile(filePath) {
        const code = await fs.readFile(filePath, 'utf8')
        const ast = parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        })

        const analysis = {
            selectors: [],
            waits: [],
            assertions: [],
            timeouts: [],
        }

        traverse(ast, {
            CallExpression(path) {
                const { callee, arguments: args } = path.node

                // Detect page interactions
                if (t.isMemberExpression(callee)) {
                    const method = callee.property?.name

                    // Find selectors
                    if (['click', 'fill', 'locator', 'waitForSelector'].includes(method)) {
                        if (args[0] && t.isStringLiteral(args[0])) {
                            analysis.selectors.push({
                                selector: args[0].value,
                                method,
                                line: path.node.loc?.start.line,
                            })
                        }
                    }

                    // Find waits
                    if (['waitForTimeout', 'waitForSelector', 'waitForLoadState'].includes(method)) {
                        analysis.waits.push({
                            type: method,
                            value: args[0]?.value,
                            line: path.node.loc?.start.line,
                        })
                    }
                }

                // Find assertions
                if (callee.name === 'expect' || (t.isMemberExpression(callee) && callee.object?.name === 'expect')) {
                    analysis.assertions.push({
                        line: path.node.loc?.start.line,
                        type: this.getAssertionType(path),
                    })
                }
            },
        })

        return analysis
    }

    getAssertionType(path) {
        let current = path
        while (current.parent) {
            if (t.isCallExpression(current.parent.node)) {
                const method = current.parent.node.callee?.property?.name
                if (method) return method
            }
            current = current.parent
        }
        return 'unknown'
    }

    async suggestFixes(testFailure) {
        const suggestions = []

        // Analyze error type
        const errorType = this.categorizeError(testFailure.error)

        switch (errorType) {
            case 'timeout':
                suggestions.push(...(await this.suggestTimeoutFixes(testFailure)))
                break

            case 'element-not-found':
                suggestions.push(...(await this.suggestSelectorFixes(testFailure)))
                break

            case 'assertion-failed':
                suggestions.push(...(await this.suggestAssertionFixes(testFailure)))
                break

            case 'visual-regression':
                suggestions.push(...(await this.suggestVisualFixes(testFailure)))
                break
        }

        return suggestions
    }

    categorizeError(error) {
        const errorMsg = error?.message || ''

        if (errorMsg.includes('Timeout') || errorMsg.includes('exceeded')) {
            return 'timeout'
        }
        if (errorMsg.includes('not found') || errorMsg.includes('No element')) {
            return 'element-not-found'
        }
        if (errorMsg.includes('Expected') || errorMsg.includes('toBe')) {
            return 'assertion-failed'
        }
        if (errorMsg.includes('Screenshot') || errorMsg.includes('visual')) {
            return 'visual-regression'
        }

        return 'unknown'
    }

    async suggestTimeoutFixes(failure) {
        const suggestions = []

        // Extract timeout location
        const timeoutMatch = failure.error?.message?.match(/(\d+)ms/)
        const currentTimeout = timeoutMatch ? parseInt(timeoutMatch[1]) : 5000

        suggestions.push({
            type: 'increase-timeout',
            description: 'Increase timeout duration',
            code: {
                before: `timeout: ${currentTimeout}`,
                after: `timeout: ${currentTimeout * 2}`,
            },
            confidence: 0.8,
        })

        // Suggest explicit waits
        if (failure.file) {
            const analysis = await this.analyzeTestFile(failure.file)

            if (analysis.waits.length === 0) {
                suggestions.push({
                    type: 'add-explicit-wait',
                    description: 'Add explicit wait before action',
                    code: {
                        suggestion: `await page.waitForLoadState('networkidle')`,
                    },
                    confidence: 0.7,
                })
            }
        }

        return suggestions
    }

    async suggestSelectorFixes(failure) {
        const suggestions = []

        // Extract selector from error
        const selectorMatch = failure.error?.message?.match(/selector[:\s]+["'](.+?)["']/)
        const selector = selectorMatch ? selectorMatch[1] : null

        if (selector) {
            // Suggest alternative selectors
            suggestions.push({
                type: 'use-test-id',
                description: 'Use data-testid for more stable selection',
                code: {
                    before: selector,
                    after: `[data-testid="${this.generateTestId(selector)}"]`,
                },
                confidence: 0.9,
            })

            // Suggest wait before selection
            suggestions.push({
                type: 'add-wait-for-selector',
                description: 'Wait for element before interacting',
                code: {
                    suggestion: `await page.waitForSelector('${selector}', { state: 'visible' })`,
                },
                confidence: 0.85,
            })

            // Suggest text-based selector
            if (!selector.includes('text=')) {
                suggestions.push({
                    type: 'use-text-selector',
                    description: 'Use text-based selector',
                    code: {
                        suggestion: `page.locator('text=YourText')`,
                    },
                    confidence: 0.6,
                })
            }
        }

        return suggestions
    }

    generateTestId(selector) {
        // Generate a test ID from selector
        return selector
            .replace(/[#.]/g, '')
            .replace(/[\[\]]/g, '-')
            .replace(/[^a-zA-Z0-9-]/g, '')
            .toLowerCase()
    }

    async suggestAssertionFixes(failure) {
        const suggestions = []

        // Extract expected and actual values
        const expectedMatch = failure.error?.message?.match(/Expected: (.+)/)
        const actualMatch = failure.error?.message?.match(/Received: (.+)/)

        if (expectedMatch && actualMatch) {
            const expected = expectedMatch[1]
            const actual = actualMatch[1]

            // Suggest updating assertion
            suggestions.push({
                type: 'update-assertion',
                description: 'Update assertion to match actual value',
                code: {
                    before: `expect(...).toBe(${expected})`,
                    after: `expect(...).toBe(${actual})`,
                },
                confidence: 0.5, // Lower confidence for changing assertions
                warning: 'Verify this change is intentional',
            })

            // Suggest using more flexible matcher
            suggestions.push({
                type: 'use-flexible-matcher',
                description: 'Use more flexible assertion',
                code: {
                    suggestions: [
                        `expect(...).toContain(...)`,
                        `expect(...).toMatch(/pattern/)`,
                        `expect(...).toBeCloseTo(value, precision)`,
                    ],
                },
                confidence: 0.7,
            })
        }

        return suggestions
    }

    async suggestVisualFixes(failure) {
        const suggestions = []

        suggestions.push({
            type: 'update-screenshots',
            description: 'Update baseline screenshots',
            command: `npx playwright test "${failure.test}" --update-snapshots`,
            confidence: 0.8,
        })

        suggestions.push({
            type: 'increase-threshold',
            description: 'Increase visual comparison threshold',
            code: {
                suggestion: `toHaveScreenshot({ threshold: 0.3 })`,
            },
            confidence: 0.7,
        })

        suggestions.push({
            type: 'mask-dynamic-content',
            description: 'Mask dynamic content in screenshots',
            code: {
                suggestion: `toHaveScreenshot({ mask: [page.locator('.dynamic-content')] })`,
            },
            confidence: 0.6,
        })

        return suggestions
    }

    async applyFix(suggestion, testFile) {
        try {
            switch (suggestion.type) {
                case 'increase-timeout':
                    return await this.applyTimeoutFix(suggestion, testFile)

                case 'add-wait-for-selector':
                    return await this.applyWaitFix(suggestion, testFile)

                case 'update-assertion':
                    return await this.applyAssertionFix(suggestion, testFile)

                case 'use-test-id':
                    return await this.applySelectorFix(suggestion, testFile)

                default:
                    return { success: false, message: 'Fix type not implemented' }
            }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    async applyTimeoutFix(suggestion, testFile) {
        const configPath = path.join(process.cwd(), 'playwright.config.js')
        let config = await fs.readFile(configPath, 'utf8')

        config = config.replace(suggestion.code.before, suggestion.code.after)

        await fs.writeFile(configPath, config)

        this.fixes.push({
            type: suggestion.type,
            file: configPath,
            timestamp: new Date().toISOString(),
        })

        return { success: true, message: 'Timeout increased' }
    }

    async applyWaitFix(suggestion, testFile) {
        // This would require AST manipulation to insert wait statements
        // For now, return as a manual suggestion
        return {
            success: false,
            manual: true,
            message: `Add this line before the failing action: ${suggestion.code.suggestion}`,
        }
    }

    async applyAssertionFix(suggestion, testFile) {
        // This would require careful AST manipulation
        // Return as manual suggestion for safety
        return {
            success: false,
            manual: true,
            message: 'Manual review required for assertion changes',
            suggestion: suggestion.code,
        }
    }

    async applySelectorFix(suggestion, testFile) {
        let content = await fs.readFile(testFile, 'utf8')

        if (content.includes(suggestion.code.before)) {
            content = content.replace(suggestion.code.before, suggestion.code.after)

            await fs.writeFile(testFile, content)

            this.fixes.push({
                type: suggestion.type,
                file: testFile,
                timestamp: new Date().toISOString(),
            })

            return { success: true, message: 'Selector updated' }
        }

        return { success: false, message: 'Selector not found in file' }
    }

    async generateFixReport() {
        const report = {
            timestamp: new Date().toISOString(),
            fixes: this.fixes,
            patterns: {
                mostCommonErrors: this.analyzePattterns(),
                suggestedImprovements: this.generateImprovements(),
            },
        }

        const reportPath = path.join(process.cwd(), 'test-results', 'fix-report.json')
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

        return report
    }

    analyzePattterns() {
        // Analyze patterns in fixes to identify common issues
        const patterns = {}

        this.fixes.forEach(fix => {
            patterns[fix.type] = (patterns[fix.type] || 0) + 1
        })

        return Object.entries(patterns)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => ({ type, count }))
    }

    generateImprovements() {
        const improvements = []

        // Based on fix patterns, suggest improvements
        const timeoutFixes = this.fixes.filter(f => f.type === 'increase-timeout').length
        if (timeoutFixes > 3) {
            improvements.push({
                category: 'performance',
                suggestion: 'Consider optimizing application performance to reduce timeout issues',
                priority: 'high',
            })
        }

        const selectorFixes = this.fixes.filter(f => f.type.includes('selector')).length
        if (selectorFixes > 5) {
            improvements.push({
                category: 'test-stability',
                suggestion: 'Implement data-testid attributes throughout the application',
                priority: 'medium',
            })
        }

        return improvements
    }
}

export default AutonomousFixer
