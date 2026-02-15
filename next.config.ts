import type {NextConfig} from 'next';

// Define security headers to protect against web vulnerabilities.
// More information: https://nextjs.org/docs/app/building-your-application/configuring/headers
// Определяем заголовки безопасности для защиты от веб-уязвимостей.
const securityHeaders = [
  // Prevent content type sniffing.
  // Предотвращает определение типа контента по содержимому (MIME-sniffing).
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff', // Prevents the browser from MIME-sniffing a response. - Запрещает браузеру определять тип контента, отличный от указанного.
    // Запрещает браузеру определять тип контента, отличный от указанного.
  },
  // Prevent clickjacking attacks.
  // Предотвращает атаки "clickjacking".
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN', // Prevents the page from being displayed in an iframe, except from the same origin. Use 'DENY' to prevent iframing altogether. - Разрешает отображать страницу только во фрейме с тем же источником. "DENY" запрещает встраивание во фреймы.
    // Разрешает отображать страницу только во фрейме с тем же источником. "DENY" запрещает встраивание во фреймы.
  },
  // Prevent cross-site scripting (XSS) attacks.
  // Предотвращает межсайтовые скриптовые атаки (XSS).
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block', // Enables XSS filtering and blocks the page from rendering if an attack is detected. - Включает фильтрацию XSS и блокирует отрисовку страницы, если обнаружена атака.
    // Включает фильтрацию XSS и блокирует отрисовку страницы, если обнаружена атака.
  },
  // Control referrer information sent to other sites.
  // Управляет информацией о реферере, отправляемой на другие сайты.
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin', // Only send the origin when navigating to another site. - Отправляет только источник при переходе на другой сайт.
    // Отправляет только источник при переходе на другой сайт.
  },
  // Content Security Policy (CSP) - *Example*, requires customization.
  // This is a powerful header, but requires careful configuration based on your specific needs.
  // Restricts which resources (scripts, styles, images, etc.) the browser is allowed to load.
  // It is recomended to start with a restrictive policy and gradually allow necessary sources.
  // Content Security Policy (CSP) - *Пример*, требуется настройка.
  // Это мощный заголовок, но требует тщательной настройки, исходя из ваших конкретных потребностей.
  // Ограничивает, какие ресурсы (скрипты, стили, изображения и т. д.) браузеру разрешено загружать.
  // Рекомендуется начинать с ограничительной политики и постепенно разрешать необходимые источники.
  // {
  //   key: 'Content-Security-Policy',
  //   value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://picsum.photos; font-src 'self';",
    // Этот заголовок задаёт правила для загрузки ресурсов.
    // default-src 'self': default policy for content loading - all from the same domain;
    // script-src 'self' 'unsafe-inline' 'unsafe-eval': allows loading scripts from own domain, and inline scripts;
    // style-src 'self' 'unsafe-inline': allows loading style from own domain, and inline style;
    // img-src 'self' data: https://picsum.photos: allows loading images from the same domain, from data: and https://picsum.photos
    // font-src 'self': allows loading fonts from same domain.
  // },
  // Strict Transport Security (HSTS) - Enforce HTTPS.
  // Strict Transport Security (HSTS) - Принудительное использование HTTPS.
   // Указывает браузеру использовать HTTPS на сайте, даже если пользователь ввел HTTP.
  // Strict Transport Security (HSTS) - Принудительное использование HTTPS.
  // Указывает браузеру использовать HTTPS на сайте, даже если пользователь ввел HTTP.
  // Only enable this if you are sure your site is fully HTTPS and you understand the security implications.
  // {
  //   key: 'Strict-Transport-Security',
  //   value: 'max-age=63072000; includeSubDomains; preload', // max-age = 2 years - enforce HTTPS for 2 years, including all subdomains.
  // }
];

// Next.js configuration - Конфигурация Next.js
const nextConfig: NextConfig = {
  /* config options here */
  // TypeScript and ESLint errors will now halt the build process - Ошибки TypeScript и ESLint теперь будут останавливать процесс сборки.
  // Ошибки TypeScript и ESLint теперь будут останавливать процесс сборки.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  }, 
  // Add the security headers configuration to the application. - Добавляет заголовки безопасности в приложение.
  // Добавляет заголовки безопасности в приложение.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
