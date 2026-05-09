#!/bin/bash

# Helper script to view logs in the Docker container or local directory
# Usage: ./scripts/view-logs.sh [error|combined] [--tail]

LOG_TYPE=${1:-combined}
TAIL_MODE=$2

LOG_DIR="./logs"

if [ "$LOG_TYPE" == "error" ]; then
    FILE_PATTERN="error-*.log"
else
    FILE_PATTERN="combined-*.log"
fi

# Find the latest log file
LATEST_LOG=$(ls -t $LOG_DIR/$FILE_PATTERN 2>/dev/null | head -n 1)

if [ -z "$LATEST_LOG" ]; then
    echo "No log files found in $LOG_DIR matching $FILE_PATTERN"
    exit 1
fi

echo "Viewing latest log: $LATEST_LOG"

if [ "$TAIL_MODE" == "--tail" ]; then
    tail -f "$LATEST_LOG"
else
    cat "$LATEST_LOG" | jq . 2>/dev/null || cat "$LATEST_LOG"
fi
