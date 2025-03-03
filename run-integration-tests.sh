#!/bin/bash

# Set Node environment to test
export NODE_ENV=test

# Display test summary
echo "=== Running Integration Tests ==="
echo "These tests validate the API endpoints and their interactions"

# Run integration tests
npx jest --testMatch="**/__tests__/integration/**/*.test.ts"