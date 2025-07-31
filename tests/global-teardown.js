import fs from 'fs/promises'
import path from 'path'

async function globalTeardown() {
    console.log('🧹 Starting global test teardown...')

    const testResultsDir = path.join(process.cwd(), 'test-results')
    const metadataPath = path.join(testResultsDir, 'metadata.json')

    try {
        // Update metadata with end time
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
        metadata.endTime = new Date().toISOString()
        metadata.duration = Date.now() - new Date(metadata.startTime).getTime()

        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

        // Generate test summary
        const resultsPath = path.join(testResultsDir, 'results.json')
        if (
            await fs
                .access(resultsPath)
                .then(() => true)
                .catch(() => false)
        ) {
            const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'))

            console.log('\n📊 Test Summary:')
            console.log(`   Total Tests: ${results.stats?.total || 0}`)
            console.log(`   ✅ Passed: ${results.stats?.passed || 0}`)
            console.log(`   ❌ Failed: ${results.stats?.failed || 0}`)
            console.log(`   ⏭️  Skipped: ${results.stats?.skipped || 0}`)
            console.log(`   ⏱️  Duration: ${(metadata.duration / 1000).toFixed(2)}s`)
        }
    } catch (error) {
        console.warn('Could not generate test summary:', error.message)
    }

    console.log('\n✅ Global teardown completed')
}
