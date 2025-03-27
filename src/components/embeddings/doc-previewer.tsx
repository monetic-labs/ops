import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";

// Helper function to format content
const formatContentPreview = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    const innerContent = JSON.parse(parsed.content);

    return {
      type: parsed.type,
      id: innerContent.id,
      description: innerContent.description,
      ui_component: innerContent.ui_component,
      requires: innerContent.requires,
      user_intent: innerContent.user_intent,
      parameters: innerContent.parameters,
      decision_rules: innerContent.decision_rules,
      metadata: {
        category: parsed.metadata?.category,
        related: parsed.metadata?.related_chunks,
        title: parsed.metadata?.title,
      },
    };
  } catch (error) {
    return null;
  }
};

// Component to display content preview
export const ContentPreview = ({ content }: { content: string }) => {
  const preview = formatContentPreview(content);

  if (!preview) return <p className="text-red-500">Invalid content format</p>;

  return (
    <Card className="shadow-lg ">
      <CardHeader className="bg-charyo-400/60 flex flex-col items-start gap-2 p-4">
        <div className="flex flex-wrap gap-2">
          <Chip className="bg-blue-500 text-white" size="sm">
            {preview.type}
          </Chip>
          <Chip className="bg-blue-300 text-white" size="sm">
            {preview.id}
          </Chip>
          {preview.metadata?.category && (
            <Chip className="bg-yellow-500 text-white" size="sm">
              {preview.metadata.category}
            </Chip>
          )}
        </div>
        {preview.ui_component && (
          <Chip className="bg-gray-600 text-white" size="sm">
            {preview.ui_component}
          </Chip>
        )}
      </CardHeader>
      <CardBody className="p-4 flex flex-col gap-4 bg-charyo-500/70">
        <div>
          <h3 className="text-lg font-semibold text-notpurple-500">{preview.description}</h3>
          {preview.user_intent && (
            <div className="mt-2">
              <span className="text-sm text-gray-500 font-medium">User Intent:</span>
              <p className="text-lg font-semibold text-notpurple-500">{`"${preview.user_intent}"`}</p>
            </div>
          )}
        </div>

        {preview.requires && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500 font-medium">Requires:</span>
            <div className="flex flex-wrap gap-1">
              {preview.requires.map((req: string) => (
                <Chip key={req} className="bg-red-500 text-white" size="sm">
                  {req}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {preview.metadata?.related && (
          <div className="flex flex-col gap-2  ">
            <span className="text-sm text-gray-500 font-medium">Related Components:</span>
            <div className="flex flex-wrap gap-1">
              {preview.metadata.related.map((item: string) => (
                <Chip key={item} className="bg-purple-500 text-white" size="sm">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {preview.parameters && (
          <div className="mt-2 p-3 bg-charyo-300/30 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(preview.parameters, null, 2)}</pre>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
