import React, { useEffect, useState } from 'react';
import { Icon, Button, Tag, Section, SectionCard, Tooltip } from '@blueprintjs/core';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';

interface SchemaPanelProps {
  schema: any;
}

export const SchemaPanel: React.FC<SchemaPanelProps> = ({ schema }) => {
  const [viewMode, setViewMode] = useState<'fields' | 'json'>('fields');
  const jsonSchema = schema ? JSON.stringify(schema, null, 2) : '{}';
  const fields = Array.isArray(schema?.children) ? schema.children : [];

  useEffect(() => {
    if (viewMode === 'json') {
      Prism.highlightAll();
    }
  }, [schema, viewMode]);

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

  const getTypeTag = (
    type: string,
  ): {
    icon: 'citation' | 'numerical' | 'floating-point' | 'segmented-control' | 'calendar' | 'time' | 'binary-number' | 'array' | 'map' | 'curly-braces';
    tone: 'number' | 'date' | 'bool' | 'string' | 'complex';
  } => {
    const normalizedType = String(type || '').toLowerCase();
    if (normalizedType.includes('struct')) {
      return { icon: 'curly-braces', tone: 'complex' };
    }
    if (normalizedType.includes('map')) {
      return { icon: 'map', tone: 'complex' };
    }
    if (normalizedType.includes('array') || normalizedType.includes('list')) {
      return { icon: 'array', tone: 'complex' };
    }
    if (normalizedType.includes('binary')) {
      return { icon: 'binary-number', tone: 'number' };
    }
    if (normalizedType.includes('timestamp')) {
      return { icon: 'time', tone: 'date' };
    }
    if (normalizedType.includes('date')) {
      return { icon: 'calendar', tone: 'date' };
    }
    if (normalizedType.includes('bool')) {
      return { icon: 'segmented-control', tone: 'bool' };
    }
    if (normalizedType.includes('float') || normalizedType.includes('double') || normalizedType.includes('decimal')) {
      return { icon: 'floating-point', tone: 'number' };
    }
    if (
      normalizedType.includes('byte')
      || normalizedType.includes('short')
      || normalizedType.includes('int')
      || normalizedType.includes('long')
      || normalizedType.includes('uint')
    ) {
      return { icon: 'numerical', tone: 'number' };
    }
    return { icon: 'citation', tone: 'string' };
  };

  return (
    <Section
      title="Schema"
      icon={<Icon icon="document" size={14} />}
      rightElement={(
        <>
          <Button
            minimal
            icon={viewMode === 'fields' ? 'code' : 'list'}
            title={viewMode === 'fields' ? 'Switch to JSON view' : 'Switch to field list view'}
            onClick={() => setViewMode((mode) => (mode === 'fields' ? 'json' : 'fields'))}
          />
          <Button minimal icon="duplicate" onClick={handleCopySchema} />
        </>
      )}
      className="panel schema-section-container"
    >
      <SectionCard padded={false} className="panel-card schema-section-card">
        <div className="schema-content">
          {viewMode === 'fields' && fields.length > 0 ? (
            <div className="schema-field-list">
              {fields.map((field: any, index: number) => {
                const typeTag = getTypeTag(field?.type);
                return (
                  <div className="schema-field-row" key={`${field?.name || 'field'}-${index}`}>
                    <Tooltip content={field?.type || 'Unknown type'} placement="right">
                      <span className={`schema-field-type ${typeTag.tone}`}>
                        <Icon icon={typeTag.icon} size={12} />
                      </span>
                    </Tooltip>
                    <span className="schema-field-name">{field?.name || '(unnamed)'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre><code className="language-json">{jsonSchema}</code></pre>
          )}
        </div>
      </SectionCard>
      <div className="panel-footer" style={{ flexShrink: 0 }}>
        <Tag>Columns: {getColumnCount()}</Tag>
        {schema?.row_groups !== undefined && <Tag>Row Groups: {schema.row_groups}</Tag>}
      </div>
    </Section>
  );
};
