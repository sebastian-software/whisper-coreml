#!/bin/bash
# Check for whisper.cpp updates

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

# Current version from package.json
CURRENT=$(node -p "require('$PACKAGE_DIR/package.json').whisperCpp.version")

# Latest release from GitHub API (follow redirects)
LATEST=$(curl -sL https://api.github.com/repos/ggerganov/whisper.cpp/releases/latest | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).tag_name")

echo "whisper.cpp version check"
echo "========================="
echo "Current: $CURRENT"
echo "Latest:  $LATEST"
echo ""

if [ "$CURRENT" = "$LATEST" ]; then
    echo "✓ You're up to date!"
else
    echo "⚠ Update available!"
    echo ""
    echo "To update:"
    echo "  1. Edit package.json: whisperCpp.version → \"$LATEST\""
    echo "  2. rm -rf vendor/whisper.cpp"
    echo "  3. pnpm run prepare:whisper"
    echo "  4. pnpm build"
    echo "  5. Test thoroughly before committing"
fi

