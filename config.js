// ============================================================
//  CONFIG.JS — Archivo de configuración de Mario E. López C.
//  Edita aquí todos tus datos sin tocar el index.html
// ============================================================

const CONFIG = {

  // ── PERFIL ──────────────────────────────────────────────
  nombre:    "Mario E. López C.",
  iniciales: "ML",

  // ── MODOS ───────────────────────────────────────────────
  //  pro    → se activa con ?mode=pro (link del CV)
  //  casual → default (link de Instagram, etc.)
  //
  //  En ordenLinks podés usar marcadores de sección:
  //    "_social"      → muestra el label "Redes Sociales"
  //    "_profesional"  → muestra el label "Profesional"
  // ────────────────────────────────────────────────────────
  modos: {
    pro: {
      tagline:     "Ing. Industrial | Gestión de Producción · Datos & Automatización",
      descripcion: null,
      badge:       "Disponible para oportunidades",
      actualmente: "Desarrollando mi proyecto de grado en Ingeniería Industrial",
      ordenLinks:  ["cv", "linkedin", "github", "instagram", "strava"],
      mostrarCV:    true,
      mostrarSkills: true,
      // Chips específicos de este modo:
      skills: [
        { nombre: "Python",            icono: "🐍" },
        { nombre: "Power BI",          icono: "📊" },
        { nombre: "Excel",             icono: "📊" },
        { nombre: "Lean Manufacturing", icono: "⚙️" },
        { nombre: "VBA",               icono: "⚡" },
      ],
    },
    casual: {
      // ✏️ Cambiá estas frases cuando quieras:
      tagline:     "Ingeniería Industrial · Santa Cruz, Bolivia",
      descripcion: null,
      badge:       null,
      actualmente: "Reparando mi bicicleta para volver a rodar",
      ordenLinks:  [
        "_social",
        "instagram", "tiktok", "facebook", "spotify", "duolingo", "strava", "discord",
        "_profesional_toggle",
        "linkedin", "github"
      ],
      mostrarCV:    false,
      mostrarSkills: true,
    },
  },

  // ── CHIPS DE HABILIDADES (default, se sobreescribe si el modo tiene los suyos) ──
  skills: [
    { nombre: "Ciclismo",        icono: "🚴" },
    { nombre: "Frontón",          icono: "🎾" },
    { nombre: "Inglés",           icono: "🇺🇸" },
    { nombre: "Automatización",   icono: "⚙️" },
  ],

  // ── URL DE LA PÁGINA (para el botón de compartir) ──
  siteUrl: "https://marioelopez.github.io",

  // ── DUOLINGO STREAK ─────────────────────────────────────
  //  fechaInicioStreak: el día que empezaste tu racha
  //  La página calcula los días automáticamente desde esa fecha
  fechaInicioStreak: "2024-01-25",  // Formato: YYYY-MM-DD (773 días al 8/mar/2026)
  duolingoIdioma: "Inglés",

  // ── REDES / LINKS ───────────────────────────────────────
  //  El orden aquí NO importa; lo define cada modo arriba.
  //  Solo se muestran los IDs que aparecen en ordenLinks.
  links: [
    {
      id:      "instagram",
      nombre:  "Instagram",
      handle:  "@marioelopez2011",
      url:     "https://www.instagram.com/marioelopez2011",
      icono:   "ig",
    },
    {
      id:      "tiktok",
      nombre:  "TikTok",
      handle:  "@mario_e_lopez",
      url:     "https://www.tiktok.com/@mario_e_lopez",
      icono:   "tt",
    },
    {
      id:      "facebook",
      nombre:  "Facebook",
      handle:  "Capitalista Técnico Analista",
      url:     "https://www.facebook.com/Capitalista.Tecnico.Analista",
      icono:   "fb",
    },
    {
      id:      "discord",
      nombre:  "Discord",
      handle:  "@mario_e_lopez",
      url:     null,
      discordUser: "mario_e_lopez",
      icono:   "dc",
    },
    {
      id:      "spotify",
      nombre:  "Spotify",
      handle:  "Mario E. López",
      url:     "https://open.spotify.com/user/wuf84is4sj60wzyh6cyozurkq",
      icono:   "sp",
    },
    {
      id:      "duolingo",
      nombre:  "Duolingo",
      handle:  "@MarioELopez11",
      url:     "https://www.duolingo.com/profile/MarioELopez11",
      icono:   "duo",
    },
    {
      id:      "strava",
      nombre:  "Strava",
      handle:  "🚴 Cargando stats...",
      url:     "https://www.strava.com/athletes/95307903",
      icono:   "strava",
    },
    {
      id:      "linkedin",
      nombre:  "LinkedIn",
      handle:  "Mario Eduardo López Cáceres",
      url:     "https://www.linkedin.com/in/marioelopezc/",
      icono:   "li",
    },
    {
      id:      "github",
      nombre:  "GitHub",
      handle:  "@MarioELopez",
      url:     "https://github.com/MarioELopez",
      icono:   "gh",
    },
    {
      id:      "cv",
      nombre:  "Currículum Vitae",
      handle:  "Ing. Industrial · UAGRM",
      url:     "https://www.canva.com/design/DAHAlzexkmM/gzhliwIQDsy30xh4PfHfjw/view?utm_content=DAHAlzexkmM&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd70d46c15b",
      urlDescarga: "./CV - MARIO GIT.pdf",
      icono:   "cv",
    },
  ],

  // ── PIE DE PÁGINA ────────────────────────────────────────
  footer: "Mario E. López C. · Santa Cruz, Bolivia"

};
