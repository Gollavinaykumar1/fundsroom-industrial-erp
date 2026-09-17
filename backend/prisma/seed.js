import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const products = [
  ['IP-001','Industrial Pump A','Pumps','Unit',45000,200],
  ['IP-002','Industrial Valve B','Valves','Unit',12500,150],
  ['IP-003','Hydraulic Motor C','Motors','Unit',38000,100],
  ['IP-004','Steel Bearing D','Bearings','Unit',3200,500],
  ['IP-005','Pressure Gauge E','Instrumentation','Unit',4800,250],
  ['IP-006','Conveyor Belt F','Material Handling','Meter',1850,1000]
];

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const salesPassword = await bcrypt.hash('Sales@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@fundsroom.com' },
    update: {},
    create: { name:'ERP Admin', email:'admin@fundsroom.com', password:adminPassword, role:'ADMIN' }
  });
  await prisma.user.upsert({
    where: { email: 'sales@fundsroom.com' },
    update: {},
    create: { name:'Sales User', email:'sales@fundsroom.com', password:salesPassword, role:'SALES' }
  });

  for (const [code,name,category,unit,price,physical] of products) {
    const p = await prisma.product.upsert({
      where: { code },
      update: {},
      create: { code,name,category,unit,basePrice:price }
    });
    await prisma.inventory.upsert({
      where: { productId:p.id },
      update: {},
      create: { productId:p.id, physical, reserved:0 }
    });
  }

  const customer = await prisma.customer.findFirst({ where:{companyName:'ABC Engineering Pvt. Ltd.'} });
  if (!customer) {
    await prisma.customer.create({
      data:{
        companyName:'ABC Engineering Pvt. Ltd.',
        contactPerson:'Rahul Sharma',
        mobile:'9876543210',
        email:'purchase@abcengineering.com',
        city:'Bengaluru'
      }
    });
  }
  console.log('Seed complete.');
}

main().finally(()=>prisma.$disconnect());
