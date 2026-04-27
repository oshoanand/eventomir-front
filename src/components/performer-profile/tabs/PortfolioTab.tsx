// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   LayoutGrid,
//   Image as ImageIcon,
//   Music,
//   Award,
//   PlusCircle,
//   FileText,
// } from "lucide-react";
// import {
//   useAddGalleryItem,
//   useRemoveGalleryItem,
//   useAddAudioTrack,
//   useRemoveAudioTrack,
//   useAddCertificate,
//   useRemoveCertificate,
// } from "@/services/performer";
// import { useToast } from "@/hooks/use-toast";
// import GalleryManager from "@/components/performer-profile/GalleryManager";
// import AudioManager from "@/components/performer-profile/AudioManager";
// import MediaCarousel from "@/components/ui/media-carousel";
// import AudioUploadDialog from "@/components/performer-profile/AudioUploadDialog";
// import FileUploadDialog from "@/components/performer-profile/FileUploadDialog";

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
// const getImageUrl = (path: string) =>
//   path?.startsWith("http") ? path : `${API_BASE}${path}`;

// export default function PortfolioTab({ profile, isOwnProfile }: any) {
//   const { toast } = useToast();

//   // State
//   const [filter, setFilter] = useState<"all" | "photo" | "audio" | "docs">(
//     "all",
//   );
//   const [isGalleryOpen, setIsGalleryOpen] = useState(false);
//   const [isAudioOpen, setIsAudioOpen] = useState(false);
//   const [isCertOpen, setIsCertOpen] = useState(false);

//   // Mutations
//   const addGallery = useAddGalleryItem();
//   const removeGallery = useRemoveGalleryItem();
//   const addAudio = useAddAudioTrack();
//   const removeAudio = useRemoveAudioTrack();
//   const addCert = useAddCertificate();
//   const removeCert = useRemoveCertificate();

//   const isAudioHeavy = profile.roles?.some((r: string) =>
//     ["dj", "вокал", "певец"].some((v) => r.toLowerCase().includes(v)),
//   );
//   const isVisualHeavy = profile.roles?.some((r: string) =>
//     ["танц", "шоу"].some((v) => r.toLowerCase().includes(v)),
//   );
//   const isChef = profile.roles?.some((r: string) =>
//     ["повар", "кейтеринг"].some((v) => r.toLowerCase().includes(v)),
//   );

//   return (
//     <div className="space-y-6">
//       {/* Sub-Nav */}
//       <div className="bg-white p-2 rounded-2xl shadow-sm border border-border/40 flex gap-2 overflow-x-auto no-scrollbar">
//         <Button
//           variant={filter === "all" ? "default" : "ghost"}
//           onClick={() => setFilter("all")}
//           className="rounded-xl h-10 font-bold shrink-0"
//         >
//           <LayoutGrid className="w-4 h-4 mr-2" /> Все материалы
//         </Button>
//         <Button
//           variant={filter === "photo" ? "default" : "ghost"}
//           onClick={() => setFilter("photo")}
//           className="rounded-xl h-10 font-bold shrink-0"
//         >
//           <ImageIcon className="w-4 h-4 mr-2" />{" "}
//           {isChef ? "Блюда" : "Фотогалерея"}
//         </Button>
//         {isAudioHeavy && (
//           <Button
//             variant={filter === "audio" ? "default" : "ghost"}
//             onClick={() => setFilter("audio")}
//             className="rounded-xl h-10 font-bold shrink-0"
//           >
//             <Music className="w-4 h-4 mr-2" /> Аудио
//           </Button>
//         )}
//         <Button
//           variant={filter === "docs" ? "default" : "ghost"}
//           onClick={() => setFilter("docs")}
//           className="rounded-xl h-10 font-bold shrink-0"
//         >
//           <Award className="w-4 h-4 mr-2" /> Документы
//         </Button>
//       </div>

//       {/* AUDIO */}
//       {(filter === "all" || filter === "audio") && isAudioHeavy && (
//         <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 animate-in fade-in">
//           <div className="flex justify-between mb-6">
//             <h2 className="text-xl font-black flex items-center gap-3">
//               <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
//                 <Music className="w-6 h-6" />
//               </div>
//               Аудио и Демо
//             </h2>
//             {isOwnProfile && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsAudioOpen(true)}
//                 className="rounded-xl text-primary border-primary/30"
//               >
//                 <PlusCircle className="w-4 h-4 mr-2" />
//                 Загрузить
//               </Button>
//             )}
//           </div>
//           <AudioManager
//             tracks={profile.audioTracks || []}
//             isOwnProfile={isOwnProfile}
//             onAddClick={() => setIsAudioOpen(true)}
//             onDelete={(id) =>
//               removeAudio.mutate({ performerId: profile.id, trackId: id })
//             }
//             getImageUrl={getImageUrl}
//           />
//         </div>
//       )}

//       {/* PHOTOS */}
//       {(filter === "all" || filter === "photo") && (
//         <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 animate-in fade-in">
//           <div className="flex justify-between mb-6">
//             <h2 className="text-xl font-black flex items-center gap-3">
//               <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
//                 <ImageIcon className="w-6 h-6" />
//               </div>
//               Портфолио
//             </h2>
//             {isOwnProfile && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsGalleryOpen(true)}
//                 className="rounded-xl text-blue-600 border-blue-200"
//               >
//                 <PlusCircle className="w-4 h-4 mr-2" />
//                 Добавить фото
//               </Button>
//             )}
//           </div>
//           {profile.gallery?.length > 0 ? (
//             isOwnProfile ? (
//               <GalleryManager
//                 gallery={profile.gallery}
//                 isOwnProfile={true}
//                 onAddOrEdit={() => setIsGalleryOpen(true)}
//                 onDelete={(id) =>
//                   removeGallery.mutate({ performerId: profile.id, itemId: id })
//                 }
//               />
//             ) : (
//               <MediaCarousel
//                 items={profile.gallery.map((g: any) => ({
//                   url: getImageUrl(g.imageUrls[0]),
//                   description: g.description,
//                 }))}
//               />
//             )
//           ) : (
//             <p className="text-muted-foreground text-center py-6">
//               Фотографий пока нет.
//             </p>
//           )}
//         </div>
//       )}

//       {/* DOCS */}
//       {(filter === "all" || filter === "docs") && (
//         <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 animate-in fade-in">
//           <div className="flex justify-between mb-6">
//             <h2 className="text-xl font-black flex items-center gap-3">
//               <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
//                 <Award className="w-6 h-6" />
//               </div>
//               Награды
//             </h2>
//             {isOwnProfile && (
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsCertOpen(true)}
//                 className="rounded-xl text-amber-600 border-amber-200"
//               >
//                 <PlusCircle className="w-4 h-4 mr-2" />
//                 Загрузить
//               </Button>
//             )}
//           </div>
//           {profile.certificates?.length > 0 ? (
//             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//               {profile.certificates.map((cert: any) => (
//                 <div
//                   key={cert.id}
//                   className="relative group rounded-2xl overflow-hidden border border-border/50 aspect-[3/4]"
//                 >
//                   <img
//                     src={getImageUrl(cert.fileUrl)}
//                     alt="Doc"
//                     className="w-full h-full object-cover group-hover:scale-105 transition-transform"
//                   />
//                   {isOwnProfile && (
//                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4 transition-opacity">
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() =>
//                           removeCert.mutate({
//                             performerId: profile.id,
//                             itemId: cert.id,
//                           })
//                         }
//                       >
//                         Удалить
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-muted-foreground text-center py-6">
//               Документы не загружены.
//             </p>
//           )}
//         </div>
//       )}

//       {/* Modals managed inside the Tab */}
//       {isOwnProfile && (
//         <>
//           <AudioUploadDialog
//             isOpen={isAudioOpen}
//             onClose={() => setIsAudioOpen(false)}
//             title="Загрузить аудио"
//             description="MP3 или WAV"
//             accept="audio/mpeg, audio/wav"
//             onFileUpload={async (file, title) => {
//               try {
//                 await addAudio.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   title,
//                 });
//                 toast({ title: "Успешно" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />
//           <FileUploadDialog
//             isOpen={isGalleryOpen}
//             onClose={() => setIsGalleryOpen(false)}
//             title="Добавить фото"
//             description="JPG/PNG"
//             onFileUpload={async (file, desc) => {
//               try {
//                 await addGallery.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   title: "Портфолио",
//                   description: desc,
//                 });
//                 toast({ title: "Успешно" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />
//           <FileUploadDialog
//             isOpen={isCertOpen}
//             onClose={() => setIsCertOpen(false)}
//             title="Загрузить документ"
//             description="Скан (JPG/PNG/PDF)"
//             onFileUpload={async (file, desc) => {
//               try {
//                 await addCert.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   description: desc,
//                 });
//                 toast({ title: "Успешно" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />
//         </>
//       )}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Image as ImageIcon,
  Music,
  Award,
  PlusCircle,
} from "lucide-react";

import {
  useAddGalleryItem,
  useRemoveGalleryItem,
  useAddAudioTrack,
  useRemoveAudioTrack,
  useAddCertificate,
  useRemoveCertificate,
} from "@/services/performer";
import { useToast } from "@/hooks/use-toast";

// --- Components ---
import GalleryManager from "@/components/performer-profile/GalleryManager";
import AudioManager from "@/components/performer-profile/AudioManager";
import MediaCarousel from "@/components/ui/media-carousel";
import AudioUploadDialog from "@/components/performer-profile/AudioUploadDialog";
import FileUploadDialog from "@/components/performer-profile/FileUploadDialog";
import { cn } from "@/utils/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
const getImageUrl = (path: string) =>
  path?.startsWith("https") ? path : `${API_BASE}${path}`;

export default function PortfolioTab({ profile, isOwnProfile }: any) {
  const { toast } = useToast();

  // State
  const [filter, setFilter] = useState<"all" | "photo" | "audio" | "docs">(
    "all",
  );

  // Modal States
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // Mutations
  const addGallery = useAddGalleryItem();
  const removeGallery = useRemoveGalleryItem();
  const addAudio = useAddAudioTrack();
  const removeAudio = useRemoveAudioTrack();
  const addCert = useAddCertificate();
  const removeCert = useRemoveCertificate();

  // Role Checks
  const isAudioHeavy = profile.roles?.some((r: string) =>
    ["dj", "вокал", "певец", "Диджеи", "Dj", "диджеи"].some((v) =>
      r.toLowerCase().includes(v),
    ),
  );

  const isChef = profile.roles?.some((r: string) =>
    ["повар", "chef", "Chef", "Повар", "catering", "кейтеринг"].some((v) =>
      r.toLowerCase().includes(v),
    ),
  );

  return (
    <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-border/40 animate-in fade-in">
      {/* --- SUB-NAV FILTERS (Inside the Card) --- */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-4 mb-6 border-b border-border/40">
        <Button
          variant={filter === "all" ? "secondary" : "ghost"}
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-xl h-8 px-3 text-xs font-semibold shrink-0 transition-colors",
            filter === "all"
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground",
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Все материалы
        </Button>

        <Button
          variant={filter === "photo" ? "secondary" : "ghost"}
          onClick={() => setFilter("photo")}
          className={cn(
            "rounded-xl h-8 px-3 text-xs font-semibold shrink-0 transition-colors",
            filter === "photo"
              ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
              : "text-muted-foreground",
          )}
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1.5" />{" "}
          {isChef ? "Блюда" : "Фотогалерея"}
        </Button>

        {isAudioHeavy && (
          <Button
            variant={filter === "audio" ? "secondary" : "ghost"}
            onClick={() => setFilter("audio")}
            className={cn(
              "rounded-xl h-8 px-3 text-xs font-semibold shrink-0 transition-colors",
              filter === "audio"
                ? "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                : "text-muted-foreground",
            )}
          >
            <Music className="w-3.5 h-3.5 mr-1.5" /> Аудио
          </Button>
        )}

        <Button
          variant={filter === "docs" ? "secondary" : "ghost"}
          onClick={() => setFilter("docs")}
          className={cn(
            "rounded-xl h-8 px-3 text-xs font-semibold shrink-0 transition-colors",
            filter === "docs"
              ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
              : "text-muted-foreground",
          )}
        >
          <Award className="w-3.5 h-3.5 mr-1.5" /> Награды
        </Button>
      </div>

      {/* --- PORTFOLIO CONTENT SECTIONS --- */}
      <div className="space-y-12">
        {/* 1. AUDIO SECTION */}
        {(filter === "all" || filter === "audio") && isAudioHeavy && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Music className="w-5 h-5" />
                </div>
                Аудио и Демо
              </h2>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAudioOpen(true)}
                  className="rounded-xl h-8 px-3 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Загрузить
                </Button>
              )}
            </div>
            <AudioManager
              tracks={profile.audioTracks || []}
              isOwnProfile={isOwnProfile}
              onAddClick={() => setIsAudioOpen(true)}
              onDelete={(id) =>
                removeAudio.mutate({ performerId: profile.id, trackId: id })
              }
              getImageUrl={getImageUrl}
            />
          </div>
        )}

        {/* 2. PHOTOS SECTION */}
        {(filter === "all" || filter === "photo") && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                {isChef ? "Меню и Блюда" : "Портфолио"}
              </h2>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGalleryOpen(true)}
                  className="rounded-xl h-8 px-3 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Добавить фото
                </Button>
              )}
            </div>

            {profile.gallery?.length > 0 ? (
              isOwnProfile ? (
                <GalleryManager
                  gallery={profile.gallery}
                  isOwnProfile={true}
                  onAddOrEdit={() => setIsGalleryOpen(true)}
                  onDelete={(id) =>
                    removeGallery.mutate({
                      performerId: profile.id,
                      itemId: id,
                    })
                  }
                />
              ) : (
                <MediaCarousel
                  items={profile.gallery.map((g: any) => ({
                    url: getImageUrl(g.imageUrls[0]),
                    description: g.description,
                  }))}
                />
              )
            ) : (
              <div className="border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm font-medium">
                  Фотографий пока нет.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. DOCS / CERTIFICATES SECTION */}
        {(filter === "all" || filter === "docs") && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                Награды и Документы
              </h2>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCertOpen(true)}
                  className="rounded-xl h-8 px-3 text-xs font-bold text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Загрузить
                </Button>
              )}
            </div>

            {profile.certificates?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="relative group rounded-2xl overflow-hidden border border-border/50 aspect-[3/4] bg-muted/20"
                  >
                    <img
                      src={getImageUrl(cert.fileUrl)}
                      alt={cert.description || "Документ"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-4 transition-opacity">
                      <p className="text-white text-xs font-medium line-clamp-2 mb-2">
                        {cert.description}
                      </p>
                      {isOwnProfile && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full h-8 text-xs font-bold rounded-lg"
                          onClick={() =>
                            removeCert.mutate({
                              performerId: profile.id,
                              itemId: cert.id,
                            })
                          }
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Award className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground text-sm font-medium">
                  Документы не загружены.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- UPLOAD MODALS (Owner Only) --- */}
      {isOwnProfile && (
        <>
          <AudioUploadDialog
            isOpen={isAudioOpen}
            onClose={() => setIsAudioOpen(false)}
            title="Загрузить аудио"
            description="Поддерживаемые форматы: MP3, WAV (макс. 15МБ)"
            accept="audio/mpeg, audio/wav"
            onFileUpload={async (file, title) => {
              try {
                await addAudio.mutateAsync({
                  performerId: profile.id,
                  file,
                  title,
                });
                toast({ title: "Трек успешно загружен" });
                return true;
              } catch {
                return false;
              }
            }}
          />
          <FileUploadDialog
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            title="Добавить фото"
            description="Загрузите качественное изображение (JPG/PNG)"
            onFileUpload={async (file, desc) => {
              try {
                await addGallery.mutateAsync({
                  performerId: profile.id,
                  file,
                  title: "Портфолио",
                  description: desc,
                });
                toast({ title: "Фото успешно добавлено" });
                return true;
              } catch {
                return false;
              }
            }}
          />
          <FileUploadDialog
            isOpen={isCertOpen}
            onClose={() => setIsCertOpen(false)}
            title="Загрузить документ"
            description="Скан сертификата, диплома или награды (JPG/PNG/PDF)"
            onFileUpload={async (file, desc) => {
              try {
                await addCert.mutateAsync({
                  performerId: profile.id,
                  file,
                  description: desc,
                });
                toast({ title: "Документ успешно загружен" });
                return true;
              } catch {
                return false;
              }
            }}
          />
        </>
      )}
    </div>
  );
}
