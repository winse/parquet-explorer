import React, { useState } from 'react';
import { Button, ButtonGroup, Icon, Navbar, NonIdealState, Spinner, Tag, Divider, ProgressBar } from '@blueprintjs/core';
import { SchemaPanel } from './components/SchemaPanel';
import { RecordsPanel } from './components/RecordsPanel';
import { useParquetData } from './hooks/useParquetData';
import { useIsDarkTheme } from './hooks/useTheme';
import './App.scss';

const ParquetApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<'both' | 'schema' | 'records'>('both');
  const [leftWidth, setLeftWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const { schema, records, header, loading, error, progress, total, filteredRecords } = useParquetData();

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 15 && newWidth < 85) setLeftWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = React.useCallback(() => { setIsResizing(false); }, []);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleExport = (format: 'csv' | 'json') => {
    if (window.vscode) {
      window.vscode.postMessage({ type: format === 'csv' ? 'exportCSV' : 'exportJSON', data: filteredRecords });
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner size={50} />
        <div className="loading-text">Loading Parquet data...</div>
        {progress > 0 && progress < total && (
          <ProgressBar
            value={total > 0 ? progress / total : 0}
            intent="primary"
            stripes={false}
          />
        )}
        <Tag minimal>{progress} / {total}</Tag>
      </div>
    );
  }

  if (error) {
    return <NonIdealState icon="error" title="Error Loading Parquet File" description={error} />;
  }

  if (!schema && !records.length) {
    return <NonIdealState icon="search" title="No Data" description="No Parquet data found in this file." />;
  }

  return (
    <div className="app-container" style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}>
      <Navbar className="app-navbar">
        <Navbar.Group align="left">
          <ButtonGroup minimal>
            <Button icon="exchange" active={viewMode === 'both'} onClick={() => setViewMode('both')} title="Split View" />
            <Button icon="document" active={viewMode === 'schema'} onClick={() => setViewMode('schema')} title="Schema ONLY" />
            <Button icon="th" active={viewMode === 'records'} onClick={() => setViewMode('records')} title="Records ONLY" />
          </ButtonGroup>
        </Navbar.Group>
        <Navbar.Group align="right">
          <ButtonGroup minimal>
            <Button icon="export" intent="primary" onClick={() => handleExport('csv')}>CSV</Button>
            <Button icon="code" intent="primary" onClick={() => handleExport('json')}>JSON</Button>
          </ButtonGroup>
        </Navbar.Group>
      </Navbar>
      <div className={`main-content mode-${viewMode}`}>
        {(viewMode === 'both' || viewMode === 'schema') && <div className="panel schema-section">{schema && <SchemaPanel schema={schema} />}</div>}
        {viewMode === 'both' && <Divider className={`resize-divider ${isResizing ? 'is-resizing' : ''}`} onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }} />}
        {(viewMode === 'both' || viewMode === 'records') && <div className="panel records-section"><RecordsPanel records={records} header={header} filteredRecords={filteredRecords} /></div>}
      </div>
    </div>
  );
};

const ThemeApp: React.FC = () => {
  const isDark = useIsDarkTheme();
  return <div className={isDark ? 'bp6-dark' : ''}><ParquetApp /></div>;
};

export default ThemeApp;
