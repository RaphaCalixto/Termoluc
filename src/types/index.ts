export type OSStatus = 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  technician_id?: string;
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
  password?: string; // Senha de acesso individual ao sistema
  created_at: string;
  updated_at?: string;
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

export type ScheduleStatus = 'Agendado' | 'Confirmado' | 'Em andamento' | 'Concluído' | 'Cancelado';

export interface Schedule {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone?: string;
  equipment_id?: string | null;
  equipment_name?: string;
  technician_id?: string;
  technician_name?: string;
  service_date: string; // YYYY-MM-DD
  service_time: string; // HH:mm (ex: '09:00')
  service_type: string; // 'Instalação', 'Manutenção Preventiva', etc.
  description?: string;
  address?: string;
  status: ScheduleStatus;
  value?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;

  // Relacionamentos expandidos
  client?: Client;
  equipment?: Equipment | null;
  technician?: Technician;
}

export type ReportCategory = 'Limpeza' | 'Manutenção' | 'Instalação' | 'Laudo';

export interface VistoriaReportData {
  report_code: string; // ex: RT-2026/104-LEB
  date_formatted: string; // ex: "Outubro de 2026"
  equipment_summary: string; // ex: "Samsung Wind Free 18k"
  operational_status: string; // ex: "REQUER INTERVENÇÃO"
  ambient: string; // ex: "Sala Administração"
  equipment_brand_model: string; // ex: "Ar Split Samsung Wind Free"
  capacity: string; // ex: "18.000 BTUs"
  current_condition: string; // ex: "DESCONTINUADO / FALHA"
  diagnosis: string; // texto da constatação na vistoria
  proposed_procedures: { title: string; description: string }[];
  client_signature_name?: string; // ex: "Cliente / Sala Administração"
  address_line?: string; // ex: "Rua Carlos Gois, 422 - Leblon, Rio de Janeiro/RJ"
}

export interface LimpezaEquipmentItem {
  id: string;
  ambient: string; // ex: "Sala TV"
  equipment_model: string; // ex: "LG Split Hi-Wall 18.000 BTUs"
  service_executed: string; // ex: "Higienização + Lavagem"
  pressure: string; // ex: "130 PSI - OK"
  condenser_status: string; // ex: "LIMPA"
  general_status: string; // ex: "OK"
}

export interface LimpezaReportData {
  report_code: string; // ex: RT-2026/089-BOT
  subtitle?: string; // ex: "Serviço Técnico de Sanitização e Aferição Operacional em Sistemas Split Hi-Wall"
  date_formatted: string; // ex: "Outubro de 2026"
  operational_status: string; // ex: "100% CONCLUÍDO & OPERACIONAL"
  client_address_full: string; // ex: "Av. Lauro Sodré, nº 150, Bloco 3, Apt 209\nBotafogo, Rio de Janeiro / RJ – CEP: 22290-070"
  kpi_evaporators_clean: string; // ex: "06 Unid."
  kpi_condensers_clean: string; // ex: "06 Unid."
  kpi_pressure: string; // ex: "130 PSI"
  kpi_efficiency: string; // ex: "100%"
  initial_scope: string; // texto do escopo e inspeção inicial
  items: LimpezaEquipmentItem[];
  procedures: { title: string; description: string }[];
  conclusion: string; // conclusão de desempenho e segurança operacional
  preventive_recommendations: string[]; // lista de recomendações
  city_date?: string; // ex: "Rio de Janeiro, 05 de Outubro de 2026"
}

export interface InstalacaoEquipmentItem {
  id: string;
  ambient: string; // ex: "Quarto Filho"
  equipment_brand_model: string; // ex: "Midea Split Hi-Wall (Novo)"
  capacity: string; // ex: "9.000 BTUs"
  service_type: string; // ex: "INSTALAÇÃO NOVA"
  status: string; // ex: "OPERACIONAL"
}

export interface InstalacaoReportData {
  report_code: string; // ex: RT-2026/092-LEB
  subtitle?: string; // ex: "Serviço Técnico de Implantação e Montagem de Novos Sistemas Split Hi-Wall"
  date_formatted: string; // ex: "Outubro de 2026"
  operational_status: string; // ex: "100% CONCLUÍDO & TESTADO"
  client_address_full: string; // ex: "Rua Almirante Guilhem, nº 454, Bloco 1, Apt 603\nLeblon, Rio de Janeiro / RJ – CEP: 22440-000"
  kpi_new_installations: string; // ex: "02 Unid."
  kpi_total_operating: string; // ex: "02 Unid."
  kpi_vacuum_level: string; // ex: "< 500 µ"
  kpi_tightness: string; // ex: "100%"
  initial_scope: string; // escopo das intervenções técnicas focado em instalação
  items: InstalacaoEquipmentItem[];
  procedures: { title: string; description: string }[];
  commissioning_conclusion: string; // parecer de comissionamento e liberação
  manufacturer_recommendations: string[]; // recomendações do fabricante e operação
  city_date?: string; // ex: "Rio de Janeiro, 09 de Outubro de 2026."
}

export interface Report {
  id: string;
  title: string;
  category: ReportCategory;
  report_type?: 'vistoria' | 'limpeza' | 'instalacao' | 'arquivo'; // Tipo do modelo oficial
  report_code?: string; // ex: RT-2026/104-LEB
  client_id?: string | null;
  client_name?: string;
  equipment_id?: string | null;
  equipment_name?: string;
  service_order_id?: string | null;
  service_order_number?: string;
  technician_name?: string;
  file_url: string;
  file_name: string;
  file_size?: number; // em bytes
  report_date: string; // YYYY-MM-DD
  notes?: string;
  vistoria_data?: VistoriaReportData;
  limpeza_data?: LimpezaReportData;
  instalacao_data?: InstalacaoReportData;
  created_by?: string;
  created_at: string;
  updated_at?: string;

  // Relacionamentos expandidos
  client?: Client;
  equipment?: Equipment | null;
}

