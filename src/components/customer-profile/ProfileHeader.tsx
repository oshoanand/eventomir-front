"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/utils/helper";
import {
  Edit,
  Camera,
  MapPin,
  Phone,
  Image as ImageIcon,
  Map,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/utils/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

interface ProfileHeaderProps {
  profile: any;
  formData: any;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  isCustomerOnline: boolean;
  handlePictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBackgroundChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  profilePictureFile: File | null;
  backgroundPictureFile: File | null;
}

export const ProfileHeader = ({
  profile,
  formData,
  isEditing,
  setIsEditing,
  isCustomerOnline,
  handlePictureChange,
  handleBackgroundChange,
  profilePictureFile,
  backgroundPictureFile,
}: ProfileHeaderProps) => {
  console.log(profile);
  return (
    <div className="bg-card rounded-[2rem] shadow-sm border border-border/50 overflow-hidden relative">
      {/* Cover Image */}
      <div className="h-48 md:h-64 w-full relative bg-muted group">
        {formData.backgroundPicture || profile.backgroundPicture ? (
          <img
            src={
              backgroundPictureFile
                ? formData.backgroundPicture
                : getImageUrl(profile.backgroundPicture)
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5" />
        )}

        {isEditing && (
          <label
            htmlFor="background-upload"
            className="absolute top-4 right-4 bg-background/80 hover:bg-background backdrop-blur-sm text-foreground p-3 rounded-full cursor-pointer shadow-sm transition-all"
          >
            <ImageIcon className="h-5 w-5 pointer-events-none" />
            <input
              id="background-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundChange}
            />
          </label>
        )}
      </div>

      {/* Avatar & Info Container */}
      <div className="px-6 md:px-10 pb-8 relative">
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 bg-muted/50 hover:bg-muted backdrop-blur-sm rounded-full shadow-sm z-10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 md:gap-4 gap-6">
          {/* Avatar Wrapper - 🚨 ADDED inline-flex and w-fit so absolute positioning perfectly hugs the circle */}
          <div className="relative inline-flex w-fit shrink-0 rounded-full">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-xl bg-muted">
              <AvatarImage
                src={
                  profilePictureFile
                    ? formData.profilePicture
                    : getImageUrl(profile.profilePicture)
                }
                alt={formData.name || profile.name}
                className="object-cover"
              />
              <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                {getInitials(formData.name || profile.name)}
              </AvatarFallback>
            </Avatar>

            {!isEditing && (
              <span
                className={cn(
                  "absolute bottom-3 right-4 rounded-full border-2 border-background z-20 transition-all duration-300",
                  // Made smaller:
                  "h-4 w-4",
                  // Added glow effects when online: shadow and animate-pulse
                  isCustomerOnline
                    ? "bg-emerald-500  animate-pulse"
                    : "bg-gray-300 shadow-none animate-none",
                )}
                title="В сети"
              />
            )}

            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-primary text-primary-foreground rounded-full p-2.5 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5 pointer-events-none" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePictureChange}
                />
              </label>
            )}
          </div>

          {/* User Details (Name, Email, Tags) */}
          <div className="flex-1 text-center sm:text-left ">
            <div>
              <h1 className="md:pl-3 text-xl text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {formData.name || profile.name}
                {profile.moderationStatus === "APPROVED" && (
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                )}
              </h1>
              <p className="md:pl-3 text-muted-foreground font-medium text-[15px]">
                {profile.email}
              </p>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {(formData.city || profile.city) && (
                <Badge
                  variant="secondary"
                  className="bg-muted/50 px-3 py-1.5 text-sm font-medium rounded-xl border-transparent"
                >
                  <MapPin className="h-4 w-4 mr-1.5 text-primary" />{" "}
                  {formData.city || profile.city}
                </Badge>
              )}
              {(formData.phone || profile.phone) && (
                <Badge
                  variant="secondary"
                  className="bg-muted/50 px-3 py-1.5 text-sm font-medium rounded-xl border-transparent"
                >
                  <Phone className="h-4 w-4 mr-1.5 text-primary" />{" "}
                  {formatPhoneNumber(formData.phone || profile.phone)}
                </Badge>
              )}
              {(formData.address || profile.address) && (
                <Badge
                  variant="secondary"
                  className="bg-muted/50 px-3 py-1.5 text-sm font-medium rounded-xl border-transparent"
                >
                  <Map className="h-4 w-4 mr-1.5 text-primary" />{" "}
                  {formData.address || profile.address}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
