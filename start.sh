#!/usr/bin/env bash
# ============================================================
#  HAM Radio Dashboard — Launcher Script (macOS / Linux)
#
#  Usage:
#    ./start.sh                       # start with defaults
#    ./start.sh --port 8080           # use a custom port
#    ./start.sh --no-browser          # don't open the browser
#    ./start.sh --host                # allow network access
#    ./start.sh --help                # show help
# ============================================================

set -e

# ---- Defaults ------------------------------------------------
PORT=5173
OPEN_BROWSER=true
HOST_FLAG=""

# ---- Parse arguments -----------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            PORT="$2"
            shift 2
            ;;
        --no-browser)
            OPEN_BROWSER=false
            shift
            ;;
        --host)
            HOST_FLAG="--host"
            shift
            ;;
        --help|-h)
            echo ""
            echo "HAM Radio Dashboard Launcher"
            echo ""
            echo "Usage: ./start.sh [options]"
            echo ""
            echo "Options:"
            echo "  --port NUMBER     Port for the dev server (default: 5173)"
            echo "  --no-browser      Don't open the browser automatically"
            echo "  --host            Allow access from other devices on your network"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./start.sh                        # start with defaults"
            echo "  ./start.sh --port 8080            # use port 8080"
            echo "  ./start.sh --port 8080 --host     # port 8080, network access"
            echo "  ./start.sh --no-browser            # don't open browser"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1  (use --help for usage)"
            exit 1
            ;;
    esac
done

# ---- Helper: coloured output --------------------------------
info()    { printf '\033[0;36m%s\033[0m\n' "$*"; }
success() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn()    { printf '\033[0;33m%s\033[0m\n' "$*"; }
err()     { printf '\033[0;31m%s\033[0m\n' "$*"; }

echo ""
info "===================================="
info "  HAM Radio Dashboard Launcher"
info "===================================="
echo ""

# ---- 1. Check for Node.js -----------------------------------
info "Checking for Node.js..."

if ! command -v node &>/dev/null; then
    echo ""
    err "ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js (version 18 or newer):"
    echo ""

    # Detect OS and give specific instructions
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Option 1 — Download the installer:"
        echo "    https://nodejs.org/"
        echo ""
        echo "  Option 2 — Install with Homebrew:"
        echo "    brew install node"
    elif command -v apt-get &>/dev/null; then
        echo "  Option 1 — Download the installer:"
        echo "    https://nodejs.org/"
        echo ""
        echo "  Option 2 — Install with apt (Ubuntu/Debian):"
        echo "    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        echo "    sudo apt-get install -y nodejs"
    elif command -v dnf &>/dev/null; then
        echo "  Option 1 — Download the installer:"
        echo "    https://nodejs.org/"
        echo ""
        echo "  Option 2 — Install with dnf (Fedora/RHEL):"
        echo "    sudo dnf install nodejs"
    elif command -v pacman &>/dev/null; then
        echo "  Option 1 — Download the installer:"
        echo "    https://nodejs.org/"
        echo ""
        echo "  Option 2 — Install with pacman (Arch):"
        echo "    sudo pacman -S nodejs npm"
    else
        echo "  Download the installer from:"
        echo "    https://nodejs.org/"
    fi

    echo ""
    echo "After installing, run this script again."
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
success "  Found Node.js $NODE_VERSION"

# Check minimum version (v18+)
MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/^v//' | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 18 ] 2>/dev/null; then
    echo ""
    warn "WARNING: Node.js version 18 or newer is recommended."
    warn "  You have $NODE_VERSION. Some features may not work."
    warn "  Download the latest from: https://nodejs.org/"
    echo ""
fi

# Check npm
if ! command -v npm &>/dev/null; then
    echo ""
    err "ERROR: npm is not available!"
    echo "npm should be included with Node.js. Try reinstalling Node.js."
    echo ""
    exit 1
fi

NPM_VERSION=$(npm --version)
success "  Found npm v$NPM_VERSION"

# ---- 2. Navigate to project directory -----------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- 3. Install dependencies if needed ----------------------
if [ ! -d "node_modules" ]; then
    echo ""
    warn "Installing dependencies (first run)..."
    echo "  This may take a minute or two."
    echo ""
    npm install
    echo ""
    success "  Dependencies installed successfully!"
else
    success "  Dependencies already installed."
fi

# ---- 4. Open the browser (unless --no-browser) --------------
if [ "$OPEN_BROWSER" = true ]; then
    URL="http://localhost:$PORT"
    echo ""
    info "  Opening browser to $URL ..."

    # Open browser after a short delay in the background
    (
        sleep 3
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "$URL" 2>/dev/null
        elif command -v xdg-open &>/dev/null; then
            xdg-open "$URL" 2>/dev/null
        elif command -v wslview &>/dev/null; then
            wslview "$URL" 2>/dev/null
        else
            echo "  Could not detect how to open the browser."
            echo "  Please open $URL manually."
        fi
    ) &
fi

# ---- 5. Start the dev server --------------------------------
echo ""
success "Starting HAM Radio Dashboard..."
echo "  Press Ctrl+C to stop the server."
echo ""

npm run dev -- --port "$PORT" $HOST_FLAG
