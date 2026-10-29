// Единственное место, где живут имя, тексты, цифры, проекты и ссылки.
// Разметка страницы собирается из этого файла при сборке (см. vite.config.ts),
// поэтому всё здесь видно и без JavaScript.

export type Tag = 'ML' | 'Data' | 'Web'

export interface Project {
  id: string
  title: string
  /** одна строка для карточки */
  description: string
  /** абзацы для модального окна */
  details: string[]
  highlights: string[]
  tags: Tag[]
  stack: string[]
  year: string
  /** превью 800×500, лежит в /public/projects */
  image: string
  imageAlt: string
  /** пустая строка — ссылка не показывается */
  demo: string
  github: string
}

export interface Skill {
  name: string
  status: 'ok' | 'wip'
}

export interface Stat {
  value: number
  suffix?: string
  label: string
}

const name = 'HENRIK'

export const content = {
  name,
  lang: 'ru',
  meta: {
    title: `${name} — sites that push back`,
    description: `${name}: ML, Data и Web-разработка. Портфолио в эстетике ретро-терминала.`,
    themeColor: '#07070C',
  },

  nav: {
    logo: `~/${name.toLowerCase()}`,
    links: [
      { href: '#about', label: 'обо мне' },
      { href: '#projects', label: 'проекты' },
      { href: '#contact', label: 'контакты' },
    ],
    soundOn: 'звук: вкл',
    soundOff: 'звук: выкл',
    skip: 'Перейти к содержимому',
  },

  intro: {
    boot: 'crt://power-on',
  },

  hero: {
    kicker: `${name} · ML / Data / Web`,
    title: ['SITES THAT', 'PUSH BACK'],
    subtitle: [
      'Делаю интерфейсы, которые отвечают на каждое движение,',
      'и модели, которые находят сигнал в шуме данных.',
    ],
    stats: [
      { value: 5, suffix: '+', label: 'лет в коде' },
      { value: 32, label: 'проекта в проде' },
      { value: 2480, label: 'коммитов за год' },
    ] satisfies Stat[],
    ctaProjects: 'Проекты',
    ctaContact: 'Связаться',
    scrollHint: 'scroll',
  },

  about: {
    label: '01 // обо мне',
    title: 'Cyber eye',
    text: `Я ${name}, разработчик на стыке машинного обучения и веба. Обучаю модели, строю пайплайны данных и превращаю результаты в интерфейсы, которые хочется трогать. Люблю, когда код быстрый, графика плавная, а данные честные.`,
    skillsLabel: 'diagnostics',
    skills: [
      { name: 'python', status: 'ok' },
      { name: 'pytorch', status: 'ok' },
      { name: 'pandas / sql', status: 'ok' },
      { name: 'typescript', status: 'ok' },
      { name: 'three.js / webgl', status: 'ok' },
      { name: 'docker / ci', status: 'ok' },
      { name: 'rust', status: 'wip' },
    ] satisfies Skill[],
    eyeAlt: 'Неоновый кибер-глаз в панельной оболочке',
  },

  projects: {
    label: '02 // проекты',
    title: 'Проекты',
    filterLabel: 'Фильтр проектов по тегам',
    filterAll: 'Все',
    more: 'подробнее',
    demo: 'demo',
    github: 'github',
    close: 'закрыть',
    items: [
      {
        id: 'neurolens',
        title: 'NeuroLens',
        description: 'Классификация изображений прямо в браузере, без сервера.',
        details: [
          'Модель на PyTorch, сжатая до 4 МБ и экспортированная в ONNX. Инференс идёт на WebGPU, а если его нет — на WASM.',
          'Интерфейс показывает карту внимания поверх картинки, чтобы было видно, на что смотрит сеть.',
        ],
        highlights: ['18 мс на кадр на ноутбуке', 'квантизация int8 без потери точности', 'работает офлайн как PWA'],
        tags: ['ML', 'Web'],
        stack: ['PyTorch', 'ONNX', 'WebGPU', 'TypeScript'],
        year: '2026',
        image: '/projects/neurolens.webp',
        imageAlt: 'Превью NeuroLens: тепловая карта внимания поверх сетки',
        demo: 'https://example.com',
        github: 'https://github.com/',
      },
      {
        id: 'pulse',
        title: 'Pulse Board',
        description: 'Дашборд метрик в реальном времени на миллион событий в минуту.',
        details: [
          'Поток событий из Kafka складывается в ClickHouse, агрегаты считаются материализованными представлениями.',
          'Фронтенд рисует графики на canvas и не теряет плавность даже при обновлении раз в секунду.',
        ],
        highlights: ['p95 запроса меньше 120 мс', 'алерты по аномалиям', 'тёмная и светлая темы'],
        tags: ['Data', 'Web'],
        stack: ['ClickHouse', 'Kafka', 'Python', 'Canvas'],
        year: '2025',
        image: '/projects/pulse.webp',
        imageAlt: 'Превью Pulse Board: графики метрик на тёмном фоне',
        demo: 'https://example.com',
        github: 'https://github.com/',
      },
      {
        id: 'kepler',
        title: 'Kepler Recs',
        description: 'Рекомендательная система для каталога из 200 тысяч товаров.',
        details: [
          'Двухбашенная модель для кандидатов и градиентный бустинг для ранжирования. Обучение по расписанию в Airflow.',
          'A/B-тест показал рост кликов на 14 % по сравнению с правилами «похожие товары».',
        ],
        highlights: ['+14 % CTR в A/B-тесте', 'обновление эмбеддингов каждую ночь', 'объяснимые рекомендации'],
        tags: ['ML', 'Data'],
        stack: ['PyTorch', 'CatBoost', 'Airflow', 'Postgres'],
        year: '2025',
        image: '/projects/kepler.webp',
        imageAlt: 'Превью Kepler Recs: граф связей между товарами',
        demo: '',
        github: 'https://github.com/',
      },
      {
        id: 'atlas',
        title: 'Atlas ETL',
        description: 'Пайплайн, который собирает данные из 40 источников в одно хранилище.',
        details: [
          'Инкрементальная загрузка, проверки качества данных и автоматическая документация моделей dbt.',
          'Если источник присылает мусор, пайплайн не падает, а складывает строки в карантин и пишет в Telegram.',
        ],
        highlights: ['40 источников', 'тесты качества на каждом шаге', 'время прогона сократилось с 3 ч до 25 мин'],
        tags: ['Data'],
        stack: ['dbt', 'Airflow', 'Python', 'BigQuery'],
        year: '2024',
        image: '/projects/atlas.webp',
        imageAlt: 'Превью Atlas ETL: схема потоков данных',
        demo: '',
        github: 'https://github.com/',
      },
      {
        id: 'echonote',
        title: 'EchoNote',
        description: 'Голосовые заметки, которые сами превращаются в задачи.',
        details: [
          'Распознавание речи на Whisper, затем небольшая языковая модель вытаскивает из текста задачи, даты и людей.',
          'Бэкенд на FastAPI, интерфейс — веб-приложение с офлайн-очередью записей.',
        ],
        highlights: ['русский и английский', 'обработка на своём сервере', 'экспорт в календарь'],
        tags: ['ML', 'Web'],
        stack: ['Whisper', 'FastAPI', 'TypeScript', 'SQLite'],
        year: '2024',
        image: '/projects/echonote.webp',
        imageAlt: 'Превью EchoNote: звуковая волна и список задач',
        demo: 'https://example.com',
        github: 'https://github.com/',
      },
      {
        id: 'terminal',
        title: 'Retro Terminal',
        description: 'Этот сайт: WebGL, шейдеры и 60 fps на встроенной графике.',
        details: [
          'Один WebGL-контекст на всю страницу, частицы с отталкиванием в вершинном шейдере и процедурный глаз.',
          'Качество графики подстраивается под железо и само снижается, если FPS проседает.',
        ],
        highlights: ['3 уровня качества', 'работает без WebGL и без JS', 'скрытая консоль по ~'],
        tags: ['Web'],
        stack: ['three.js', 'GLSL', 'GSAP', 'Vite'],
        year: '2026',
        image: '/projects/terminal.webp',
        imageAlt: 'Превью Retro Terminal: окно терминала с неоновым текстом',
        demo: 'https://example.com',
        github: 'https://github.com/',
      },
    ] satisfies Project[],
  },

  contact: {
    label: '03 // контакты',
    title: 'Связь',
    text: 'Есть задача, идея или вакансия? Напишите пару строк — отвечу в течение суток.',
    email: 'hello@example.com',
    /** адрес сервиса форм (например, Formspree). Пусто — письмо уйдёт через mailto: */
    formEndpoint: '',
    formTitle: 'contact.sh',
    fields: { name: 'name', email: 'email', message: 'message' },
    submit: 'отправить',
    sending: 'transmitting...',
    done: 'ok — сообщение отправлено',
    mailtoDone: 'ok — открываю почтовый клиент',
    error: 'error — не получилось, напишите на почту напрямую',
    links: [
      { label: 'GitHub', href: 'https://github.com/' },
      { label: 'Telegram', href: 'https://t.me/' },
      { label: 'TikTok', href: 'https://www.tiktok.com/' },
      { label: 'YouTube', href: 'https://www.youtube.com/' },
    ],
  },

  footer: {
    hint: 'нажми ~ — откроется консоль',
    top: 'наверх',
  },

  console: {
    title: 'terminal',
    motd: `${name.toLowerCase()}-os v2.6 — введите help`,
    prompt: `guest@${name.toLowerCase()}:~$`,
  },
}

export type Content = typeof content
