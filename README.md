# Cortex Benchmark Lab (Prompt.Bench)

A prompt engineering benchmarking tool for evaluating LLM outputs against rule-based test fixtures. Run structured tests across OpenAI and Anthropic models, compare results, and iterate on prompt quality.

## Features

- Run prompt benchmarks against multiple LLM models (GPT-4o, Claude 3.5 Sonnet, etc.)
- Rule-based pass/fail evaluation of model outputs
- Custom context injection for testing different scenarios (simulation reports, adaptive learning, deep learning)
- Real-time execution monitoring with system logs
- Token usage and cost tracking per test
- Failure diagnosis with clipboard export for prompt iteration
- Dark/light theme support

## Prerequisites

- Node.js (v18+)
- Python 3 (for the test runner)
- API keys for the models you want to benchmark:
  - OpenAI API key
  - Anthropic API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Add your API keys to `.env`:

   ```
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   ```

   You can also enter keys directly in the UI header.

## Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
npm start
```

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start dev server with hot reload     |
| `npm run build` | Build frontend and bundle server     |
| `npm start`     | Run production server                |
| `npm run clean` | Remove dist directory                |
| `npm run lint`  | Type-check with TypeScript           |

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Framer Motion, Lucide icons
- **Backend**: Express, TypeScript, Vite (dev middleware)
- **Test Runner**: Python (`test_prompt_system.py`)
- **Build**: Vite + esbuild

## Deployment

Configured for Render via `render.yaml`. Set environment variables in your Render dashboard.

## License

Private
