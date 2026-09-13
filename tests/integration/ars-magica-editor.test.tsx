import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ArsMagicaEditor } from '../../src/games/ars-magica-definitive/ArsMagicaEditor';
import { createArsCharacter } from '../../src/games/ars-magica-definitive/create-character';
import { MageDatabase } from '../../src/storage/mage-database';
import { DexieStoredCharacterRepository } from '../../src/storage/dexie-stored-character-repository';

describe('internal Ars Magica sheet', () => {
  let database: MageDatabase;
  afterEach(async () => {
    cleanup();
    await database?.delete();
  });
  it('autosaves identity through the repository and exposes its unfinished status', async () => {
    database = new MageDatabase(`ars-editor-${crypto.randomUUID()}`);
    const repository = new DexieStoredCharacterRepository(database);
    const character = createArsCharacter();
    const at = new Date().toISOString();
    const record = await repository.create({
      id: crypto.randomUUID(),
      systemId: 'ars-magica-definitive',
      systemVersion: 1,
      name: '',
      createdAt: at,
      updatedAt: at,
      data: character,
    });
    render(
      <ArsMagicaEditor
        character={character}
        record={record}
        repository={repository}
        onBack={vi.fn(async () => undefined)}
        onRecordChanged={vi.fn()}
      />,
    );
    expect(screen.getByText(/This is a manual character/)).toBeInTheDocument();
    expect(
      screen.getByRole('spinbutton', { name: 'Current year' }),
    ).toHaveValue(1220);
    expect(screen.getByRole('textbox', { name: 'Birth Name' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Armor worn' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Add weapon' })).toBeEnabled();
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Name' })[0], {
      target: { value: 'Test magus' },
    });
    await waitFor(async () =>
      expect((await repository.get(record.id))?.name).toBe('Test magus'),
    );
    expect((await repository.get(record.id))?.data).toMatchObject({
      definition: { name: 'Test magus' },
      creation: { status: 'manual', baseline: null },
    });
  });
});
