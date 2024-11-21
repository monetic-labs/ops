import { NextResponse } from "next/server";

import { pinecone } from "@/libs/pinecone/pinecone";

export async function DELETE(req: Request) {
  try {
    const { id, ids, filter, namespace } = await req.json();
    const index = pinecone.index("fintech-knowledge");

    if (id) {
      if (namespace) {
        await index.namespace(namespace).deleteOne(id);
      } else {
        await index.deleteOne(id);
      }

      return NextResponse.json({ message: "Document deleted successfully" });
    }

    if (ids) {
      if (namespace) {
        await index.namespace(namespace).deleteMany(ids);
      } else {
        await index.deleteMany(ids);
      }

      return NextResponse.json({ message: `${ids.length} documents deleted successfully` });
    }

    if (filter) {
      if (namespace) {
        await index.namespace(namespace).deleteMany({ filter });
      } else {
        await index.deleteMany({ filter });
      }

      return NextResponse.json({ message: "Documents matching filter deleted successfully" });
    }

    return NextResponse.json({ error: "No delete criteria provided" }, { status: 400 });
  } catch (error) {
    console.error("Delete error:", error);

    return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed" }, { status: 500 });
  }
}
