import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const steps: string[] = [];

  try {
    // Create tables
    steps.push('Creating customers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        property_size VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    steps.push('Creating services table...');
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        default_price DECIMAL(10,2),
        duration_minutes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    steps.push('Creating jobs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        service_id UUID REFERENCES services(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'scheduled',
        scheduled_date DATE,
        scheduled_time TIME,
        completed_date DATE,
        price DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    steps.push('Creating invoices table...');
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    steps.push('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`;

    // Seed default services
    steps.push('Checking for existing services...');
    const existingServices = await sql`SELECT COUNT(*) as count FROM services`;

    if (Number(existingServices[0].count) === 0) {
      steps.push('Seeding default services...');
      const defaultServices = [
        { name: 'Lawn Mowing', description: 'Standard lawn mowing service', price: 45, duration: 60 },
        { name: 'Hedge Trimming', description: 'Trim and shape hedges', price: 65, duration: 90 },
        { name: 'Leaf Removal', description: 'Seasonal leaf cleanup', price: 85, duration: 120 },
        { name: 'Fertilization', description: 'Lawn fertilization treatment', price: 55, duration: 45 },
        { name: 'Aeration', description: 'Core aeration for lawn health', price: 95, duration: 90 },
        { name: 'Spring Cleanup', description: 'Full spring yard cleanup', price: 150, duration: 180 },
        { name: 'Fall Cleanup', description: 'Full fall yard cleanup', price: 175, duration: 240 },
        { name: 'Mulching', description: 'Mulch installation', price: 120, duration: 120 },
      ];

      for (const svc of defaultServices) {
        await sql`
          INSERT INTO services (name, description, default_price, duration_minutes)
          VALUES (${svc.name}, ${svc.description}, ${svc.price}, ${svc.duration})
        `;
      }
      steps.push('Default services added!');
    } else {
      steps.push('Services already exist, skipping seed');
    }

    // Seed sample data
    steps.push('Checking for existing customers...');
    const existingCustomers = await sql`SELECT COUNT(*) as count FROM customers`;

    if (Number(existingCustomers[0].count) === 0) {
      steps.push('Seeding sample customers...');
      const customers = [
        { name: 'John Smith', email: 'john@example.com', phone: '(555) 123-4567', address: '123 Oak Street', city: 'Springfield', state: 'IL', zip: '62701', property_size: 'Medium (1/4 - 1/2 acre)' },
        { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '(555) 234-5678', address: '456 Maple Ave', city: 'Springfield', state: 'IL', zip: '62702', property_size: 'Large (1/2 - 1 acre)' },
        { name: 'Mike Williams', email: 'mike@example.com', phone: '(555) 345-6789', address: '789 Pine Road', city: 'Springfield', state: 'IL', zip: '62703', property_size: 'Small (under 1/4 acre)' },
      ];

      for (const c of customers) {
        await sql`
          INSERT INTO customers (name, email, phone, address, city, state, zip, property_size)
          VALUES (${c.name}, ${c.email}, ${c.phone}, ${c.address}, ${c.city}, ${c.state}, ${c.zip}, ${c.property_size})
        `;
      }

      // Get IDs for sample jobs
      const customerIds = await sql`SELECT id FROM customers LIMIT 3`;
      const serviceIds = await sql`SELECT id FROM services LIMIT 3`;

      if (customerIds.length > 0 && serviceIds.length > 0) {
        steps.push('Seeding sample jobs...');
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

        await sql`
          INSERT INTO jobs (customer_id, service_id, title, status, scheduled_date, scheduled_time, price)
          VALUES
            (${customerIds[0].id}, ${serviceIds[0].id}, 'Weekly Lawn Mowing', 'scheduled', ${today}, '09:00', 45),
            (${customerIds[1].id}, ${serviceIds[1].id}, 'Hedge Trimming', 'scheduled', ${tomorrow}, '10:00', 65),
            (${customerIds[2].id}, ${serviceIds[0].id}, 'Lawn Mowing', 'scheduled', ${nextWeek}, '08:00', 45)
        `;
      }
      steps.push('Sample data added!');
    } else {
      steps.push('Customers already exist, skipping sample data');
    }

    steps.push('Setup complete!');

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      steps,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database setup failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        steps,
      },
      { status: 500 }
    );
  }
}
