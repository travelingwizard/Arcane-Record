import { z } from 'zod';

export const storedCharacterSchema = z.object({
  id: z.string().min(1),
  systemId: z.string().min(1),
  systemVersion: z.number().int().nonnegative(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  data: z.unknown(),
});

export type StoredCharacter = z.infer<typeof storedCharacterSchema>;

export type CharacterAvailability =
  | { status: 'available'; record: StoredCharacter }
  | {
      status: 'unavailable' | 'invalid';
      record: StoredCharacter;
      message: string;
    };
