import * as React from "react";

export type JsonLdProps<T extends Record<string, unknown>> = {
  data: T;
};

export function JsonLd<T extends Record<string, unknown>>({ data }: JsonLdProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
