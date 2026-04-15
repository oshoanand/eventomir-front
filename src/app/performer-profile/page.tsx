import { Metadata, ResolvingMetadata } from "next";
import PerformerProfileClient from "./PerformerProfileClient";

type Props = {
  // In Next.js 15+, searchParams is a Promise
  searchParams: Promise<{ id?: string }>;
};

// ==========================================
// 🚀 DYNAMIC OPENGRAPH METADATA GENERATOR
// ==========================================
export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const id = resolvedSearchParams?.id;

  // 1. Setup Base URLs securely
  const SITE_URL =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://app.eventomir.ru";
  const metadataBase = new URL(SITE_URL); // CRITICAL: Required by Next.js for OG tags

  // 2. Create a full fallback object.
  // If the API fails, we still want to show a beautiful generic card, not an empty gray box.
  const fallbackMetadata: Metadata = {
    metadataBase,
    title: "Профиль исполнителя | Eventomir",
    description:
      "Забронируйте лучших исполнителей для вашего мероприятия на Eventomir.",
    openGraph: {
      title: "Профиль исполнителя | Eventomir",
      description:
        "Забронируйте лучших исполнителей для вашего мероприятия на Eventomir.",
      url: `${SITE_URL}/performer-profile${id ? `?id=${id}` : ""}`,
      siteName: "Eventomir",
      images: [`${SITE_URL}/images/og-image.png`], // Ensure this generic image exists in your /public/images folder
      type: "profile",
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: "Профиль исполнителя | Eventomir",
      description:
        "Забронируйте лучших исполнителей для вашего мероприятия на Eventomir.",
      images: [`${SITE_URL}/images/og-image.png`],
    },
  };

  if (!id) return fallbackMetadata;

  try {
    // Note: If you are using Docker, localhost might fail on the server.
    // Use an internal network URL if necessary.
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

    const res = await fetch(`${API_BASE}/api/performers/profile/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);

    const performer = await res.json();
    console.log(performer);

    const title = `${performer.name} | Eventomir`;
    const description = performer.description
      ? performer.description.replace(/\n/g, " ").substring(0, 150) + "..."
      : `Забронируйте ${performer.name} для вашего мероприятия! Узнайте цены, отзывы и свободные даты на Eventomir.`;

    // 3. Safely handle image URLs (Checking 'http' covers both http and https)
    let imageUrl = `${SITE_URL}/images/og-image.png`;
    if (performer.profilePicture) {
      if (performer.profilePicture.startsWith("http")) {
        imageUrl = performer.profilePicture; // Directly use Yandex/External links
      } else {
        imageUrl = `${API_BASE}${performer.profilePicture}`; // Prepend API base for local MinIO/Uploaded files
      }
    }

    return {
      metadataBase,
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/performer-profile?id=${id}`,
        siteName: "Eventomir",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `Профиль ${performer.name}`,
          },
        ],
        locale: "ru_RU",
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("OG Metadata Error:", error);
    // 4. Return FULL fallback metadata instead of a naked object
    return fallbackMetadata;
  }
}

// ==========================================
// 🖥️ PAGE RENDERER
// ==========================================
export default function PerformerProfilePage() {
  return <PerformerProfileClient />;
}
