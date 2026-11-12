import type { Metadata } from "next";
import { ApiError, tenantApi } from "@/lib/api";
import type { InvitePreview } from "@/lib/types";
import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Accept invitation" };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;

  let preview: InvitePreview;
  try {
    preview = await tenantApi<InvitePreview>(`/invites/${encodeURIComponent(token)}`, { auth: false });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      return <p className="text-sm">This invitation is invalid or has expired.</p>;
    }
    throw e;
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm">
        <span className="font-medium">{preview.inviter_name}</span> invited you to join{" "}
        <span className="font-medium">{preview.workspace.name}</span> as{" "}
        <span className="font-medium">{preview.role}</span>.
      </p>
      <AcceptForm token={token} email={preview.email} userExists={preview.user_exists} />
    </div>
  );
}
