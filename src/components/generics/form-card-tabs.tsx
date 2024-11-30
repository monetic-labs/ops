import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";

import { FormCard } from "./form-card";

interface FormCardTabsProps<T> {
  title: string;
  fields: T[];
  children?: React.ReactNode;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  renderTabContent: (field: T, index: number) => React.ReactNode;
  renderTabTitle: (field: T, index: number) => string;
  onCancel: () => void;
  onSubmit: () => void;
}

export const FormCardTabs = <T,>({
  title,
  fields,
  children,
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
        data-testid="form-card-tabs"
        selectedKey={selectedTab.toString()}
        onSelectionChange={(key) => setSelectedTab(parseInt(key.toString()))}
      >
        {fields.map((field, index) => (
          <Tab key={index.toString()} title={renderTabTitle(field, index)}>
            {renderTabContent(field, index)}
          </Tab>
        ))}
      </Tabs>
      {children}
      <div className="flex justify-between mt-4">
        <div className="space-x-2">
          <Tooltip content="Add another user">
            <Button
              className="text-notpurple-500"
              variant="light"
              data-testid="form-card-tabs-add-button"
              onClick={onAdd}
            >
              Add
            </Button>
          </Tooltip>
          {fields.length > 1 && (
            <Tooltip content="Remove selected user">
              <Button
                className="text-notpurple-500"
                variant="light"
                data-testid="form-card-tabs-remove-button"
                onClick={() => onRemove?.(selectedTab)}
              >
                Remove
              </Button>
            </Tooltip>
          )}
        </div>
        <div className="space-x-2">
          <Button className="text-notpurple-500" variant="light" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-ualert-500 text-notpurple-100"
            data-testid="form-card-tabs-submit-button"
            onClick={onSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </FormCard>
  );
};
