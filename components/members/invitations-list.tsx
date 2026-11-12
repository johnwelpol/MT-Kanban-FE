"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { revokeInvitation } from "@/app/(tenant)/(app)/settings/members/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Invitation } from "@/lib/types";

export type InvitationRow = Invitation & { expiresLabel: string };

function Row({ invitation }: { invitation: InvitationRow }) {
  const [pending, startTransition] = useTransition();
  const revoke = () =>
    startTransition(async () => {
      const result = await revokeInvitation(invitation.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });

  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 pr-4 font-medium break-all">{invitation.email}</td>
      <td className="py-2.5 pr-4">
        <Badge variant="outline">{ROLE_LABELS[invitation.role]}</Badge>
      </td>
      <td className="hidden py-2.5 pr-4 text-muted-foreground md:table-cell">{invitation.invited_by.name}</td>
      <td className="hidden py-2.5 pr-4 text-muted-foreground sm:table-cell">{invitation.expiresLabel}</td>
      <td className="py-2.5 text-right">
        <Button variant="ghost" size="sm" disabled={pending} onClick={revoke}>
          Revoke
        </Button>
      </td>
    </tr>
  );
}

export function InvitationsList({ invitations }: { invitations: InvitationRow[] }) {
  if (invitations.length === 0) return <p className="text-sm text-muted-foreground">No pending invitations.</p>;

  return (
    <table className="w-full text-sm">
      <thead className="border-b text-left text-xs text-muted-foreground">
        <tr>
          <th className="py-2 pr-4 font-medium">Email</th>
          <th className="py-2 pr-4 font-medium">Role</th>
          <th className="hidden py-2 pr-4 font-medium md:table-cell">Invited by</th>
          <th className="hidden py-2 pr-4 font-medium sm:table-cell">Expires</th>
          <th className="py-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {invitations.map((invitation) => (
          <Row key={invitation.id} invitation={invitation} />
        ))}
      </tbody>
    </table>
  );
}
