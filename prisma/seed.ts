import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deviceId = 'vivero-nodo-01';

  // Registrar o asegurar dispositivo
  await prisma.device.upsert({
    where: { id: deviceId },
    update: {},
    create: {
      id: deviceId,
      name: 'Nodo Principal - Invernadero 1',
      location: 'Sector Germinación y Plantines',
    },
  });

  // Limpiar mediciones anteriores de prueba para dejar un conjunto limpio y realista
  await prisma.measurement.deleteMany({
    where: { deviceId },
  });

  const now = new Date();
  const measurementsData = [];

  // Generar 48 puntos de datos (las últimas 24 horas, cada 30 minutos)
  for (let i = 48; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000);
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;

    // Simulación del ciclo circadiano diurno/nocturno
    const isDay = hour >= 6 && hour <= 19;
    const peakSun = Math.max(0, Math.sin(((hour - 6) / 13) * Math.PI));

    const temperature = Number((19.0 + peakSun * 7.5 + (Math.random() - 0.5) * 0.8).toFixed(1));
    const humidity = Number((78.0 - peakSun * 20.0 + (Math.random() - 0.5) * 2.0).toFixed(1));
    const soilMoisture = Number((62.0 - (i % 24) * 0.7 + (Math.random() - 0.5) * 1.5).toFixed(1));
    const light = Math.round(isDay ? 200 + peakSun * 1600 + Math.random() * 80 : 10 + Math.random() * 20);
    const co2 = Math.round(410 + (isDay ? -20 : 60) + Math.random() * 30);

    const waterPump = soilMoisture < 48;
    const exhaustFan = temperature > 25.0;
    const growLight = !isDay && hour >= 19 && hour <= 23;

    measurementsData.push({
      deviceId,
      recordedAt: timestamp,
      temperature,
      humidity,
      soilMoisture,
      light,
      co2,
      waterPump,
      exhaustFan,
      growLight,
    });
  }

  for (const m of measurementsData) {
    await prisma.measurement.create({
      data: m,
    });
  }

  console.log(`✅ Base de datos poblada con 49 mediciones de prueba para '${deviceId}'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
