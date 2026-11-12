"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeMember, updateRole } from "@/app/(tenant)/(app)/settings/members/actions";
import { useMe } from "@/components/me-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormState } from "@/lib/form";
import { assignableRoles, can, canManage, ROLE_LABELS } from "@/lib/permissions";
import type { Member, Role } from "@/lib/types";

function report(result: FormState) {
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
}

function MemberRow({ member }: { member: Member }) {
  const me = useMe();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const editable = can(me, "members.manage") && canManage(me.role, member.role) && member.user.id !== me.user.id;
  const roles = assignableRoles(me.role);
  const items = Object.fromEntries([member.role, ...roles].map((r) => [r, ROLE_LABELS[r]]));

  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 pr-4">
        <div className="font-medium">
          {member.user.name}
          {member.user.id === me.user.id && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
        </div>
        <div className="text-muted-foreground sm:hidden">{member.user.email}</div>
      </td>
      <td className="hidden py-2.5 pr-4 text-muted-foreground sm:table-cell">{member.user.email}</td>
      <td className="py-2.5 pr-4">
        {editable ? (
          <Select
            items={items}
            value={member.role}
            disabled={pending}
            onValueChange={(role) =>
              role && role !== member.role && startTransition(async () => report(await updateRole(member.user.id, role as Role)))
            }
          >
            <SelectTrigger className="w-32" aria-label={`Role for ${member.user.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
        )}
      </td>
      <td className="py-2.5 text-right">
        {editable && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${member.user.name}`}
              disabled={pending}
              onClick={() => setConfirm(true)}
            >
              <Trash2 aria-hidden />
            </Button>
            <AlertDialog open={confirm} onOpenChange={setConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {member.user.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    They lose access to this workspace right away and are unassigned from their cards.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setConfirm(false);
                      startTransition(async () => report(await removeMember(member.user.id)));
                    }}
                  >
                    Remove member
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </td>
    </tr>
  );
}

export function MembersTable({ members }: { members: Member[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b text-left text-xs text-muted-foreground">
        <tr>
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="hidden py-2 pr-4 font-medium sm:table-cell">Email</th>
          <th className="py-2 pr-4 font-medium">Role</th>
          <th className="py-2">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <MemberRow key={member.user.id} member={member} />
        ))}
      </tbody>
    </table>
  );
}
