import { IconBrandGithub, IconBrandX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="flex items-center justify-between border-t px-5 py-4">
      <div>
        <Link href="/">
          <Image
            src="logo-with-text.svg"
            alt="Tailwind Prism Logo"
            width={180}
            height={100}
            className="object-cover"
          />
        </Link>

        <p className="text-muted-foreground text-base">
          Developed by{" "}
          <Link
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline hover:underline-offset-2"
          >
            Snehdeep Dupare
          </Link>
          .
        </p>
      </div>

      <div className="text-muted-foreground flex items-center gap-2">
        <Link
          href=""
          className="hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandGithub className="size-6" />
        </Link>
        <Link
          href=""
          className="hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandX className="size-6" />
        </Link>
      </div>
    </footer>
  );
};
