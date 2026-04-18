"use client";

import { Button } from "@heroui/react";

export function HeroDemo() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-[32px] border border-black/5 bg-white p-8 shadow-sm sm:p-12">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit rounded-full border border-black/10 px-3 py-1 text-sm font-medium text-zinc-600">
            HeroUI v3 running
          </span>

          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Pulselane frontend is now using HeroUI v3.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              Base setup finished on top of Next.js 16, React 19 and Tailwind CSS
              v4. This is only the foundation layer, without fake providers or old
              v2 setup.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg">Create client</Button>

          <Button size="lg" variant="secondary">
            Create project
          </Button>

          <Button size="lg" variant="outline">
            Open dashboard
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-zinc-600">
          <span className="rounded-full border border-black/10 px-3 py-1">
            Next 16
          </span>
          <span className="rounded-full border border-black/10 px-3 py-1">
            React 19
          </span>
          <span className="rounded-full border border-black/10 px-3 py-1">
            Tailwind 4
          </span>
          <span className="rounded-full border border-black/10 px-3 py-1">
            HeroUI v3
          </span>
        </div>
      </div>
    </section>
  );
}