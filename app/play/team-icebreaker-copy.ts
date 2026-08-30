import type { Locale } from "../game-data";

export type TeamIcebreakerCopy = {
  heroBadge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  facilitationHeading: string;
  actions: readonly { label: string; body: string }[];
  momentsHeading: string;
  moments: readonly string[];
  trustPrivacy: string;
  factsHeading: string;
  facts: readonly string[];
  questionsHeading: string;
  questions: readonly { question: string; answer: string }[];
  finalHeading: string;
  finalCta: string;
};

export const TEAM_ICEBREAKER_COPY: Record<Locale, TeamIcebreakerCopy> = {
  en: {
    heroBadge: "5-minute drawing icebreaker for remote teams",
    title: "Break the ice. Draw it wrong.",
    subtitle: "A five-minute drawing game that gets your remote team laughing before the real meeting begins.",
    primaryCta: "Start a team room",
    facilitationHeading: "Ready in three tiny moves",
    actions: [
      { label: "Open a room", body: "Start a private room and get one clean invite link." },
      { label: "Paste the link", body: "Drop it into Zoom, Slack, Teams, or your call chat." },
      { label: "Laugh, then work", body: "Everyone draws badly, guesses boldly, and returns to the meeting warmed up." },
    ],
    momentsHeading: "Use the first five minutes",
    moments: ["While people join the call", "Right before a workshop", "Before your next sprint retro"],
    trustPrivacy: "Private room. No account. No public profile.",
    factsHeading: "Built for a small group already together",
    facts: ["2-6 players", "About five minutes", "Phone or laptop", "8 interface languages"],
    questionsHeading: "Quick answers before you start",
    questions: [
      { question: "What is a drawing icebreaker?", answer: "It is a short group activity where everyone takes turns drawing a secret prompt and guessing the result. Draw Me Wrong turns it into one private browser room." },
      { question: "How long does it take, and how many people can play?", answer: "A full team warm-up takes about five minutes for 2-6 people. Each drawing turn lasts ten seconds." },
      { question: "Does anyone need an app or account?", answer: "No. It is free to play in a modern phone or laptop browser. The facilitator shares one room link, and anyone with that link can join." },
    ],
    finalHeading: "Your meeting has five minutes to spare.",
    finalCta: "Start a team room",
  },
  hi: {
    heroBadge: "रिमोट टीमों के लिए 5 मिनट का ड्रॉइंग आइसब्रेकर",
    title: "बर्फ तोड़ो। गलत ड्रॉ करो।",
    subtitle: "असल मीटिंग से पहले आपकी रिमोट टीम को हंसाने वाला पांच मिनट का ड्रॉइंग गेम।",
    primaryCta: "टीम रूम शुरू करें",
    facilitationHeading: "तीन छोटे कदमों में तैयार",
    actions: [
      { label: "रूम खोलें", body: "प्राइवेट रूम शुरू करें और एक साफ इनवाइट लिंक पाएं।" },
      { label: "लिंक पेस्ट करें", body: "इसे Zoom, Slack, Teams या कॉल चैट में भेजें।" },
      { label: "हंसें, फिर काम करें", body: "सब खराब ड्रॉ करते हैं, बेधड़क अंदाजा लगाते हैं और मीटिंग के लिए तैयार हो जाते हैं।" },
    ],
    momentsHeading: "शुरुआती पांच मिनट इस्तेमाल करें",
    moments: ["जब लोग कॉल में जुड़ रहे हों", "वर्कशॉप शुरू होने से ठीक पहले", "अगले स्प्रिंट रेट्रो से पहले"],
    trustPrivacy: "प्राइवेट रूम। कोई अकाउंट नहीं। कोई पब्लिक प्रोफाइल नहीं।",
    factsHeading: "पहले से साथ मौजूद छोटे ग्रुप के लिए",
    facts: ["2 से 6 खिलाड़ी", "लगभग पांच मिनट", "फोन या लैपटॉप", "8 इंटरफेस भाषाएं"],
    questionsHeading: "शुरू करने से पहले छोटे जवाब",
    questions: [
      { question: "ड्रॉइंग आइसब्रेकर क्या होता है?", answer: "यह एक छोटा ग्रुप गेम है जिसमें हर कोई बारी-बारी से गुप्त संकेत को ड्रॉ करता है और बाकी लोग अंदाजा लगाते हैं। Draw Me Wrong इसे एक प्राइवेट ब्राउज़र रूम में चलाता है।" },
      { question: "इसमें कितना समय लगता है और कितने लोग खेल सकते हैं?", answer: "2 से 6 लोगों का पूरा टीम वॉर्म-अप लगभग पांच मिनट में हो जाता है। हर ड्रॉइंग टर्न दस सेकंड का है।" },
      { question: "क्या किसी को ऐप या अकाउंट चाहिए?", answer: "नहीं। यह आधुनिक फोन या लैपटॉप ब्राउज़र में मुफ्त चलता है। फैसिलिटेटर एक रूम लिंक शेयर करता है और उस लिंक वाला कोई भी व्यक्ति जुड़ सकता है।" },
    ],
    finalHeading: "आपकी मीटिंग के पास पांच मिनट हैं।",
    finalCta: "टीम रूम शुरू करें",
  },
  es: {
    heroBadge: "Rompehielos de dibujo de 5 minutos para equipos remotos",
    title: "Rompe el hielo. Dibújalo mal.",
    subtitle: "Un juego de dibujo de cinco minutos para hacer reír a tu equipo remoto antes de empezar.",
    primaryCta: "Crear sala de equipo",
    facilitationHeading: "Listo en tres movimientos",
    actions: [
      { label: "Abre una sala", body: "Crea una sala privada y recibe un enlace limpio." },
      { label: "Pega el enlace", body: "Compártelo en Zoom, Slack, Teams o el chat de la llamada." },
      { label: "Ríanse y trabajen", body: "Todos dibujan fatal, adivinan con seguridad y vuelven a la reunión con energía." },
    ],
    momentsHeading: "Usa los primeros cinco minutos",
    moments: ["Mientras la gente entra a la llamada", "Justo antes de un taller", "Antes de la próxima retrospectiva"],
    trustPrivacy: "Sala privada. Sin cuenta. Sin perfil público.",
    factsHeading: "Para grupos pequeños que ya están juntos",
    facts: ["2-6 jugadores", "Unos cinco minutos", "Móvil o portátil", "8 idiomas de interfaz"],
    questionsHeading: "Respuestas rápidas antes de empezar",
    questions: [
      { question: "¿Qué es un rompehielos de dibujo?", answer: "Es una actividad breve en grupo donde todos se turnan para dibujar una consigna secreta y adivinar el resultado. Draw Me Wrong lo convierte en una sala privada del navegador." },
      { question: "¿Cuánto dura y cuántas personas pueden jugar?", answer: "Una ronda completa para el equipo dura unos cinco minutos con 2-6 personas. Cada turno de dibujo dura diez segundos." },
      { question: "¿Hace falta una app o una cuenta?", answer: "No. Se juega gratis en el navegador de un móvil u ordenador moderno. La persona que facilita comparte un enlace y cualquiera que lo tenga puede entrar." },
    ],
    finalHeading: "Tu reunión puede regalarte cinco minutos.",
    finalCta: "Crear sala de equipo",
  },
  fr: {
    heroBadge: "Brise-glace dessin de 5 minutes pour équipes à distance",
    title: "Brisez la glace. Dessinez de travers.",
    subtitle: "Un jeu de dessin de cinq minutes pour faire rire votre équipe à distance avant la réunion.",
    primaryCta: "Créer une salle d'équipe",
    facilitationHeading: "Prêt en trois petits gestes",
    actions: [
      { label: "Ouvrez une salle", body: "Créez une salle privée et obtenez un lien simple." },
      { label: "Collez le lien", body: "Envoyez-le dans Zoom, Slack, Teams ou le chat de l'appel." },
      { label: "Riez, puis travaillez", body: "Tout le monde dessine mal, devine avec aplomb et reprend la réunion détendu." },
    ],
    momentsHeading: "Profitez des cinq premières minutes",
    moments: ["Quand les gens rejoignent l'appel", "Juste avant un atelier", "Avant votre prochaine rétrospective"],
    trustPrivacy: "Salle privée. Sans compte. Sans profil public.",
    factsHeading: "Pour un petit groupe déjà réuni",
    facts: ["2-6 joueurs", "Environ cinq minutes", "Téléphone ou ordinateur", "8 langues d'interface"],
    questionsHeading: "Quelques réponses avant de commencer",
    questions: [
      { question: "Qu'est-ce qu'un brise-glace de dessin ?", answer: "C'est une courte activité de groupe où chacun dessine à tour de rôle un sujet secret et devine le résultat. Draw Me Wrong en fait une salle privée dans le navigateur." },
      { question: "Combien de temps faut-il et combien de personnes peuvent jouer ?", answer: "Un échauffement complet dure environ cinq minutes pour 2 à 6 personnes. Chaque tour de dessin dure dix secondes." },
      { question: "Faut-il une application ou un compte ?", answer: "Non. Le jeu est gratuit dans le navigateur d'un téléphone ou ordinateur récent. L'animateur partage un lien et toute personne qui le possède peut rejoindre la salle." },
    ],
    finalHeading: "Votre réunion a bien cinq minutes.",
    finalCta: "Créer une salle d'équipe",
  },
  "pt-BR": {
    heroBadge: "Quebra-gelo de desenho de 5 minutos para times remotos",
    title: "Quebre o gelo. Desenhe errado.",
    subtitle: "Um jogo de desenho de cinco minutos para fazer seu time remoto rir antes da reunião começar.",
    primaryCta: "Criar sala do time",
    facilitationHeading: "Pronto em três movimentos",
    actions: [
      { label: "Abra uma sala", body: "Crie uma sala privada e receba um link simples." },
      { label: "Cole o link", body: "Envie no Zoom, Slack, Teams ou no chat da chamada." },
      { label: "Riam e trabalhem", body: "Todo mundo desenha mal, chuta com confiança e volta mais solto para a reunião." },
    ],
    momentsHeading: "Use os primeiros cinco minutos",
    moments: ["Enquanto as pessoas entram na chamada", "Logo antes de um workshop", "Antes da próxima retrospectiva"],
    trustPrivacy: "Sala privada. Sem conta. Sem perfil público.",
    factsHeading: "Feito para um grupo pequeno já reunido",
    facts: ["2-6 jogadores", "Cerca de cinco minutos", "Celular ou computador", "8 idiomas de interface"],
    questionsHeading: "Respostas rápidas antes de começar",
    questions: [
      { question: "O que é um quebra-gelo de desenho?", answer: "É uma atividade curta em grupo em que todos se revezam para desenhar uma palavra secreta e adivinhar o resultado. O Draw Me Wrong transforma isso em uma sala privada no navegador." },
      { question: "Quanto tempo leva e quantas pessoas podem jogar?", answer: "Um aquecimento completo leva cerca de cinco minutos para 2 a 6 pessoas. Cada turno de desenho dura dez segundos." },
      { question: "Alguém precisa de aplicativo ou conta?", answer: "Não. É grátis para jogar no navegador de um celular ou computador moderno. O facilitador compartilha um link e qualquer pessoa com ele pode entrar." },
    ],
    finalHeading: "Sua reunião pode poupar cinco minutos.",
    finalCta: "Criar sala do time",
  },
  de: {
    heroBadge: "5-Minuten-Zeichen-Eisbrecher für Remote-Teams",
    title: "Eis brechen. Falsch zeichnen.",
    subtitle: "Ein Fünf-Minuten-Zeichenspiel, das euer Remote-Team vor dem Meeting zum Lachen bringt.",
    primaryCta: "Teamraum starten",
    facilitationHeading: "In drei kleinen Zügen bereit",
    actions: [
      { label: "Raum öffnen", body: "Starte einen privaten Raum und erhalte einen einfachen Link." },
      { label: "Link einfügen", body: "Schicke ihn in Zoom, Slack, Teams oder den Call-Chat." },
      { label: "Lachen, dann arbeiten", body: "Alle zeichnen schlecht, raten mutig und gehen locker ins Meeting zurück." },
    ],
    momentsHeading: "Nutzt die ersten fünf Minuten",
    moments: ["Während Leute dem Call beitreten", "Direkt vor einem Workshop", "Vor eurer nächsten Sprint-Retro"],
    trustPrivacy: "Privater Raum. Kein Konto. Kein öffentliches Profil.",
    factsHeading: "Für kleine Gruppen, die schon zusammen sind",
    facts: ["2-6 Spieler", "Etwa fünf Minuten", "Handy oder Laptop", "8 Oberflächensprachen"],
    questionsHeading: "Kurze Antworten vor dem Start",
    questions: [
      { question: "Was ist ein Zeichen-Eisbrecher?", answer: "Das ist eine kurze Gruppenaktivität, bei der alle abwechselnd einen geheimen Begriff zeichnen und das Ergebnis erraten. Draw Me Wrong bringt sie in einen privaten Browserraum." },
      { question: "Wie lange dauert es und wie viele Personen können spielen?", answer: "Ein kompletter Team-Warm-up dauert für 2 bis 6 Personen etwa fünf Minuten. Jede Zeichenrunde dauert zehn Sekunden." },
      { question: "Braucht jemand eine App oder ein Konto?", answer: "Nein. Das Spiel ist in einem modernen Handy- oder Laptop-Browser kostenlos. Die Moderation teilt einen Raumlink und alle mit diesem Link können beitreten." },
    ],
    finalHeading: "Euer Meeting hat fünf Minuten übrig.",
    finalCta: "Teamraum starten",
  },
  ja: {
    heroBadge: "リモートチーム向け・5分のお絵描きアイスブレイク",
    title: "アイスブレイクは、下手な絵から。",
    subtitle: "本題の前に、リモートチームが5分で笑えるお絵描きゲーム。",
    primaryCta: "チームルームを作る",
    facilitationHeading: "3つの簡単な動きで開始",
    actions: [
      { label: "ルームを作る", body: "プライベートルームを作り、シンプルな招待リンクを受け取ります。" },
      { label: "リンクを貼る", body: "Zoom、Slack、Teams、または通話チャットに送ります。" },
      { label: "笑って、仕事に戻る", body: "みんなで下手に描き、大胆に当てて、気軽に会議へ戻ります。" },
    ],
    momentsHeading: "最初の5分を使おう",
    moments: ["みんなが通話に参加している間", "ワークショップの直前", "次のスプリントレトロの前"],
    trustPrivacy: "プライベートルーム。アカウント不要。公開プロフィールなし。",
    factsHeading: "すでに集まっている少人数グループ向け",
    facts: ["2〜6人", "約5分", "スマホまたはパソコン", "8つの表示言語"],
    questionsHeading: "始める前の簡単な答え",
    questions: [
      { question: "お絵描きアイスブレイクとは？", answer: "全員が順番に秘密のお題を描き、その絵を当てる短いグループ活動です。Draw Me Wrongなら、ブラウザーのプライベートルームひとつで遊べます。" },
      { question: "所要時間と参加人数は？", answer: "2〜6人なら、チーム全体のウォームアップは約5分です。1回のお絵描きは10秒です。" },
      { question: "アプリやアカウントは必要ですか？", answer: "いいえ。新しいスマホやパソコンのブラウザーで無料で遊べます。進行役がルームリンクを共有し、リンクを持つ人なら参加できます。" },
    ],
    finalHeading: "会議の最初の5分を、もっと楽しく。",
    finalCta: "チームルームを作る",
  },
  ko: {
    heroBadge: "원격 팀을 위한 5분 그림 아이스브레이크",
    title: "어색함을 깨세요. 엉망으로 그리세요.",
    subtitle: "본격적인 회의 전에 원격 팀이 5분 동안 웃을 수 있는 그림 게임입니다.",
    primaryCta: "팀 방 만들기",
    facilitationHeading: "작은 세 동작이면 준비 끝",
    actions: [
      { label: "방 열기", body: "비공개 방을 만들고 간단한 초대 링크를 받으세요." },
      { label: "링크 붙여넣기", body: "Zoom, Slack, Teams 또는 통화 채팅에 보내세요." },
      { label: "웃고, 다시 일하기", body: "모두 엉망으로 그리고 자신 있게 맞힌 뒤 편하게 회의로 돌아갑니다." },
    ],
    momentsHeading: "처음 5분을 활용하세요",
    moments: ["사람들이 통화에 들어오는 동안", "워크숍 바로 전", "다음 스프린트 회고 전"],
    trustPrivacy: "비공개 방. 계정 불필요. 공개 프로필 없음.",
    factsHeading: "이미 모여 있는 작은 그룹을 위해",
    facts: ["2-6명", "약 5분", "휴대폰 또는 노트북", "8개 인터페이스 언어"],
    questionsHeading: "시작하기 전, 빠른 답변",
    questions: [
      { question: "그림 아이스브레이커란 무엇인가요?", answer: "모두가 돌아가며 비밀 제시어를 그리고 결과를 맞히는 짧은 그룹 활동입니다. Draw Me Wrong은 이를 하나의 비공개 브라우저 방에서 진행합니다." },
      { question: "얼마나 걸리고 몇 명이 플레이할 수 있나요?", answer: "2-6명이 함께하면 전체 팀 워밍업은 약 5분 걸립니다. 각 그림 차례는 10초입니다." },
      { question: "앱이나 계정이 필요한가요?", answer: "아니요. 최신 휴대폰이나 노트북 브라우저에서 무료로 플레이할 수 있습니다. 진행자가 방 링크 하나를 공유하면 링크가 있는 누구나 참여할 수 있습니다." },
    ],
    finalHeading: "회의 시작 전 5분이면 충분합니다.",
    finalCta: "팀 방 만들기",
  },
};
