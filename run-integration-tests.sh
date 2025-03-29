#!/bin/bash
echo "Running integration tests..."
npx jest 'integration\.test\.(ts|tsx)$'