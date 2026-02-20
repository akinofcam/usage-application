#!/bin/bash

# Verification script for Usage app setup

echo "🔍 Checking Usage App Installation..."
echo ""

errors=0
warnings=0

# Check Node.js
if command -v node &>/dev/null; then
    VERSION=$(node --version)
    echo "✅ Node.js installed: $VERSION"
else
    echo "❌ Node.js not found"
    ((errors++))
fi

# Check npm
if command -v npm &>/dev/null; then
    VERSION=$(npm --version)
    echo "✅ npm installed: $VERSION"
else
    echo "❌ npm not found"
    ((errors++))
fi

echo ""
echo "📁 Checking project structure..."

# Check essential files
files=(
    "package.json"
    "src/main.js"
    "src/cli.js"
    "src/preload.js"
    "src/ui.html"
    "src/tracker.js"
    "src/security.js"
    "src/config.js"
    "src/utils.js"
    "README.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        ((errors++))
    fi
done

echo ""
echo "📦 Checking dependencies..."

if [ -d "node_modules" ]; then
    count=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "✅ node_modules exists ($((count-1)) packages)"
else
    echo "⚠️  node_modules not found - run 'npm install'"
    ((warnings++))
fi

echo ""
echo "🔧 Checking CLI..."

if [ -x "src/cli.js" ]; then
    echo "✅ CLI is executable"
else
    echo "⚠️  CLI is not executable - run 'chmod +x src/cli.js'"
    ((warnings++))
fi

echo ""
echo "📊 System Information..."
os=$(uname -s)
if [ "$os" = "Darwin" ]; then
    echo "✅ macOS detected"
else
    echo "⚠️  Not running on macOS (detected: $os)"
    ((warnings++))
fi

echo ""

if [ $errors -gt 0 ]; then
    echo "❌ Found $errors error(s). Please fix before running."
    exit 1
elif [ $warnings -gt 0 ]; then
    echo "⚠️  Found $warnings warning(s). Recommended to fix."
    echo ""
    echo "Try running: npm install && chmod +x src/cli.js"
    exit 0
else
    echo "✅ All checks passed! Everything is ready."
    echo ""
    echo "Next: Run 'usage' to start the app"
    exit 0
fi
