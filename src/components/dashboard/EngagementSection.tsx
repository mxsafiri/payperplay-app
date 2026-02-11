import * as React from "react";

import { Container } from "./Container";
import { PhoneMockup } from "./PhoneMockup";

export function EngagementSection() {
  return (
    <section id="community" className="bg-white py-16 dark:bg-neutral-950">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">
            Collaborate, Ask Questions and Give Feedback in Real-Time
          </h2>
          <p className="max-w-xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            A premium chat layer turns every play into a shared moment. Reactions
            are delightful, gifts feel personal, and creators stay in control.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Live Q&A
              </div>
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Ask questions while the moment is fresh.
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Reactions
              </div>
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Keep it playful, never chaotic.
              </div>
            </div>
          </div>
        </div>

        <div className="order-first lg:order-none">
          <PhoneMockup />
        </div>
      </Container>
    </section>
  );
}
