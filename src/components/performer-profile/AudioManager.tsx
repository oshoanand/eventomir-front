"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, PlusCircle, Trash2 } from "lucide-react";

export interface AudioTrack {
  id: string;
  title: string;
  file_url: string;
}

interface AudioManagerProps {
  tracks: AudioTrack[];
  isOwnProfile: boolean;
  onAddClick: () => void;
  onDelete: (trackId: string) => void;
  getImageUrl: (url: string) => string;
}

const AudioManager: React.FC<AudioManagerProps> = ({
  tracks,
  isOwnProfile,
  onAddClick,
  onDelete,
  getImageUrl,
}) => {
  return (
    <Card className="mb-8 relative overflow-hidden border shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
        <CardTitle className="text-xl font-bold flex items-center gap-2.5">
          <Music className="h-6 w-6 text-primary" />
          Аудиозаписи
        </CardTitle>

        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold px-3 rounded-full hover:bg-primary/10 transition-colors"
            onClick={onAddClick}
          >
            <PlusCircle className="h-4 w-4 mr-1.5" /> Добавить трек
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {tracks && tracks.length > 0 ? (
          tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate mb-2 text-foreground">
                  {track.title}
                </p>
                <audio
                  controls
                  className="w-full h-10 rounded-full outline-none"
                >
                  <source src={getImageUrl(track.file_url)} type="audio/mpeg" />
                  Ваш браузер не поддерживает элемент <code>audio</code>.
                </audio>
              </div>

              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 shrink-0 h-10 w-10 rounded-full transition-colors"
                  onClick={() => onDelete(track.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/10">
            <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-3 shadow-sm border border-border/50">
              <Music className="h-6 w-6 opacity-40 text-foreground" />
            </div>
            <p className="text-sm font-medium">Треки пока не загружены</p>
            <p className="text-xs text-muted-foreground mt-1">
              Добавьте свои лучшие сеты для клиентов
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioManager;
