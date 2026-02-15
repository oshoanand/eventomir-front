"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
// import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS // Импорт CSS Leaflet
// import L from 'leaflet'; // Import leaflet library // Импорт библиотеки leaflet
import type { PerformerProfile } from "@/services/performer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

// Fix for default icon issue with Leaflet and React
// Исправление проблемы со стандартной иконкой в Leaflet и React
// @ts-ignore
// delete L.Icon.Default.prototype._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

interface MapProps {
  performers: PerformerProfile[]; // Array of performer profiles // Массив профилей исполнителей
}

// Helper component to recenter map when performers change
// Вспомогательный компонент для перецентрирования карты при изменении исполнителей
const RecenterAutomatically = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap(); // Hook to get the map instance // Хук для получения экземпляра карты
  useEffect(() => {
    // If coordinates are valid, set the map view
    // Если координаты валидны, устанавливаем вид карты
    if (lat && lng) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, map]); // Dependencies: lat, lng, map // Зависимости: lat, lng, map
  return null; // This component doesn't render anything // Этот компонент ничего не рендерит
};

const Map: React.FC<MapProps> = ({ performers }) => {
  // Filter performers who have valid coordinates
  // Фильтруем исполнителей, у которых есть валидные координаты
  const performersWithCoords = performers.filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  // Default center (e.g., Moscow) if no performers or no valid coords
  // Центр по умолчанию (например, Москва), если нет исполнителей или валидных координат
  const defaultCenter: [number, number] = [55.7558, 37.6173];

  // Calculate center based on the first performer with coordinates
  // Вычисляем центр на основе первого исполнителя с координатами
  const mapCenter =
    performersWithCoords.length > 0
      ? ([
          performersWithCoords[0].latitude!,
          performersWithCoords[0].longitude!,
        ] as [number, number])
      : defaultCenter;

  return (
    <MapContainer
      center={mapCenter} // Set initial map center // Устанавливаем начальный центр карты
      zoom={10} // Set initial zoom level // Устанавливаем начальный уровень масштабирования
      scrollWheelZoom={true} // Enable scroll wheel zoom // Включаем масштабирование колесиком мыши
      style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }} // Added border radius // Добавлен радиус границы
    >
      {/* Tile layer provider (e.g., OpenStreetMap) */}
      {/* Поставщик тайлов (например, OpenStreetMap) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Optionally recenter map when performers change */}
      {/* Опционально перецентрируем карту при изменении исполнителей */}
      <RecenterAutomatically lat={mapCenter[0]} lng={mapCenter[1]} />

      {/* Render markers for performers with coordinates */}
      {/* Рендерим маркеры для исполнителей с координатами */}
      {performersWithCoords.map((performer) => (
        <Marker
          key={performer.id}
          position={[performer.latitude!, performer.longitude!]}
        >
          {/* Popup content for each marker */}
          {/* Содержимое всплывающего окна для каждого маркера */}
          <Popup>
            <div className="text-center space-y-1">
              <p className="font-semibold">{performer.name}</p>
              <p className="text-xs text-muted-foreground">
                {performer.roles.join(", ")}
              </p>{" "}
              {/* Join roles with comma */}{" "}
              {/* Объединяем роли через запятую */}
              <p className="text-xs text-muted-foreground">{performer.city}</p>
              {/* Link to performer profile */}
              {/* Ссылка на профиль исполнителя */}
              <Link href={`/performer-profile?id=${performer.id}`}>
                <Button size="sm" variant="link" className="p-0 h-auto text-xs">
                  Перейти в профиль {/* Go to profile */}
                </Button>
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
