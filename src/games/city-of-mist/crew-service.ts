import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import type { StoredCharacter } from '../../storage/stored-character';
import {
  CITY_OF_MIST_CREW_SYSTEM_ID,
  cityCrewSchema,
  createCityCrew,
  type CityCrew,
  type CityCrewBinding,
  type CityCharacter,
  cityCharacterSchema,
} from './schema';

export type ResolvedCityCrew =
  | { status: 'none' }
  | { status: 'available'; crew: CityCrew; record: StoredCharacter | null }
  | { status: 'unavailable'; crewId: string; reason: string };

/** Game-owned adapter; components never access IndexedDB. No cached shared copy. */
export class CityCrewService {
  constructor(private readonly repository: StoredCharacterRepository) {}

  /** Exported snapshots never silently reconnect to an ID in another browser. */
  async prepareExport(character: CityCharacter): Promise<CityCharacter> {
    if (character.crew.kind !== 'linked') return structuredClone(character);
    const result = await this.resolve(character.crew);
    if (result.status !== 'available')
      throw new Error(
        'The linked crew is unavailable. Restore it or explicitly unlink before exporting.',
      );
    return cityCharacterSchema.parse({
      ...character,
      crew: { kind: 'none' },
      crewTransfer: {
        sourceCrewId: character.crew.crewId,
        capturedAt: new Date().toISOString(),
        snapshot: structuredClone(result.crew),
      },
    });
  }

  async acceptTransfer(
    character: CityCharacter,
    choice: 'personal' | 'new' | 'link',
    crewId?: string,
  ): Promise<CityCharacter> {
    const transfer = character.crewTransfer;
    if (!transfer) throw new Error('There is no crew snapshot to review.');
    let crew: CityCrewBinding;
    if (choice === 'personal')
      crew = { kind: 'embedded', crew: structuredClone(transfer.snapshot) };
    else if (choice === 'link') crew = await this.link(crewId ?? '');
    else {
      const timestamp = new Date().toISOString();
      const record = await this.repository.create({
        id: crypto.randomUUID(),
        systemId: CITY_OF_MIST_CREW_SYSTEM_ID,
        systemVersion: transfer.snapshot.schemaVersion,
        name: transfer.snapshot.name,
        createdAt: timestamp,
        updatedAt: timestamp,
        data: structuredClone(transfer.snapshot),
      });
      crew = { kind: 'linked', crewId: record.id };
    }
    return cityCharacterSchema.parse({
      ...character,
      crew,
      crewTransfer: null,
    });
  }

  async references(crewId: string) {
    return (await this.repository.list()).filter((record) => {
      if (record.systemId !== 'city-of-mist') return false;
      const data = record.data as {
        crew?: { kind?: unknown; crewId?: unknown };
      } | null;
      return data?.crew?.kind === 'linked' && data.crew.crewId === crewId;
    });
  }

  async list() {
    const records = await this.repository.list();
    return records.filter(
      (record) => record.systemId === CITY_OF_MIST_CREW_SYSTEM_ID,
    );
  }

  async create(name: string) {
    const timestamp = new Date().toISOString();
    return this.repository.create({
      id: crypto.randomUUID(),
      systemId: CITY_OF_MIST_CREW_SYSTEM_ID,
      systemVersion: 2,
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      data: createCityCrew(name),
    });
  }

  async resolve(binding: CityCrewBinding): Promise<ResolvedCityCrew> {
    if (binding.kind === 'none') return { status: 'none' };
    if (binding.kind === 'embedded')
      return {
        status: 'available',
        crew: cityCrewSchema.parse(binding.crew),
        record: null,
      };
    const record = await this.repository.get(binding.crewId);
    if (!record || record.systemId !== CITY_OF_MIST_CREW_SYSTEM_ID) {
      return {
        status: 'unavailable',
        crewId: binding.crewId,
        reason: 'The linked crew is missing or is not a City of Mist crew.',
      };
    }
    if (![1, 2].includes(record.systemVersion))
      return {
        status: 'unavailable',
        crewId: binding.crewId,
        reason: 'This crew uses an unsupported schema version.',
      };
    const parsed = cityCrewSchema.safeParse(record.data);
    if (!parsed.success)
      return {
        status: 'unavailable',
        crewId: binding.crewId,
        reason: 'The linked crew needs data repair.',
      };
    return { status: 'available', crew: parsed.data, record };
  }

  async link(crewId: string): Promise<CityCrewBinding> {
    const binding = { kind: 'linked' as const, crewId };
    const result = await this.resolve(binding);
    if (result.status !== 'available')
      throw new Error('Choose an available City of Mist crew.');
    return binding;
  }

  /** Unlinking never deletes or modifies the shared crew. */
  async detach(binding: CityCrewBinding): Promise<CityCrewBinding> {
    const result = await this.resolve(binding);
    if (result.status !== 'available')
      throw new Error('The crew must be available to make a personal copy.');
    return { kind: 'embedded', crew: structuredClone(result.crew) };
  }
}
