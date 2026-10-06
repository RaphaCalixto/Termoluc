import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client, Equipment, Technician, ServiceOrder, ServiceOrderImage, DashboardMetrics } from '../types';

const STORAGE_KEY_CLIENTS = 'termoluc_clients_v4';
const STORAGE_KEY_EQUIPMENT = 'termoluc_equipment_v4';
const STORAGE_KEY_TECHNICIANS = 'termoluc_technicians_v4';
const STORAGE_KEY_ORDERS = 'termoluc_service_orders_v4';
const STORAGE_KEY_ORDER_IMAGES = 'termoluc_order_images_v4';

// BroadcastChannel para sincronização rápida local
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('termoluc_sync_channel')
  : null;

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
        if (data.length > 0) {
          setStored(STORAGE_KEY_CLIENTS, data);
          return data;
        } else {
          // Se Supabase estiver vazio, sincroniza automaticamente os clientes iniciais
          await syncInitialSeedToSupabase();
          const { data: seeded } = await supabase.from('clients').select('*').order('name', { ascending: true });
          if (seeded && seeded.length > 0) {
            setStored(STORAGE_KEY_CLIENTS, seeded);
            return seeded;
          }
        }
      } else if (error) {
        console.error('Erro ao buscar clientes no Supabase:', error);
      }
    } catch (err) {
      console.error('Falha de conexão com Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
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

      if (!error && data) return data;
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
  const document = clientData.document ? clientData.document.trim() : null;
  const notes = clientData.notes || (clientData.address_2 ? `Endereço 2: ${clientData.address_2}` : null);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name,
          document,
          phone,
          email,
          address,
          notes,
          image_url: clientData.image_url || null,
        }])
        .select()
        .single();

      if (!error && data) {
        notifyDataChange('clients');
        const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
        clients.unshift(data);
        setStored(STORAGE_KEY_CLIENTS, clients);
        return data;
      } else if (error) {
        console.error('Erro no Supabase ao inserir cliente:', error);
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
    id: fallbackId,
    created_by,
    created_at: new Date().toISOString(),
  };

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
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
  const document = updates.document !== undefined ? (updates.document ? updates.document.trim() : null) : undefined;
  const notes = updates.notes !== undefined ? (updates.notes || null) : undefined;
  const image_url = updates.image_url !== undefined ? (updates.image_url || null) : undefined;

  if (isSupabaseConfigured && supabase) {
    try {
      const updatePayload: any = { updated_at };
      if (name !== undefined) updatePayload.name = name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (email !== undefined) updatePayload.email = email;
      if (address !== undefined) updatePayload.address = address;
      if (document !== undefined) updatePayload.document = document;
      if (notes !== undefined) updatePayload.notes = notes;
      if (image_url !== undefined) updatePayload.image_url = image_url;

      // 1. Tenta atualizar pelo ID exato
      let { data } = await supabase
        .from('clients')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle();

      // 2. Se não encontrou por ID (ex: cliente criado com ID local prévio), busca e atualiza pelo nome
      if (!data && (name || updates.name)) {
        const searchName = name || updates.name || '';
        const { data: byName } = await supabase
          .from('clients')
          .update(updatePayload)
          .ilike('name', searchName)
          .select()
          .maybeSingle();

        data = byName;
      }

      if (data) {
        notifyDataChange('clients');
        const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
        const idx = clients.findIndex(c => c.id === id || c.id === data.id);
        if (idx !== -1) {
          clients[idx] = data;
          setStored(STORAGE_KEY_CLIENTS, clients);
        }
        return data;
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar cliente no Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) {
    const created = { ...updates, id, updated_at } as Client;
    clients.unshift(created);
    setStored(STORAGE_KEY_CLIENTS, clients);
    notifyDataChange('clients');
    return created;
  }
  const updated = { ...clients[index], ...updates, updated_at };
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
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) return data;
      if (error) console.error('Erro ao buscar técnicos no Supabase:', error);
    } catch (err) {
      console.error('Erro de rede ao buscar técnicos no Supabase:', err);
    }
  }
  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  return techs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTechnician(data: Omit<Technician, 'id' | 'created_at'>): Promise<Technician> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
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
      if (!error && created) {
        notifyDataChange('technicians');
        return created;
      } else if (error) {
        console.error('Erro no Supabase ao inserir técnico:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao salvar técnico no Supabase:', err);
    }
  }

  const newTech: Technician = {
    ...data,
    id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    created_at: new Date().toISOString(),
  };

  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  techs.push(newTech);
  setStored(STORAGE_KEY_TECHNICIANS, techs);
  notifyDataChange('technicians');
  return newTech;
}

export async function updateTechnician(id: string, updates: Partial<Technician>): Promise<Technician> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        notifyDataChange('technicians');
        return data;
      } else if (error) {
        console.error('Erro no Supabase ao atualizar técnico:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar técnico no Supabase:', err);
    }
  }

  const techs = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
  const index = techs.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Técnico não encontrado');
  const updated = { ...techs[index], ...updates };
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

          return {
            ...order,
            client_ids: ids,
            client: linkedClients[0] || clientMap.get(order.client_id),
            clients: linkedClients,
            equipment: order.equipment_id ? equipmentMap.get(order.equipment_id) || null : null,
            technician: techMap.get(order.technician_id) || order.technician,
            images: order.images || images.filter(img => img.service_order_id === order.id),
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

      return {
        ...order,
        client_ids: ids,
        client: linkedClients[0] || clientMap.get(order.client_id),
        clients: linkedClients,
        equipment: order.equipment_id ? equipmentMap.get(order.equipment_id) || null : null,
        technician: techMap.get(order.technician_id),
        images: images.filter(img => img.service_order_id === order.id),
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
        if (imageUrls.length > 0) {
          const imageRows = imageUrls.map(url => ({
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

  if (imageUrls.length > 0) {
    const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
    imageUrls.forEach((url, i) => {
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
  newImages?: string[]
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

      if (!error && newImages && newImages.length > 0) {
        const imageRows = newImages.map(url => ({
          service_order_id: id,
          image_url: url,
        }));
        await supabase.from('service_order_images').insert(imageRows);
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

  if (newImages && newImages.length > 0) {
    const images = getStored<ServiceOrderImage>(STORAGE_KEY_ORDER_IMAGES, INITIAL_ORDER_IMAGES);
    newImages.forEach((url, i) => {
      images.push({
        id: `img-${Date.now()}-${i}`,
        service_order_id: id,
        image_url: url,
        created_at: new Date().toISOString(),
      });
    });
    setStored(STORAGE_KEY_ORDER_IMAGES, images);
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
      const notes = c.notes || (c.address_2 ? `Endereço 2: ${c.address_2}` : null);

      let { data: existing } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', cleanName)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('clients')
          .update({
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            document: document || undefined,
            notes: notes || undefined,
            image_url: c.image_url || undefined,
          })
          .eq('id', existing.id);

        clientIdMap.set(c.id, existing.id);
        clientIdMap.set(cleanName.toLowerCase(), existing.id);
        syncedClientsCount++;
      } else {
        const { data: created, error } = await supabase
          .from('clients')
          .insert([{
            name: cleanName,
            document,
            phone,
            email,
            address,
            notes,
            image_url: c.image_url || null,
          }])
          .select('id')
          .single();

        if (created) {
          clientIdMap.set(c.id, created.id);
          clientIdMap.set(cleanName.toLowerCase(), created.id);
          syncedClientsCount++;
        }
        if (error) console.error('Erro ao sincronizar cliente:', cleanName, error);
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
