"use client";

export interface Review {
  id: string;
  performerId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

// TODO: Replace with actual interaction with Firebase Firestore or another DB
let reviews: Review[] = [
    {
        id: 'rev1',
        performerId: 'perf123',
        customerId: 'cust456',
        customerName: 'Анна К.',
        rating: 5,
        comment: 'Отличный фотограф! Сделал замечательные снимки нашей свадьбы. Рекомендую!',
        timestamp: new Date(2024, 6, 10, 14, 30),
    },
    {
        id: 'rev2',
        performerId: 'perf123',
        customerId: 'cust789',
        customerName: 'Иван П.',
        rating: 4,
        comment: 'Все прошло хорошо, повар приготовил вкусные блюда. Немного опоздал, но в целом довольны.',
        timestamp: new Date(2024, 7, 1, 10, 0),
    },
     {
        id: 'rev3',
        performerId: '2',
        customerId: 'cust111',
        customerName: 'Сергей В.',
        rating: 5,
        comment: 'DJ просто супер! Музыка была отличная, все гости танцевали до упаду!',
        timestamp: new Date(2024, 5, 20, 23, 15),
    },
];

export const addReview = async (reviewData: Omit<Review, 'id' | 'timestamp'>): Promise<Review> => {
    console.log(`Добавление отзыва для исполнителя ${reviewData.performerId} (заглушка)...`); // Adding review for performer ${reviewData.performerId} (stub)...
    return new Promise((resolve) => {
        setTimeout(() => {
            const newReview: Review = {
                ...reviewData,
                id: `rev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                timestamp: new Date(),
            };
            reviews.push(newReview);
            resolve(newReview);
        }, 400);
    });
};

export const getReviewsByPerformer = async (performerId: string): Promise<Review[]> => {
    console.log(`Получение отзывов для исполнителя ${performerId} (заглушка)...`); // Fetching reviews for performer ${performerId} (stub)...
    return new Promise((resolve) => {
        setTimeout(() => {
            const performerReviews = reviews
                .filter(review => review.performerId === performerId)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            resolve([...performerReviews]);
        }, 300);
    });
};

export const getAverageRating = async (performerId: string): Promise<number | null> => {
    console.log(`Вычисление среднего рейтинга для ${performerId} (заглушка)...`); // Calculating average rating for ${performerId} (stub)...
    return new Promise((resolve) => {
        setTimeout(() => {
            const performerReviews = reviews.filter(review => review.performerId === performerId);
            if (performerReviews.length === 0) {
                resolve(null);
                return;
            }
            const totalRating = performerReviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / performerReviews.length;
            resolve(Math.round(averageRating * 10) / 10);
        }, 350);
    });
};

// TODO: Add functions for editing and deleting reviews (with access rights check)
// export const updateReview = async (reviewId: string, updatedData: Partial<Review>): Promise<Review> => { ... };
// export const deleteReview = async (reviewId: string): Promise<void> => { ... };
