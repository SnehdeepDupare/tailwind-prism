export default function Home() {
  return (
    <div className="flex-1">
      <div className="px-5 pt-20">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-5xl">
          Make Tailwind classes readable again.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-4xl text-base">
          Semantic syntax highlighting for your Tailwind CSS classes, so you
          don&apos;t get confused again and edit long classes without slowing
          down.
        </p>

        <div className="mt-4 flex gap-2">
          <button className="bg-primary text-primary-foreground cursor-pointer rounded-md px-4 py-2 text-sm font-medium">
            Install from VS Code Marketplace
          </button>
          <button className="cursor-pointer rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium">
            View on GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
