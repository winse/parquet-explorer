import React, { useEffect } from 'react';
import { Icon, Button, Tag, Section, SectionCard } from '@blueprintjs/core';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';

interface SchemaPanelProps {
  schema: any;
}

export const SchemaPanel: React.FC<SchemaPanelProps> = ({ schema }) => {
  const jsonSchema = schema ? JSON.stringify(schema, null, 2) : '{}';

  useEffect(() => { Prism.highlightAll(); }, [schema]);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(jsonSchema).then(() => {
      if (window.vscode) {
        window.vscode.postMessage({ type: 'showNotification', message: 'Schema copied to clipboard', level: 'info' });
      }
    });
  };

  const getColumnCount = () => {
    if (!schema) return 0;
    if (schema.children) return schema.children.length;
    return 0;
  };

  return (
    <Section
      title="Schema"
      icon={<Icon icon="document" size={14} />}
      rightElement={<Button minimal icon="duplicate" onClick={handleCopySchema} />}
      className="panel schema-section-container"
    >
      <SectionCard padded={false} className="panel-card schema-section-card">
        <div className="schema-content"><pre><code className="language-json">{jsonSchema}</code></pre></div>
      </SectionCard>
      <div className="panel-footer" style={{ flexShrink: 0 }}>
        <Tag>Columns: {getColumnCount()}</Tag>
        {schema?.row_groups !== undefined && <Tag>Row Groups: {schema.row_groups}</Tag>}
      </div>
    </Section>
  );
};
