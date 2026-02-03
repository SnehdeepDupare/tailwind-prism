# Tailwind Prism Monorepo

A pnpm workspace containing the Tailwind Prism VS Code extension and future web applications.

## Structure

```
.
├── apps/
│   └── web/           # Next.js app (future)
├── packages/
│   └── extension/     # VS Code extension
├── package.json       # Root workspace config
└── pnpm-workspace.yaml
```

## Development

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm run build

# Run dev mode for all packages
pnpm run dev
```

## Packages

- **[extension](./packages/extension/)** - VS Code extension for semantic Tailwind CSS syntax highlighting
