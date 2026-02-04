"use client";

import { motion } from "motion/react";
import { FEATURES } from "@/constants";

export const Features = () => {
  return (
    <section className="mt-14 px-4">
      <motion.h2
        initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
        whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="text-center text-4xl font-bold tracking-tight"
      >
        Features
      </motion.h2>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, ...item }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              delay: index * 0.02,
            }}
            className="flex flex-col rounded-2xl bg-neutral-50 p-4 shadow-sm ring ring-black/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-neutral-200/50">
              <Icon className="size-4.5" stroke={1.75} />
            </div>

            <div className="flex flex-col">
              <h3 className="text-xl font-bold tracking-tight text-balance text-neutral-900">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed text-pretty">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
