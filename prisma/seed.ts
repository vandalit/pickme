import { UserRole, CustodyStatus, SessionStatus, AuthorizationType, AuthorizationStatus } from '@prisma/client';
import { prisma } from '../src/lib/db';

async function main() {
  console.log('🌱 Starting PickMe database seeding...');

  // 1. Limpieza de datos previos (idempotente)
  await prisma.incident.deleteMany();
  await prisma.pickupEvent.deleteMany();
  await prisma.pickupSession.deleteMany();
  await prisma.authorization.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.picker.deleteMany();
  await prisma.guardian.deleteMany();

  // 2. Escuela de Sofía (Escola Primaria San Martín)
  const school = await prisma.school.create({
    data: {
      name: 'Colegio San Martín',
      address: 'Av. Las Condes 1234, Santiago',
      emergencyPhone: '+56987654321',
      qrRefreshSecs: 300,
    },
  });
  console.log(`✅ Colegio creado: ${school.name} (${school.id})`);

  // 3. Usuarios Administrativos y Personal de Portón
  const sofia = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'sofia@sanmartin.edu',
      name: 'Sofía Valenzuela (Directora)',
      role: UserRole.SCHOOL_ADMIN,
    },
  });

  const staffCarlos = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'carlos.puertas@sanmartin.edu',
      name: 'Carlos Mendoza (Portón Principal)',
      role: UserRole.STAFF,
    },
  });
  console.log(`✅ Usuarios creados: Sofía (${sofia.role}), Carlos (${staffCarlos.role})`);

  // 4. Salones / Cursos
  const aula1A = await prisma.classroom.create({
    data: {
      schoolId: school.id,
      grade: '1° Básico',
      section: 'A',
    },
  });

  const aula2B = await prisma.classroom.create({
    data: {
      schoolId: school.id,
      grade: '2° Básico',
      section: 'B',
    },
  });
  console.log(`✅ Salones creados: 1° Básico A, 2° Básico B`);

  // 5. Apoderados Legales (Guardians)
  const apoderado1 = await prisma.guardian.create({
    data: {
      fullName: 'Carolina Herrera',
      whatsappNumber: '+56991112233',
    },
  });

  const apoderado2 = await prisma.guardian.create({
    data: {
      fullName: 'Roberto Gómez',
      whatsappNumber: '+56992223344',
    },
  });

  const apoderado3 = await prisma.guardian.create({
    data: {
      fullName: 'Marcela Silva',
      whatsappNumber: '+56993334455',
    },
  });

  // 6. Pickers (Personas Autorizadas a Retirar)
  const pickerTio = await prisma.picker.create({
    data: {
      fullName: 'Ignacio Herrera (Tío)',
      whatsappNumber: '+56981112233',
      relationship: 'Tío materno',
    },
  });

  const pickerFurgon = await prisma.picker.create({
    data: {
      fullName: 'Don Pedro (Transporte Escolar)',
      whatsappNumber: '+56984445566',
      relationship: 'Furgón Escolar',
    },
  });
  console.log(`✅ Apoderados y Pickers registrados`);

  // 7. Alumnos con asignación de Layer 0 (Animal + Color único por aula)
  const s1 = await prisma.student.create({
    data: {
      classroomId: aula1A.id,
      fullName: 'Mateo González Herrera',
      initials: 'M.G.',
      animalId: 'zorro',
      colorId: 'naranja',
      homeAddress: 'Calle Los Alerces 450, Depto 302',
    },
  });

  const s2 = await prisma.student.create({
    data: {
      classroomId: aula1A.id,
      fullName: 'Valentina Soto Gómez',
      initials: 'V.S.',
      animalId: 'delfin',
      colorId: 'celeste',
      homeAddress: 'Pasaje El Roble 12',
    },
  });

  const s3 = await prisma.student.create({
    data: {
      classroomId: aula1A.id,
      fullName: 'Lucas Morales Silva',
      initials: 'L.M.',
      animalId: 'osito',
      colorId: 'cafe',
      homeAddress: 'Av. El Parque 889',
    },
  });

  const s4 = await prisma.student.create({
    data: {
      classroomId: aula2B.id,
      fullName: 'Camila Rojas',
      initials: 'C.R.',
      animalId: 'leon',
      colorId: 'amarillo',
      homeAddress: 'Av. Las Tranqueras 120',
    },
  });

  const s5 = await prisma.student.create({
    data: {
      classroomId: aula2B.id,
      fullName: 'Joaquín Benítez',
      initials: 'J.B.',
      animalId: 'elefante',
      colorId: 'morado',
      homeAddress: 'Calle Nueva 44',
    },
  });

  const s6 = await prisma.student.create({
    data: {
      classroomId: aula2B.id,
      fullName: 'Isidora Castro',
      initials: 'I.C.',
      animalId: 'loro',
      colorId: 'verde',
      homeAddress: 'Av. Apoquindo 3000',
    },
  });

  // Vincular Alumnos con Apoderados
  await prisma.studentGuardian.createMany({
    data: [
      { studentId: s1.id, guardianId: apoderado1.id, isPrimary: true },
      { studentId: s2.id, guardianId: apoderado2.id, isPrimary: true },
      { studentId: s3.id, guardianId: apoderado3.id, isPrimary: true },
      { studentId: s4.id, guardianId: apoderado1.id, isPrimary: true },
      { studentId: s5.id, guardianId: apoderado2.id, isPrimary: true },
      { studentId: s6.id, guardianId: apoderado3.id, isPrimary: true },
    ],
  });

  // Crear Autorizaciones de Retiro
  await prisma.authorization.createMany({
    data: [
      {
        studentId: s1.id,
        pickerId: pickerTio.id,
        guardianId: apoderado1.id,
        type: AuthorizationType.PERMANENT,
        status: AuthorizationStatus.ACTIVE,
      },
      {
        studentId: s2.id,
        pickerId: pickerFurgon.id,
        guardianId: apoderado2.id,
        type: AuthorizationType.PERMANENT,
        status: AuthorizationStatus.ACTIVE,
      },
    ],
  });
  console.log(`✅ Alumnos y autorizaciones registradas`);

  // 8. Sesión de Retiro Activa
  const session = await prisma.pickupSession.create({
    data: {
      schoolId: school.id,
      sessionCode: 'SAN-1024',
      status: SessionStatus.OPEN,
      startedAt: new Date(),
    },
  });
  console.log(`✅ Sesión de retiro activa creada: ${session.sessionCode} (${session.id})`);

  // 9. Eventos iniciales de custodia dentro de la sesión activa
  // s1 está en portón (IN_PROCESS) porque el tío escaneó el QR
  await prisma.pickupEvent.create({
    data: {
      sessionId: session.id,
      studentId: s1.id,
      pickerId: pickerTio.id,
      status: CustodyStatus.IN_PROCESS,
      pickerScannedAt: new Date(),
      handoverCode: '849201',
      handoverExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
  });

  // s2 está esperando (WAITING) en el patio
  await prisma.pickupEvent.create({
    data: {
      sessionId: session.id,
      studentId: s2.id,
      status: CustodyStatus.WAITING,
    },
  });

  // s3 entregado exitosamente (HANDOVER / ARRIVED)
  await prisma.pickupEvent.create({
    data: {
      sessionId: session.id,
      studentId: s3.id,
      staffId: staffCarlos.id,
      status: CustodyStatus.ARRIVED,
      pickerScannedAt: new Date(Date.now() - 25 * 60 * 1000),
      staffConfirmedAt: new Date(Date.now() - 20 * 60 * 1000),
      arrivedAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  // Alumnos de 2° Básico esperando
  await prisma.pickupEvent.createMany({
    data: [
      { sessionId: session.id, studentId: s4.id, status: CustodyStatus.WAITING },
      { sessionId: session.id, studentId: s5.id, status: CustodyStatus.WAITING },
      { sessionId: session.id, studentId: s6.id, status: CustodyStatus.WAITING },
    ],
  });

  console.log(`✅ Cadena de custodia inicial generada (WAITING, IN_PROCESS, ARRIVED)`);
  console.log('🎉 Seed finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
