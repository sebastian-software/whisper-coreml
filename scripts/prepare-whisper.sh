#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
VENDOR_DIR="$PACKAGE_DIR/vendor"

# Read version from package.json (single source of truth)
WHISPER_VERSION=$(node -p "require('$PACKAGE_DIR/package.json').whisperCpp.version")

echo "Preparing whisper.cpp $WHISPER_VERSION for whisper-coreml..."

# Clone whisper.cpp if not exists
if [ ! -d "$VENDOR_DIR/whisper.cpp" ]; then
    echo "Cloning whisper.cpp $WHISPER_VERSION..."
    mkdir -p "$VENDOR_DIR"
    git clone --depth 1 --branch "$WHISPER_VERSION" \
        https://github.com/ggerganov/whisper.cpp.git \
        "$VENDOR_DIR/whisper.cpp"
else
    echo "whisper.cpp already exists in vendor/"
fi

# Build whisper.cpp with CoreML support
echo "Building whisper.cpp with CoreML support..."
cd "$VENDOR_DIR/whisper.cpp"

# Clean previous builds
rm -rf build

# Configure with CoreML + Metal for maximum performance on Apple Silicon
cmake -B build \
    -DWHISPER_COREML=ON \
    -DWHISPER_METAL=ON \
    -DBUILD_SHARED_LIBS=OFF \
    -DWHISPER_BUILD_EXAMPLES=OFF \
    -DWHISPER_BUILD_TESTS=OFF \
    -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build -j$(sysctl -n hw.ncpu) --config Release

echo ""
echo "✓ whisper.cpp $WHISPER_VERSION built successfully!"
echo ""
echo "Static library: $VENDOR_DIR/whisper.cpp/build/src/libwhisper.a"
echo ""
echo "Next steps:"
echo "  1. pnpm build        # Build native addon + TypeScript"
echo "  2. pnpm exec whisper-coreml download  # Download models"

