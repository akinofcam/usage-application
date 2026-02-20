#!/bin/bash

# Usage Installation Script for macOS

echo "📊 Usage - macOS App Tracker Installer"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Make CLI executable
echo "🔧 Setting up CLI..."
chmod +x src/cli.js

echo "✅ CLI is executable"
echo ""

# Ask if user wants to install globally
read -p "Do you want to install 'usage' command globally? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm link
    if [ $? -eq 0 ]; then
        echo "✅ 'usage' command installed globally"
        echo ""
        echo "You can now use 'usage' from anywhere in your terminal!"
    else
        echo "⚠️  Failed to install globally. You can try running 'npm link' manually."
    fi
else
    echo "⚠️  You can install globally later by running: npm link"
fi

echo ""
echo "======================================"
echo "✨ Installation Complete!"
echo ""
echo "Usage: usage                    - Launch the app"
echo "Usage: usage --help             - Show help"
echo "Usage: usage -p /path -m password -c YOUR_PASSWORD"
echo ""
echo "Happy tracking! 📊"
