import React from 'react';
import {
  DataViewerApp,
  ThemedDataViewer,
  useDataViewer,
  DataTable,
  SchemaView,
} from 'data-viewer';
import 'data-viewer/styles';

const ParquetApp: React.FC = () => {
  const data = useDataViewer('Parquet');
  const { schema, records, header, filteredRecords } = data;

  return (
    <DataViewerApp
      label="Parquet"
      data={data}
      schemaPanel={
        schema && (
          <SchemaView
            schema={schema}
            metadata={
              schema?.row_groups !== undefined
                ? { 'Row Groups': schema.row_groups }
                : undefined
            }
          />
        )
      }
      recordsPanel={
        <DataTable
          records={records}
          header={header}
          filteredRecords={filteredRecords}
          schema={schema}
          enablePreview={true}
        />
      }
    />
  );
};

const ThemeApp: React.FC = () => (
  <ThemedDataViewer>
    <ParquetApp />
  </ThemedDataViewer>
);

export default ThemeApp;
