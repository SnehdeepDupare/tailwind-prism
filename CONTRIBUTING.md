# Contributing to Tailwind Prism

Thank you for your interest in contributing to Tailwind Prism! Contributions of all kinds like bug reports, fixes, improvements, and ideas are welcome. 

This guide will help you understand the directory structure and development workflow.

## Repository Structure

```
├── apps/
│   └── web/           # Website
├── packages/
│   └── extension/     # VS Code extension
├── package.json       # Root workspace config
└── pnpm-workspace.yaml
```

## Getting Started

### Fork and Clone the Repository

1. **Fork this repository**

   Click [here](https://github.com/SnehdeepDupare/tailwind-prism/fork) to fork the repository.

2. **Clone your forked repository to your local machine**

    ```bash
   git clone https://github.com/<YOUR_USERNAME>/tailwind-prism.git
   ```

3. **Navigate to the project directory**

   ```bash
   cd tailwind-prism
   ```
4. **Create a new branch for your changes**

   ```bash
   git checkout -b my-new-branch
   ```

5. **Install dependencies for all packages**

   ```bash
   pnpm i
   ```

## Development

### Extension

Navigate to the extension directory:

```bash
cd packages/extension
```

Compile the extension:

```bash
pnpm run compile
```

Run the extension in debug mode:
- Press `F5` in your code editor
- This opens a new Extension Development Host window

Build the extension package:

```bash
pnpm run package
```

### Website

Navigate to the website directory:

```bash
cd apps/web
```

Start the development server:

```bash
pnpm dev
```

Build the website:
```bash
pnpm build
```

## What You Can Contribute

Some ideas for contributions:

- Bug fixes and performance improvements
- Support for additional Tailwind patterns
- UX and accessibility improvements
- Documentation and examples
- Website content or design tweaks

If you're unsure where to start, feel free to open an issue to discuss ideas.
