import type { Metadata } from "next";
import LiveClient from "./live-client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Private Live Drawing Room | Draw Me Wrong",
  description: "Create or join a private 2-6 person drawing room. No account required.",
  alternates: { canonical: "/live" },
  robots: { index: false, follow: false },
};

export default function LivePage() {
  return <LiveClient />;
}
