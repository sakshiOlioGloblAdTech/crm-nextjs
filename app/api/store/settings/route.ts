import { prisma } from "@/lib/prisma";
import { storeJson, handleOptions } from "@/lib/store";

export const OPTIONS = handleOptions;

/** Public storefront contact + social settings (footer / contact / WhatsApp). */
export async function GET() {
  try {
    const s = await prisma.setting.findFirst();
    return storeJson({
      settings: {
        phone: s?.phone ?? null,
        whatsapp: s?.whatsapp ?? null,
        email: s?.supportEmail ?? null,
        instagram: s?.instagram ?? null,
        linkedin: s?.linkedin ?? null,
      },
    });
  } catch (error) {
    console.error("GET /api/store/settings failed", error);
    return storeJson({ settings: {} });
  }
}
