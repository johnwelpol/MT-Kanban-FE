import { format } from "date-fns";
import type { Metadata } from "next";
import { InvitationsList } from "@/components/members/invitations-list";
import { InviteForm } from "@/components/members/invite-form";
import { MembersTable } from "@/components/members/members-table";
import { getMe, tenantApi } from "@/lib/api";
import { can } from "@/lib/permissions";
import type { Invitation, Member } from "@/lib/types";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const me = await getMe();
  const canInvite = can(me, "invitations.manage");
  const [members, invitations] = await Promise.all([
    tenantApi<Member[]>("/members"),
    canInvite ? tenantApi<Invitation[]>("/invitations") : Promise.resolve([]),
  ]);

  return (
    <div className="grid max-w-4xl gap-8 p-6">
      <h1 className="text-xl font-semibold">Members</h1>

      {canInvite && (
        <section className="grid gap-3" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="font-medium">
            Invite someone
          </h2>
          <InviteForm />
        </section>
      )}

      <section className="grid gap-3" aria-labelledby="members-heading">
        <h2 id="members-heading" className="font-medium">
          People in {me.workspace.name} <span className="text-muted-foreground">({members.length})</span>
        </h2>
        <MembersTable members={members} />
      </section>

      {canInvite && (
        <section className="grid gap-3" aria-labelledby="invitations-heading">
          <h2 id="invitations-heading" className="font-medium">
            Pending invitations
          </h2>
          <InvitationsList
            invitations={invitations.map((i) => ({ ...i, expiresLabel: format(new Date(i.expires_at), "MMM d, yyyy") }))}
          />
        </section>
      )}
    </div>
  );
}
