"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(() => import("@/components/Experience"), {
  ssr: false,
  loading: () => <main className="boot"><span className="paw">●</span><p>Preparing the little paws…</p></main>
});

export default function Page() { return <Experience />; }
