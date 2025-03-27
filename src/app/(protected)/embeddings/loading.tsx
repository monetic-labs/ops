import { Spinner } from "@heroui/spinner";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center">
      <Spinner label="Loading embeddings page..." />
    </div>
  );
}
