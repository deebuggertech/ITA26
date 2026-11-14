# Project Rules
- Stack: React (TS) in `/frontend`, FastAPI (Python 3.12) in `/backend`.
- Never put business logic in React components; keep API calls in `/frontend/src/api/`.
- All backend endpoints must use Pydantic models for request/response validation.
- Before finishing any task, run `npm run typecheck` and `pytest`.

## Anti-Slop & Style Constraints
- UI: Use shadcn/ui primitives with a flat, high-density, neutral-palette layout (1px borders, no gradients, no drop-shadow bloat, no sparkle/rocket emojis).
- Copy: Keep UI labels terse and technical. Never generate marketing fluff or placeholder Latin.
- Code: No "what" comments—only "why" comments. No speculative abstractions or unused helper files.
- Error Handling: Fail fast at boundaries (Pydantic/API layer); do not wrap internal functions in redundant try/except blocks.
