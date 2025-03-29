#!/bin/bash

# Run only authentication-related tests
npx jest --testMatch="**/__tests__/auth/**/*.test.ts" --verbose

echo "Authentication tests completed!"