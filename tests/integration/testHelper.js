const fs = require('fs');
const path = require('path');
const { parseStudentsCSV } = require('../../dist/lib/csvImporter');
const { assignNextAvailableAvatar } = require('../../dist/lib/avatarAssigner');

const TEST_SCHOOL_NAME = 'Colegio QA Automatizado';

async function cleanupTestSchool(prisma) {
  const school = await prisma.school.findFirst({ where: { name: TEST_SCHOOL_NAME } });
  if (!school) return;

  await prisma.pickupEvent.deleteMany({
    where: { session: { schoolId: school.id } },
  });
  await prisma.pickupSession.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.authorization.deleteMany({
    where: { student: { classroom: { schoolId: school.id } } },
  });
  await prisma.studentGuardian.deleteMany({
    where: { student: { classroom: { schoolId: school.id } } },
  });
  await prisma.student.deleteMany({
    where: { classroom: { schoolId: school.id } },
  });
  await prisma.classroom.deleteMany({
    where: { schoolId: school.id },
  });
  await prisma.school.delete({
    where: { id: school.id },
  });
}

async function setupTestSchool(prisma) {
  await cleanupTestSchool(prisma);

  const school = await prisma.school.create({
    data: {
      name: TEST_SCHOOL_NAME,
      address: 'Av. Test QA 1234, Santiago',
      emergencyPhone: '+56990000000',
    },
  });

  const c1 = await prisma.classroom.create({
    data: { schoolId: school.id, grade: '1° Básico', section: 'A' },
  });
  const c2 = await prisma.classroom.create({
    data: { schoolId: school.id, grade: '2° Básico', section: 'B' },
  });

  const classroomMap = {
    '1° Básico A': c1.id,
    '2° Básico B': c2.id,
  };

  const csvContent = fs.readFileSync(
    path.join(__dirname, '../../public/nomina_alumnos_mock.csv'),
    'utf-8'
  );
  const { validRows } = parseStudentsCSV(csvContent);

  for (const row of validRows) {
    const classroomId = classroomMap[row.gradeSection];
    if (!classroomId) continue;

    const existingStudents = await prisma.student.findMany({
      where: { classroomId },
      select: { animalId: true, colorId: true },
    });

    const usedPairs = existingStudents.map((s) => ({
      animalId: s.animalId,
      colorId: s.colorId,
    }));
    const avatar = assignNextAvailableAvatar(usedPairs);

    const nameParts = row.fullName.trim().split(/\s+/);
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}.${nameParts[nameParts.length - 1][0]}.`
      : `${nameParts[0][0]}.`;

    const student = await prisma.student.create({
      data: {
        classroomId,
        fullName: row.fullName,
        initials,
        animalId: avatar.animalId,
        colorId: avatar.colorId,
        status: row.status,
      },
    });

    const guardian = await prisma.guardian.upsert({
      where: { whatsappNumber: row.guardianPhone },
      create: { fullName: row.guardianName, whatsappNumber: row.guardianPhone },
      update: { fullName: row.guardianName },
    });

    await prisma.studentGuardian.create({
      data: { studentId: student.id, guardianId: guardian.id, isPrimary: true },
    });

    if (row.pickerName) {
      const pickerPhone = `+5698000${String(student.id).slice(0, 4)}`;
      const picker = await prisma.picker.upsert({
        where: { whatsappNumber: pickerPhone },
        create: {
          whatsappNumber: pickerPhone,
          fullName: row.pickerName,
          relationship: row.pickerRelationship || 'Familiar Autorizado',
        },
        update: {
          fullName: row.pickerName,
          relationship: row.pickerRelationship || 'Familiar Autorizado',
        },
      });

      await prisma.authorization.create({
        data: {
          studentId: student.id,
          pickerId: picker.id,
          guardianId: guardian.id,
          type: 'PERMANENT',
          status: 'ACTIVE',
        },
      });
    }
  }

  return school;
}

module.exports = {
  TEST_SCHOOL_NAME,
  setupTestSchool,
  cleanupTestSchool,
};
