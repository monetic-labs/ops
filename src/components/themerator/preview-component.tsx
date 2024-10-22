import React from 'react';

interface PreviewComponentProps {
  theme: any;
}

export default function PreviewComponent({ theme }: PreviewComponentProps) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.primary,
        fontFamily: theme.fonts.sans,
      }}
      className="p-4 border rounded"
    >
      <h1 className="text-2xl">Sample Heading</h1>
      <p>Sample paragraph with custom styles.</p>
    </div>
  );
}