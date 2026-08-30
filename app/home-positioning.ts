import type { Locale } from "./game-data";

type HomePositioning = {
  eyebrow: string;
  title: string;
  subtitle: string;
  startRoom: string;
  sendDare: string;
  teamLink: string;
};

export const HOME_POSITIONING: Record<Locale, HomePositioning> = {
  en: {
    eyebrow: "A tiny drawing game for people who can't draw",
    title: "DRAW IT WRONG. LAUGH TOGETHER.",
    subtitle: "Create a private room for 2-6. Take turns drawing a secret word in 10 seconds while everyone else gets one guess. Free, no app, no account.",
    startRoom: "Start a private room",
    sendDare: "Send a 10-second dare",
    teamLink: "Need a meeting icebreaker?",
  },
  hi: {
    eyebrow: "उन लोगों के लिए छोटा ड्रॉइंग गेम जिन्हें ड्रॉ करना नहीं आता",
    title: "गलत बनाओ। साथ हंसो।",
    subtitle: "2 से 6 लोगों के लिए प्राइवेट रूम बनाएं। बारी-बारी से 10 सेकंड में एक गुप्त शब्द ड्रॉ करें, जबकि बाकी सभी को एक अंदाज़ा मिलता है। मुफ़्त, बिना ऐप, बिना अकाउंट।",
    startRoom: "प्राइवेट रूम शुरू करें",
    sendDare: "10 सेकंड का ड्रॉइंग चैलेंज भेजें",
    teamLink: "मीटिंग के लिए आइसब्रेकर चाहिए?",
  },
  es: {
    eyebrow: "Un pequeño juego de dibujo para quienes no saben dibujar",
    title: "DIBÚJALO MAL. RÍANSE JUNTOS.",
    subtitle: "Crea una sala privada para 2-6 personas. Túrnense para dibujar una palabra secreta en 10 segundos mientras los demás tienen un solo intento para adivinar. Gratis, sin app y sin cuenta.",
    startRoom: "Crear una sala privada",
    sendDare: "Enviar un reto de 10 segundos",
    teamLink: "¿Necesitas romper el hielo en una reunión?",
  },
  fr: {
    eyebrow: "Un petit jeu de dessin pour ceux qui ne savent pas dessiner",
    title: "DESSINEZ MAL. RIEZ ENSEMBLE.",
    subtitle: "Créez une salle privée pour 2 à 6 personnes. À tour de rôle, dessinez un mot secret en 10 secondes pendant que les autres n'ont droit qu'à une réponse. Gratuit, sans appli et sans compte.",
    startRoom: "Créer une salle privée",
    sendDare: "Envoyer un défi de 10 secondes",
    teamLink: "Besoin d'un brise-glace pour une réunion ?",
  },
  "pt-BR": {
    eyebrow: "Um pequeno jogo de desenho para quem não sabe desenhar",
    title: "DESENHE ERRADO. RIAM JUNTOS.",
    subtitle: "Crie uma sala privada para 2 a 6 pessoas. Revezem-se para desenhar uma palavra secreta em 10 segundos enquanto os outros têm um único palpite. Grátis, sem app e sem conta.",
    startRoom: "Criar uma sala privada",
    sendDare: "Enviar um desafio de 10 segundos",
    teamLink: "Precisa de um quebra-gelo para a reunião?",
  },
  de: {
    eyebrow: "Ein kleines Zeichenspiel für alle, die nicht zeichnen können",
    title: "FALSCH ZEICHNEN. ZUSAMMEN LACHEN.",
    subtitle: "Erstellt einen privaten Raum für 2-6 Personen. Zeichnet abwechselnd in 10 Sekunden einen geheimen Begriff, während alle anderen genau einen Rateversuch haben. Kostenlos, ohne App und ohne Konto.",
    startRoom: "Privaten Raum starten",
    sendDare: "10-Sekunden-Challenge senden",
    teamLink: "Braucht ihr einen Meeting-Eisbrecher?",
  },
  ja: {
    eyebrow: "絵が苦手な人のための小さなお絵描きゲーム",
    title: "下手に描いて、一緒に笑おう。",
    subtitle: "2〜6人用のプライベートルームを作成。交代でお題を10秒で描き、ほかの人は一度だけ答えます。無料、アプリもアカウントも不要。",
    startRoom: "プライベートルームを作る",
    sendDare: "10秒チャレンジを送る",
    teamLink: "会議のアイスブレイクをお探しですか？",
  },
  ko: {
    eyebrow: "그림에 자신 없는 사람들을 위한 작은 그림 게임",
    title: "엉망으로 그리고, 함께 웃어요.",
    subtitle: "2~6명이 함께할 비공개 방을 만드세요. 돌아가며 10초 안에 비밀 단어를 그리고, 나머지 사람들은 한 번만 정답을 맞혀요. 무료이며 앱과 계정이 필요 없어요.",
    startRoom: "비공개 방 만들기",
    sendDare: "10초 그림 도전 보내기",
    teamLink: "회의용 아이스브레이커가 필요한가요?",
  },
};
