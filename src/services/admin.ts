import type { ModerationStatus } from "./performer";

export interface RegisteredPerformer {
  id: string;
  email: string;
  name: string;
  phone: string;
  inn: string;
  roles: string[];
  description: string;
  registrationDate: string;
  city: string;
  companyName: string;
  status: "active" | "frozen";
  moderationStatus: ModerationStatus;
}

export async function getRegisteredPerformers(): Promise<
  RegisteredPerformer[]
> {
  // TODO: Implement API call to fetch data.
  console.log("Вызов заглушки getRegisteredPerformers"); // Calling stub getRegisteredPerformers
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          email: "johndoe@example.com",
          name: "Иван Иванов",
          phone: "+79991234567",
          inn: "123456789012",
          roles: ["Фотограф"],
          description: "Опытный фотограф для свадеб и мероприятий.",
          registrationDate: "2024-01-01",
          city: "Москва",
          status: "active",
          companyName: "Лучшее Фото",
          moderationStatus: "approved",
        },
        {
          id: "2",
          email: "janesmith@example.com",
          name: "Анна Смирнова",
          phone: "+79997654321",
          inn: "987654321098",
          roles: ["DJ", "Ведущий"],
          description:
            "Профессиональный DJ и ведущий для вечеринок и торжеств.",
          registrationDate: "2024-02-15",
          city: "Санкт-Петербург",
          status: "active",
          companyName: "Музыкальная Жизнь",
          moderationStatus: "pending_approval",
        },
        {
          id: "perf123",
          email: "email@example.com",
          name: "Тест Исполнитель",
          phone: "+7 (999) 999-99-99",
          inn: "111222333444",
          roles: ["Фотограф", "Видеограф", "Повар", "Транспорт"],
          description: "Описание деятельности компании.",
          registrationDate: "2023-11-20",
          city: "Москва",
          status: "active",
          companyName: "Тест Company",
          moderationStatus: "approved",
        },
      ]);
    }, 500);
  });
}

export const approvePerformerProfile = async (
  performerId: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(`Одобрение профиля ${performerId} (заглушка)...`); // Approving profile ${performerId} (stub)...
  return Promise.resolve();
};

export const rejectPerformerProfile = async (
  performerId: string,
  reason: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Отклонение профиля ${performerId} по причине: ${reason} (заглушка)...`,
  ); // Rejecting profile ${performerId} for reason: ${reason} (stub)...
  return Promise.resolve();
};

export const approveGalleryItem = async (
  performerId: string,
  itemId: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(`Одобрение работы ${itemId} для ${performerId} (заглушка)...`); // Approving work ${itemId} for ${performerId} (stub)...
  return Promise.resolve();
};

export const rejectGalleryItem = async (
  performerId: string,
  itemId: string,
  reason: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Отклонение работы ${itemId} для ${performerId} по причине: ${reason} (заглушка)...`,
  ); // Rejecting work ${itemId} for ${performerId} for reason: ${reason} (stub)...
  return Promise.resolve();
};

export const approveCertificate = async (
  performerId: string,
  itemId: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Одобрение сертификата ${itemId} для ${performerId} (заглушка)...`,
  ); // Approving certificate ${itemId} for ${performerId} (stub)...
  return Promise.resolve();
};

export const rejectCertificate = async (
  performerId: string,
  itemId: string,
  reason: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Отклонение сертификата ${itemId} для ${performerId} по причине: ${reason} (заглушка)...`,
  ); // Rejecting certificate ${itemId} for ${performerId} for reason: ${reason} (stub)...
  return Promise.resolve();
};

export const approveRecommendationLetter = async (
  performerId: string,
  itemId: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Одобрение благодарственного письма ${itemId} для ${performerId} (заглушка)...`,
  ); // Approving recommendation letter ${itemId} for ${performerId} (stub)...
  return Promise.resolve();
};

export const rejectRecommendationLetter = async (
  performerId: string,
  itemId: string,
  reason: string,
): Promise<void> => {
  // TODO: Implement API call to change status on backend
  console.log(
    `Отклонение благодарственного письма ${itemId} для ${performerId} по причине: ${reason} (заглушка)...`,
  ); // Rejecting recommendation letter ${itemId} for ${performerId} for reason: ${reason} (stub)...
  return Promise.resolve();
};
