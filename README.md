# World Drive

This repository uses a pnpm workspace. Run `pnpm install` from the repository
root; dependencies for both apps are recorded in the root `pnpm-lock.yaml`.

## Local development

- Client: `pnpm --filter client dev`
- Server: `pnpm --filter server dev`
- Client tests: `pnpm --filter client test`
- Client build and type check: `pnpm --filter client build`
- Server build and type check: `pnpm --filter server build`
- Run the compiled server: `pnpm --filter server start`

The client opens the driving playground without requiring a server. Use W/S or
the up/down arrows to accelerate and brake/reverse; A/D or the left/right arrows
steer. Press R or select Reset car to return to the start. The existing multiplayer
lobby is available at `/lobby` and requires the server and `VITE_WEBSOCKET_URL`.

The server uses `tsx watch` during development. Its production build uses
TypeScript to check types and emit JavaScript, which Node runs at startup.
The compiler preserves the `server` and `shared` directory layout under
`server/dist`, so the entry point is `server/dist/server/index.js`.

## Railway

Use the repository root (`/`) for both services so the shared types are available.
Railpack detects Node and pnpm from the root package manifest and installs
workspace dependencies automatically. Do not put an install command in the build
command.

### Client service

- Root Directory: `/`
- Build Command: `pnpm --filter client build`
- Start Command: leave empty (remove any previous override)
- Service variable: `RAILPACK_SPA_OUTPUT_DIR=client/dist`

The SPA output variable enables Railpack's static server, so Vite's preview
server is unnecessary. Set `VITE_WEBSOCKET_URL` on this service before building.

### Server service

- Root Directory: `/`
- Build Command: `pnpm --filter server build`
- Start Command: `pnpm --filter server start`

Do not set `RAILPACK_SPA_OUTPUT_DIR` on the server service. The server reads
Railway's `PORT` variable and binds to `0.0.0.0`.
