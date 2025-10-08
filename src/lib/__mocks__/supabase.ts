import { mockDeep, mockReset } from 'vitest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach } from 'vitest';

beforeEach(() => {
  mockReset(supabase);
});

const supabase = mockDeep<SupabaseClient>();
export { supabase };
