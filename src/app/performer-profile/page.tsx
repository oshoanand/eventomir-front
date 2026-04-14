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

  // Fallback if no ID is provided
  if (!id) {
    return { title: "Профиль | Eventomir" };
  }

  try {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
    const SITE_URL = process.env.NEXTAUTH_URL || "https://app.eventomir.ru";

    // Fetch data directly from your backend for the crawler
    const res = await fetch(`${API_BASE}/api/performers/profile/${id}`, {
      next: { revalidate: 60 }, // Cache the result for 60 seconds for lightning-fast scraping
    });

    if (!res.ok) throw new Error("Failed to fetch profile for OG tags");

    const performer = await res.json();

    // Format the text beautifully for the card
    const title = `${performer.name} | Eventomir`;
    const description = performer.description
      ? performer.description.replace(/\n/g, " ").substring(0, 150) + "..."
      : `Забронируйте ${performer.name} для вашего мероприятия! Узнайте цены, отзывы и свободные даты на Eventomir.`;

    // Ensure absolute URL for the image (Crawlers require absolute URLs)
    const imageUrl = performer.profilePicture
      ? performer.profilePicture.startsWith("https")
        ? performer.profilePicture
        : `${API_BASE}${performer.profilePicture}`
      : `${SITE_URL}/images/og-image.png`;

    console.log(imageUrl);

    return {
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
    // Graceful fallback if the backend fetch fails
    return {
      title: "Профиль исполнителя | Eventomir",
    };
  }
}

// ==========================================
// 🖥️ PAGE RENDERER
// ==========================================
export default function PerformerProfilePage() {
  // This renders your exact client-side logic without any changes!
  return <PerformerProfileClient />;
}
