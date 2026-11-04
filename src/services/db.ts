import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client, Equipment, Technician, ServiceOrder, ServiceOrderImage, DashboardMetrics, Schedule, Report, ReportCategory } from '../types';

const STORAGE_KEY_CLIENTS = 'termoluc_clients_v4';
const STORAGE_KEY_EQUIPMENT = 'termoluc_equipment_v4';
const STORAGE_KEY_TECHNICIANS = 'termoluc_technicians_v4';
const STORAGE_KEY_ORDERS = 'termoluc_service_orders_v4';
const STORAGE_KEY_ORDER_IMAGES = 'termoluc_order_images_v4';
const STORAGE_KEY_SCHEDULES = 'termoluc_schedules_v1';
const STORAGE_KEY_REPORTS = 'termoluc_reports_v1';
const STORAGE_KEY_TECH_PASSWORDS = 'termoluc_tech_passwords_v1';

// BroadcastChannel para sincronização rápida local
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('termoluc_sync_channel')
  : null;

// Empacota múltiplos endereços para garantir persistência mesmo se as colunas address_2 / address_3 não existirem no Supabase
export function packNotesWithAddresses(notes: string | null | undefined, addr2?: string | null, addr3?: string | null): string | null {
  const cleanNotes = (notes || '').replace(/<!--TERMOLUC_ADDR:.*?-->/gs, '').trim();
  const cleanAddr2 = (addr2 || '').trim();
  const cleanAddr3 = (addr3 || '').trim();

  if (!cleanAddr2 && !cleanAddr3) {
    return cleanNotes || null;
  }

  const meta = JSON.stringify({
    address_2: cleanAddr2 || undefined,
    address_3: cleanAddr3 || undefined,
  });

  const tag = `<!--TERMOLUC_ADDR:${meta}-->`;
  return cleanNotes ? `${cleanNotes}\n${tag}` : tag;
}

// Desempacota endereços salvos em notes caso as colunas nativas ainda não estejam preenchidas
export function unpackClientAddresses(client: any): Client {
  if (!client) return client;
  let address_2 = client.address_2 || '';
  let address_3 = client.address_3 || '';
  let notes = client.notes || '';

  // 1. Tenta extrair da tag structured JSON <!--TERMOLUC_ADDR:{...}-->
  if (notes && notes.includes('<!--TERMOLUC_ADDR:')) {
    const match = notes.match(/<!--TERMOLUC_ADDR:(.*?)-->/s);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (!address_2 && parsed.address_2) address_2 = parsed.address_2;
        if (!address_3 && parsed.address_3) address_3 = parsed.address_3;
      } catch {
        // Fallback silencioso
      }
    }
    notes = notes.replace(/<!--TERMOLUC_ADDR:.*?-->/gs, '').trim();
  }

  // 2. Tenta extrair de formato legado ("Endereço 2: ...")
  if (!address_2 && notes && notes.includes('Endereço 2:')) {
    const lines = notes.split('\n');
    const remainingLines: string[] = [];
    for (const line of lines) {
      if (line.trim().startsWith('Endereço 2:')) {
        address_2 = line.replace('Endereço 2:', '').trim();
      } else if (line.trim().startsWith('Endereço 3:')) {
        address_3 = line.replace('Endereço 3:', '').trim();
      } else {
        remainingLines.push(line);
      }
    }
    notes = remainingLines.join('\n').trim();
  }

  return {
    ...client,
    address_2: address_2 || undefined,
    address_3: address_3 || undefined,
    notes: notes || undefined,
  };
}

// Gerenciamento de Senhas dos Técnicos
export function getStoredTechPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TECH_PASSWORDS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setStoredTechPassword(identifier: string, pass: string): void {
  if (typeof window === 'undefined') return;
  const map = getStoredTechPasswords();
  map[identifier.toLowerCase().trim()] = pass;
  localStorage.setItem(STORAGE_KEY_TECH_PASSWORDS, JSON.stringify(map));
}

export async function getTechnicianPassword(techId: string, email?: string): Promise<string> {
  const map = getStoredTechPasswords();
  if (map[techId.toLowerCase()]) return map[techId.toLowerCase()];
  if (email && map[email.toLowerCase().trim()]) return map[email.toLowerCase().trim()];
  return '123456';
}

export async function updateTechnicianPassword(techId: string, newPassword: string, email?: string): Promise<void> {
  const cleanPass = newPassword.trim();
  if (!cleanPass) throw new Error('A senha não pode estar em branco.');

  // 1. Salva no cache local
  setStoredTechPassword(techId, cleanPass);
  if (email) {
    setStoredTechPassword(email, cleanPass);
  }

  // 2. Atualiza no Supabase se configurado
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ password: cleanPass })
        .eq('id', techId);

      if (error && error.code !== '42703') {
        console.warn('Aviso ao persistir senha no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro de rede ao atualizar senha no Supabase:', err);
    }
  }

  // 3. Atualiza na lista local de técnicos
  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  const idx = techs.findIndex(t => t.id === techId);
  if (idx !== -1) {
    techs[idx] = { ...techs[idx], password: cleanPass };
    setStored(STORAGE_KEY_TECHNICIANS, techs);
  }

  notifyDataChange('technicians');
}

export function notifyDataChange(entity: string) {
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DATA_CHANGED', entity, timestamp: Date.now() });
  }
}

// Sincronização em tempo real entre diferentes computadores via Supabase Realtime + Local
export function subscribeToDataChanges(callback: (entity: string) => void) {
  const cleanups: (() => void)[] = [];

  // 1. Escuta local entre abas
  if (syncChannel) {
    const localHandler = (event: MessageEvent) => {
      if (event.data?.type === 'DATA_CHANGED') {
        callback(event.data.entity);
      }
    };
    syncChannel.addEventListener('message', localHandler);
    cleanups.push(() => syncChannel.removeEventListener('message', localHandler));
  }

  // 2. Escuta nuvem em tempo real (Supabase Realtime WebSockets entre diferentes computadores)
  if (isSupabaseConfigured && supabase) {
    try {
      const channel = supabase
        .channel(`termoluc_realtime_${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            notifyDataChange(payload.table || 'all');
            callback(payload.table || 'all');
          }
        )
        .subscribe();

      cleanups.push(() => {
        supabase?.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Realtime subscription fallback:', err);
    }
  }

  return () => {
    cleanups.forEach(fn => fn());
  };
}

// -------------------------------------------------------------
// DADOS OFICIAIS TERMOLUC
// -------------------------------------------------------------
const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Alessandro Araújo',
    phone: '(11) 98765-4321',
    email: 'alessandro@termoluc.com.br',
    specialty: 'Refrigeração e Climatização',
    active: true,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'tech-2',
    name: 'Carlos Alberto',
    phone: '(11) 97654-3210',
    email: 'carlos@termoluc.com.br',
    specialty: 'Sistemas VRF e Splits',
    active: true,
    created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
  },
  {
    id: 'tech-3',
    name: 'Marquinhos',
    phone: '(11) 96543-2109',
    email: 'marquinhos@termoluc.com.br',
    specialty: 'Câmaras Frigoríficas e Manutenção',
    active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  }
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-ana-holk',
    name: 'Ana Holk',
    document: '',
    phone: 'n tem',
    email: 'ana.holk@email.com',
    address: 'Avenida Borges de Medeiros 3407/401',
    notes: '',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'client-dona-jurema',
    name: 'Dona Jurema',
    document: '2323322323',
    phone: '2323322323',
    email: 'teste@outlook.com',
    address: 'Madureira',
    notes: '',
    created_by: 'Alesandro',
    created_at: '2026-08-26T14:00:00.000Z',
  },
  {
    id: 'client-flavia',
    name: 'Flavia',
    document: '',
    phone: '324342343',
    email: 'flavia@email.com',
    address: 'Ipanema',
    notes: '',
    created_by: 'Alesandro',
    created_at: '2026-08-26T11:00:00.000Z',
  },
  {
    id: 'client-luis-pessoa',
    name: 'Luis Pessoa',
    document: '',
    phone: '32232323',
    email: 'luis.pessoa@email.com',
    address: 'Ipanema',
    notes: '',
    created_by: 'Alesandro',
    created_at: '2026-09-01T15:00:00.000Z',
  }
];

const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'equip-ana-1',
    client_id: 'client-ana-holk',
    client_ids: ['client-ana-holk'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CARRIER',
    model: 'n sei',
    address: 'Avenida Borges de Medeiros 3407/401',
    installation_location: 'Sala dutado',
    installation_date: '2026-09-01',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:05:00.000Z',
  },
  {
    id: 'equip-ana-2',
    client_id: 'client-ana-holk',
    client_ids: ['client-ana-holk'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CARRIER',
    model: 'n sei',
    address: 'Avenida Borges de Medeiros 3407/401',
    installation_location: 'Sala TV',
    installation_date: '2026-09-01',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:10:00.000Z',
  },
  {
    id: 'equip-ana-3',
    client_id: 'client-ana-holk',
    client_ids: ['client-ana-holk'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CARRIER',
    model: 'n sei',
    address: 'Avenida Borges de Medeiros 3407/401',
    installation_location: 'Suite',
    installation_date: '2026-09-01',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:15:00.000Z',
  },
  {
    id: 'equip-ana-4',
    client_id: 'client-ana-holk',
    client_ids: ['client-ana-holk'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CARRIER',
    model: 'n sei',
    address: 'Avenida Borges de Medeiros 3407/401',
    installation_location: 'Quarto 2',
    installation_date: '2026-09-01',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:20:00.000Z',
  },
  {
    id: 'equip-ana-5',
    client_id: 'client-ana-holk',
    client_ids: ['client-ana-holk'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CARRIER',
    model: 'n sei',
    address: 'Avenida Borges de Medeiros 3407/401',
    installation_location: 'Quarto 1',
    installation_date: '2026-09-01',
    created_by: 'Alesandro',
    created_at: '2026-09-01T10:25:00.000Z',
  },
  {
    id: 'equip-flavia-1',
    client_id: 'client-flavia',
    client_ids: ['client-flavia'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'SEI LA',
    model: 'teste',
    address: 'Ipanema',
    installation_date: '2026-08-26',
    created_by: 'Alesandro',
    created_at: '2026-08-26T11:30:00.000Z',
  },
  {
    id: 'equip-jurema-1',
    client_id: 'client-dona-jurema',
    client_ids: ['client-dona-jurema'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'CONSUL',
    model: 'air master',
    address: 'Madureira',
    installation_location: 'quarto',
    installation_date: '2026-08-26',
    created_by: 'Alesandro',
    created_at: '2026-08-26T14:15:00.000Z',
  },
  {
    id: 'equip-jurema-2',
    client_id: 'client-dona-jurema',
    client_ids: ['client-dona-jurema'],
    type: 'Ar-condicionado Split Hi-Wall',
    brand: 'SPRING 30K',
    model: 'samsung',
    address: 'Madureira',
    installation_location: 'sala',
    installation_date: '2026-08-26',
    created_by: 'Alesandro',
    created_at: '2026-08-26T14:20:00.000Z',
  }
];

const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [];
const INITIAL_ORDER_IMAGES: ServiceOrderImage[] = [];

// Funções de Inicialização e Leitura/Escrita Local
function getStored<T>(key: string, initial: T[]): T[] {
  if (typeof window === 'undefined') return initial;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// -------------------------------------------------------------
// CLIENTS API (Cloud-First com Supabase)
// -------------------------------------------------------------
export async function getClients(): Promise<Client[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        const unpackedData = data.map(unpackClientAddresses);
        if (unpackedData.length > 0) {
          setStored(STORAGE_KEY_CLIENTS, unpackedData);
          return unpackedData;
        } else {
          // Se Supabase estiver vazio, sincroniza automaticamente os clientes iniciais
          await syncInitialSeedToSupabase();
          const { data: seeded } = await supabase.from('clients').select('*').order('name', { ascending: true });
          if (seeded && seeded.length > 0) {
            const unpackedSeeded = seeded.map(unpackClientAddresses);
            setStored(STORAGE_KEY_CLIENTS, unpackedSeeded);
            return unpackedSeeded;
          }
        }
      } else if (error) {
        console.error('Erro ao buscar clientes no Supabase:', error);
      }
    } catch (err) {
      console.error('Falha de conexão com Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS).map(unpackClientAddresses);
  return clients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClientById(id: string): Promise<Client | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return unpackClientAddresses(data);
    } catch {
      // Fallback
    }
  }
  const clients = await getClients();
  return clients.find(c => c.id === id) || null;
}

export async function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const created_by = clientData.created_by || 'Alesandro';
  const name = (clientData.name || '').trim();
  const phone = (clientData.phone || '').trim();
  const email = (clientData.email || '').trim();
  const address = (clientData.address || '').trim();
  const address_2 = clientData.address_2 ? clientData.address_2.trim() : null;
  const address_3 = clientData.address_3 ? clientData.address_3.trim() : null;
  const document = clientData.document ? clientData.document.trim() : null;
  const rawNotes = clientData.notes ? clientData.notes.trim() : null;
  const packedNotes = packNotesWithAddresses(rawNotes, address_2, address_3);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Tenta inserir com as colunas nativas caso existam
      let insertRes = await supabase
        .from('clients')
        .insert([{
          name,
          document,
          phone,
          email,
          address,
          address_2,
          address_3,
          notes: rawNotes,
          image_url: clientData.image_url || null,
          created_by,
        }])
        .select()
        .single();

      // 2. Se as colunas não existirem ainda no Supabase (código 42703), salva com fallback empacotado em notes
      if (insertRes.error && (insertRes.error.code === '42703' || insertRes.error.message?.includes('address_2') || insertRes.error.message?.includes('created_by'))) {
        insertRes = await supabase
          .from('clients')
          .insert([{
            name,
            document,
            phone,
            email,
            address,
            notes: packedNotes,
            image_url: clientData.image_url || null,
          }])
          .select()
          .single();
      }

      if (!insertRes.error && insertRes.data) {
        notifyDataChange('clients');
        const unpacked = unpackClientAddresses({
          ...insertRes.data,
          address_2: address_2 || insertRes.data.address_2,
          address_3: address_3 || insertRes.data.address_3,
          created_by: created_by || insertRes.data.created_by,
        });
        const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS).map(unpackClientAddresses);
        clients.unshift(unpacked);
        setStored(STORAGE_KEY_CLIENTS, clients);
        return unpacked;
      } else if (insertRes.error) {
        console.error('Erro no Supabase ao inserir cliente:', insertRes.error);
      }
    } catch (err) {
      console.error('Erro de rede ao salvar cliente no Supabase:', err);
    }
  }

  const fallbackId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newClient: Client = {
    ...clientData,
    name,
    phone,
    email,
    address,
    address_2: address_2 || undefined,
    address_3: address_3 || undefined,
    id: fallbackId,
    created_by,
    created_at: new Date().toISOString(),
  };

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS).map(unpackClientAddresses);
  clients.unshift(newClient);
  setStored(STORAGE_KEY_CLIENTS, clients);
  notifyDataChange('clients');
  return newClient;
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const updated_at = new Date().toISOString();
  const name = updates.name !== undefined ? updates.name.trim() : undefined;
  const phone = updates.phone !== undefined ? updates.phone.trim() : undefined;
  const email = updates.email !== undefined ? updates.email.trim() : undefined;
  const address = updates.address !== undefined ? updates.address.trim() : undefined;
  const address_2 = updates.address_2 !== undefined ? (updates.address_2 ? updates.address_2.trim() : null) : undefined;
  const address_3 = updates.address_3 !== undefined ? (updates.address_3 ? updates.address_3.trim() : null) : undefined;
  const document = updates.document !== undefined ? (updates.document ? updates.document.trim() : null) : undefined;
  const rawNotes = updates.notes !== undefined ? (updates.notes ? updates.notes.trim() : null) : undefined;
  const image_url = updates.image_url !== undefined ? (updates.image_url || null) : undefined;

  const packedNotes = (address_2 !== undefined || address_3 !== undefined || rawNotes !== undefined)
    ? packNotesWithAddresses(rawNotes, address_2, address_3)
    : undefined;

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = { updated_at };
      if (name !== undefined) updatePayload.name = name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (email !== undefined) updatePayload.email = email;
      if (address !== undefined) updatePayload.address = address;
      if (address_2 !== undefined) updatePayload.address_2 = address_2;
      if (address_3 !== undefined) updatePayload.address_3 = address_3;
      if (document !== undefined) updatePayload.document = document;
      if (rawNotes !== undefined) updatePayload.notes = rawNotes;
      if (image_url !== undefined) updatePayload.image_url = image_url;

      // 1. Tenta atualizar com colunas nativas
      let updateRes = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      // Se falhar porque as colunas address_2 / address_3 ainda não foram criadas no Supabase
      if (updateRes.error && (updateRes.error.code === '42703' || updateRes.error.message?.includes('address_2'))) {
        const fallbackPayload: any = { updated_at };
        if (name !== undefined) fallbackPayload.name = name;
        if (phone !== undefined) fallbackPayload.phone = phone;
        if (email !== undefined) fallbackPayload.email = email;
        if (address !== undefined) fallbackPayload.address = address;
        if (packedNotes !== undefined) fallbackPayload.notes = packedNotes;
        if (document !== undefined) fallbackPayload.document = document;
        if (image_url !== undefined) fallbackPayload.image_url = image_url;

        updateRes = await supabase
          .from('clients')
          .update(fallbackPayload)
          .eq('id', id)
          .select()
          .maybeSingle();
      }

      // 2. Se não encontrou por ID, tenta por nome
      if (!updateRes.data && (name || updates.name)) {
        const searchName = name || updates.name || '';
        updateRes = await supabase
          .from('clients')
          .update(updatePayload)
          .ilike('name', searchName)
          .select()
          .maybeSingle();

        if (updateRes.error && (updateRes.error.code === '42703' || updateRes.error.message?.includes('address_2'))) {
          const fallbackPayload: any = { updated_at };
          if (name !== undefined) fallbackPayload.name = name;
          if (phone !== undefined) fallbackPayload.phone = phone;
          if (email !== undefined) fallbackPayload.email = email;
          if (address !== undefined) fallbackPayload.address = address;
          if (packedNotes !== undefined) fallbackPayload.notes = packedNotes;
          if (document !== undefined) fallbackPayload.document = document;
          if (image_url !== undefined) fallbackPayload.image_url = image_url;

          updateRes = await supabase
            .from('clients')
            .update(fallbackPayload)
            .ilike('name', searchName)
            .select()
            .maybeSingle();
        }
      }

      if (updateRes.data) {
        notifyDataChange('clients');
        const unpacked = unpackClientAddresses({
          ...updateRes.data,
          ...(address_2 !== undefined ? { address_2: address_2 || undefined } : {}),
          ...(address_3 !== undefined ? { address_3: address_3 || undefined } : {}),
        });
        const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS).map(unpackClientAddresses);
        const idx = clients.findIndex(c => c.id === id || c.id === updateRes.data.id);
        if (idx !== -1) {
          clients[idx] = unpacked;
          setStored(STORAGE_KEY_CLIENTS, clients);
        }
        return unpacked;
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar cliente no Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS).map(unpackClientAddresses);
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) {
    const created = { ...updates, id, updated_at } as Client;
    clients.unshift(created);
    setStored(STORAGE_KEY_CLIENTS, clients);
    notifyDataChange('clients');
    return created;
  }
  const updated = unpackClientAddresses({ ...clients[index], ...updates, updated_at });
  clients[index] = updated;
  setStored(STORAGE_KEY_CLIENTS, clients);
  notifyDataChange('clients');
  return updated;
  clients[index] = updated;
  setStored(STORAGE_KEY_CLIENTS, clients);
  notifyDataChange('clients');
  return updated;
}

export async function deleteClient(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (!error) {
        notifyDataChange('clients');
      } else {
        console.error('Erro no Supabase ao excluir cliente:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao excluir cliente no Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
  const filtered = clients.filter(c => c.id !== id);
  setStored(STORAGE_KEY_CLIENTS, filtered);

  const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);
  const filteredEquipment = equipment.filter(e => e.client_id !== id && !e.client_ids?.includes(id));
  setStored(STORAGE_KEY_EQUIPMENT, filteredEquipment);

  notifyDataChange('clients');
  return true;
}

// -------------------------------------------------------------
// EQUIPMENT API (Cloud-First com Supabase)
// -------------------------------------------------------------
export async function getEquipment(): Promise<Equipment[]> {
  const clients = await getClients();
  const clientMap = new Map(clients.map(c => [c.id, c]));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          const mapped = data.map((item: any) => {
            const ids: string[] = item.client_ids && item.client_ids.length > 0
              ? item.client_ids
              : item.client_id ? [item.client_id] : [];
            const linkedClients = ids.map(cid => clientMap.get(cid)).filter(Boolean) as Client[];
            const names = linkedClients.map(c => c.name).join(' & ') || clientMap.get(item.client_id)?.name || 'Cliente';
            const photos = item.images && item.images.length > 0
              ? item.images
              : item.image_url ? [item.image_url] : [];

            return {
              ...item,
              client_ids: ids,
              client_name: names,
              clients: linkedClients,
              images: photos,
            };
          });
          setStored(STORAGE_KEY_EQUIPMENT, mapped);
          return mapped;
        }
      } else if (error) {
        console.error('Erro ao buscar equipamentos no Supabase:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao buscar equipamentos no Supabase:', err);
    }
  }

  const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);

  return equipment.map(e => {
    const ids: string[] = e.client_ids && e.client_ids.length > 0
      ? e.client_ids
      : e.client_id ? [e.client_id] : [];
    const linkedClients = ids.map(cid => clientMap.get(cid)).filter(Boolean) as Client[];
    const names = linkedClients.map(c => c.name).join(' & ') || clientMap.get(e.client_id)?.name || 'Cliente não encontrado';

    return {
      ...e,
      client_ids: ids,
      client_name: names,
      clients: linkedClients,
    };
  });
}

export async function getEquipmentByClientId(clientId: string): Promise<Equipment[]> {
  const all = await getEquipment();
  return all.filter(e => e.client_id === clientId || e.client_ids?.includes(clientId));
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const all = await getEquipment();
  return all.find(e => e.id === id) || null;
}

export async function createEquipment(data: Omit<Equipment, 'id' | 'created_at' | 'client_name' | 'clients'>): Promise<Equipment> {
  const ids: string[] = data.client_ids && data.client_ids.length > 0
    ? data.client_ids
    : data.client_id ? [data.client_id] : [];

  const primaryClientId = ids[0] || data.client_id || '';
  const created_by = data.created_by || 'Alesandro';
  const locationWithAddress = data.installation_location && data.address
    ? `${data.installation_location} - ${data.address}`
    : data.installation_location || data.address || null;

  if (isSupabaseConfigured && supabase && primaryClientId) {
    try {
      const { data: created, error } = await supabase
        .from('equipment')
        .insert([{
          client_id: primaryClientId,
          client_ids: ids.length > 0 ? ids : [primaryClientId],
          type: data.type,
          brand: data.brand,
          model: data.model,
          serial_number: data.serial_number || null,
          capacity: data.capacity || null,
          installation_location: locationWithAddress,
          installation_date: data.installation_date || null,
          notes: data.notes || (data.address ? `Endereço: ${data.address}` : null),
          image_url: data.image_url || (data.images && data.images[0]) || null,
          images: data.images || [],
        }])
        .select()
        .single();

      if (!error && created) {
        notifyDataChange('equipment');
        const eqWithPhotos = {
          ...created,
          address: data.address || created.address,
          images: data.images || created.images || [],
        };
        return (await getEquipmentById(created.id)) || eqWithPhotos;
      } else if (error) {
        console.error('Erro no Supabase ao inserir equipamento:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao salvar equipamento no Supabase:', err);
    }
  }

  const fallbackId = `equip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newEquip: Equipment = {
    ...data,
    id: fallbackId,
    client_id: primaryClientId,
    client_ids: ids,
    installation_location: locationWithAddress || data.installation_location,
    created_by,
    created_at: new Date().toISOString(),
  };

  const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);
  equipment.unshift(newEquip);
  setStored(STORAGE_KEY_EQUIPMENT, equipment);
  notifyDataChange('equipment');
  return (await getEquipmentById(newEquip.id)) || newEquip;
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment> {
  const ids: string[] | undefined = updates.client_ids
    ? updates.client_ids
    : updates.client_id ? [updates.client_id] : undefined;

  const primaryClientId = ids ? (ids[0] || '') : updates.client_id;
  const updated_at = new Date().toISOString();
  const locationWithAddress = updates.installation_location && updates.address
    ? `${updates.installation_location} - ${updates.address}`
    : updates.installation_location || updates.address;

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = { updated_at };
      if (primaryClientId) updatePayload.client_id = primaryClientId;
      if (ids) updatePayload.client_ids = ids;
      if (updates.type !== undefined) updatePayload.type = updates.type;
      if (updates.brand !== undefined) updatePayload.brand = updates.brand;
      if (updates.model !== undefined) updatePayload.model = updates.model;
      if (updates.serial_number !== undefined) updatePayload.serial_number = updates.serial_number || null;
      if (updates.capacity !== undefined) updatePayload.capacity = updates.capacity || null;
      if (locationWithAddress !== undefined) updatePayload.installation_location = locationWithAddress || null;
      if (updates.installation_date !== undefined) updatePayload.installation_date = updates.installation_date || null;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes || null;
      if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url || null;
      if (updates.images !== undefined) updatePayload.images = updates.images;

      let { data, error } = await supabase
        .from('equipment')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (data) {
        notifyDataChange('equipment');
        return (await getEquipmentById(id)) || data;
      } else if (error) {
        console.error('Erro no Supabase ao atualizar equipamento:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar equipamento no Supabase:', err);
    }
  }

  const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);
  const index = equipment.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Equipamento não encontrado');
  const updated = {
    ...equipment[index],
    ...updates,
    ...(ids ? { client_ids: ids, client_id: primaryClientId || equipment[index].client_id } : {}),
    updated_at,
  };
  equipment[index] = updated;
  setStored(STORAGE_KEY_EQUIPMENT, equipment);
  notifyDataChange('equipment');
  return (await getEquipmentById(id)) || updated;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('equipment').delete().eq('id', id);
      if (!error) {
        notifyDataChange('equipment');
      } else {
        console.error('Erro no Supabase ao excluir equipamento:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao excluir equipamento no Supabase:', err);
    }
  }

  const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);
  const filtered = equipment.filter(e => e.id !== id);
  setStored(STORAGE_KEY_EQUIPMENT, filtered);
  notifyDataChange('equipment');
  return true;
}

// -------------------------------------------------------------
// TECHNICIANS API
// -------------------------------------------------------------
export async function getTechnicians(): Promise<Technician[]> {
  const passMap = getStoredTechPasswords();
  const enrichTech = (t: Technician): Technician => {
    const customPass = t.password || passMap[t.id.toLowerCase()] || (t.email ? passMap[t.email.toLowerCase().trim()] : undefined) || '123456';
    return { ...t, password: customPass };
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        const enriched = data.map(enrichTech);
        setStored(STORAGE_KEY_TECHNICIANS, enriched);
        return enriched;
      }
      if (error) console.error('Erro ao buscar técnicos no Supabase:', error);
    } catch (err) {
      console.error('Erro de rede ao buscar técnicos no Supabase:', err);
    }
  }
  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  return techs.map(enrichTech).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTechnician(data: Omit<Technician, 'id' | 'created_at'>): Promise<Technician> {
  const initialPass = (data.password || '123456').trim();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Tenta com coluna password se existir
      let res = await supabase
        .from('technicians')
        .insert([{
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
          specialty: data.specialty || null,
          active: data.active ?? true,
          password: initialPass,
        }])
        .select()
        .single();

      // Fallback se coluna password ainda não existir no Supabase
      if (res.error && (res.error.code === '42703' || res.error.message?.includes('password'))) {
        res = await supabase
          .from('technicians')
          .insert([{
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            specialty: data.specialty || null,
            active: data.active ?? true,
          }])
          .select()
          .single();
      }

      if (!res.error && res.data) {
        setStoredTechPassword(res.data.id, initialPass);
        if (data.email) setStoredTechPassword(data.email, initialPass);
        notifyDataChange('technicians');
        return { ...res.data, password: initialPass };
      } else if (res.error) {
        console.error('Erro no Supabase ao inserir técnico:', res.error);
      }
    } catch (err) {
      console.error('Erro de rede ao salvar técnico no Supabase:', err);
    }
  }

  const newTechId = `tech-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  setStoredTechPassword(newTechId, initialPass);
  if (data.email) setStoredTechPassword(data.email, initialPass);

  const newTech: Technician = {
    ...data,
    id: newTechId,
    password: initialPass,
    created_at: new Date().toISOString(),
  };

  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  techs.push(newTech);
  setStored(STORAGE_KEY_TECHNICIANS, techs);
  notifyDataChange('technicians');
  return newTech;
}

export async function updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician> {
  if (updates.password) {
    setStoredTechPassword(id, updates.password.trim());
    if (updates.email) setStoredTechPassword(updates.email, updates.password.trim());
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let res = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      // Fallback se updates tiver password e a coluna ainda não existir
      if (res.error && (res.error.code === '42703' || res.error.message?.includes('password'))) {
        const { password: _p, ...rest } = updates;
        res = await supabase
          .from('technicians')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
      }

      if (!res.error && res.data) {
        notifyDataChange('technicians');
        return {
          ...res.data,
          password: updates.password || getStoredTechPasswords()[id] || '123456',
        };
      } else if (res.error) {
        console.error('Erro no Supabase ao atualizar técnico:', res.error);
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar técnico no Supabase:', err);
    }
  }

  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  const index = techs.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Técnico não encontrado');
  const updated = {
    ...techs[index],
    ...updates,
    password: updates.password || techs[index].password || getStoredTechPasswords()[id] || '123456',
  };
  techs[index] = updated;
  setStored(STORAGE_KEY_TECHNICIANS, techs);
  notifyDataChange('technicians');
  return updated;
}

export async function deleteTechnician(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('technicians').delete().eq('id', id);
      if (!error) {
        notifyDataChange('technicians');
      } else {
        console.error('Erro no Supabase ao excluir técnico:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao excluir técnico no Supabase:', err);
    }
  }

  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  const filtered = techs.filter(t => t.id !== id);
  setStored(STORAGE_KEY_TECHNICIANS, filtered);
  notifyDataChange('technicians');
  return true;
}

// -------------------------------------------------------------
// SERVICE ORDERS API
// -------------------------------------------------------------
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const clients = await getClients();
  const clientMap = new Map(clients.map(c => [c.id, c]));
  const equipment = await getEquipment();
  const equipmentMap = new Map(equipment.map(e => [e.id, e]));
  const technicians = await getTechnicians();
  const techMap = new Map(technicians.map(t => [t.id, t]));
  const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          technician:technicians(*),
          images:service_order_images(*)
        `)
        .order('service_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((order: any) => {
          const ids: string[] = order.client_ids && order.client_ids.length > 0
            ? order.client_ids
            : order.client_id ? [order.client_id] : [];
          const linkedClients = ids.map(cid => clientMap.get(cid)).filter(Boolean) as Client[];

          const rawImages: ServiceOrderImage[] = (order.images && order.images.length > 0)
            ? order.images
            : images.filter(img => img.service_order_id === order.id);
          const seen = new Set<string>();
          const uniqueImages: ServiceOrderImage[] = [];
          for (const img of rawImages) {
            if (img && img.image_url && !seen.has(img.image_url)) {
              seen.add(img.image_url);
              uniqueImages.push(img);
            }
          }

          return {
            ...order,
            client_ids: ids,
            client: linkedClients[0] || clientMap.get(order.client_id),
            clients: linkedClients,
            equipment: order.equipment_id ? equipmentMap.get(order.equipment_id) || null : null,
            technician: techMap.get(order.technician_id) || order.technician,
            images: uniqueImages,
          };
        });
      } else if (error) {
        console.error('Erro ao buscar ordens de serviço no Supabase:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao buscar ordens de serviço no Supabase:', err);
    }
  }

  const orders = getStored<ServiceOrder>(STORAGE_KEY_ORDERS, INITIAL_SERVICE_ORDERS);

  return orders
    .map(order => {
      const ids: string[] = order.client_ids && order.client_ids.length > 0
        ? order.client_ids
        : order.client_id ? [order.client_id] : [];
      const linkedClients = ids.map(cid => clientMap.get(cid)).filter(Boolean) as Client[];

      const rawImages = images.filter(img => img.service_order_id === order.id);
      const seen = new Set<string>();
      const uniqueImages: ServiceOrderImage[] = [];
      for (const img of rawImages) {
        if (img && img.image_url && !seen.has(img.image_url)) {
          seen.add(img.image_url);
          uniqueImages.push(img);
        }
      }

      return {
        ...order,
        client_ids: ids,
        client: linkedClients[0] || clientMap.get(order.client_id),
        clients: linkedClients,
        equipment: order.equipment_id ? equipmentMap.get(order.equipment_id) || null : null,
        technician: techMap.get(order.technician_id),
        images: uniqueImages,
      };
    })
    .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder | null> {
  const all = await getServiceOrders();
  return all.find(o => o.id === id) || null;
}

export async function getServiceOrdersByClientId(clientId: string): Promise<ServiceOrder[]> {
  const all = await getServiceOrders();
  return all.filter(o => o.client_id === clientId || o.client_ids?.includes(clientId));
}

export async function getServiceOrdersByEquipmentId(equipmentId: string): Promise<ServiceOrder[]> {
  const all = await getServiceOrders();
  return all.filter(o => o.equipment_id === equipmentId);
}

function generateNextOSNumber(existingOrders: ServiceOrder[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 1000;
  for (const order of existingOrders) {
    if (order.order_number && order.order_number.startsWith(`OS-${currentYear}-`)) {
      const seqPart = parseInt(order.order_number.replace(`OS-${currentYear}-`, ''), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  }
  return `OS-${currentYear}-${(maxSeq + 1).toString().padStart(4, '0')}`;
}

function normalizeOSStatus(status?: string): 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada' {
  const s = (status || '').toLowerCase();
  if (s.includes('andamento') || s.includes('progresso') || s.includes('atendimento')) return 'Em andamento';
  if (s.includes('concl') || s.includes('finaliz')) return 'Concluída';
  if (s.includes('cancel')) return 'Cancelada';
  return 'Pendente';
}

export async function createServiceOrder(
  data: Omit<ServiceOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'client' | 'clients' | 'equipment' | 'technician' | 'images'>,
  imageUrls: string[] = []
): Promise<ServiceOrder> {
  const ids: string[] = data.client_ids && data.client_ids.length > 0
    ? data.client_ids
    : data.client_id ? [data.client_id] : [];
  const primaryClientId = ids[0] || data.client_id || '';
  const created_by = data.created_by || 'Alesandro';
  const status = normalizeOSStatus(data.status);
  const cleanImageUrls = Array.from(new Set(imageUrls.filter(Boolean)));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
        .from('service_orders')
        .insert([{
          client_id: primaryClientId,
          equipment_id: data.equipment_id || null,
          technician_id: data.technician_id,
          service_date: data.service_date,
          description: data.description,
          notes: data.notes || null,
          status,
          value: data.value || null,
        }])
        .select()
        .single();

      if (!error && created) {
        if (cleanImageUrls.length > 0) {
          const imageRows = cleanImageUrls.map(url => ({
            service_order_id: created.id,
            image_url: url,
          }));
          await supabase.from('service_order_images').insert(imageRows);
        }
        notifyDataChange('orders');
        return (await getServiceOrderById(created.id)) || created;
      } else if (error) {
        console.error('Erro no Supabase ao criar ordem de serviço:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao salvar OS no Supabase:', err);
    }
  }

  const orders = getStored<ServiceOrder>(STORAGE_KEY_ORDERS, INITIAL_SERVICE_ORDERS);
  const order_number = generateNextOSNumber(orders);
  const newId = `os-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const newOrder: ServiceOrder = {
    ...data,
    id: newId,
    order_number,
    status,
    client_id: primaryClientId,
    client_ids: ids,
    created_by,
    created_at: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  setStored(STORAGE_KEY_ORDERS, orders);

  if (cleanImageUrls.length > 0) {
    const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
    cleanImageUrls.forEach((url, i) => {
      images.push({
        id: `img-${Date.now()}-${i}`,
        service_order_id: newId,
        image_url: url,
        created_at: new Date().toISOString(),
      });
    });
    setStored(STORAGE_KEY_ORDER_IMAGES, images);
  }

  notifyDataChange('orders');
  return (await getServiceOrderById(newId)) || newOrder;
}

export async function updateServiceOrder(
  id: string,
  updates: Partial<ServiceOrder>,
  images?: string[]
): Promise<ServiceOrder> {
  const updated_at = new Date().toISOString();
  const ids: string[] | undefined = updates.client_ids
    ? updates.client_ids
    : updates.client_id ? [updates.client_id] : undefined;
  const primaryClientId = ids ? (ids[0] || '') : updates.client_id;
  const status = updates.status !== undefined ? normalizeOSStatus(updates.status) : undefined;

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = { updated_at };
      if (primaryClientId) updatePayload.client_id = primaryClientId;
      if (updates.equipment_id !== undefined) updatePayload.equipment_id = updates.equipment_id || null;
      if (updates.technician_id !== undefined) updatePayload.technician_id = updates.technician_id;
      if (updates.service_date !== undefined) updatePayload.service_date = updates.service_date;
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes || null;
      if (status !== undefined) updatePayload.status = status;
      if (updates.value !== undefined) updatePayload.value = updates.value || null;

      const { error } = await supabase
        .from('service_orders')
        .update(updatePayload)
        .eq('id', id);

      // Sincroniza imagens da OS se o array de imagens foi fornecido
      if (!error && images !== undefined) {
        const cleanImages = Array.from(new Set(images.filter(Boolean)));

        // Remove imagens anteriores desta OS para manter exatamente o estado atualizado
        const { error: delError } = await supabase
          .from('service_order_images')
          .delete()
          .eq('service_order_id', id);

        if (delError) {
          console.error('Erro ao limpar imagens anteriores da OS no Supabase:', delError);
        }

        // Insere as imagens atualizadas
        if (cleanImages.length > 0) {
          const imageRows = cleanImages.map(url => ({
            service_order_id: id,
            image_url: url,
          }));
          const { error: insError } = await supabase
            .from('service_order_images')
            .insert(imageRows);
          if (insError) {
            console.error('Erro ao inserir imagens atualizadas no Supabase:', insError);
          }
        }
      }

      if (!error) {
        notifyDataChange('orders');
        return (await getServiceOrderById(id))!;
      } else {
        console.error('Erro no Supabase ao atualizar OS:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar OS no Supabase:', err);
    }
  }

  const orders = getStored<ServiceOrder>(STORAGE_KEY_ORDERS, INITIAL_SERVICE_ORDERS);
  const index = orders.findIndex(o => o.id === id);
  if (index === -1) throw new Error('Ordem de serviço não encontrada');

  orders[index] = {
    ...orders[index],
    ...updates,
    ...(status !== undefined ? { status } : {}),
    ...(ids ? { client_ids: ids, client_id: primaryClientId || orders[index].client_id } : {}),
    updated_at,
  };
  setStored(STORAGE_KEY_ORDERS, orders);

  if (images !== undefined) {
    const cleanImages = Array.from(new Set(images.filter(Boolean)));
    const storedImages = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
    const withoutCurrent = storedImages.filter(img => img.service_order_id !== id);
    cleanImages.forEach((url, i) => {
      withoutCurrent.push({
        id: `img-${Date.now()}-${i}`,
        service_order_id: id,
        image_url: url,
        created_at: new Date().toISOString(),
      });
    });
    setStored(STORAGE_KEY_ORDER_IMAGES, withoutCurrent);
  }

  notifyDataChange('orders');
  return (await getServiceOrderById(id))!;
}

export async function deleteServiceOrder(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('service_orders').delete().eq('id', id);
      if (!error) {
        notifyDataChange('orders');
      } else {
        console.error('Erro no Supabase ao excluir OS:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao excluir OS no Supabase:', err);
    }
  }

  const orders = getStored<ServiceOrder>(STORAGE_KEY_ORDERS, INITIAL_SERVICE_ORDERS);
  const filtered = orders.filter(o => o.id !== id);
  setStored(STORAGE_KEY_ORDERS, filtered);

  const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
  setStored(STORAGE_KEY_ORDER_IMAGES, images.filter(img => img.service_order_id !== id));

  notifyDataChange('orders');
  return true;
}

export async function deleteOrderImage(imageId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('service_order_images').delete().eq('id', imageId);
      if (!error) {
        notifyDataChange('orders');
      } else {
        console.error('Erro no Supabase ao excluir imagem:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao excluir imagem no Supabase:', err);
    }
  }

  const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
  setStored(STORAGE_KEY_ORDER_IMAGES, images.filter(img => img.id !== imageId));
  notifyDataChange('orders');
  return true;
}

// -------------------------------------------------------------
// SCHEDULES (AGENDA DE SERVIÇOS) API
// -------------------------------------------------------------
export async function getSchedules(): Promise<Schedule[]> {
  const [clients, equipment, technicians] = await Promise.all([
    getClients(),
    getEquipment(),
    getTechnicians(),
  ]);
  const clientMap = new Map(clients.map(c => [c.id, c]));
  const equipmentMap = new Map(equipment.map(e => [e.id, e]));
  const techMap = new Map(technicians.map(t => [t.id, t]));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('service_date', { ascending: true })
        .order('service_time', { ascending: true });

      if (!error && data) {
        const mapped = data.map((item: any) => ({
          ...item,
          client: item.client_id ? clientMap.get(item.client_id) : undefined,
          equipment: item.equipment_id ? equipmentMap.get(item.equipment_id) : undefined,
          technician: item.technician_id ? techMap.get(item.technician_id) : undefined,
        }));
        setStored(STORAGE_KEY_SCHEDULES, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Fallback local para agenda:', err);
    }
  }

  const schedules = getStored<Schedule>(STORAGE_KEY_SCHEDULES, []);
  return schedules
    .map(s => ({
      ...s,
      client: s.client_id ? clientMap.get(s.client_id) : undefined,
      equipment: s.equipment_id ? equipmentMap.get(s.equipment_id) : undefined,
      technician: s.technician_id ? techMap.get(s.technician_id) : undefined,
    }))
    .sort((a, b) => {
      const dateCmp = a.service_date.localeCompare(b.service_date);
      if (dateCmp !== 0) return dateCmp;
      return (a.service_time || '').localeCompare(b.service_time || '');
    });
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  const all = await getSchedules();
  return all.find(s => s.id === id) || null;
}

export async function createSchedule(data: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'client' | 'equipment' | 'technician'>): Promise<Schedule> {
  const created_by = data.created_by || 'Alesandro';
  const cleanDate = data.service_date.trim();
  const cleanTime = (data.service_time || '09:00').trim();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
        .from('schedules')
        .insert([{
          client_id: data.client_id || null,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          equipment_id: data.equipment_id || null,
          equipment_name: data.equipment_name || null,
          technician_id: data.technician_id || null,
          technician_name: data.technician_name || null,
          service_date: cleanDate,
          service_time: cleanTime,
          service_type: data.service_type,
          description: data.description || null,
          address: data.address || null,
          status: data.status || 'Agendado',
          value: data.value || null,
          notes: data.notes || null,
          created_by,
        }])
        .select()
        .single();

      if (!error && created) {
        notifyDataChange('schedules');
        const list = getStored<Schedule>(STORAGE_KEY_SCHEDULES, []);
        list.push(created);
        setStored(STORAGE_KEY_SCHEDULES, list);
        return (await getScheduleById(created.id)) || created;
      } else if (error) {
        console.error('Erro no Supabase ao agendar serviço:', error);
      }
    } catch (err) {
      console.warn('Erro ao salvar agendamento no Supabase:', err);
    }
  }

  const fallbackId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const newSchedule: Schedule = {
    ...data,
    id: fallbackId,
    service_date: cleanDate,
    service_time: cleanTime,
    created_by,
    created_at: new Date().toISOString(),
  };

  const list = getStored<Schedule>(STORAGE_KEY_SCHEDULES, []);
  list.push(newSchedule);
  setStored(STORAGE_KEY_SCHEDULES, list);
  notifyDataChange('schedules');
  return (await getScheduleById(fallbackId)) || newSchedule;
}

export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
  const updated_at = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = { updated_at };
      if (updates.client_id !== undefined) updatePayload.client_id = updates.client_id || null;
      if (updates.client_name !== undefined) updatePayload.client_name = updates.client_name;
      if (updates.client_phone !== undefined) updatePayload.client_phone = updates.client_phone || null;
      if (updates.equipment_id !== undefined) updatePayload.equipment_id = updates.equipment_id || null;
      if (updates.equipment_name !== undefined) updatePayload.equipment_name = updates.equipment_name || null;
      if (updates.technician_id !== undefined) updatePayload.technician_id = updates.technician_id || null;
      if (updates.technician_name !== undefined) updatePayload.technician_name = updates.technician_name || null;
      if (updates.service_date !== undefined) updatePayload.service_date = updates.service_date;
      if (updates.service_time !== undefined) updatePayload.service_time = updates.service_time;
      if (updates.service_type !== undefined) updatePayload.service_type = updates.service_type;
      if (updates.description !== undefined) updatePayload.description = updates.description || null;
      if (updates.address !== undefined) updatePayload.address = updates.address || null;
      if (updates.status !== undefined) updatePayload.status = updates.status;
      if (updates.value !== undefined) updatePayload.value = updates.value || null;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes || null;

      const { data, error } = await supabase
        .from('schedules')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (!error && data) {
        notifyDataChange('schedules');
        return (await getScheduleById(id)) || data;
      }
    } catch (err) {
      console.warn('Erro ao atualizar agendamento no Supabase:', err);
    }
  }

  const list = getStored<Schedule>(STORAGE_KEY_SCHEDULES, []);
  const index = list.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Agendamento não encontrado');

  list[index] = {
    ...list[index],
    ...updates,
    updated_at,
  };
  setStored(STORAGE_KEY_SCHEDULES, list);
  notifyDataChange('schedules');
  return (await getScheduleById(id)) || list[index];
}

export async function deleteSchedule(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (!error) {
        notifyDataChange('schedules');
      }
    } catch (err) {
      console.warn('Erro ao excluir agendamento no Supabase:', err);
    }
  }

  const list = getStored<Schedule>(STORAGE_KEY_SCHEDULES, []);
  const filtered = list.filter(s => s.id !== id);
  setStored(STORAGE_KEY_SCHEDULES, filtered);
  notifyDataChange('schedules');
  return true;
}

// -------------------------------------------------------------
// REPORTS API (Relatórios Técnicos em PDF)
// -------------------------------------------------------------
export async function getReports(): Promise<Report[]> {
  const clients = await getClients();
  const clientMap = new Map(clients.map(c => [c.id, c]));
  const equipment = await getEquipment();
  const equipMap = new Map(equipment.map(e => [e.id, e]));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (!error && data) {
        const enriched: Report[] = data.map((item: any) => ({
          ...item,
          client: item.client_id ? clientMap.get(item.client_id) : undefined,
          equipment: item.equipment_id ? equipMap.get(item.equipment_id) : null,
        }));
        setStored(STORAGE_KEY_REPORTS, enriched);
        return enriched;
      } else if (error) {
        console.warn('Erro ao buscar relatórios no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro de rede ao buscar relatórios no Supabase:', err);
    }
  }

  const reports = getStored<Report>(STORAGE_KEY_REPORTS, []);
  return reports.map(r => ({
    ...r,
    client: r.client_id ? clientMap.get(r.client_id) : undefined,
    equipment: r.equipment_id ? equipMap.get(r.equipment_id) : null,
  })).sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
}

export async function getReportById(id: string): Promise<Report | null> {
  const all = await getReports();
  return all.find(r => r.id === id) || null;
}

export async function getReportsByCategory(category: ReportCategory): Promise<Report[]> {
  const all = await getReports();
  return all.filter(r => r.category === category);
}

export async function createReport(
  data: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'client' | 'equipment'>
): Promise<Report> {
  const now = new Date().toISOString();
  const report_date = data.report_date || now.split('T')[0];
  const created_by = data.created_by || 'Alesandro';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
        .from('reports')
        .insert([{
          title: data.title,
          category: data.category,
          client_id: data.client_id || null,
          client_name: data.client_name || null,
          equipment_id: data.equipment_id || null,
          equipment_name: data.equipment_name || null,
          service_order_id: data.service_order_id || null,
          service_order_number: data.service_order_number || null,
          technician_name: data.technician_name || null,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size || null,
          report_date,
          notes: data.notes || null,
          created_by,
        }])
        .select()
        .single();

      if (!error && created) {
        notifyDataChange('reports');
        return (await getReportById(created.id)) || created;
      } else if (error) {
        console.warn('Erro ao inserir relatório no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro de rede ao salvar relatório no Supabase:', err);
    }
  }

  const reports = getStored<Report>(STORAGE_KEY_REPORTS, []);
  const newReport: Report = {
    ...data,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    report_date,
    created_by,
    created_at: now,
  };

  reports.unshift(newReport);
  setStored(STORAGE_KEY_REPORTS, reports);
  notifyDataChange('reports');
  return newReport;
}

export async function deleteReport(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (!error) {
        notifyDataChange('reports');
      } else {
        console.warn('Erro ao excluir relatório no Supabase:', error);
      }
    } catch (err) {
      console.warn('Erro de rede ao excluir relatório no Supabase:', err);
    }
  }

  const reports = getStored<Report>(STORAGE_KEY_REPORTS, []);
  const filtered = reports.filter(r => r.id !== id);
  setStored(STORAGE_KEY_REPORTS, filtered);
  notifyDataChange('reports');
  return true;
}

// -------------------------------------------------------------
// DASHBOARD METRICS
// -------------------------------------------------------------
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const clients = await getClients();
  const equipment = await getEquipment();
  const orders = await getServiceOrders();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthOrders = orders.filter(o => {
    const d = new Date(o.service_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const completedOrders = orders.filter(o => o.status === 'Concluída').length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  const inProgressOrders = orders.filter(o => o.status === 'Em andamento').length;

  return {
    totalClients: clients.length,
    totalEquipment: equipment.length,
    completedOrders,
    pendingOrders,
    inProgressOrders,
    monthOrders,
  };
}

// Sincronização de boot automática caso Supabase esteja vazio
async function syncInitialSeedToSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    // Insere técnicos
    for (const t of INITIAL_TECHNICIANS) {
      const { data: ex } = await supabase.from('technicians').select('id').eq('name', t.name).maybeSingle();
      if (!ex) {
        await supabase.from('technicians').insert([{ name: t.name, phone: t.phone, email: t.email, specialty: t.specialty, active: t.active }]);
      }
    }
    // Insere clientes
    const cMap = new Map<string, string>();
    for (const c of INITIAL_CLIENTS) {
      let { data: ex } = await supabase.from('clients').select('id').eq('name', c.name).maybeSingle();
      if (!ex) {
        const { data: created } = await supabase.from('clients').insert([{
          name: c.name,
          document: c.document || null,
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
        }]).select('id').single();
        ex = created;
      }
      if (ex) cMap.set(c.id, ex.id);
    }
    // Insere equipamentos
    for (const e of INITIAL_EQUIPMENT) {
      const realClientId = cMap.get(e.client_id);
      if (!realClientId) continue;
      const { data: ex } = await supabase.from('equipment').select('id').eq('installation_location', e.installation_location).eq('client_id', realClientId).maybeSingle();
      if (!ex) {
        await supabase.from('equipment').insert([{
          client_id: realClientId,
          client_ids: [realClientId],
          type: e.type,
          brand: e.brand,
          model: e.model,
          installation_location: e.installation_location || e.address || null,
          installation_date: e.installation_date || null,
        }]);
      }
    }
  } catch (err) {
    console.error('Erro na sincronização de boot:', err);
  }
}

// -------------------------------------------------------------
// SINCRONIZAÇÃO COMPLETA MANUAL/PAINEL -> SUPABASE POSTGRESQL
// -------------------------------------------------------------
export async function syncAllDataToSupabase(): Promise<{ success: boolean; message: string; countClients?: number; countEquipment?: number }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase não está configurado no ambiente.' };
  }

  try {
    // 1. Coleta todos os clientes locais existentes (varre chaves antigas e novas)
    const clientKeys = [STORAGE_KEY_CLIENTS, 'termoluc_clients_v3', 'termoluc_clients_v2', 'termoluc_clients'];
    const allLocalClientsMap = new Map<string, Client>();

    INITIAL_CLIENTS.forEach(c => allLocalClientsMap.set(c.name.toLowerCase().trim(), c));

    for (const k of clientKeys) {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((c: Client) => {
              if (c && c.name) {
                allLocalClientsMap.set(c.name.toLowerCase().trim(), {
                  ...allLocalClientsMap.get(c.name.toLowerCase().trim()),
                  ...c,
                });
              }
            });
          }
        } catch {
          // Ignora chave inválida
        }
      }
    }

    const localClients = Array.from(allLocalClientsMap.values());

    // Sincroniza Clientes com Supabase
    const clientIdMap = new Map<string, string>();
    let syncedClientsCount = 0;

    for (const c of localClients) {
      const cleanName = c.name.trim();
      const phone = (c.phone || '').trim();
      const email = (c.email || '').trim();
      const address = (c.address || '').trim();
      const document = c.document ? c.document.trim() : null;
      const address_2 = c.address_2 ? c.address_2.trim() : null;
      const address_3 = c.address_3 ? c.address_3.trim() : null;
      const rawNotes = c.notes ? c.notes.trim() : null;
      const packedNotes = packNotesWithAddresses(rawNotes, address_2, address_3);

      let { data: existing } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', cleanName)
        .maybeSingle();

      if (existing) {
        // Tenta com colunas nativas se existirem
        let upRes = await supabase
          .from('clients')
          .update({
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            address_2: address_2 || undefined,
            address_3: address_3 || undefined,
            document: document || undefined,
            notes: rawNotes || undefined,
            image_url: c.image_url || undefined,
          })
          .eq('id', existing.id);

        if (upRes.error && (upRes.error.code === '42703' || upRes.error.message?.includes('address_2'))) {
          await supabase
            .from('clients')
            .update({
              phone: phone || undefined,
              email: email || undefined,
              address: address || undefined,
              document: document || undefined,
              notes: packedNotes || undefined,
              image_url: c.image_url || undefined,
            })
            .eq('id', existing.id);
        }

        clientIdMap.set(c.id, existing.id);
        clientIdMap.set(cleanName.toLowerCase(), existing.id);
        syncedClientsCount++;
      } else {
        let insRes = await supabase
          .from('clients')
          .insert([{
            name: cleanName,
            document,
            phone,
            email,
            address,
            address_2,
            address_3,
            notes: rawNotes,
            image_url: c.image_url || null,
          }])
          .select('id')
          .single();

        if (insRes.error && (insRes.error.code === '42703' || insRes.error.message?.includes('address_2'))) {
          insRes = await supabase
            .from('clients')
            .insert([{
              name: cleanName,
              document,
              phone,
              email,
              address,
              notes: packedNotes,
              image_url: c.image_url || null,
            }])
            .select('id')
            .single();
        }

        if (insRes.data) {
          clientIdMap.set(c.id, insRes.data.id);
          clientIdMap.set(cleanName.toLowerCase(), insRes.data.id);
          syncedClientsCount++;
        }
      }
    }

    // 2. Coleta todos os equipamentos locais existentes
    const equipKeys = [STORAGE_KEY_EQUIPMENT, 'termoluc_equipment_v3', 'termoluc_equipment_v2', 'termoluc_equipment'];
    const allLocalEquipMap = new Map<string, Equipment>();

    INITIAL_EQUIPMENT.forEach(e => allLocalEquipMap.set(`${e.brand}-${e.model}-${e.installation_location || ''}`.toLowerCase(), e));

    for (const k of equipKeys) {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((e: Equipment) => {
              if (e && (e.brand || e.model)) {
                allLocalEquipMap.set(`${e.id}-${e.brand}-${e.model}`.toLowerCase(), e);
              }
            });
          }
        } catch {
          // Ignora
        }
      }
    }

    const localEquipment = Array.from(allLocalEquipMap.values());
    const equipIdMap = new Map<string, string>();
    let syncedEquipCount = 0;

    for (const e of localEquipment) {
      let targetClientId = clientIdMap.get(e.client_id) || clientIdMap.get((e.client_name || '').toLowerCase());
      if (!targetClientId) {
        // Tenta achar pelo cliente vinculado
        if (e.client_ids && e.client_ids.length > 0) {
          targetClientId = clientIdMap.get(e.client_ids[0]);
        }
      }
      if (!targetClientId) continue;

      const locationWithAddress = e.installation_location && e.address
        ? `${e.installation_location} - ${e.address}`
        : e.installation_location || e.address || null;

      const { data: existing } = await supabase
        .from('equipment')
        .select('id')
        .eq('client_id', targetClientId)
        .eq('model', e.model || 'n sei')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('equipment')
          .update({
            type: e.type,
            brand: e.brand,
            serial_number: e.serial_number || null,
            capacity: e.capacity || null,
            installation_location: locationWithAddress,
            installation_date: e.installation_date || null,
            notes: e.notes || null,
            image_url: e.image_url || (e.images && e.images[0]) || null,
            images: e.images || [],
          })
          .eq('id', existing.id);

        equipIdMap.set(e.id, existing.id);
        syncedEquipCount++;
      } else {
        const { data: created, error } = await supabase
          .from('equipment')
          .insert([{
            client_id: targetClientId,
            client_ids: [targetClientId],
            type: e.type || 'Ar-condicionado Split Hi-Wall',
            brand: e.brand || 'CARRIER',
            model: e.model || 'n sei',
            serial_number: e.serial_number || null,
            capacity: e.capacity || null,
            installation_location: locationWithAddress,
            installation_date: e.installation_date || null,
            notes: e.notes || null,
            image_url: e.image_url || (e.images && e.images[0]) || null,
            images: e.images || [],
          }])
          .select('id')
          .single();

        if (created) {
          equipIdMap.set(e.id, created.id);
          syncedEquipCount++;
        }
        if (error) console.error('Erro ao sincronizar equipamento:', e.brand, error);
      }
    }

    // 3. Atualiza cache local com o banco em nuvem atualizado
    const { data: freshClients } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (freshClients && freshClients.length > 0) {
      setStored(STORAGE_KEY_CLIENTS, freshClients);
    }

    const { data: freshEquip } = await supabase.from('equipment').select('*').order('created_at', { ascending: false });
    if (freshEquip && freshEquip.length > 0) {
      setStored(STORAGE_KEY_EQUIPMENT, freshEquip);
    }

    notifyDataChange('clients');
    notifyDataChange('equipment');
    notifyDataChange('all');

    return {
      success: true,
      countClients: freshClients ? freshClients.length : syncedClientsCount,
      countEquipment: freshEquip ? freshEquip.length : syncedEquipCount,
      message: `Sincronização 100% concluída! ${freshClients ? freshClients.length : syncedClientsCount} clientes e ${freshEquip ? freshEquip.length : syncedEquipCount} equipamentos gravados no banco Supabase.`
    };
  } catch (err: any) {
    console.error('Erro durante a sincronização:', err);
    return { success: false, message: err.message || 'Erro ao sincronizar com o banco de dados.' };
  }
}
