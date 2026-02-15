import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

const SETTINGS_KEY = "00000000-0000-0000-0000-000000000001";

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_KEY },
    });

    if (settings && settings.settings_data) {
      return NextResponse.json(settings.settings_data);
    } else {
      // If no settings found, return an empty object or default structure
      return NextResponse.json({});
    }
  } catch (error) {
    console.error("Ошибка получения настроек:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}

// POST /api/settings
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Получаем текущие настройки
    const currentSettings = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_KEY },
    });

    const currentData = (currentSettings?.settings_data as object) || {};

    const newData = { ...currentData, ...body };

    // Обновляем или создаем настройки
    await prisma.siteSettings.upsert({
      where: { id: SETTINGS_KEY },
      update: { settings_data: newData, updated_at: new Date() },
      create: { id: SETTINGS_KEY, settings_data: newData },
    });

    return NextResponse.json({ message: "Настройки успешно обновлены" });
  } catch (error) {
    console.error("Ошибка обновления настроек:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
