import React from 'react';
import { FormCardTabs } from '@/components/generics/form-card-tabs';
import { FormInput } from '@/components/generics/form-input';
import { AutocompleteInput } from '@/components/generics/autocomplete-input';
import { useForm } from 'react-hook-form';

interface ConfiguratorProps {
  theme: any;
  onThemeChange: (newTheme: any) => void;
}

const componentOptions = [
  { label: 'Card', value: 'card' },
  { label: 'Button', value: 'button' },
  { label: 'Tab', value: 'tab' },
];

export default function Configurator({ theme, onThemeChange }: ConfiguratorProps) {
  const { control, handleSubmit, watch } = useForm({
    defaultValues: theme
  });

  const selectedComponent = watch('selectedComponent');

  const onSubmit = (data: any) => {
    onThemeChange(data);
  };

  const renderComponentTab = (field: any, index: number) => (
    <div key={index} className="space-y-4">
      <AutocompleteInput
        control={control}
        name="selectedComponent"
        label="Select Component"
        items={componentOptions}
        about="Choose a component to customize"
      />
      {selectedComponent === 'card' && renderCardCustomization()}
      {selectedComponent === 'button' && renderButtonCustomization()}
      {selectedComponent === 'tab' && renderTabCustomization()}
    </div>
  );

  const renderCardCustomization = () => (
    <>
      <FormInput
        control={control}
        name="card.backgroundColor"
        label="Background Color"
        type="color"
        about="Choose the background color for the card"
      />
      <FormInput
        control={control}
        name="card.textColor"
        label="Text Color"
        type="color"
        about="Choose the text color for the card"
      />
      <FormInput
        control={control}
        name="card.borderRadius"
        label="Border Radius"
        type="number"
        about="Set the border radius for the card"
      />
    </>
  );

  const renderButtonCustomization = () => (
    <>
      <FormInput
        control={control}
        name="button.backgroundColor"
        label="Background Color"
        type="color"
        about="Choose the background color for the button"
      />
      <FormInput
        control={control}
        name="button.textColor"
        label="Text Color"
        type="color"
        about="Choose the text color for the button"
      />
      <FormInput
        control={control}
        name="button.borderRadius"
        label="Border Radius"
        type="number"
        about="Set the border radius for the button"
      />
    </>
  );

  const renderTabCustomization = () => (
    <>
      <FormInput
        control={control}
        name="tab.backgroundColor"
        label="Background Color"
        type="color"
        about="Choose the background color for the tab"
      />
      <FormInput
        control={control}
        name="tab.textColor"
        label="Text Color"
        type="color"
        about="Choose the text color for the tab"
      />
      <FormInput
        control={control}
        name="tab.activeColor"
        label="Active Color"
        type="color"
        about="Choose the color for the active tab"
      />
    </>
  );

  return (
    <FormCardTabs
      title="Component Configurator"
      fields={[{ name: 'Components', render: renderComponentTab }]}
      renderTabContent={(field, index) => field.render(field, index)}
      renderTabTitle={(field) => field.name}
      onCancel={() => {/* Handle cancel */}}
      onSubmit={handleSubmit(onSubmit)}
      //customStyle={theme.card}
    />
  );
}