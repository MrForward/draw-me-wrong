import type { Metadata } from "next";
import UseCaseLanding from "../use-case-landing";

const title = "5-Minute Drawing Icebreaker for Remote Teams | Draw Me Wrong";
const description = "Start a private 2-6 person drawing icebreaker for a remote meeting, workshop, or sprint retrospective. No app and no account.";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/play/team-icebreaker" },
  openGraph: { title, description, url: "/play/team-icebreaker", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Draw Me Wrong: Bad drawings. Better together." }] },
  twitter: { title, description, images: ["/og.png"] },
};

export default function TeamIcebreakerPage() {
  return <UseCaseLanding />;
}
