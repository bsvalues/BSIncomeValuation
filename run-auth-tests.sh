#!/bin/bash

# Set environment to test
export NODE_ENV=test

# Run Jest tests with --no-cache flag to avoid potential caching issues
npx jest __tests__/unit/auth.test.ts --no-cache --testTimeout=10000