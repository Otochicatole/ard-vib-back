import { z } from 'zod';

export const registerDeviceSchema = z.object({
  id: z
    .string()
    .min(2, 'El identificador del dispositivo debe tener al menos 2 caracteres')
    .max(50, 'El identificador no puede superar los 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El id solo puede contener letras, números, guiones y guiones bajos'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  location: z.string().max(150).optional().nullable(),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
