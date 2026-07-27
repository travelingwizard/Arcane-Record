import { useRef, useState } from 'react';
import { SheetSection } from '../../components/layout/SheetSection';
import type { CharacterRepository } from '../../storage/character-repository';
import type { MageCharacter } from '../../types/character';
import {
  createCharacterFileName,
  prepareImportedCharacter,
  serializeCharacter,
  type CharacterFileFormat,
} from './character-files';

interface ImportExportSectionProps {
  character: MageCharacter;
  repository: CharacterRepository;
  onImported: (character: MageCharacter) => void;
}

export function ImportExportSection({
  character,
  repository,
  onImported,
}: ImportExportSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [format, setFormat] = useState<CharacterFileFormat>('json');

  const download = (format: CharacterFileFormat) => {
    const contents = serializeCharacter(character, format);
    const blob = new Blob([contents], {
      type:
        format === 'json'
          ? 'application/json;charset=utf-8'
          : 'application/yaml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = createCharacterFileName(character, format);
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${format.toUpperCase()} copy downloaded locally.`);
  };

  const importFile = async (file: File) => {
    setImporting(true);
    setMessage('');
    try {
      const imported = prepareImportedCharacter(await file.text(), file.name);
      await repository.create(imported);
      setMessage('Imported as a new browser-local character.');
      onImported(imported);
    } catch {
      setMessage(
        'Import failed. Choose a valid Arcane Ledger JSON or YAML character file.',
      );
    } finally {
      setImporting(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <SheetSection
      id="import-export"
      eyebrow="Portable, still private"
      title="Save"
      description="Download a local copy or import one as a new character. Files never leave this device."
    >
      <div className="file-exchange">
        <div className="file-exchange__group">
          <h3>Save this character</h3>
          <p>
            Save the complete validated character record in a readable local
            format.
          </p>
          <div className="file-exchange__actions">
            <label>
              <span>Format</span>
              <select
                aria-label="Save format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as CharacterFileFormat)
                }
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={() => download(format)}
            >
              Save {format.toUpperCase()}
            </button>
          </div>
        </div>

        <div className="file-exchange__group">
          <h3>Import a character copy</h3>
          <p>
            JSON and YAML files are validated before they can be saved in this
            browser.
          </p>
          <label className="file-picker">
            <span>{importing ? 'Importing…' : 'Choose character file'}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
              disabled={importing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void importFile(file);
                }
              }}
            />
          </label>
        </div>
      </div>
      {message ? (
        <p className="file-exchange__message" role="status">
          {message}
        </p>
      ) : null}
    </SheetSection>
  );
}
