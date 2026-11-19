#!/usr/bin/env bash
set -u

mkdir -p logs

(cd backend && .venv/bin/python -m app) > logs/backend.log 2>&1 &
BACKEND_PID=$!

npm --prefix frontend run dev -- --host < /dev/null > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"

wait_for_port() {
  local port="$1"
  local name="$2"
  for _ in $(seq 1 30); do
    if bash -c "exec 3<>/dev/tcp/127.0.0.1/$port" 2>/dev/null; then
      echo "$name is listening on :$port"
      return 0
    fi
    sleep 0.5
  done
  echo "WARNING: $name did not listen on :$port within 15s" >&2
  return 1
}

wait_for_port 5172 "Backend"
wait_for_port 5173 "Frontend"