-- ==============================================================================
-- SCHEMA BANCO DE DADOS CENTRALIZADO: TERMOLUC REFRIGERAÇÃO
-- ==============================================================================
-- Todos os administradores autenticados compartilham e visualizam a mesma base
-- de dados em tempo real.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (Administradores)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Técnicos Oficiais
CREATE TABLE IF NOT EXISTS public.technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialty TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Clientes (com suporte a múltiplos endereços e rastreabilidade de ADM)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    address_2 TEXT,
    address_3 TEXT,
    notes TEXT,
    image_url TEXT,
    created_by TEXT DEFAULT 'Alesandro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT,
    capacity TEXT,
    installation_location TEXT,
    installation_date DATE,
    notes TEXT,
    image_url TEXT,
    created_by TEXT DEFAULT 'Alesandro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sequência e Tabela de Ordens de Serviço (OS)
CREATE SEQUENCE IF NOT EXISTS service_order_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE RESTRICT,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em andamento', 'Concluída', 'Cancelada')),
    value NUMERIC(10, 2),
    created_by TEXT DEFAULT 'Alesandro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Imagens das Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.service_order_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TRIGGER PARA GERAR NÚMERO DE OS AUTOMÁTICO (ex: OS-2026-1001)
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_os_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'OS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('service_order_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_os_number ON public.service_orders;
CREATE TRIGGER trigger_generate_os_number
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION generate_os_number();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - ACESSO TOTAL ENTRE ADMINISTRADORES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users have full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access to technicians" ON public.technicians FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access to clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access to equipment" ON public.equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access to service_orders" ON public.service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users have full access to service_order_images" ON public.service_order_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKETS (Para fotos de clientes, equipamentos e OS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('termoluc-media', 'termoluc-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public media access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'termoluc-media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'termoluc-media');
CREATE POLICY "Authenticated users can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'termoluc-media');
CREATE POLICY "Authenticated users can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'termoluc-media');

-- ==============================================================================
-- DADOS INICIAIS (SEED) DOS TÉCNICOS OFICIAIS TERMOLUC
-- ==============================================================================
INSERT INTO public.technicians (name, phone, specialty, active)
VALUES 
  ('Alessandro Araújo', '(11) 98765-4321', 'Refrigeração e Climatização', true),
  ('Carlos Alberto', '(11) 97654-3210', 'Sistemas VRF e Splits', true),
  ('Marquinhos', '(11) 96543-2109', 'Câmaras Frigoríficas e Manutenção', true)
ON CONFLICT DO NOTHING;
