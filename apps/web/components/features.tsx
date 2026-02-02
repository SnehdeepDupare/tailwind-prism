import { FEATURES } from "@/constants";

export const Features = () => {
  return (
    <section className="mt-14 px-5">
      <h2 className="text-center text-4xl font-bold">Features</h2>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {FEATURES.map((item, index) => (
          <div
            key={index}
            className="rounded-2xl bg-neutral-50 p-4 text-balance shadow-md ring ring-black/10"
          >
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
