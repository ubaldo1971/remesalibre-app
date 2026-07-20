-- Raite Envíos - Delivery Module Schema
-- Extends the core RemesaLibre schema

-- Drivers Table (Extension of Users)
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) DEFAULT 'sedan', -- 'motorcycle', 'sedan', 'van'
  plate_number VARCHAR(20),
  license_number VARCHAR(50),
  is_active BOOLEAN DEFAULT false, -- Toggle 'En Línea'
  is_delivery_enabled BOOLEAN DEFAULT false, -- Toggle 'Modo Envíos'
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 5.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Delivery Pricing Configuration
CREATE TABLE delivery_pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_code VARCHAR(10) DEFAULT 'default',
  base_fee_small DECIMAL(10, 2) DEFAULT 35.00,
  base_fee_medium DECIMAL(10, 2) DEFAULT 45.00,
  base_fee_large DECIMAL(10, 2) DEFAULT 60.00,
  price_per_km DECIMAL(10, 2) DEFAULT 8.00,
  urgency_multiplier_max DECIMAL(3, 2) DEFAULT 2.00,
  platform_fee_percent DECIMAL(4, 3) DEFAULT 0.250, -- 25%
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Orders
CREATE TABLE delivery_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number VARCHAR(20) UNIQUE NOT NULL, -- "RTE-XXXX"
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES users(id),
  
  -- Driver (Nullable initially)
  driver_id UUID REFERENCES drivers(id),
  
  -- Status flow
  status VARCHAR(20) DEFAULT 'created', 
  -- 'created', 'assigned', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff', 'delivered', 'cancelled'
  
  -- Order Details
  order_type VARCHAR(20) DEFAULT 'on_demand', -- 'on_demand', 'scheduled'
  package_size VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  
  -- Locations (Stored as JSON for flexibility with various map providers)
  pickup_location JSONB NOT NULL, -- { lat, lng, address, instructions, contact }
  dropoff_location JSONB NOT NULL, -- { lat, lng, address, instructions, contact }
  
  -- Financials (Snapshot at creation)
  base_fee DECIMAL(10, 2) NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  distance_fee DECIMAL(10, 2) NOT NULL,
  urgency_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  total_price DECIMAL(10, 2) NOT NULL,
  driver_earnings DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  
  -- Timestamps
  scheduled_at TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Proof of Delivery
  proof_photo_url TEXT,
  proof_signature TEXT,
  receiver_name VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Delivery
CREATE INDEX idx_drivers_status ON drivers(is_active, is_delivery_enabled);
CREATE INDEX idx_drivers_location ON drivers(current_lat, current_lng); -- For geospatial queries later
CREATE INDEX idx_delivery_customer ON delivery_orders(customer_id);
CREATE INDEX idx_delivery_driver ON delivery_orders(driver_id);
CREATE INDEX idx_delivery_status ON delivery_orders(status);
CREATE INDEX idx_delivery_tracking ON delivery_orders(tracking_number);

-- Triggers for Updated At
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at BEFORE UPDATE ON delivery_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Pricing
INSERT INTO delivery_pricing_config (city_code, is_active) VALUES ('default', true);
