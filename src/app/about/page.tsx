import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPageSEO } from "@/utils/seo";

export async function generateMetadata() {
  return getPageSEO("/about");
}

// About Us page component
// Компонент страницы "О нас"
const AboutPage = () => {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>О нас</CardTitle> {/* About Us */}
          <CardDescription>
            Информация о нашем сервисе и портале{" "}
            {/* Information about our service and portal */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <div className="p-4">
              {/* Welcome message */}
              {/* Приветственное сообщение */}
              <h2 className="text-2xl font-bold mb-4">
                Добро пожаловать в Eventomir!
              </h2>{" "}
              {/* Welcome to Eventomir! */}
              {/* Main platform description */}
              {/* Основное описание платформы */}
              <p className="mb-4">
                Eventomir - это онлайн-платформа, созданная для соединения
                профессионалов в сфере организации мероприятий с клиентами,
                нуждающимися в их услугах. Мы стремимся упростить процесс поиска
                и выбора идеальных исполнителей для любого торжества: от свадеб
                и юбилеев до корпоративных вечеринок и дней рождения.
                {/* Eventomir is an online platform created to connect event organization professionals with clients
                                needing their services. We aim to simplify the process of finding and selecting the perfect performers for any celebration:
                                from weddings and anniversaries to corporate parties and birthdays. */}
              </p>
              {/* Platform advantages */}
              {/* Преимущества платформы */}
              <h3 className="text-xl font-semibold mb-2">
                Наши преимущества:
              </h3>{" "}
              {/* Our advantages: */}
              <ul className="list-disc pl-5 mb-4">
                <li>
                  <b>Обширная база исполнителей:</b> Мы предлагаем широкий выбор
                  профессионалов различных категорий, что позволяет найти
                  идеального кандидата под любой запрос и бюджет.
                  {/* <b>Extensive performer database:</b> We offer a wide selection of professionals in various categories,
                                    allowing you to find the ideal candidate for any request and budget. */}
                </li>
                <li>
                  <b>Удобный поиск и фильтры:</b> Наша система поиска позволяет
                  быстро находить исполнителей по местоположению, типу услуг,
                  ценовому диапазону и другим важным критериям.
                  {/* <b>Convenient search and filters:</b> Our search system allows you to quickly find performers by location,
                                    service type, price range, and other important criteria. */}
                </li>
                <li>
                  <b>Рейтинги и отзывы:</b> Просматривайте рейтинги и отзывы от
                  других пользователей, чтобы сделать осознанный выбор и найти
                  самых надежных и проверенных специалистов.
                  {/* <b>Ratings and reviews:</b> View ratings and reviews from other users to make an informed choice and
                                    find the most reliable and trusted specialists. */}
                </li>
                <li>
                  <b>Личные кабинеты с портфолио:</b> У каждого исполнителя есть
                  свой личный кабинет, где они могут демонстрировать свои
                  работы, опыт и цены, что помогает клиентам лучше оценить их
                  профессионализм.
                  {/* <b>Personal profiles with portfolios:</b> Each performer has their own personal profile where they can showcase their work,
                                    experience, and prices, helping clients better assess their professionalism. */}
                </li>
                <li>
                  <b>Прозрачность и безопасность:</b> Мы следим за качеством
                  предоставляемых услуг и стремимся обеспечить безопасную и
                  надежную платформу для взаимодействия между клиентами и
                  исполнителями.
                  {/* <b>Transparency and security:</b> We monitor the quality of services provided and strive to ensure a safe and
                                    reliable platform for interaction between clients and performers. */}
                </li>
              </ul>
              {/* Value for users */}
              {/* Ценность для пользователей */}
              <h3 className="text-xl font-semibold mb-2">
                Наша ценность для пользователей:
              </h3>{" "}
              {/* Our value for users: */}
              <p className="mb-4">
                Eventomir помогает сэкономить время и силы при поиске идеальных
                исполнителей для мероприятий. Мы предлагаем удобный и надежный
                способ найти профессионалов, отвечающих вашим требованиям и
                ожиданиям, чтобы ваше мероприятие прошло на высшем уровне.
                {/* Eventomir helps save time and effort when searching for the ideal performers for events.
                                We offer a convenient and reliable way to find professionals who meet your requirements and expectations,
                                ensuring your event is held at the highest level. */}
              </p>
              {/* Call to action */}
              {/* Призыв к действию */}
              <p className="mb-4">
                Присоединяйтесь к Eventomir сегодня и откройте для себя мир
                возможностей для организации незабываемых событий!
                {/* Join Eventomir today and discover a world of possibilities for organizing unforgettable events! */}
              </p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Export component
// Экспорт компонента
export default AboutPage;
