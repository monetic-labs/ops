import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { Divider } from "@nextui-org/divider";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";

import { useBootstrapProcessor } from "@/hooks/embeddings/useBootstrapProcessor";

export const BootstrapSection = () => {
  const { runBootstrap, isBootstrapping, bootstrapStatus } = useBootstrapProcessor();

  return (
    <Card className="bg-charyo-500/60 backdrop-blur-sm">
      <CardHeader className="flex flex-col items-start">
        <h3 className="text-lg font-semibold text-notpurple-500">Bootstrap Knowledge Base</h3>
        <p className="text-small text-notpurple-500/60">
          Initialize or reset the knowledge base with core system knowledge
        </p>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button className="w-full" disabled={isBootstrapping} onPress={runBootstrap}>
              {isBootstrapping ? <Spinner color="current" size="sm" /> : "Bootstrap Knowledge Base"}
            </Button>
            {bootstrapStatus?.type && (
              <div
                className={`p-4 rounded ${
                  bootstrapStatus.type === "success" ? "bg-green-100/10 text-green-500" : "bg-red-100/10 text-red-500"
                }`}
              >
                {bootstrapStatus.message}
                {bootstrapStatus.type === "error" && bootstrapStatus.stats && (
                  <div className="mt-2 text-sm">Failed documents: {bootstrapStatus.stats.errors.length || 0}</div>
                )}
              </div>
            )}
          </div>
          <div className="text-notpurple-500/60">
            <p className="font-semibold">This will:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Load core graph structure</li>
              <li>Initialize energy type patterns</li>
              <li>Set up preference templates</li>
              <li>Create base embeddings</li>
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
