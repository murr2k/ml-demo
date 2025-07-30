#!/bin/bash

echo "Attempting to enable GitHub Pages..."

# Try to enable Pages with GitHub Actions as source
response=$(gh api --method PUT repos/murr2k/ml-demo/pages \
  --field source='actions' \
  --field build_type='workflow' 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ GitHub Pages has been enabled successfully!"
    echo "🚀 The deployment workflow will now run automatically on push to main branch"
else
    echo "❌ Failed to enable GitHub Pages automatically"
    echo ""
    echo "Please enable it manually:"
    echo "1. Go to: https://github.com/murr2k/ml-demo/settings/pages"
    echo "2. Under 'Source', select 'GitHub Actions'"
    echo "3. Click 'Save'"
    echo ""
    echo "Error: $response"
fi