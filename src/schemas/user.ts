import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

// export const createUserSchema = z.object({
//   name: z.string().min(2),
//   email: z.string().email(),
//   password: z.string().min(8),
// });

// Схема валидации формы регистрации заказчика, добавлено поле agreement
export const createUserSchema = z
  .object({
    accountType: z.enum(["individual", "legalEntity"], {
      required_error: "Выберите тип аккаунта.",
    }),
    email: z.string().email({
      message: "Пожалуйста, введите корректный адрес электронной почты.",
    }),
    password: z.string().min(8, {
      // Добавлено поле пароля
      message: "Пароль должен содержать не менее 8 символов.",
    }),
    name: z.string().min(2, {
      message: "Имя пользователя должно содержать не менее 2 символов.",
    }),
    companyName: z.string().optional(), // Поле для названия компании
    inn: z.string().optional(), // Поле для ИНН
    phone: z.string().regex(/^(\+7|8)\d{10}$/, {
      message: "Пожалуйста, введите корректный номер телефона.",
    }),
    city: z.string().min(2, {
      message: "Пожалуйста, выберите или введите город.",
    }),
    agreement: z.boolean().refine((val) => val === true, {
      // Поле для галочки согласия
      message: "Необходимо согласиться с обработкой персональных данных.",
    }),
  })
  .refine(
    (data) => {
      // Если выбран тип "юрлицо", то companyName и inn должны быть заполнены
      if (data.accountType === "legalEntity") {
        return (
          !!data.companyName &&
          data.companyName.length >= 2 &&
          !!data.inn &&
          /^\d{10}$|^\d{12}$/.test(data.inn)
        );
      }
      return true; // Для физлица эти поля не обязательны
    },
    {
      // Сообщение об ошибке будет отображаться у конкретных полей ниже
      message:
        "Для юридического лица необходимо указать название компании и ИНН.",
      // path: ["companyName"], // Можно привязать к одному полю, но лучше проверять ниже
    }
  );

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema;

export type User = z.infer<typeof userSchema>;
// export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
