#!/bin/bash

# Set environment to test
export NODE_ENV=test

# Run Jest tests
if [ "$1" == "watch" ]; then
  npx jest --watch
elif [ "$1" == "coverage" ]; then
  npx jest --coverage
else
  npx jest
fi