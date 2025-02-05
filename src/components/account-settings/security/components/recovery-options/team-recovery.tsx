"use client";

import { Button } from "@nextui-org/button";
import { Select, SelectItem, SelectedItems } from "@nextui-org/select";
import { Chip } from "@nextui-org/chip";
import { Avatar } from "@nextui-org/avatar";
import { XIcon } from "lucide-react";

import { MOCK_ORG_MEMBERS, OrgMember } from "../../constants";

export interface TeamRecoveryProps {
  configuredTeamMember: OrgMember | null;
  onSelectTeamMember: (memberId: string) => void;
  onRemoveTeamMember: () => void;
}

export const TeamRecovery = ({ configuredTeamMember, onSelectTeamMember, onRemoveTeamMember }: TeamRecoveryProps) => {
  return (
    <div className="space-y-4">
      {configuredTeamMember ? (
        <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar className="bg-default-300" name={configuredTeamMember.displayName} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{configuredTeamMember.displayName}</span>
              <span className="text-xs text-default-500">{configuredTeamMember.email}</span>
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
                  <span className="text-xs text-default-500">{member.data?.email}</span>
                </div>
              </div>
            ) : null;
          }}
          onChange={(e) => onSelectTeamMember(e.target.value)}
        >
          {MOCK_ORG_MEMBERS.map((member) => (
            <SelectItem
              key={member.id}
              className="data-[selected=true]:bg-default-100"
              textValue={member.displayName}
              value={member.id}
            >
              <div className="flex items-center gap-2">
                <Avatar className="bg-default-300" name={member.displayName} size="sm" />
                <div className="flex flex-col">
                  <span className="text-sm">{member.displayName}</span>
                  <span className="text-xs text-default-500">{member.email}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
};
