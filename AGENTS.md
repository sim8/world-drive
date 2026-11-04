# World Drive

## Vision and motivation

World Drive is a multiplayer browser game where players can drive anywhere in
the real world. Real geographic data provides roads, terrain, and buildings;
the world can become richer over time as the project and AI capabilities evolve.

An important purpose of this side project is to develop practical backend and
system-design intuition. The owner has done little backend work in side projects
and wants to build an application from scratch with a few meaningful backend
components while staying motivated by a playable game.

## Development approach

- Build small, playable increments. Prefer the simplest implementation that
  supports the current milestone.
- Introduce infrastructure when a concrete problem makes its purpose clear.
  Avoid adding services solely to exercise a technology or anticipate scale.
- Explain significant backend decisions and tradeoffs so the owner can build
  understanding alongside the implementation.
- Prefer tools that reduce setup friction while keeping application concepts
  visible: services, processes, networking, persistence, and deployment.
- Treat current code and explicit decisions as the source of truth for what is
  implemented. The ideas below are possibilities, not requirements or permission
  to expand the scope of a task.

## Possible future directions

- Real roads and elevation data, with procedural buildings and scenery.
- Geographic subscriptions so multiplayer clients receive nearby player updates.
- Generated 3D assets for frequently visited areas, stored for reuse.
- Background generation jobs, retries, and deduplication when generation needs
  asynchronous processing.
- Object storage and CDN delivery for generated models and textures.
- Shared transient state and pub/sub if multiple game servers become necessary.

OpenStreetMap and Mapzen terrain were discussed as initial geographic data
sources. Railway, Node/TypeScript, and Postgres were discussed as an approachable
backend foundation. These are prior proposals, not a mandate to add dependencies
or a statement that each component is already in use.

## References

- [Original ideation and backend learning discussion: System design roleplay setup](https://chatgpt.com/c/6ac3f65f-6ea8-83eb-83e8-2d4a49c95c90)
- [Geographic data exploration: Compare Simulator Data Options](https://chatgpt.com/c/6aa2e361-cfec-83eb-901e-865ada140ede)
- See README.md for local development and deployment instructions.
