import { Columns3, Radio, Users } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Columns3,
    title: "Boards that fit your flow",
    body: "Columns, cards, assignees and due dates. Drag cards where they belong.",
  },
  {
    icon: Users,
    title: "Your team, your workspace",
    body: "Each workspace gets its own address. Invite people with the right role.",
  },
  {
    icon: Radio,
    title: "Live for everyone",
    body: "Changes show up for everyone on the board without a refresh.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-20">
      <section className="flex flex-col items-start gap-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Plan the work. See it move.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          A shared Kanban workspace for your team, with its own address and realtime boards.
        </p>
        <Link href="/register" className={buttonVariants({ size: "lg" })}>
          Create your workspace
        </Link>
      </section>
    </div>
  );
}
