'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Select, SelectItem } from '@nextui-org/select';
import { Spinner } from '@nextui-org/spinner';
import { Accordion, AccordionItem } from '@nextui-org/accordion';
import { Chip } from '@nextui-org/chip';
import { Divider } from '@nextui-org/divider';
import { useDocumentManager } from '@/hooks/embeddings/useDocumentManager';
import CardFooterWithActions from '@/components/generics/card-footer-actions';
import IDSnippet from '../generics/snippet-id';

interface DocumentList {
  id: string;
  metadata: {
    category?: string;
    section?: string;
    text?: string;
    type?: string;
    [key: string]: any;
  };
}

interface NamespaceOption {
  label: string;
  value: string;
  description: string;
}

const DocumentManager = () => {
  const [namespace, setNamespace] = useState('');
  const [documents, setDocuments] = useState<DocumentList[]>([]);
  const [namespaces, setNamespaces] = useState<Record<string, { recordCount: number }>>({});
  const [loading, setLoading] = useState(true);
  const { deleteDocument, deleteManyDocuments, deleting, error } = useDocumentManager();

  const namespaceOptions: NamespaceOption[] = [
    { 
      label: 'Default namespace', 
      value: 'default', // Changed from empty string to 'default'
      description: `${namespaces['']?.recordCount || 0} documents` 
    },
    ...Object.entries(namespaces)
      .filter(([ns]) => ns !== '') // Filter out empty string namespace
      .map(([ns, { recordCount }]) => ({
        label: ns,
        value: ns,
        description: `${recordCount} documents`
      }))
  ];

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/embeddings/docs${
        namespace === 'default' ? '' : namespace ? `?namespace=${namespace}` : ''
      }`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents);
      setNamespaces(data.namespaces);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [namespace]);

  const handleDeleteOne = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete document ${id}?`)) {
      try {
        await deleteDocument({ 
          id, 
          namespace: namespace || undefined 
        });
        await fetchDocuments();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm(`Are you sure you want to delete all documents${namespace ? ` in namespace ${namespace}` : ''}? This cannot be undone.`)) {
      try {
        await deleteManyDocuments({ 
          deleteAll: true,
          namespace: namespace || undefined 
        });
        await fetchDocuments();
      } catch (error) {
        console.error('Delete all failed:', error);
      }
    }
  };

  const renderDocumentCard = (doc: DocumentList) => {
    const preview = doc.metadata.text || 'No content available';
    const category = doc.metadata.category || 'Uncategorized';
    const section = doc.metadata.section || 'No section';
  
    return (
      <AccordionItem
        key={doc.id}
        aria-label={doc.id}
        className="bg-charyo-700/60 text-notpurple-500"
        title={
          <div className="flex justify-between items-center w-full px-2">
            <div className="flex items-center gap-2">
              <Chip 
                size="sm" 
                variant="flat"
                className="bg-charyo-500/60 text-notpurple-500"
              >
                {category}
              </Chip>
              <Chip 
                size="sm" 
                variant="flat"
                className="bg-charyo-700/60 text-notpurple-500/80"
              >
                {section}
              </Chip>
            </div>
            <span
              role="button"
              tabIndex={0}
              className="text-ualert-500 hover:text-ualert-600 cursor-pointer px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteOne(doc.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDeleteOne(doc.id);
                }
              }}
              aria-label={`Delete document ${doc.id}`}
            >
              Delete
            </span>
          </div>
        }
      >
        <div className="px-4 py-3 space-y-4">
          <div className="flex flex-col gap-2">
            <IDSnippet id={doc.id} label="Document ID" />
            <div className="flex gap-2 text-sm">
              <span className="text-notpurple-500/60">Created:</span>
              <span className="text-notpurple-500">
                {new Date(doc.metadata.created_at || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-notpurple-500/60">Content Preview</h4>
            <div className="bg-charyo-800/40 rounded-lg p-3">
              <p className="text-sm text-notpurple-500 whitespace-pre-wrap font-mono">
                {preview}
              </p>
            </div>
          </div>
  
          {doc.metadata.source && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-notpurple-500/60">Source</h4>
              <p className="text-sm text-notpurple-500">{doc.metadata.source}</p>
            </div>
          )}
        </div>
      </AccordionItem>
    );
  };

  const actions = [
    {
      label: deleting ? 'Deleting...' : 'Delete All Documents',
      onClick: handleDeleteAll,
      isDisabled: deleting,
      className: 'bg-ualert-500'
    }
  ];

  return (
    <Card className="bg-charyo-500/60 backdrop-blur-sm w-full">
      <CardHeader className="flex flex-col items-start">
        <h3 className="text-lg font-semibold text-notpurple-500">Document Management</h3>
        <p className="text-small text-notpurple-500/60">Manage your document embeddings</p>
      </CardHeader>
      <Divider />
      <CardBody className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Select
            label="Namespace"
            placeholder="Select namespace"
            selectedKeys={[namespace || 'default']}
            onChange={(e) => setNamespace(e.target.value)}
            className="md:max-w-xs"
            classNames={{
              trigger: "bg-charyo-700/60",
              value: "text-notpurple-500",
              label: "text-notpurple-500",
              listbox: "bg-charyo-700/60",
            }}
          >
            {namespaceOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-notpurple-500 data-[hover=true]:bg-charyo-600/60"
              >
                {option.label} ({option.description})
              </SelectItem>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner color="secondary" />
          </div>
        ) : documents.length > 0 ? (
          <Accordion 
            variant="bordered"
            className="max-h-[600px] overflow-y-auto bg-charyo-600/60"
          >
            {documents.map(renderDocumentCard)}
          </Accordion>
        ) : (
          <div className="text-center p-4 text-notpurple-500/60">
            No documents found in this namespace
          </div>
        )}

        {error && (
          <div className="p-4 rounded bg-ualert-500/20 text-ualert-500">
            {error}
          </div>
        )}

        <CardFooterWithActions actions={actions} />
      </CardBody>
    </Card>
  );
};

export default DocumentManager;