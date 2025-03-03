#!/bin/bash

# Set Node environment to test
export NODE_ENV=test

# Display test summary
echo "=== Running All Tests ==="
echo "Running both unit and integration tests"

# Run all tests
npx jest