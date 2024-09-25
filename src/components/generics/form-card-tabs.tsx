import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

import { FormCard } from "./form-card";

interface FormCardTabsProps<T> {
  title: string;
  fields: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderTabContent: (field: T, index: number) => React.ReactNode;
  renderTabTitle: (field: T, index: number) => string;
  onCancel: () => void;
  onSubmit: () => void;
}

export const FormCardTabs = <T,>({
  title,
  fields,
  onAdd,
  onRemove,
  renderTabContent,
  renderTabTitle,
  onCancel,
  onSubmit,
}: FormCardTabsProps<T>) => {
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    setSelectedTab(fields.length - 1);
  }, [fields.length]);

  return (
    <FormCard title={title}>
      <Tabs
        aria-label="Dynamic Tabs"
        className="max-w-md"
        selectedKey={selectedTab.toString()}
        onSelectionChange={(key) => setSelectedTab(parseInt(key.toString()))}
      >
        {fields.map((field, index) => (
          <Tab key={index.toString()} title={renderTabTitle(field, index)}>
            {renderTabContent(field, index)}
          </Tab>
        ))}
      </Tabs>
      <div className="flex justify-between mt-4">
        <div className="space-x-2">
          <Tooltip content="Add another user">
            <Button className="text-notpurple-500" variant="light" onClick={onAdd}>
              Add
            </Button>
          </Tooltip>
          {fields.length > 1 && (
            <Tooltip content="Remove selected user">
              <Button className="text-notpurple-500" variant="light" onClick={() => onRemove(selectedTab)}>
                Remove
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="space-x-2">
          <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-ualert-500 text-notpurple-100" onClick={onSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </FormCard>
  );
};
