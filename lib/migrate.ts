import sql from './db';

export async function runMigrations() {
  // Create customers table
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id VARCHAR(20) UNIQUE,
      received_at TIMESTAMPTZ,
      brand VARCHAR(50),
      customer_name VARCHAR(50),
      ssn VARCHAR(20),
      phone VARCHAR(20),
      address TEXT,
      account TEXT,
      model_code VARCHAR(100),
      color VARCHAR(50),
      contract_period VARCHAR(20),
      service_type VARCHAR(50),
      monthly_fee INTEGER,
      promotion TEXT[],
      desired_install_date VARCHAR(100),
      scheduled_install_date DATE,
      status VARCHAR(20) DEFAULT '접수완료',
      memo TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create db_leads table
  await sql`
    CREATE TABLE IF NOT EXISTS db_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) NOT NULL,
      customer_name VARCHAR(50),
      memo TEXT,
      status VARCHAR(20) DEFAULT '상담전',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Create updated_at trigger function
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `;

  // Apply trigger to customers table
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at'
      ) THEN
        CREATE TRIGGER update_customers_updated_at
          BEFORE UPDATE ON customers
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      END IF;
    END;
    $$
  `;

  return { success: true, message: 'Migrations completed successfully' };
}
