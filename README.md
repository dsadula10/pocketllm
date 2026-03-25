# PocketLLM

**Run AI models directly on your smartphone. No cloud, no subscription, completely offline.**

PocketLLM is an open-source mobile-first web application that lets you download and run lightweight LLM models entirely on your device using WebGPU and WebAssembly. Think of it as **Ollama for smartphones**.

## Features

- **Fully Offline** — After downloading a model once, everything runs locally. No internet needed for inference.
- **Privacy-First** — Your data never leaves your device. No telemetry, no cloud processing.
- **Model Library** — Curated collection of 9 lightweight models (360M–3.8B parameters) optimized for mobile.
- **Chat Interface** — Full conversation UI with streaming responses, conversation history, and quick-start prompts.
- **Automations** — 12 pre-built prompt templates for common tasks (summarization, email drafting, code review, brainstorming, translation, debugging, security audit, and more).
- **Dark Mode** — Full light/dark theme support with system preference detection.
- **Open Source** — MIT licensed. Fork it, customize it, make it yours.

## Supported Models

| Model | Params | Size | Category |
|-------|--------|------|----------|
| SmolLM2 360M | 360M | ~250 MB | Tiny |
| Qwen2.5 0.5B | 0.5B | ~350 MB | Tiny |
| TinyLlama 1.1B | 1.1B | ~650 MB | Tiny |
| Llama 3.2 1B | 1B | ~700 MB | Small |
| SmolLM2 1.7B | 1.7B | ~1.0 GB | Small |
| Qwen2.5 1.5B | 1.5B | ~1.0 GB | Small |
| Gemma 2 2B | 2B | ~1.4 GB | Small |
| Llama 3.2 3B | 3B | ~1.8 GB | Medium |
| Phi-3.5 Mini | 3.8B | ~2.2 GB | Medium |

## Requirements

- **Browser**: Chrome 113+ or Edge 113+ (WebGPU support required for GPU acceleration; falls back to WASM on older browsers)
- **RAM**: 1–4 GB available depending on model size
- **Storage**: Space for downloaded model weights (250 MB – 2.2 GB per model)

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express + SQLite (Drizzle ORM) for conversation persistence
- **LLM Engine**: [WebLLM](https://github.com/mlc-ai/web-llm) by MLC AI (WebGPU + WASM inference)
- **Build**: Vite

## Getting Started

```bash
# Clone the repository
git clone https://github.com/dsadula10/pocketllm.git
cd pocketllm

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

## Production Build

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## How It Works

1. **Browse Models** — Open the Models tab and pick a model that fits your device.
2. **Download Once** — The model weights are downloaded and cached in your browser's storage.
3. **Chat Offline** — Switch to the Chat tab and start talking. All inference runs on your device's GPU (via WebGPU) or CPU (via WASM).
4. **Automate Tasks** — Use pre-built templates in the Automations tab for common tasks like summarization, translation, or code review.

## Project Structure

```
pocketllm/
├── client/src/
│   ├── components/        # UI components and layout
│   ├── lib/
│   │   ├── webllm-engine.ts   # WebLLM integration and model management
│   │   ├── hooks.ts           # Custom React hooks
│   │   ├── automation-templates.ts  # Pre-built prompt templates
│   │   └── queryClient.ts    # API client
│   └── pages/
│       ├── chat.tsx           # Chat interface
│       ├── models.tsx         # Model library
│       ├── automations.tsx    # Task automation
│       └── settings.tsx       # Device status and preferences
├── server/
│   ├── routes.ts          # API routes
│   └── storage.ts         # SQLite storage layer
└── shared/
    └── schema.ts          # Database schema (Drizzle)
```

## Contributing

Contributions are welcome! Feel free to:

- Report bugs or request features via Issues
- Submit Pull Requests
- Add new model support
- Improve the automation templates
- Help with translations

## License

MIT — do whatever you want with it.

## Credits

- [WebLLM](https://github.com/mlc-ai/web-llm) by MLC AI for the in-browser inference engine
- Models from Meta (Llama), Google (Gemma), Microsoft (Phi), Alibaba (Qwen), and HuggingFace (SmolLM)
- Built with [Perplexity Computer](https://www.perplexity.ai/computer)
