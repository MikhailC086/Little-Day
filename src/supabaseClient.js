// Creates the Supabase client when config.js is filled in; otherwise null,
// and the app keeps using on-device storage (graceful fallback).
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const backendReady = () => supabase !== null;
