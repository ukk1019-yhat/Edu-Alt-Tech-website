import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ── Firebase-compatible User type ───────────────────────────────────────

export class FirebaseUserClass {
 uid: string;
 email: string | null;
 displayName: string | null;
 photoURL: string | null;
 emailVerified: boolean;
 metadata: any;

  isGoogleUser: boolean;

  constructor(su: SupabaseUser | null) {
  this.uid = su?.id || '';
  this.email = su?.email || null;
  this.displayName = su?.user_metadata?.display_name || su?.user_metadata?.full_name || null;
  this.photoURL = su?.user_metadata?.avatar_url || su?.user_metadata?.picture || null;
  this.emailVerified = su?.email_confirmed_at ? true : false;
  this.metadata = {};
  this.isGoogleUser = su?.app_metadata?.provider === 'google';
  }
}

export type User = FirebaseUserClass;

// ── Auth ─────────────────────────────────────────────────────────────────

type AuthCallback = (user: FirebaseUserClass | null) => void;

function createAuth() {
 const listeners = new Set<AuthCallback>();
 let current: FirebaseUserClass | null = null;

 supabase.auth.getUser().then(({ data }) => {
 current = data.user ? new FirebaseUserClass(data.user) : null;
 listeners.forEach(cb => cb(current));
 });

 supabase.auth.onAuthStateChange((_event, session) => {
 current = session?.user ? new FirebaseUserClass(session.user) : null;
 listeners.forEach(cb => cb(current));
 });

 return {
 get currentUser(): FirebaseUserClass | null { return current },
 onAuthStateChanged: (cb: AuthCallback) => {
 listeners.add(cb);
 if (current) cb(current);
 return () => { listeners.delete(cb) };
 },
 signOut: async () => { await supabase.auth.signOut() },
 };
}

export const auth = createAuth();

// ── Key conversion (camelCase ↔ snake_case) ─────────────────────────────

function camelToSnake(str: string): string {
 return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
 return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function convertKeys<T>(obj: T, converter: (s: string) => string): T {
 if (obj && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Blob) && !Array.isArray(obj)) {
 const entries = Object.entries(obj).map(([k, v]) => [converter(k), v]);
 return Object.fromEntries(entries);
 }
 return obj;
}

// ── Firestore compatibility ──────────────────────────────────────────────

type SupabaseFilter = { field: string; op: string; value: any };
type SupabaseOrder = { field: string; dir: 'asc' | 'desc' };

interface CollectionRef {
 type: 'collection';
 table: string;
 filters: SupabaseFilter[];
 orders: SupabaseOrder[];
 limitCount?: number;
}

interface DocRef {
 type: 'document';
 table: string;
 id: string;
 filters: SupabaseFilter[];
 orders: SupabaseOrder[];
 limitCount?: number;
}

interface WhereFilter { _field: string; _op: string; _value: any }
interface OrderFilter { _field: string; _dir?: 'asc' | 'desc' }
interface LimitFilter { _limit: number }

// ── Exported Firestore-like functions ────────────────────────────────────

export function collection(_db: any, path: string, ...rest: string[]): CollectionRef {
 const table = [path, ...rest].join('/');
 return { type: 'collection', table, filters: [], orders: [] };
}

export function doc(db: any, path?: string, ...pathSegments: string[]): DocRef {
 // doc(collectionRef) - auto-generate ID
 if (arguments.length === 1 && db?.type === 'collection') {
 return { type: 'document', table: db.table, id: crypto.randomUUID(), filters: [], orders: [] };
 }
 // doc(db, 'collection/id')
 if (arguments.length === 2 && path && path.includes('/')) {
 const parts = path.split('/');
 const id = parts[parts.length - 1];
 const table = parts.slice(0, -1).join('/');
 return { type: 'document', table, id: id!, filters: [], orders: [] };
  }
  // doc(db, 'collection', 'id') or doc(db, 'collection', 'sub', 'id')
  let table = path!;
  let id: string;
  if (pathSegments.length >= 2) {
  id = pathSegments[pathSegments.length - 1]!;
 table = [path, ...pathSegments.slice(0, -1)].join('/');
 } else {
 id = pathSegments[0] || '';
 }
 return { type: 'document', table, id, filters: [], orders: [] };
}

export async function getDoc(ref: DocRef): Promise<{ data: () => any; exists: () => boolean; id: string }> {
 const { data, error } = await supabase.from(ref.table).select('*').eq('id', ref.id).maybeSingle();
 if (error || !data) return { data: () => null, exists: () => false, id: ref.id };
 const camelData = convertKeys(data, snakeToCamel);
 return { data: () => camelData, exists: () => true, id: data.id || ref.id };
}

export async function getDocs(ref: CollectionRef | DocRef): Promise<{
 docs: { data: () => any; id: string }[];
 forEach: (cb: (d: any) => void) => void;
 empty: boolean;
 size: number;
}> {
 if (ref.type === 'document') {
 const snap = await getDoc(ref as DocRef);
 const docs = snap.exists() ? [{ data: () => snap.data(), id: snap.id }] : [];
 return { docs, forEach: (cb: any) => docs.forEach(cb), empty: docs.length === 0, size: docs.length };
 }

 let query = supabase.from(ref.table).select('*');
 for (const f of ref.filters || []) {
 const field = camelToSnake(f.field);
 if (f.op === '==') query = query.eq(field, f.value);
 else if (f.op === '>') query = query.gt(field, f.value);
 else if (f.op === '>=') query = query.gte(field, f.value);
 else if (f.op === '<') query = query.lt(field, f.value);
 else if (f.op === '<=') query = query.lte(field, f.value);
 else if (f.op === '!=') query = query.neq(field, f.value);
 else if (f.op === 'in') query = query.in(field, f.value);
 else if (f.op === 'array-contains') query = query.contains(field, f.value);
 }
 for (const o of ref.orders || []) {
 query = query.order(camelToSnake(o.field), { ascending: o.dir !== 'desc' });
 }
 if (ref.limitCount) query = query.limit(ref.limitCount);

 const { data, error: _error } = await query;
 const docs = (data || []).map((d: any) => ({ data: () => convertKeys(d, snakeToCamel), id: d.id }));
 return { docs, forEach: (cb: any) => docs.forEach(cb), empty: docs.length === 0, size: docs.length };
}

export async function addDoc(ref: CollectionRef, data: any): Promise<{ id: string }> {
 const snakeData = convertKeys(data, camelToSnake);
 const { data: inserted, error } = await supabase.from(ref.table).insert(snakeData).select('id').single();
 if (error) throw new Error(`addDoc failed: ${error.message}`);
 return { id: inserted?.id };
}

export async function setDoc(ref: DocRef, data: any, options?: { merge?: boolean }): Promise<void> {
  const snakeData = convertKeys(data, camelToSnake);
  if (options?.merge) {
    const { data: existing } = await supabase.from(ref.table).select('*').eq('id', ref.id).maybeSingle();
    if (existing) {
      const merged = { ...existing, ...snakeData };
      const { error } = await supabase.from(ref.table).upsert({ id: ref.id, ...merged }, { onConflict: 'id' });
      if (error) throw new Error(`setDoc failed: ${error.message}`);
      return;
    }
  }
  const { error } = await supabase.from(ref.table).upsert({ id: ref.id, ...snakeData }, { onConflict: 'id' });
  if (error) throw new Error(`setDoc failed: ${error.message}`);
}

export async function updateDoc(ref: DocRef, data: any): Promise<void> {
  const snakeData: Record<string, any> = {};
  const increments: Record<string, number> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object' && INCREMENT_MARKER in val) {
      increments[camelToSnake(key)] = (val as any)[INCREMENT_MARKER];
    } else {
      snakeData[camelToSnake(key)] = val;
    }
  }

  if (Object.keys(increments).length > 0) {
    for (const [field, amount] of Object.entries(increments)) {
      const { error } = await supabase.rpc('increment_field', { table_name: ref.table, row_id: ref.id, field_name: field, amount });
      if (error) {
        const { data: current } = await supabase.from(ref.table).select(field).eq('id', ref.id).maybeSingle();
        const newVal = ((current as any)?.[field] || 0) + amount;
        const { error: updateErr } = await supabase.from(ref.table).update({ [field]: newVal }).eq('id', ref.id);
        if (updateErr) throw new Error(`updateDoc increment failed: ${updateErr.message}`);
      }
    }
  }

  if (Object.keys(snakeData).length > 0) {
    const { error, count } = await (supabase.from(ref.table).update(snakeData).eq('id', ref.id) as any).select('id', { count: 'exact', head: true });
    if (error) throw new Error(`updateDoc failed: ${error.message}`);
    if (count === 0) throw new Error(`updateDoc failed: no rows matched (RLS or missing doc)`);
  }
}

export async function deleteDoc(ref: DocRef): Promise<void> {
 const { error } = await supabase.from(ref.table).delete().eq('id', ref.id);
 if (error) throw new Error(`deleteDoc failed: ${error.message}`);
}

export function query(ref: CollectionRef, ...filters: any[]): CollectionRef {
 const newFilters: SupabaseFilter[] = [];
 const newOrders: SupabaseOrder[] = [];
 let limitCount: number | undefined;

 for (const f of filters) {
 if (f._field !== undefined && f._op !== undefined) {
 newFilters.push({ field: f._field, op: f._op, value: f._value });
 } else if (f._field !== undefined && f._dir !== undefined) {
 newOrders.push({ field: f._field, dir: f._dir });
 } else if (f._field !== undefined) {
 newOrders.push({ field: f._field, dir: 'asc' });
 } else if (f._limit !== undefined) {
 limitCount = f._limit;
 }
 }

 return {
 type: 'collection',
 table: ref.table,
 filters: [...(ref.filters || []), ...newFilters],
 orders: [...(ref.orders || []), ...newOrders],
 limitCount: limitCount ?? ref.limitCount,
 };
}

export function where(field: string, op: string, value: any): WhereFilter {
 return { _field: field, _op: op, _value: value };
}

export function orderBy(field: string, dir?: 'asc' | 'desc'): OrderFilter {
 return { _field: field, _dir: dir };
}

export function limit(n: number): LimitFilter {
 return { _limit: n };
}

export function serverTimestamp(): string {
 return new Date().toISOString();
}

const INCREMENT_MARKER = '__increment__';
export function increment(n: number): Record<string, number | string> {
  return { [INCREMENT_MARKER]: n };
}

export function arrayUnion(...items: any[]): any[] {
  return items; // Handled via Supabase RPC in updateDoc
}

export function arrayRemove(...items: any[]): any[] {
  return items; // Handled via Supabase RPC in updateDoc
}

// ── Realtime subscriptions (onSnapshot) ──────────────────────────────────

export function onSnapshot(
 ref: DocRef | CollectionRef,
 onNext: (snapshot: any) => void,
 onError?: (error: any) => void
): () => void {
 const table = ref.type === 'document' ? ref.table : ref.table;
 const channel = supabase.channel(`snapshot-${table}-${Date.now()}-${Math.random()}`);

 channel.on(
 'postgres_changes',
 { event: '*', schema: 'public', table },
 async () => {
 try {
 const snap = ref.type === 'document'
 ? await getDoc(ref as DocRef)
 : await getDocs(ref);
 onNext(snap);
 } catch (e) {
 onError?.(e);
 }
 }
 ).subscribe();

 (async () => {
 try {
 const snap = ref.type === 'document'
 ? await getDoc(ref as DocRef)
 : await getDocs(ref);
 onNext(snap);
 } catch (e) {
 onError?.(e);
 }
 })();

 return () => {
 supabase.removeChannel(channel);
 };
}

// ── Firebase Auth compatibility ──────────────────────────────────────────

export function onAuthStateChanged(_authObj: any, cb: AuthCallback): () => void {
 return auth.onAuthStateChanged(cb);
}

export async function signInWithEmailAndPassword(_authObj: any, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user ? new FirebaseUserClass(data.user) : null };
}

export async function createUserWithEmailAndPassword(_authObj: any, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user ? new FirebaseUserClass(data.user) : null };
}

export async function signOut(_authObj: any): Promise<void> {
 await supabase.auth.signOut();
}

export class GoogleAuthProvider {
 static PROVIDER_ID = 'google';
 constructor() {}
}

export async function signInWithPopup(_authObj: any, _provider: any): Promise<{ user: FirebaseUserClass | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin },
  });
  // On success, Supabase redirects the browser to Google.
  // After the OAuth flow completes, the browser returns to redirectTo.
  // At that point, the auth listener in createAuth() picks up the session.
  if (error) throw error;
  return { user: null };
}

export async function sendPasswordResetEmail(_authObj: any, email: string): Promise<void> {
 const { error } = await supabase.auth.resetPasswordForEmail(email);
 if (error) throw error;
}

export async function updateProfile(user: any, profile: { displayName?: string; photoURL?: string }): Promise<void> {
  const updates: any = {};
  if (profile.displayName) updates.display_name = profile.displayName;
  if (profile.photoURL) updates.avatar_url = profile.photoURL;
  const { error } = await supabase.auth.updateUser({ data: updates });
  if (error) throw error;
  if (user?.uid) {
    const syncData: any = {};
    if (profile.displayName) syncData.name = profile.displayName;
    if (profile.photoURL) syncData.profile_pic = profile.photoURL;
    await supabase.from('users').update(syncData).eq('id', user.uid);
  }
}

export async function sendEmailVerification(_user?: any): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: _user?.email || '', options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export const EmailAuthProvider = {
 credential: (email: string, password: string) => ({ email, password }),
};

export async function reauthenticateWithCredential(_user: any, credential: any): Promise<void> {
  if (credential?.email && credential?.password) {
    const { error } = await supabase.auth.signInWithPassword({ email: credential.email, password: credential.password });
    if (error) throw error;
  } else {
    const { error } = await supabase.auth.reauthenticate();
    if (error) throw error;
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
 const { error } = await supabase.auth.updateUser({ password: newPassword });
 if (error) throw error;
}

// ── Storage compatibility ────────────────────────────────────────────────

function createStorage() {
 return {
 bucket: 'public',
 ref: (path: string) => ({ path, bucket: 'public' }),
 };
}

export const storage = createStorage();

export function ref(storageObj: any, path: string): { path: string; bucket: string } {
 if (typeof storageObj === 'string') return { path: storageObj, bucket: 'public' };
 return { path, bucket: storageObj.bucket || 'public' };
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/csv', 'application/json'];
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadBytes(storageRef: { path: string; bucket: string }, file: File | Blob): Promise<{ ref: any }> {
 if (file instanceof File) {
   if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
     throw new Error(`File type "${file.type}" is not allowed.`);
   }
   if (file.size > MAX_UPLOAD_SIZE) {
     throw new Error(`File exceeds the maximum size of 5 MB.`);
   }
 }
 const path = storageRef.path.startsWith('/') ? storageRef.path.slice(1) : storageRef.path;
 const { error } = await supabase.storage.from(storageRef.bucket).upload(path, file, { upsert: true });
 if (error) throw new Error(`Upload failed: ${error.message}`);
 return { ref: storageRef };
}

export async function getDownloadURL(storageRef: { path: string; bucket: string }): Promise<string> {
 const path = storageRef.path.startsWith('/') ? storageRef.path.slice(1) : storageRef.path;
 const { data } = supabase.storage.from(storageRef.bucket).getPublicUrl(path);
 return data.publicUrl;
}

// ── RPC helpers (bypass RLS via SECURITY DEFINER) ────────────────────────

export async function createEnrollment(enrollment: {
 id: string;
 userId: string;
 courseId: string;
 role?: string;
 studentStatus?: string;
}): Promise<void> {
 const { error } = await supabase.rpc('create_enrollment', {
 p_id: enrollment.id,
 p_user_id: enrollment.userId,
 p_course_id: enrollment.courseId,
 p_role: enrollment.role || 'teacher',
 p_student_status: enrollment.studentStatus || 'active',
 });
 if (error) throw new Error(`createEnrollment failed: ${error.message}`);
}

// ── Bare db export (for any direct supabase access) ──────────────────────

export const db = supabase;
