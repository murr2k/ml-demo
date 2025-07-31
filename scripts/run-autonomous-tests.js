#!/usr/bin/env node

import { AutonomousTestRunner } from '../tests/autonomous-runner.js'
import { program } from 'commander'
import chalk from 'chalk'

program
    .name('autonomous-test')
    .description('Run Playwright tests with autonomous fixing capabilities')
    .option('-r, --retries <number>', 'Maximum retry attempts', '3')
    .option('-f, --fix-attempts <number>', 'Maximum fix attempts', '5')
    .option('-t, --tests <files...>', 'Specific test files to run')
    .option('--no-fix', 'Run tests without attempting fixes')
    .option('--report', 'Generate detailed report')
    .parse()

const options = program.opts()

async function main() {
    console.log(chalk.bold.blue('🤖 Autonomous Test Runner'))
    console.log(chalk.gray('='.repeat(50)))

    const runner = new AutonomousTestRunner({
        maxRetries: parseInt(options.retries),
        fixAttempts: parseInt(options.fixAttempts),
    })

    try {
        if (options.fix === false) {
            // Run tests without fixes
            console.log(chalk.yellow('Running tests without auto-fix...'))
            const results = await runner.runTests(options.tests)

            console.log('\n' + chalk.bold('Test Results:'))
            console.log(chalk.green(`✅ Passed: ${results.passed}`))
            console.log(chalk.red(`❌ Failed: ${results.failed}`))

            if (results.failed > 0) {
                console.log('\n' + chalk.bold('Failures:'))
                results.failures.forEach(f => {
                    console.log(chalk.red(`- ${f.title} (${f.file})`))
                    if (f.error?.message) {
                        console.log(chalk.gray(`  ${f.error.message.split('\n')[0]}`))
                    }
                })
            }
        } else {
            // Run with autonomous fixing
            console.log(chalk.yellow('Starting autonomous test iteration...'))
            const result = await runner.runAutonomousIteration()

            console.log('\n' + chalk.bold('Autonomous Test Summary:'))
            console.log(chalk.blue(`🔄 Attempts: ${result.attempts}`))
            console.log(
                chalk[result.success ? 'green' : 'red'](
                    result.success ? '✅ All tests passing!' : '❌ Some tests still failing'
                )
            )

            if (result.fixes.length > 0) {
                console.log('\n' + chalk.bold(`🔧 Applied ${result.fixes.length} fixes:`))
                result.fixes.forEach(fix => {
                    console.log(chalk.cyan(`- ${fix.type}: ${fix.details.message}`))
                })
            }
        }

        if (options.report) {
            console.log('\n' + chalk.yellow('Generating report...'))
            const report = await runner.generateReport()
            console.log(chalk.green('✅ Report saved to test-results/autonomous-report.md'))

            // Display summary
            console.log('\n' + chalk.bold('Report Summary:'))
            console.log(`- Success Rate: ${report.summary.successRate.toFixed(1)}%`)
            console.log(`- Average Duration: ${(report.summary.avgDuration / 1000).toFixed(1)}s`)
            console.log(`- Total Fixes: ${report.summary.totalFixes}`)
        }

        // Exit with appropriate code
        const finalResults = runner.testResults[runner.testResults.length - 1]
        process.exit(finalResults?.failed > 0 ? 1 : 0)
    } catch (error) {
        console.error(chalk.red('\n❌ Error running autonomous tests:'))
        console.error(chalk.red(error.message))
        process.exit(1)
    }
}

main()
