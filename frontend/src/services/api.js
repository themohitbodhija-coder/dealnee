import { usesSupabase } from '../lib/backend';
import { getSupabase } from '../lib/supabase';
import { createSupabaseApi } from './supabaseApi';
import * as legacy from './legacyApi';

const services = usesSupabase ? createSupabaseApi(getSupabase) : legacy;
export const { authService, propertyService, categoryService, inquiryService, adminService } = services;
