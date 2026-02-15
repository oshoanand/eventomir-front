"use client";

export interface SupportManager {
  id: string;
  name: string;
  email: string;
  // Can add 'support_manager' role or other fields if needed
  addedAt: Date;
}

// TODO: Replace with actual interaction with Firebase Firestore or another DB
let supportManagersStore: SupportManager[] = [
    {
        id: 'support-1',
        name: 'Мария Поддержкина',
        email: 'support1@eventomir.com',
        addedAt: new Date(2024, 7, 1),
    },
];

export const getSupportManagers = async (): Promise<SupportManager[]> => {
    console.log("Получение списка менеджеров поддержки (заглушка)..."); // Fetching list of support managers (stub)...
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...supportManagersStore]);
        }, 300);
    });
};

export const addSupportManager = async (name: string, email: string): Promise<SupportManager> => {
    console.log(`Добавление менеджера поддержки ${name} (${email}) (заглушка)...`); // Adding support manager ${name} (${email}) (stub)...
    // TODO: Implement check for existing email
    // TODO: Implement password setting mechanism or invitation sending
    return new Promise((resolve) => {
        setTimeout(() => {
            const newManager: SupportManager = {
                id: `support-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                name,
                email,
                addedAt: new Date(),
            };
            supportManagersStore.push(newManager);
            resolve(newManager);
        }, 500);
    });
};

export const removeSupportManager = async (managerId: string): Promise<void> => {
    console.log(`Удаление менеджера поддержки ${managerId} (заглушка)...`); // Removing support manager ${managerId} (stub)...
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const initialLength = supportManagersStore.length;
            supportManagersStore = supportManagersStore.filter(manager => manager.id !== managerId);
            if (supportManagersStore.length < initialLength) {
                resolve();
            } else {
                reject(new Error(`Менеджер с ID ${managerId} не найден.`)); // Manager with ID ${managerId} not found.
            }
        }, 400);
    });
};

// TODO: Add functions for editing managers, resetting passwords, etc., if needed.
