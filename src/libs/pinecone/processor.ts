import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Paragraph } from 'mdast';

interface ProcessedDocument {
  category: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    section: string;
    type: 'api' | 'guide' | 'tutorial' | 'reference';
  };
}

export async function processDocuments(docsDir: string): Promise<ProcessedDocument[]> {
  const documents: ProcessedDocument[] = [];
  
  // Read all markdown files from the docs directory
  const files = readdirSync(docsDir).filter(file => file.endsWith('.md'));
  
  for (const file of files) {
    const filePath = join(docsDir, file);
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter and content
    const { data, content } = matter(fileContent);
    
    // Split content into chunks (e.g., by headers)
    const chunks = await splitIntoChunks(content);
    
    for (const chunk of chunks) {
      documents.push({
        category: data.category,
        title: data.title,
        content: chunk,
        metadata: {
          source: file,
          section: data.section,
          type: data.type || 'guide'
        }
      });
    }
  }
  
  return documents;
}

async function splitIntoChunks(content: string): Promise<string[]> {
  // Process with unified/remark to split by headers
  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify);
    
  const ast = await processor.parse(content);
  
  // Split content into ~500 token chunks
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Walk the AST and build chunks
  visit(ast, 'paragraph', (node: Paragraph) => {
    if ('value' in node) {
      const text = node.value as string;
      if ((currentChunk + text).length > 500) {
        chunks.push(currentChunk);
        currentChunk = text;
      } else {
        currentChunk += '\n\n' + text;
      }
    }
  });
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}