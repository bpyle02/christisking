#!/bin/bash

# Script to kill all node and npm processes

# Kill node processes
pkill -f node

# Kill npm processes
pkill -f npm

echo "The server has been stopped."
