export type OSStatus = 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  avatar_url?: string;
}

export interface Client {
  id: string;
  name: string; // Nome / Razão Social
  document?: string; // CPF ou CNPJ
  phone: string;
  email: string;
  address: string; // Endereço Principal (1)
  address_2?: string; // Endereço 2 (Opcional)
  address_3?: string; // Endereço 3 (Opcional)
  notes?: string;
  image_url?: string;
  created_by?: string; // Nome do Administrador que cadastrou
  created_at: string;
  updated_at?: string;
}

export interface Equipment {
  id: string;
  client_id: string; // Cliente principal (compatibilidade)
  client_ids?: string[]; // Suporte a múltiplos clientes proprietários (casais, sócios, etc.)
  type: string; // ex: Ar-condicionado Split, Câmara Frigorífica, Chiller, Freezer, Balcão Refrigerado
  brand: string; // ex: Daikin, Carrier, LG, Elgin, Bitzer
  model: string;
  serial_number?: string;
  capacity?: string; // ex: 18.000 BTU, 5 HP, 2.5 TR
  address?: string; // Endereço/Imóvel onde este equipamento está instalado
  installation_location?: string; // ex: Sala de Reunião 2, Quarto 1, Cozinha Industrial
  installation_date?: string;
  notes?: string;
  image_url?: string;
  images?: string[]; // Múltiplas fotos do maquinário (plaqueta, evaporadora, condensadora, etc.)
  created_by?: string; // Nome do Administrador que cadastrou
  created_at: string;
  updated_at?: string;
  // Campos virtuais / joins
  client_name?: string;
  clients?: Client[];
}

export interface Technician {
  id: string;
  name: string; // Alessandro Araújo, Carlos Alberto, Marquinhos
  phone?: string;
  email?: string;
  specialty?: string;
  active: boolean;
  created_at: string;
}

export interface ServiceOrderImage {
  id: string;
  service_order_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface ServiceOrder {
  id: string;
  order_number: string; // ex: OS-2026-0001
  client_id: string; // Cliente principal (compatibilidade)
  client_ids?: string[]; // Suporte a múltiplos clientes vinculados (casais, sócios, etc.)
  equipment_id?: string | null;
  technician_id: string;
  service_date: string; // Data em que o serviço foi realizado
  description: string; // Descrição detalhada do serviço
  notes?: string;
  status: OSStatus;
  value?: number;
  created_by?: string; // Nome do Administrador que cadastrou a OS
  created_at: string;
  updated_at?: string;
  
  // Relacionamentos expandidos
  client?: Client;
  clients?: Client[];
  equipment?: Equipment | null;
  technician?: Technician;
  images?: ServiceOrderImage[];
}

export interface DashboardMetrics {
  totalClients: number;
  totalEquipment: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  monthOrders: number;
}
