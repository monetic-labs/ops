"use client";

import { Button } from "@nextui-org/button";
import { Select, SelectItem, SelectedItems } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { Avatar } from "@nextui-org/avatar";
import { XIcon } from "lucide-react";

import { useUsers } from "@/contexts/UsersContext";
import { getFullName } from "@/utils/helpers";

import { OrgMember } from "../../types";

export interface TeamRecoveryProps {
  configuredTeamMember: OrgMember | null;
  onSelectTeamMember: (memberId: string) => void;
  onRemoveTeamMember: () => void;
}

export const TeamRecovery = ({ configuredTeamMember, onSelectTeamMember, onRemoveTeamMember }: TeamRecoveryProps) => {
  const { users } = useUsers();

  return (
    <div className="space-y-4">
      {configuredTeamMember ? (
        <div className="flex items-center justify-between p-3 bg-content2 rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="bg-default-300" name={configuredTeamMember.displayName} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{configuredTeamMember.displayName}</span>
              <span className="text-xs text-foreground/60">{configuredTeamMember.email}</span>
            </div>
            <Chip color="success" size="sm" variant="flat">
              Configured
            </Chip>
          </div>
          <Button isIconOnly color="danger" size="sm" variant="light" onClick={onRemoveTeamMember}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Select
          className="max-w-xs"
          label="Select Team Member"
          placeholder="Choose a team member for recovery"
          renderValue={(items: SelectedItems<OrgMember>) => {
            const member = items[0];

            return member ? (
              <div className="flex items-center gap-2">
                <Avatar className="bg-default-300" name={member.data?.displayName} size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm">{member.data?.displayName}</span>
                  <span className="text-xs text-foreground/60">{member.data?.email}</span>
                </div>
              </div>
            ) : null;
          }}
          onChange={(e) => onSelectTeamMember(e.target.value)}
        >
          {users.map((member) => {
            const fullName = getFullName(member.firstName, member.lastName);

            return (
              <SelectItem
                key={member.id}
                className="data-[selected=true]:bg-default-100"
                textValue={member.username || fullName}
                value={member.id}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="bg-default-300" name={member.username || fullName} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-sm">{member.username || fullName}</span>
                    <span className="text-xs text-default-500">{member.email}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </Select>
      )}
    </div>
  );
};
