#!/bin/bash

# Set Node environment to test
export NODE_ENV=test

# Display test summary
echo "=== Running Unit Tests ==="
echo "These tests validate individual components and functions"

# Run unit tests
npx jest --testMatch="**/__tests__/unit/**/*.test.ts"