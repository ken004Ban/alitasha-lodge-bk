CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    accepting_bookings BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    room_number TEXT,
    room_type TEXT NOT NULL,
    price_per_night DECIMAL NOT NULL,
    availability BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE visitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path TEXT NOT NULL,
    country TEXT,
    city TEXT,
    browser TEXT,
    device TEXT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_logs_branch_id ON visitor_logs (branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id ON bookings (branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Seed the 3 demo branches
INSERT INTO branches (name, location, accepting_bookings) VALUES
('Kasama', 'Kasama, Zambia', true),
('Mansa', 'Mansa, Zambia', true),
('Mpika', 'Mpika, Zambia', true);
