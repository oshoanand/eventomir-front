"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Heart,
  MessageCircle,
  Eye,
  EyeOff,
  Trash2,
  X,
  Image as ImageIcon,
  Send,
} from "lucide-react";
import {
  useAddFeedPost,
  useDeleteFeedPost,
  useTogglePostVisibility,
  useLikeFeedPost,
  useAddFeedComment,
} from "@/services/feed";

import MediaCarousel from "@/components/ui/media-carousel";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
const getImageUrl = (path: string) =>
  path?.startsWith("http") ? path : `${API_BASE}${path}`;

export default function FeedTab({
  profile,
  isOwnProfile,
  sessionUser,
  requireAuth,
  onUpdate, // Optional callback if parent wants to know about changes
}: any) {
  const { toast } = useToast();

  // --- Local Optimistic State ---
  // This isolates the feed from parent data-fetching delays
  const [localPosts, setLocalPosts] = useState<any[]>([]);

  useEffect(() => {
    setLocalPosts(profile?.feedPosts || []);
  }, [profile?.feedPosts]);

  // --- UI States ---
  const [newPostText, setNewPostText] = useState("");
  const [feedFiles, setFeedFiles] = useState<File[]>([]);
  const [feedPreviews, setFeedPreviews] = useState<
    { url: string; type: string }[]
  >([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [commentText, setCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Mutations ---
  const addFeedPostMutation = useAddFeedPost();
  const deleteFeedPostMutation = useDeleteFeedPost();
  const toggleVisibilityMutation = useTogglePostVisibility();
  const likeMutation = useLikeFeedPost();
  const commentMutation = useAddFeedComment();

  // --- Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    let hasVideo = feedFiles.some((f) => f.type.startsWith("video/"));

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: "destructive", title: `Файл ${file.name} > 5МБ` });
          continue;
        }
        validFiles.push(file);
      } else if (file.type.startsWith("video/")) {
        if (hasVideo) {
          toast({ variant: "destructive", title: "Только 1 видео на пост" });
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast({ variant: "destructive", title: `Видео ${file.name} > 15МБ` });
          continue;
        }
        validFiles.push(file);
        hasVideo = true;
      }
    }

    if (validFiles.length > 0) {
      setFeedFiles((prev) => [...prev, ...validFiles]);
      setFeedPreviews((prev) => [
        ...prev,
        ...validFiles.map((f) => ({
          url: URL.createObjectURL(f),
          type: f.type,
        })),
      ]);
    }
    e.target.value = "";
  };

  const removeFeedFile = (idx: number) => {
    URL.revokeObjectURL(feedPreviews[idx].url);
    setFeedFiles((prev) => prev.filter((_, i) => i !== idx));
    setFeedPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePostFeed = () => {
    if (!newPostText.trim() && feedFiles.length === 0) return;
    addFeedPostMutation.mutate(
      { performerId: profile.id, text: newPostText, files: feedFiles },
      {
        onSuccess: () => {
          toast({ title: "Опубликовано!" });
          setNewPostText("");
          setFeedFiles([]);
          setFeedPreviews([]);
          if (onUpdate) onUpdate();
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: err.message || "Ошибка" }),
      },
    );
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm("Удалить запись?")) return;

    // Optimistic Delete
    setLocalPosts((prev) => prev.filter((p) => p.id !== postId));

    deleteFeedPostMutation.mutate(
      { performerId: profile.id, postId },
      { onError: () => setLocalPosts(profile?.feedPosts || []) }, // Revert on fail
    );
  };

  const handleToggleVisibility = (postId: string) => {
    // Optimistic Toggle
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isPublic: !p.isPublic } : p)),
    );

    toggleVisibilityMutation.mutate(
      { performerId: profile.id, postId },
      { onError: () => setLocalPosts(profile?.feedPosts || []) },
    );
  };

  const handleLike = (postId: string) => {
    const action = () => {
      // Optimistic Like
      setLocalPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLiked = !p.isLikedByMe;
            return {
              ...p,
              isLikedByMe: isLiked,
              likesCount: isLiked
                ? p.likesCount + 1
                : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        }),
      );

      likeMutation.mutate(
        { postId },
        {
          onError: () => {
            setLocalPosts(profile?.feedPosts || []); // Revert
            toast({ variant: "destructive", title: "Ошибка" });
          },
        },
      );
    };

    // Safe call in case parent forgot to pass requireAuth
    if (requireAuth) requireAuth(action);
    else action();
  };

  const handleCommentSubmit = (postId: string) => {
    const action = () => {
      if (!commentText.trim()) return;

      const newCommentText = commentText;
      setCommentText(""); // Clear input immediately

      // Optimistic Comment Injection
      setLocalPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
              comments: [
                ...(p.comments || []),
                {
                  id: `temp-${Date.now()}`,
                  text: newCommentText,
                  createdAt: new Date().toISOString(),
                  user: {
                    id: sessionUser?.id || "me",
                    name: sessionUser?.name || "Вы",
                    image: sessionUser?.image || "",
                  },
                },
              ],
            };
          }
          return p;
        }),
      );

      commentMutation.mutate(
        { postId, text: newCommentText },
        {
          onError: () => {
            setLocalPosts(profile?.feedPosts || []); // Revert
            toast({ variant: "destructive", title: "Ошибка комментария" });
          },
        },
      );
    };

    if (requireAuth) requireAuth(action);
    else action();
  };

  return (
    <div className="space-y-6">
      {/* --- CREATE POST WIDGET --- */}
      {isOwnProfile && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/40 animate-in fade-in">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={getImageUrl(profile.profilePicture)} />
              <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Textarea
                placeholder="Что у вас нового?"
                className="min-h-[80px] bg-muted/20 border border-border/40 rounded-2xl mb-3 transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
              {feedPreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {feedPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-border"
                    >
                      {preview.type.startsWith("image/") ? (
                        <img
                          src={preview.url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={preview.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <button
                        onClick={() => removeFeedFile(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/mp4,video/quicktime,video/x-msvideo"
                    multiple
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-muted-foreground hover:bg-muted rounded-xl px-4 font-semibold"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" /> Фото / Видео
                  </Button>
                </div>
                <Button
                  onClick={handlePostFeed}
                  disabled={
                    addFeedPostMutation.isPending ||
                    (!newPostText.trim() && feedFiles.length === 0)
                  }
                  className="rounded-xl px-6 font-bold shadow-sm"
                >
                  {addFeedPostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Опубликовать"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEED POSTS LOOP --- */}
      {localPosts.length > 0 ? (
        localPosts.map((post: any) => (
          <div
            key={post.id}
            className={cn(
              "bg-white rounded-3xl p-6 shadow-sm border border-border/40 transition-opacity animate-in fade-in",
              !post.isPublic && "opacity-70",
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <Avatar className="w-12 h-12">
                <AvatarImage src={getImageUrl(profile.profilePicture)} />
                <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-bold text-[16px]">{profile.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(post.createdAt), "d MMM в HH:mm", {
                    locale: ru,
                  })}
                </p>
              </div>

              {/* Actions */}
              {isOwnProfile && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleVisibility(post.id)}
                    className="text-muted-foreground rounded-full"
                  >
                    {post.isPublic ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-destructive" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-destructive rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Content */}
            {post.text && (
              <p className="text-[16px] text-foreground/90 leading-relaxed mb-5 whitespace-pre-wrap">
                {post.text}
              </p>
            )}
            {post.videoUrl && (
              <video
                src={getImageUrl(post.videoUrl)}
                controls
                className="w-full rounded-2xl mb-5 max-h-[500px] bg-black"
              />
            )}
            {post.imageUrls?.length > 0 && (
              <div className="mb-5">
                <MediaCarousel
                  items={post.imageUrls.map((url: string) => ({
                    url: getImageUrl(url),
                  }))}
                />
              </div>
            )}

            <Separator className="mb-4" />

            {/* Interaction Bar */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                onClick={() => handleLike(post.id)}
                className={cn(
                  "font-semibold rounded-xl px-4 transition-colors",
                  post.isLikedByMe
                    ? "text-red-500 bg-red-50 hover:bg-red-100"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 mr-2",
                    post.isLikedByMe && "fill-red-500",
                  )}
                />{" "}
                {post.likesCount > 0 ? post.likesCount : ""}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setActiveCommentPostId(
                    activeCommentPostId === post.id ? null : post.id,
                  )
                }
                className={cn(
                  "font-semibold rounded-xl px-4 transition-colors",
                  activeCommentPostId === post.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <MessageCircle className="w-5 h-5 mr-2" />{" "}
                {post.commentsCount > 0 ? post.commentsCount : ""}
              </Button>
            </div>

            {/* Comments Section */}
            {activeCommentPostId === post.id && (
              <div className="mt-5 pt-5 border-t animate-in fade-in slide-in-from-top-2">
                <div className="space-y-5 mb-5 max-h-80 overflow-y-auto custom-scrollbar">
                  {post.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={getImageUrl(comment.user.image)} />
                        <AvatarFallback>
                          {comment.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/40 p-3 px-4 rounded-2xl rounded-tl-none">
                        <p className="font-bold text-sm mb-0.5">
                          {comment.user.name}
                        </p>
                        <p className="text-[15px] text-foreground/90">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!post.comments || post.comments.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Нет комментариев. Будьте первыми!
                    </p>
                  )}
                </div>

                {/* Input Box */}
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Написать комментарий..."
                    className="rounded-xl bg-muted/20 h-12"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommentSubmit(post.id);
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => handleCommentSubmit(post.id)}
                    className="rounded-xl shrink-0 h-12 w-12"
                    disabled={!commentText.trim() || commentMutation.isPending}
                  >
                    {commentMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-muted-foreground border border-border/40">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">На стене пока нет записей.</p>
        </div>
      )}
    </div>
  );
}
