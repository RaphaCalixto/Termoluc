import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Client, Equipment, Technician, ServiceOrder, ServiceOrderImage, DashboardMetrics } from '../types';

const STORAGE_KEY_CLIENTS = 'termoluc_clients_v3';
const STORAGE_KEY_EQUIPMENT = 'termoluc_equipment_v3';
const STORAGE_KEY_TECHNICIANS = 'termoluc_technicians_v3';
const STORAGE_KEY_ORDERS = 'termoluc_service_orders_v3';
const STORAGE_KEY_ORDER_IMAGES = 'termoluc_order_images_v3';

// BroadcastChannel para sincronização em tempo real entre abas/janelas
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('termoluc_sync_channel')
  : null;

export function notifyDataChange(entity: string) {
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DATA_CHANGED', entity, timestamp: Date.now() });
  }
}

export function subscribeToDataChanges(callback: (entity: string) => void) {
  if (!syncChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'DATA_CHANGED') {
      callback(event.data.entity);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel.removeEventListener('message', handler);
}

// -------------------------------------------------------------
// DADOS REAIS OFICIAIS TERMOLUC
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
// CLIENTS API
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
          return data;
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
        .single();
      if (!error && data) return data;
      if (error) console.warn('Supabase getClientById:', error.message);
    } catch {
      // Fallback
    }
  }
  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
  return clients.find(c => c.id === id) || null;
}

export async function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
  const fallbackId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const created_by = clientData.created_by || 'Alesandro';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          document: clientData.document || null,
          phone: clientData.phone,
          email: clientData.email,
          address: clientData.address,
          address_2: clientData.address_2 || null,
          address_3: clientData.address_3 || null,
          notes: clientData.notes || null,
          image_url: clientData.image_url || null,
          created_by,
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

  const newClient: Client = {
    ...clientData,
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

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: updates.name,
          document: updates.document,
          phone: updates.phone,
          email: updates.email,
          address: updates.address,
          address_2: updates.address_2,
          address_3: updates.address_3,
          notes: updates.notes,
          image_url: updates.image_url,
          updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        notifyDataChange('clients');
        const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
        const idx = clients.findIndex(c => c.id === id);
        if (idx !== -1) {
          clients[idx] = data;
          setStored(STORAGE_KEY_CLIENTS, clients);
        }
        return data;
      } else if (error) {
        console.error('Erro no Supabase ao atualizar cliente:', error);
      }
    } catch (err) {
      console.error('Erro de rede ao atualizar cliente no Supabase:', err);
    }
  }

  const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Cliente não encontrado');
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
// EQUIPMENT API
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

      if (!error && data && data.length > 0) {
        return data.map((item: any) => {
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

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
        .from('equipment')
        .insert([{
          client_id: primaryClientId,
          client_ids: ids,
          type: data.type,
          brand: data.brand,
          model: data.model,
          serial_number: data.serial_number || null,
          capacity: data.capacity || null,
          address: data.address || null,
          installation_location: data.installation_location || null,
          installation_date: data.installation_date || null,
          notes: data.notes || null,
          image_url: data.image_url || (data.images && data.images[0]) || null,
          images: data.images || [],
          created_by,
        }])
        .select()
        .single();

      if (!error && created) {
        notifyDataChange('equipment');
        return (await getEquipmentById(created.id)) || created;
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

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          ...(primaryClientId ? { client_id: primaryClientId } : {}),
          ...(ids ? { client_ids: ids } : {}),
          type: updates.type,
          brand: updates.brand,
          model: updates.model,
          serial_number: updates.serial_number,
          capacity: updates.capacity,
          address: updates.address,
          installation_location: updates.installation_location,
          installation_date: updates.installation_date,
          notes: updates.notes,
          image_url: updates.image_url,
          images: updates.images,
          updated_at,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
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

export async function createServiceOrder(
  data: Omit<ServiceOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'client' | 'clients' | 'equipment' | 'technician' | 'images'>,
  imageUrls: string[] = []
): Promise<ServiceOrder> {
  const ids: string[] = data.client_ids && data.client_ids.length > 0
    ? data.client_ids
    : data.client_id ? [data.client_id] : [];
  const primaryClientId = ids[0] || data.client_id || '';
  const created_by = data.created_by || 'Alesandro';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: created, error } = await supabase
        .from('service_orders')
        .insert([{
          client_id: primaryClientId,
          client_ids: ids,
          equipment_id: data.equipment_id || null,
          technician_id: data.technician_id,
          service_date: data.service_date,
          description: data.description,
          notes: data.notes || null,
          status: data.status,
          value: data.value || null,
          created_by,
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

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({
          ...(primaryClientId ? { client_id: primaryClientId } : {}),
          ...(ids ? { client_ids: ids } : {}),
          equipment_id: updates.equipment_id,
          technician_id: updates.technician_id,
          service_date: updates.service_date,
          description: updates.description,
          notes: updates.notes,
          status: updates.status,
          value: updates.value,
          updated_at,
        })
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

// -------------------------------------------------------------
// SINCRONIZAÇÃO COMPLETA LOCAL -> SUPABASE POSTGRESQL
// -------------------------------------------------------------
export async function syncAllDataToSupabase(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase não está configurado no arquivo .env' };
  }

  try {
    const clients = getStored<Client>(STORAGE_KEY_CLIENTS, INITIAL_CLIENTS);
    const equipment = getStored<Equipment>(STORAGE_KEY_EQUIPMENT, INITIAL_EQUIPMENT);
    const technicians = getStored<Technician>(STORAGE_KEY_TECHNICIANS, INITIAL_TECHNICIANS);
    const orders = getStored<ServiceOrder>(STORAGE_KEY_ORDERS, INITIAL_SERVICE_ORDERS);

    // 1. Sincroniza Técnicos
    const techIdMap = new Map<string, string>();
    for (const t of technicians) {
      const { data: existing } = await supabase
        .from('technicians')
        .select('id')
        .eq('name', t.name)
        .maybeSingle();

      if (existing) {
        techIdMap.set(t.id, existing.id);
      } else {
        const { data: created, error } = await supabase
          .from('technicians')
          .insert([{
            name: t.name,
            phone: t.phone,
            email: t.email,
            specialty: t.specialty,
            active: t.active,
          }])
          .select('id')
          .single();
        if (created) techIdMap.set(t.id, created.id);
        if (error) console.error('Erro ao sincronizar técnico:', error);
      }
    }

    // 2. Sincroniza Clientes
    const clientIdMap = new Map<string, string>();
    for (const c of clients) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('name', c.name)
        .maybeSingle();

      if (existing) {
        clientIdMap.set(c.id, existing.id);
      } else {
        const { data: created, error } = await supabase
          .from('clients')
          .insert([{
            name: c.name,
            document: c.document,
            phone: c.phone,
            email: c.email,
            address: c.address,
            address_2: c.address_2,
            address_3: c.address_3,
            notes: c.notes,
            image_url: c.image_url,
            created_by: c.created_by || 'Alesandro',
          }])
          .select('id')
          .single();
        if (created) clientIdMap.set(c.id, created.id);
        if (error) console.error('Erro ao sincronizar cliente:', error);
      }
    }

    // 3. Sincroniza Equipamentos
    const equipIdMap = new Map<string, string>();
    for (const e of equipment) {
      const targetClientId = clientIdMap.get(e.client_id) || e.client_id;
      if (!targetClientId || targetClientId.startsWith('client-')) continue;

      const { data: existing } = await supabase
        .from('equipment')
        .select('id')
        .eq('model', e.model)
        .eq('client_id', targetClientId)
        .maybeSingle();

      if (existing) {
        equipIdMap.set(e.id, existing.id);
      } else {
        const { data: created, error } = await supabase
          .from('equipment')
          .insert([{
            client_id: targetClientId,
            type: e.type,
            brand: e.brand,
            model: e.model,
            serial_number: e.serial_number,
            capacity: e.capacity,
            installation_location: e.installation_location,
            installation_date: e.installation_date || null,
            notes: e.notes,
            image_url: e.image_url || (e.images && e.images[0]) || null,
            images: e.images || [],
            created_by: e.created_by || 'Alesandro',
          }])
          .select('id')
          .single();
        if (created) equipIdMap.set(e.id, created.id);
        if (error) console.error('Erro ao sincronizar equipamento:', error);
      }
    }

    // 4. Sincroniza Ordens de Serviço
    for (const o of orders) {
      const targetClientId = clientIdMap.get(o.client_id) || o.client_id;
      const targetTechId = techIdMap.get(o.technician_id) || o.technician_id;
      const targetEquipId = o.equipment_id ? (equipIdMap.get(o.equipment_id) || null) : null;

      if (!targetClientId || targetClientId.startsWith('client-')) continue;
      if (!targetTechId || targetTechId.startsWith('tech-')) continue;

      const { data: existing } = await supabase
        .from('service_orders')
        .select('id')
        .eq('order_number', o.order_number)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('service_orders')
          .insert([{
            order_number: o.order_number,
            client_id: targetClientId,
            equipment_id: targetEquipId,
            technician_id: targetTechId,
            service_date: o.service_date,
            description: o.description,
            notes: o.notes,
            status: o.status,
            value: o.value,
            created_by: o.created_by || 'Alesandro',
          }]);
        if (error) console.error('Erro ao sincronizar OS:', error);
      }
    }

    notifyDataChange('clients');
    notifyDataChange('equipment');
    notifyDataChange('orders');
    return { success: true, message: 'Dados sincronizados com o Supabase com sucesso!' };
  } catch (err: any) {
    console.error('Erro durante a sincronização:', err);
    return { success: false, message: err.message || 'Erro ao sincronizar com o banco de dados.' };
  }
}
