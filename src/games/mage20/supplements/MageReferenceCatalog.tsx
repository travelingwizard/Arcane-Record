import {
  ReferenceCatalog,
  type ReferenceCatalogEntry,
} from '../../../components/controls/ReferenceCatalog';
import { useMageSourceFilter } from './SourceControls';

export function MageReferenceCatalog<
  Entry extends ReferenceCatalogEntry,
>(props: {
  label: string;
  entries: readonly Entry[];
  selectedDefinitionIds: Set<string>;
  onAdd: (entry: Entry) => void;
  getMeta?: (entry: Entry) => string;
}) {
  const filter = useMageSourceFilter();
  return (
    <>
      {filter.controls}
      <ReferenceCatalog
        {...props}
        entries={props.entries.filter(filter.visible)}
        canAdd={filter.available}
      />
    </>
  );
}
