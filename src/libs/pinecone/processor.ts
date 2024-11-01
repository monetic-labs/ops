import path from "path";
import fs from "fs";

import matter from "gray-matter";

export type ProcessedDocument = {
  content: string;
  category: string;
  title: string;
  metadata: Record<string, any>;
};

function processMarkdownFile(filePath: string): ProcessedDocument | null {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Get category from directory structure if not in frontmatter
    const category = data.category || path.basename(path.dirname(filePath));

    return {
      content: content.trim(),
      category,
      title: data.title || path.basename(filePath, ".md"),
      metadata: data,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);

    return null;
  }
}

function getAllMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively get files from subdirectories
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (item.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

export async function processDocuments(docsDir: string): Promise<ProcessedDocument[]> {
  console.log(`Scanning directory: ${docsDir}`);

  const markdownFiles = getAllMarkdownFiles(docsDir);

  console.log(`Found ${markdownFiles.length} markdown files:`, markdownFiles);

  const documents = markdownFiles
    .map((filePath) => {
      const doc = processMarkdownFile(filePath);

      if (doc) {
        console.log(`Processed: ${doc.title} (${doc.category})`);
      }

      return doc;
    })
    .filter((doc): doc is ProcessedDocument => doc !== null);

  // Fix for Set spread operator issue
  const categories = Array.from(new Set(documents.map((doc) => doc.category)));

  console.log("Categories found:", categories);

  return documents;
}
