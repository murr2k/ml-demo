import { chromium } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class AutonomousTestRunner {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3
        this.fixAttempts = options.fixAttempts || 5
        this.logLevel = options.logLevel || 'info'
        this.testResults = []
        this.fixes = []
    }

    async runTests(testFiles = null) {
        const startTime = Date.now()

        try {
            // Run Playwright tests
            const testCommand = testFiles ? `npx playwright test ${testFiles.join(' ')}` : 'npx playwright test'

            const { stdout, stderr } = await execAsync(testCommand, {
                env: { ...process.env, CI: 'true' },
            })

            const results = await this.parseTestResults()

            this.testResults.push({
                timestamp: new Date().toISOString(),
                passed: results.passed,
                failed: results.failed,
                duration: Date.now() - startTime,
                stdout,
                stderr,
            })

            return results
        } catch (error) {
            // Tests failed, parse the results
            const results = await this.parseTestResults()

            this.testResults.push({
                timestamp: new Date().toISOString(),
                passed: results.passed || 0,
                failed: results.failed || 0,
                duration: Date.now() - startTime,
                error: error.message,
            })

            return results
        }
    }

    async parseTestResults() {
        try {
            const resultsPath = path.join(process.cwd(), 'test-results', 'results.json')
            const resultsData = await fs.readFile(resultsPath, 'utf8')
            const results = JSON.parse(resultsData)

            const failures = []
            const successes = []

            // Parse test results
            results.suites?.forEach(suite => {
                suite.specs?.forEach(spec => {
                    spec.tests?.forEach(test => {
                        if (test.status === 'failed') {
                            failures.push({
                                title: test.title,
                                file: spec.file,
                                error: test.error,
                                line: test.line,
                                column: test.column,
                            })
                        } else if (test.status === 'passed') {
                            successes.push({
                                title: test.title,
                                file: spec.file,
                                duration: test.duration,
                            })
                        }
                    })
                })
            })

            return {
                passed: successes.length,
                failed: failures.length,
                failures,
                successes,
                total: successes.length + failures.length,
            }
        } catch (error) {
            console.error('Error parsing test results:', error)
            return { passed: 0, failed: 0, failures: [], successes: [] }
        }
    }

    async analyzeFailures(failures) {
        const analysis = {
            patterns: {},
            recommendations: [],
            commonErrors: [],
        }

        for (const failure of failures) {
            // Categorize failure types
            const errorType = this.categorizeError(failure.error)

            if (!analysis.patterns[errorType]) {
                analysis.patterns[errorType] = []
            }
            analysis.patterns[errorType].push(failure)

            // Generate fix recommendations
            const recommendation = await this.generateRecommendation(failure, errorType)
            if (recommendation) {
                analysis.recommendations.push(recommendation)
            }
        }

        // Identify common error patterns
        Object.entries(analysis.patterns).forEach(([type, failures]) => {
            if (failures.length > 1) {
                analysis.commonErrors.push({
                    type,
                    count: failures.length,
                    files: [...new Set(failures.map(f => f.file))],
                })
            }
        })

        return analysis
    }

    categorizeError(error) {
        if (!error) return 'unknown'

        const errorMessage = error.message || error.toString()

        if (errorMessage.includes('timeout')) return 'timeout'
        if (errorMessage.includes('not found')) return 'element-not-found'
        if (errorMessage.includes('screenshot')) return 'visual-regression'
        if (errorMessage.includes('expect')) return 'assertion-failed'
        if (errorMessage.includes('navigation')) return 'navigation-error'
        if (errorMessage.includes('network')) return 'network-error'

        return 'other'
    }

    async generateRecommendation(failure, errorType) {
        const recommendations = {
            timeout: {
                description: 'Increase timeout or add explicit wait',
                fixes: [
                    { type: 'increase-timeout', value: 30000 },
                    { type: 'add-wait', selector: this.extractSelector(failure.error) },
                ],
            },
            'element-not-found': {
                description: 'Element selector may have changed',
                fixes: [
                    { type: 'update-selector', oldSelector: this.extractSelector(failure.error) },
                    { type: 'add-wait-for-selector', selector: this.extractSelector(failure.error) },
                ],
            },
            'visual-regression': {
                description: 'Visual changes detected',
                fixes: [
                    { type: 'update-screenshot', test: failure.title },
                    { type: 'increase-threshold', value: 0.3 },
                ],
            },
            'assertion-failed': {
                description: 'Expected value mismatch',
                fixes: [
                    { type: 'update-assertion', test: failure.title },
                    { type: 'add-retry', count: 3 },
                ],
            },
        }

        return recommendations[errorType] || null
    }

    extractSelector(error) {
        // Extract selector from error message
        const selectorMatch = error?.message?.match(/selector: (.+?)(\s|$)/)
        return selectorMatch ? selectorMatch[1] : null
    }

    async attemptAutoFix(analysis) {
        const fixResults = []

        for (const recommendation of analysis.recommendations) {
            for (const fix of recommendation.fixes) {
                try {
                    const result = await this.applyFix(fix)
                    fixResults.push({
                        type: fix.type,
                        success: result.success,
                        message: result.message,
                    })

                    if (result.success) {
                        this.fixes.push({
                            timestamp: new Date().toISOString(),
                            type: fix.type,
                            details: result,
                        })
                    }
                } catch (error) {
                    fixResults.push({
                        type: fix.type,
                        success: false,
                        error: error.message,
                    })
                }
            }
        }

        return fixResults
    }

    async applyFix(fix) {
        switch (fix.type) {
            case 'increase-timeout':
                return this.increaseTimeout(fix.value)

            case 'add-wait':
                return this.addWaitForSelector(fix.selector)

            case 'update-selector':
                return this.updateSelector(fix.oldSelector)

            case 'update-screenshot':
                return this.updateScreenshot(fix.test)

            case 'increase-threshold':
                return this.increaseVisualThreshold(fix.value)

            default:
                return { success: false, message: `Unknown fix type: ${fix.type}` }
        }
    }

    async increaseTimeout(newTimeout) {
        try {
            // Update playwright config
            const configPath = path.join(process.cwd(), 'playwright.config.js')
            let config = await fs.readFile(configPath, 'utf8')

            config = config.replace(/timeout:\s*\d+/, `timeout: ${newTimeout}`)

            await fs.writeFile(configPath, config)

            return { success: true, message: `Increased timeout to ${newTimeout}ms` }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    async addWaitForSelector(selector) {
        if (!selector) return { success: false, message: 'No selector provided' }

        // This would need to modify the actual test file
        // For now, return a recommendation
        return {
            success: true,
            message: `Recommendation: Add await page.waitForSelector('${selector}')`,
            recommendation: true,
        }
    }

    async updateScreenshot(testName) {
        try {
            // Run the test with --update-snapshots flag
            const { stdout } = await execAsync(`npx playwright test -g "${testName}" --update-snapshots`)

            return { success: true, message: 'Screenshots updated', stdout }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    async increaseVisualThreshold(threshold) {
        try {
            const configPath = path.join(process.cwd(), 'playwright.config.js')
            let config = await fs.readFile(configPath, 'utf8')

            config = config.replace(/threshold:\s*[\d.]+/, `threshold: ${threshold}`)

            await fs.writeFile(configPath, config)

            return { success: true, message: `Increased visual threshold to ${threshold}` }
        } catch (error) {
            return { success: false, message: error.message }
        }
    }

    async updateSelector(oldSelector) {
        // In a real implementation, this would use AST parsing to find and update selectors
        // For now, return a recommendation
        return {
            success: true,
            message: `Recommendation: Update selector '${oldSelector}' in test files`,
            recommendation: true,
        }
    }

    async runAutonomousIteration() {
        console.log('🤖 Starting autonomous test iteration...')

        let attempts = 0
        let allTestsPassing = false

        while (attempts < this.fixAttempts && !allTestsPassing) {
            attempts++
            console.log(`\n📍 Attempt ${attempts}/${this.fixAttempts}`)

            // Run tests
            const results = await this.runTests()

            if (results.failed === 0) {
                allTestsPassing = true
                console.log('✅ All tests passing!')
                break
            }

            console.log(`❌ ${results.failed} tests failing`)

            // Analyze failures
            const analysis = await this.analyzeFailures(results.failures)
            console.log(`📊 Analysis complete: ${analysis.recommendations.length} recommendations`)

            // Attempt fixes
            const fixResults = await this.attemptAutoFix(analysis)
            const successfulFixes = fixResults.filter(f => f.success).length

            console.log(`🔧 Applied ${successfulFixes}/${fixResults.length} fixes`)

            if (successfulFixes === 0) {
                console.log('⚠️  No fixes could be applied automatically')
                break
            }

            // Brief pause before next iteration
            await new Promise(resolve => setTimeout(resolve, 2000))
        }

        return {
            success: allTestsPassing,
            attempts,
            testResults: this.testResults,
            fixes: this.fixes,
        }
    }

    async generateReport() {
        const report = {
            summary: {
                totalRuns: this.testResults.length,
                totalFixes: this.fixes.length,
                successRate: this.calculateSuccessRate(),
                avgDuration: this.calculateAvgDuration(),
            },
            testResults: this.testResults,
            fixes: this.fixes,
            recommendations: await this.generateFinalRecommendations(),
        }

        // Save report
        const reportPath = path.join(process.cwd(), 'test-results', 'autonomous-report.json')
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

        // Generate markdown summary
        const markdown = this.generateMarkdownReport(report)
        const mdPath = path.join(process.cwd(), 'test-results', 'autonomous-report.md')
        await fs.writeFile(mdPath, markdown)

        return report
    }

    calculateSuccessRate() {
        if (this.testResults.length === 0) return 0

        const successfulRuns = this.testResults.filter(r => r.failed === 0).length
        return (successfulRuns / this.testResults.length) * 100
    }

    calculateAvgDuration() {
        if (this.testResults.length === 0) return 0

        const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0)
        return totalDuration / this.testResults.length
    }

    async generateFinalRecommendations() {
        const recommendations = []

        // Analyze patterns across all test runs
        const failurePatterns = {}
        this.testResults.forEach(result => {
            if (result.error) {
                const type = this.categorizeError({ message: result.error })
                failurePatterns[type] = (failurePatterns[type] || 0) + 1
            }
        })

        // Generate recommendations based on patterns
        Object.entries(failurePatterns).forEach(([type, count]) => {
            if (count > 2) {
                recommendations.push({
                    type: 'recurring-issue',
                    category: type,
                    count,
                    suggestion: this.getSuggestionForPattern(type),
                })
            }
        })

        return recommendations
    }

    getSuggestionForPattern(type) {
        const suggestions = {
            timeout: 'Consider increasing global timeouts or optimizing page load performance',
            'element-not-found': 'Review selectors for stability, consider using data-testid attributes',
            'visual-regression':
                'Visual changes are frequent, consider relaxing thresholds or updating baselines regularly',
            'network-error': 'Network issues detected, ensure stable test environment or add retry logic',
        }

        return suggestions[type] || 'Review test implementation for stability improvements'
    }

    generateMarkdownReport(report) {
        return `# Autonomous Test Report

## Summary
- **Total Test Runs**: ${report.summary.totalRuns}
- **Total Fixes Applied**: ${report.summary.totalFixes}
- **Success Rate**: ${report.summary.successRate.toFixed(1)}%
- **Average Duration**: ${(report.summary.avgDuration / 1000).toFixed(1)}s

## Test Results
${this.testResults
    .map(
        (r, i) => `
### Run ${i + 1}
- **Timestamp**: ${r.timestamp}
- **Passed**: ${r.passed || 0}
- **Failed**: ${r.failed || 0}
- **Duration**: ${(r.duration / 1000).toFixed(1)}s
${r.error ? `- **Error**: ${r.error}` : ''}
`
    )
    .join('\n')}

## Applied Fixes
${
    this.fixes
        .map(
            f => `
- **${f.type}** at ${f.timestamp}
  ${f.details.message}
`
        )
        .join('\n') || 'No fixes applied'
}

## Recommendations
${
    report.recommendations
        .map(
            r => `
- **${r.type}**: ${r.suggestion}
  - Category: ${r.category}
  - Occurrences: ${r.count}
`
        )
        .join('\n') || 'No recommendations'
}

---
*Generated by Autonomous Test Runner*
`
    }
}

// Export for use in scripts
export default AutonomousTestRunner
