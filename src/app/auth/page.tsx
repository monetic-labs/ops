import { title } from "@/components/primitives";
import React from "react";

export default function AuthPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title({ color: "charyo" })}>Self Banking Services</h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-7xl justify-between mb-8">
        <div className="w-full sm:w-1/4 mb-4 sm:mb-0 flex">
          Nope
        </div>
      </div>
    </section>
  );
}
