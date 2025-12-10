#!/bin/bash
set -e
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

echo "🚀 Starting post-create configuration..."

# 1. Determine if sudo is required
if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

# 2. Update system pip
echo "📦 Updating pip..."
$SUDO pip install --root-user-action=ignore --upgrade pip

# 3. Install or upgrade uv
if command -v uv &> /dev/null; then
    echo "⚡ uv already installed — upgrading to latest..."
    $SUDO pip install --root-user-action=ignore --upgrade uv
else
    echo "⚡ Installing uv..."
    $SUDO pip install --root-user-action=ignore uv
fi

# Verify uv installation
if ! command -v uv &> /dev/null; then
    echo "❌ uv installation failed"
    exit 1
fi

# 4. Sync project dependencies
echo "📚 Syncing dependencies..."
uv sync --all-groups

# 5. Install Git hooks
echo "🪝 Installing pre-commit hooks..."
uv run pre-commit install

echo "✅ Configuration completed successfully!"
