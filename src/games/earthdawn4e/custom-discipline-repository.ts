import { z } from 'zod';

const tierSchema = z.object({
  talents: z.string(),
  optionalTalents: z.string(),
  abilities: z.string(),
  spells: z.string(),
});

export const customDisciplineDraftSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  summary: z.string(),
  sourceNotes: z.string(),
  karmaPermissions: z.string(),
  tiers: z.object({
    novice: tierSchema,
    journeyman: tierSchema,
    warden: tierSchema,
    master: tierSchema,
  }),
  status: z.literal('draft'),
  updatedAt: z.string().datetime(),
});

export type CustomDisciplineDraft = z.infer<typeof customDisciplineDraftSchema>;

const storageKey = 'arcane-record:earthdawn4e:custom-disciplines:v1';

export class CustomDisciplineRepository {
  list(): CustomDisciplineDraft[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      return z
        .array(customDisciplineDraftSchema)
        .parse(JSON.parse(localStorage.getItem(storageKey) ?? '[]'));
    } catch {
      return [];
    }
  }

  save(draft: CustomDisciplineDraft) {
    const parsed = customDisciplineDraftSchema.parse(draft);
    const next = [...this.list().filter(({ id }) => id !== parsed.id), parsed];
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('arcane-record:custom-disciplines'));
    return parsed;
  }

  remove(id: string) {
    localStorage.setItem(
      storageKey,
      JSON.stringify(this.list().filter((draft) => draft.id !== id)),
    );
    window.dispatchEvent(new CustomEvent('arcane-record:custom-disciplines'));
  }
}

export const customDisciplineRepository = new CustomDisciplineRepository();

export function createCustomDisciplineDraft(): CustomDisciplineDraft {
  const tier = () => ({
    talents: '',
    optionalTalents: '',
    abilities: '',
    spells: '',
  });
  return {
    id: crypto.randomUUID(),
    name: '',
    summary: '',
    sourceNotes: '',
    karmaPermissions: '',
    tiers: {
      novice: tier(),
      journeyman: tier(),
      warden: tier(),
      master: tier(),
    },
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
}
