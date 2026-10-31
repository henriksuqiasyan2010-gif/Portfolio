// Единственное место, где живут имя, тексты, цифры, проекты и ссылки.
// Разметка страницы собирается из этого файла при сборке (см. vite.config.ts),
// поэтому всё здесь видно и без JavaScript.

/** Категория для фильтра проектов. */
export type Tag = 'ML' | 'Data' | 'Web'

export interface Project {
  id: string
  title: string
  /** одна строка для карточки */
  description: string
  /** абзацы для модального окна */
  details: string[]
  highlights: string[]
  /** категории для фильтра */
  tags: Tag[]
  /** подписи на карточке и в модалке */
  labels: string[]
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

const name = 'Henrik'

export const content = {
  name,
  lang: 'en',
  meta: {
    title: `${name} — sites that push back`,
    description: `${name}: Data Science, ML and Web — from raw data to a working product.`,
    themeColor: '#07070C',
  },

  /** подписи для скринридеров и служебные строки интерфейса */
  ui: {
    skip: 'Skip to content',
    homeLabel: `${name} — back to top`,
    navLabel: 'Sections',
    statsLabel: 'Numbers',
    stackLabel: 'Stack',
    openConsole: 'Open the console',
  },

  nav: {
    logo: `~/${name.toLowerCase()}`,
    links: [
      { href: '#about', label: 'about' },
      { href: '#projects', label: 'projects' },
      { href: '#contact', label: 'contact' },
    ],
    soundOn: 'sound: on',
    soundOff: 'sound: off',
  },

  intro: {
    boot: 'crt://power-on',
  },

  hero: {
    kicker: 'Data Science · ML · Web',
    title: ['SITES THAT', 'PUSH BACK'],
    subtitle: ['From raw data to a working product:', 'I collect data, train models and turn ideas into apps.'],
    stats: [
      { value: 2, label: 'years in IT' },
      { value: 2, label: 'projects' },
      { value: 1, label: 'in development' },
    ] as Stat[],
    ctaProjects: 'Projects',
    ctaContact: 'Get in touch',
    scrollHint: 'scroll',
  },

  about: {
    label: '01 // about',
    title: 'Cyber eye',
    text: 'I’ve been in IT for two years, working across data analysis, machine learning and web development: I collect data, train models and turn ideas into working products. I’ve taken part in many hackathons and went through the 301 AD startup program, where I founded my own startup. Currently open to freelance work. I also run “a couch potato”, a channel about programming, Claude and satisfying code visualizations.',
    skillsLabel: 'diagnostics',
    skills: [
      { name: 'python', status: 'ok' },
      { name: 'pytorch / deep learning', status: 'ok' },
      { name: 'mediapipe / opencv / cv', status: 'ok' },
      { name: 'numpy / pandas / sklearn', status: 'ok' },
      { name: 'data analysis', status: 'ok' },
      { name: 'typescript', status: 'ok' },
      { name: 'react / next.js', status: 'ok' },
      { name: 'node.js / express', status: 'ok' },
      { name: 'postgresql', status: 'ok' },
      { name: 'pytest / vitest', status: 'ok' },
      { name: 'ci/cd (github actions)', status: 'ok' },
      { name: 'claude code / ai tools', status: 'ok' },
      { name: 'generative image models', status: 'wip' },
    ] satisfies Skill[],
    softSkills: 'communication · leadership · strong work ethic',
    eyeAlt: 'A neon cyber eye inside a panelled shell',
  },

  projects: {
    label: '02 // projects',
    title: 'Projects',
    filterLabel: 'Filter projects by category',
    filterAll: 'All',
    more: 'details',
    demo: 'demo',
    github: 'github',
    close: 'close',
    items: [
      {
        id: 'slt',
        title: 'SLT',
        description: 'Real-time American Sign Language recognition from an ordinary webcam, with translation into English, Armenian and Russian.',
        details: [
          'For Deaf and hard-of-hearing people, sign language is their native language, yet most hearing people don’t know it. SLT is a Windows app that helps close that gap: it recognizes ASL signs through a regular webcam, shows the word in three languages and can speak it aloud.',
          'It has three modes. In Single word mode, the app names the sign, shows its confidence and offers two alternatives. In Sentence mode, signs build up into a line, and any mistake can be fixed with one click on a suggestion. In Learn mode, the app shows an animation of the correct sign, scores your attempt and compares it side by side with the reference.',
          'Under the hood, MediaPipe Holistic extracts 543 body, hand and face landmarks per frame. The 130 most informative points are normalized and fed into a hybrid 1D-CNN + Transformer network, trained on Kaggle GPUs on Google’s Isolated Sign Language Recognition dataset (~94,500 clips of 250 signs from 21 signers). The model is exported to ONNX and runs fully offline on a laptop.',
          'Training: mixed precision, AdamW, cosine LR schedule, label smoothing, mixup, landmark-level augmentation, participant-grouped cross-validation.',
          'Limitations: SLT recognizes isolated signs, not continuous signing. It has a 250-word vocabulary, and most signs are one-handed.',
        ],
        highlights: [
          '65% top-1 and ~75% top-3 accuracy on unseen signers across 250 classes (random chance is under 0.5%)',
          '~2 ms inference on CPU, fully offline',
          'a “follow the moving hand” rule fixed two-hand tracking and raised accuracy on those signs from 37% to 61%',
          '10/10 signs and 15/15 words in sentences recognized in live tests',
          'standalone Windows app that runs without Python installed',
        ],
        tags: ['ML'],
        labels: ['Computer Vision', 'Deep Learning', 'Transformers', 'Accessibility', 'Desktop App'],
        stack: [
          'Python 3.11', 'PyTorch', 'MediaPipe Holistic', 'OpenCV', 'ONNX Runtime', 'NumPy', 'pandas', 'PyArrow',
          'scikit-learn', 'PySide6 (Qt)', 'pyttsx3', 'Matplotlib', 'pytest', 'PyInstaller', 'Kaggle (Tesla T4)',
        ],
        year: '2026',
        image: '/projects/slt.webp',
        imageAlt: 'SLT in Single word mode: hand and pose landmarks, “hello” recognized with 93% confidence, with Armenian and Russian translations',
        demo: '',
        github: 'https://github.com/henriksuqiasyan2010-gif/SLT',
      },
      {
        id: 'inview',
        title: 'Inview',
        description: 'First jobs, volunteering, people and joint projects — for 14 to 18 year olds.',
        details: [
          'Job boards are built for adults: a teenager can’t tell what they’re legally allowed to do, or whether a real organization stands behind a listing. Social networks reward followers rather than doing things, so a teen without a network has no way in. “Right now, nobody can see you.” Inview gives them a place to be seen.',
          'Teens browse jobs and volunteering filtered to their age. They can search in plain language: “paid weekend work with photography” turns into filter chips through a deterministic parser, with no LLM. They apply in one click and see exactly what the organization will receive. They can also find peers by shared interests or start projects others can join. Organizations submit listings through a public form, and a moderator verifies each one against a mandatory checklist before it goes live.',
          'Safety is the foundation, not a feature. Age is derived on the server from an immutable date of birth that never reaches the browser. Profiles collect no photos, surnames, phones or schools. Profile text is reviewed by a human, and three reports auto-hide a profile. Messaging works on a request-to-chat basis with rate limits, and an append-only audit log is enforced by a database trigger. The browser never talks to the database directly: every age check and moderation gate lives on the server.',
        ],
        highlights: [
          'working MVP, fully trilingual (English / Russian / Armenian), including emails and legal pages',
          '~19,000 lines of application code and ~4,000 lines of tests',
          '277 automated tests running against a real PostgreSQL database, not mocks',
          '21 tables, 11 migrations, 4 scheduled background jobs',
          'CI pipeline: lint → typecheck → migrate → test → build',
        ],
        tags: ['Web'],
        labels: ['Full-Stack', 'Startup', 'Trust & Safety', 'i18n', 'Teens'],
        stack: [
          'TypeScript', 'Next.js 16', 'React 19', 'Tailwind CSS 4', 'next-intl', 'Node.js 24', 'Express 5', 'PostgreSQL 17',
          'Drizzle ORM', 'Zod', 'JWT', 'Vitest', 'GitHub Actions', 'Vercel', 'Render', 'Neon',
        ],
        year: '2026',
        image: '/projects/inview.webp',
        imageAlt: 'Inview homepage: “Right now, nobody can see you.” next to age-labelled volunteering and work listings',
        demo: 'https://inview-frontend-one.vercel.app/',
        github: '',
      },
    ] satisfies Project[],
  },

  contact: {
    label: '03 // contact',
    title: 'Contact',
    text: 'Got a task, an idea or a role? Drop me a few lines — I’m open to freelance work and reply within a day.',
    email: 'henrik.suqiasyan2010@gmail.com',
    /** адрес сервиса форм (например, Formspree). Пусто — письмо уйдёт через mailto: */
    formEndpoint: '',
    formTitle: 'contact.sh',
    fields: { name: 'name', email: 'email', message: 'message' },
    submit: 'send',
    sending: 'transmitting...',
    done: 'ok — message sent',
    mailtoDone: 'ok — opening your mail app',
    error: 'error — that didn’t work, please email me directly',
    mailSubject: 'Message from the site from',
    links: [
      { label: 'GitHub', href: 'https://github.com/henriksuqiasyan2010-gif' },
      { label: 'Telegram', href: 'https://t.me/hibrotherrrr' },
      { label: 'YouTube', href: 'https://www.youtube.com/@A-couch-potato-python' },
    ],
  },

  footer: {
    hint: 'press ~ to open the console',
    top: 'back to top',
  },

  console: {
    title: 'terminal',
    motd: `${name.toLowerCase()}-os v2.6 — type help`,
    prompt: `guest@${name.toLowerCase()}:~$`,
    help: {
      help: 'list commands',
      about: 'who I am',
      projects: 'list projects',
      open: 'open a project: open <id>',
      contact: 'how to reach me',
      theme: 'theme amber | green',
      clear: 'clear the screen',
      exit: 'close the console (or Esc)',
    },
    commandsTitle: 'available commands:',
    secrets: '…and a couple of secret ones',
    openHint: 'details: open <id>, e.g. open',
    noProject: 'no such project. list them with: projects',
    notFound: 'command not found: {cmd}. type help',
    themeSet: 'theme: {name}',
    eggs: {
      sudoPassword: '[sudo] password for guest: ********',
      sudo: 'guest is not in the sudoers file. This incident will be reported.',
      rm: 'rm: cannot remove "/": this site pushes back.',
      hackStart: 'initiating hack...',
      hackSteps: ['bypassing firewall', 'decrypting mainframe', 'downloading more RAM', 'rerouting through the eye'],
      hackDone: 'ACCESS GRANTED',
      hackJoke: '…just kidding. want a site like this? type contact',
      coffee: 'HTTP 418: I’m a teapot',
      coffeeNote: 'no coffee here, but code any time',
      whoami: 'guest',
      whoamiNote: 'but you could become a client: contact',
      catSecret: 'access denied. the eye sees everything.',
      catOther: 'cat: {file}: try about',
    },
  },
}

export type Content = typeof content
