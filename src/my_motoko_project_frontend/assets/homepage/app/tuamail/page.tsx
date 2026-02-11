"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LoginContext = {
  anchorNumber: string;
  email: string;
  principal: string;
  existedBefore: boolean;
  loginCount: string;
};

export default function TuamailPage() {
  const [context, setContext] = useState<LoginContext | null>(null);

  useEffect(() => {
    const rawContext = window.localStorage.getItem("tuamail_login_context");
    if (!rawContext) {
      return;
    }

    try {
      setContext(JSON.parse(rawContext) as LoginContext);
    } catch {
      window.localStorage.removeItem("tuamail_login_context");
    }
  }, []);

  return (
    <main className="min-h-screen px-6 py-20 bg-background text-foreground">
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-8 md:p-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Tuamail</p>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
          Internet Identity Connected
        </h1>

        {!context && (
          <p className="text-muted-foreground leading-relaxed">
            No authenticated session was found in this browser tab. Go back and press{" "}
            <span className="font-medium text-foreground">Try it</span> from the services section.
          </p>
        )}

        {context && (
          <div className="space-y-3 text-sm md:text-base">
            <p>
              <span className="font-semibold">Anchor number:</span> {context.anchorNumber}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {context.email}
            </p>
            <p>
              <span className="font-semibold">Principal:</span> {context.principal}
            </p>
            <p>
              <span className="font-semibold">Existing user:</span>{" "}
              {context.existedBefore ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">Login count:</span> {context.loginCount}
            </p>
          </div>
        )}

        <Link
          href="/"
          className="inline-flex mt-8 px-5 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
