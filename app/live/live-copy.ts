import type { Locale } from "../game-data";

const en = {
  playLive: "Play live",
  liveBadge: "2-6 players · no account",
  title: "A bad drawing is better live.",
  subtitle: "Make a room, send one short link, and take turns drawing wrong together.",
  privateRoom: "Start a private room",
  quickMatch: "Quick match",
  quickNote: "Experimental · pairs you with people online",
  yourName: "Your game name",
  reroll: "change",
  joinRoom: "Join room",
  joining: "Joining…",
  lobby: "Live lobby",
  roomCode: "Room {code}",
  invite: "Invite players",
  copyLink: "Invite your group",
  copied: "Invite copied",
  shareText: "I’m waiting to draw badly against you. Join my live room:",
  waitingPlayers: "Waiting for at least one more player…",
  startGame: "Start game",
  starting: "Starting in {n}s",
  round: "Round {n} of {total}",
  yourTurn: "Your turn to draw",
  drawPrompt: "Draw: {prompt}",
  drawNow: "You have 10 seconds. Recognizable beats pretty.",
  waitingDrawer: "{name} is drawing something terrible…",
  submitDrawing: "Send drawing",
  guessIt: "What did {name} draw?",
  pickOne: "Pick one answer before time runs out.",
  waitingGuesses: "Waiting for guesses: {n}/{total}",
  result: "The answer was {prompt}",
  correct: "Correct",
  missed: "Missed it",
  nextRound: "Next round",
  gameOver: "The damage is done.",
  winner: "{name} wins",
  rematch: "Create a rematch",
  leave: "Leave room",
  reportLeave: "Report drawing & leave",
  players: "Players",
  online: "online",
  offline: "away",
  host: "host",
  you: "you",
  loading: "Finding the room…",
  expired: "This room is gone. Start a fresh one.",
  home: "Back to Draw Me Wrong",
  privacy: "Rooms expire after two hours. Anyone with the link can join. Don’t draw secrets.",
  reported: "Reported. You left the room.",
  error: "Something went wrong. Try again.",
} as const;

export type LiveCopy = { [K in keyof typeof en]: string };

export const LIVE_COPY: Record<Locale, LiveCopy> = {
  en,
  hi: { playLive:"लाइव खेलें",liveBadge:"2-6 खिलाड़ी · बिना अकाउंट",title:"खराब ड्रॉइंग लाइव में बेहतर है।",subtitle:"रूम बनाओ, एक छोटा लिंक भेजो और बारी-बारी गलत ड्रॉ करो।",privateRoom:"प्राइवेट रूम शुरू करें",quickMatch:"क्विक मैच",quickNote:"प्रयोगात्मक · ऑनलाइन खिलाड़ियों से मैच",yourName:"आपका गेम नाम",reroll:"बदलें",joinRoom:"रूम में जुड़ें",joining:"जुड़ रहे हैं…",lobby:"लाइव लॉबी",roomCode:"रूम {code}",invite:"खिलाड़ियों को बुलाएं",copyLink:"अपने ग्रुप को बुलाएं",copied:"इनवाइट कॉपी हुआ",shareText:"मैं तुम्हारे साथ खराब ड्रॉ करने का इंतज़ार कर रहा हूँ। मेरे लाइव रूम में आओ:",waitingPlayers:"कम से कम एक और खिलाड़ी का इंतज़ार…",startGame:"गेम शुरू करें",starting:"{n} सेकंड में शुरू",round:"राउंड {n}/{total}",yourTurn:"अब आपकी ड्रॉइंग",drawPrompt:"बनाएं: {prompt}",drawNow:"आपके पास 10 सेकंड हैं। सुंदर नहीं, पहचानने लायक।",waitingDrawer:"{name} कुछ बहुत खराब बना रहे हैं…",submitDrawing:"ड्रॉइंग भेजें",guessIt:"{name} ने क्या बनाया?",pickOne:"समय खत्म होने से पहले एक जवाब चुनें।",waitingGuesses:"जवाबों का इंतज़ार: {n}/{total}",result:"जवाब था {prompt}",correct:"सही",missed:"चूक गए",nextRound:"अगला राउंड",gameOver:"तबाही पूरी हुई।",winner:"{name} जीते",rematch:"रीमैच बनाएं",leave:"रूम छोड़ें",reportLeave:"रिपोर्ट करके छोड़ें",players:"खिलाड़ी",online:"ऑनलाइन",offline:"दूर",host:"होस्ट",you:"आप",loading:"रूम ढूँढ रहे हैं…",expired:"यह रूम खत्म हो गया। नया शुरू करें।",home:"Draw Me Wrong पर वापस",privacy:"रूम दो घंटे में मिट जाते हैं। लिंक वाला कोई भी जुड़ सकता है। कोई राज़ मत बनाएं।",reported:"रिपोर्ट हो गया। आपने रूम छोड़ दिया।",error:"कुछ गड़बड़ हुई। फिर कोशिश करें।"},
  es: { playLive:"Jugar en vivo",liveBadge:"2-6 jugadores · sin cuenta",title:"Un mal dibujo es mejor en vivo.",subtitle:"Crea una sala, envía un enlace corto y dibujen mal por turnos.",privateRoom:"Crear una sala privada",quickMatch:"Partida rápida",quickNote:"Experimental · te empareja con gente conectada",yourName:"Tu nombre de juego",reroll:"cambiar",joinRoom:"Entrar a la sala",joining:"Entrando…",lobby:"Sala en vivo",roomCode:"Sala {code}",invite:"Invitar jugadores",copyLink:"Invitar a tu grupo",copied:"Invitación copiada",shareText:"Te espero para dibujar fatal. Entra a mi sala en vivo:",waitingPlayers:"Esperando al menos a otro jugador…",startGame:"Empezar partida",starting:"Empieza en {n}s",round:"Ronda {n} de {total}",yourTurn:"Te toca dibujar",drawPrompt:"Dibuja: {prompt}",drawNow:"Tienes 10 segundos. Mejor reconocible que bonito.",waitingDrawer:"{name} está dibujando algo terrible…",submitDrawing:"Enviar dibujo",guessIt:"¿Qué dibujó {name}?",pickOne:"Elige antes de que se acabe el tiempo.",waitingGuesses:"Esperando respuestas: {n}/{total}",result:"La respuesta era {prompt}",correct:"Correcto",missed:"Fallaste",nextRound:"Siguiente ronda",gameOver:"El desastre terminó.",winner:"Gana {name}",rematch:"Crear revancha",leave:"Salir de la sala",reportLeave:"Reportar y salir",players:"Jugadores",online:"en línea",offline:"ausente",host:"anfitrión",you:"tú",loading:"Buscando la sala…",expired:"Esta sala ya no existe. Crea otra.",home:"Volver a Draw Me Wrong",privacy:"Las salas caducan en dos horas. Cualquiera con el enlace puede entrar. No dibujes secretos.",reported:"Reportado. Saliste de la sala.",error:"Algo salió mal. Inténtalo de nuevo."},
  fr: { playLive:"Jouer en direct",liveBadge:"2-6 joueurs · sans compte",title:"Un mauvais dessin, c’est mieux en direct.",subtitle:"Créez une salle, envoyez un lien court et dessinez mal à tour de rôle.",privateRoom:"Créer une salle privée",quickMatch:"Partie rapide",quickNote:"Expérimental · vous associe à des joueurs en ligne",yourName:"Votre nom de jeu",reroll:"changer",joinRoom:"Rejoindre la salle",joining:"Connexion…",lobby:"Salon en direct",roomCode:"Salle {code}",invite:"Inviter des joueurs",copyLink:"Inviter votre groupe",copied:"Invitation copiée",shareText:"Je t’attends pour dessiner très mal. Rejoins ma salle :",waitingPlayers:"En attente d’au moins un joueur…",startGame:"Démarrer",starting:"Départ dans {n}s",round:"Manche {n} sur {total}",yourTurn:"À vous de dessiner",drawPrompt:"Dessinez : {prompt}",drawNow:"Vous avez 10 secondes. Reconnaissable vaut mieux que joli.",waitingDrawer:"{name} dessine quelque chose d’affreux…",submitDrawing:"Envoyer le dessin",guessIt:"Qu’a dessiné {name} ?",pickOne:"Choisissez avant la fin du temps.",waitingGuesses:"Réponses : {n}/{total}",result:"La réponse était {prompt}",correct:"Correct",missed:"Raté",nextRound:"Manche suivante",gameOver:"Le carnage est terminé.",winner:"{name} gagne",rematch:"Créer une revanche",leave:"Quitter la salle",reportLeave:"Signaler et quitter",players:"Joueurs",online:"en ligne",offline:"absent",host:"hôte",you:"vous",loading:"Recherche de la salle…",expired:"Cette salle a disparu. Créez-en une autre.",home:"Retour à Draw Me Wrong",privacy:"Les salles expirent après deux heures. Toute personne ayant le lien peut entrer. Ne dessinez rien de secret.",reported:"Signalé. Vous avez quitté la salle.",error:"Un problème est survenu. Réessayez."},
  "pt-BR": { playLive:"Jogar ao vivo",liveBadge:"2-6 jogadores · sem conta",title:"Desenho ruim é melhor ao vivo.",subtitle:"Crie uma sala, envie um link curto e desenhem errado em turnos.",privateRoom:"Criar uma sala privada",quickMatch:"Partida rápida",quickNote:"Experimental · encontra pessoas online",yourName:"Seu nome no jogo",reroll:"trocar",joinRoom:"Entrar na sala",joining:"Entrando…",lobby:"Sala ao vivo",roomCode:"Sala {code}",invite:"Convidar jogadores",copyLink:"Convidar seu grupo",copied:"Convite copiado",shareText:"Estou esperando para desenhar mal com você. Entre na minha sala:",waitingPlayers:"Esperando pelo menos mais um jogador…",startGame:"Começar jogo",starting:"Começa em {n}s",round:"Rodada {n} de {total}",yourTurn:"Sua vez de desenhar",drawPrompt:"Desenhe: {prompt}",drawNow:"Você tem 10 segundos. Reconhecível é melhor que bonito.",waitingDrawer:"{name} está desenhando algo terrível…",submitDrawing:"Enviar desenho",guessIt:"O que {name} desenhou?",pickOne:"Escolha antes do tempo acabar.",waitingGuesses:"Esperando palpites: {n}/{total}",result:"A resposta era {prompt}",correct:"Acertou",missed:"Errou",nextRound:"Próxima rodada",gameOver:"O estrago está feito.",winner:"{name} venceu",rematch:"Criar revanche",leave:"Sair da sala",reportLeave:"Denunciar e sair",players:"Jogadores",online:"online",offline:"ausente",host:"host",you:"você",loading:"Procurando a sala…",expired:"Esta sala acabou. Crie uma nova.",home:"Voltar ao Draw Me Wrong",privacy:"As salas expiram em duas horas. Qualquer pessoa com o link pode entrar. Não desenhe segredos.",reported:"Denunciado. Você saiu da sala.",error:"Algo deu errado. Tente novamente."},
  de: { playLive:"Live spielen",liveBadge:"2-6 Spieler · ohne Konto",title:"Eine schlechte Zeichnung ist live besser.",subtitle:"Erstelle einen Raum, sende einen kurzen Link und zeichnet abwechselnd falsch.",privateRoom:"Privaten Raum starten",quickMatch:"Schnelles Spiel",quickNote:"Experimentell · verbindet dich mit Leuten online",yourName:"Dein Spielname",reroll:"ändern",joinRoom:"Raum beitreten",joining:"Beitritt…",lobby:"Live-Lobby",roomCode:"Raum {code}",invite:"Spieler einladen",copyLink:"Gruppe einladen",copied:"Einladung kopiert",shareText:"Ich warte darauf, mit dir schlecht zu zeichnen. Komm in meinen Live-Raum:",waitingPlayers:"Warten auf mindestens einen weiteren Spieler…",startGame:"Spiel starten",starting:"Start in {n}s",round:"Runde {n} von {total}",yourTurn:"Du zeichnest",drawPrompt:"Zeichne: {prompt}",drawNow:"Du hast 10 Sekunden. Erkennbar ist besser als schön.",waitingDrawer:"{name} zeichnet etwas Schreckliches…",submitDrawing:"Zeichnung senden",guessIt:"Was hat {name} gezeichnet?",pickOne:"Wähle, bevor die Zeit abläuft.",waitingGuesses:"Warten auf Antworten: {n}/{total}",result:"Die Antwort war {prompt}",correct:"Richtig",missed:"Daneben",nextRound:"Nächste Runde",gameOver:"Das Chaos ist vorbei.",winner:"{name} gewinnt",rematch:"Revanche erstellen",leave:"Raum verlassen",reportLeave:"Melden und verlassen",players:"Spieler",online:"online",offline:"weg",host:"Host",you:"du",loading:"Raum wird gesucht…",expired:"Dieser Raum ist weg. Starte einen neuen.",home:"Zurück zu Draw Me Wrong",privacy:"Räume verfallen nach zwei Stunden. Jeder mit dem Link kann beitreten. Zeichne keine Geheimnisse.",reported:"Gemeldet. Du hast den Raum verlassen.",error:"Etwas ist schiefgegangen. Versuch es erneut."},
  ja: { playLive:"ライブで遊ぶ",liveBadge:"2〜6人・アカウント不要",title:"下手な絵はライブの方が面白い。",subtitle:"ルームを作り、短いリンクを送り、交代で下手に描こう。",privateRoom:"プライベートルームを作る",quickMatch:"クイックマッチ",quickNote:"実験中・オンラインの人と対戦",yourName:"ゲーム名",reroll:"変更",joinRoom:"ルームに参加",joining:"参加中…",lobby:"ライブロビー",roomCode:"ルーム {code}",invite:"プレイヤーを招待",copyLink:"グループを招待",copied:"招待をコピーしました",shareText:"一緒に下手な絵を描こう。ライブルームに参加して：",waitingPlayers:"あと1人以上を待っています…",startGame:"ゲーム開始",starting:"{n}秒後に開始",round:"ラウンド {n}/{total}",yourTurn:"あなたの番",drawPrompt:"描くもの：{prompt}",drawNow:"10秒です。きれいより伝わる絵を。",waitingDrawer:"{name}がひどい絵を描いています…",submitDrawing:"絵を送る",guessIt:"{name}は何を描いた？",pickOne:"時間切れになる前に選んでください。",waitingGuesses:"回答待ち：{n}/{total}",result:"答えは「{prompt}」",correct:"正解",missed:"はずれ",nextRound:"次のラウンド",gameOver:"惨事は終了。",winner:"{name}の勝ち",rematch:"再戦を作る",leave:"ルームを退出",reportLeave:"報告して退出",players:"プレイヤー",online:"オンライン",offline:"離席",host:"ホスト",you:"あなた",loading:"ルームを探しています…",expired:"このルームは終了しました。新しく始めましょう。",home:"Draw Me Wrongへ戻る",privacy:"ルームは2時間で消えます。リンクを知る人は参加できます。秘密を描かないでください。",reported:"報告して退出しました。",error:"問題が発生しました。もう一度お試しください。"},
  ko: { playLive:"라이브 플레이",liveBadge:"2~6명 · 계정 불필요",title:"엉망인 그림은 라이브가 더 재밌어요.",subtitle:"방을 만들고 짧은 링크를 보내 번갈아 엉망으로 그려 보세요.",privateRoom:"비공개 방 만들기",quickMatch:"빠른 매치",quickNote:"실험 기능 · 온라인 사용자와 매치",yourName:"게임 이름",reroll:"바꾸기",joinRoom:"방 참가",joining:"참가 중…",lobby:"라이브 로비",roomCode:"방 {code}",invite:"플레이어 초대",copyLink:"그룹 초대하기",copied:"초대를 복사했어요",shareText:"같이 엉망으로 그려요. 내 라이브 방에 참가하세요:",waitingPlayers:"한 명 이상 더 기다리는 중…",startGame:"게임 시작",starting:"{n}초 후 시작",round:"라운드 {n}/{total}",yourTurn:"그릴 차례예요",drawPrompt:"그리기: {prompt}",drawNow:"10초입니다. 예쁘기보다 알아볼 수 있게.",waitingDrawer:"{name}님이 끔찍한 그림을 그리는 중…",submitDrawing:"그림 보내기",guessIt:"{name}님이 무엇을 그렸을까요?",pickOne:"시간이 끝나기 전에 하나를 고르세요.",waitingGuesses:"답 기다리는 중: {n}/{total}",result:"정답은 {prompt}",correct:"정답",missed:"틀렸어요",nextRound:"다음 라운드",gameOver:"참사가 끝났어요.",winner:"{name} 승리",rematch:"재대결 만들기",leave:"방 나가기",reportLeave:"신고하고 나가기",players:"플레이어",online:"온라인",offline:"자리 비움",host:"방장",you:"나",loading:"방을 찾는 중…",expired:"이 방은 사라졌어요. 새로 시작하세요.",home:"Draw Me Wrong으로 돌아가기",privacy:"방은 2시간 후 만료됩니다. 링크가 있으면 누구나 참가할 수 있어요. 비밀은 그리지 마세요.",reported:"신고하고 방을 나갔어요.",error:"문제가 생겼어요. 다시 시도하세요."},
};

export type LiveGrowthCopy = {
  teamBadge: string;
  teamTitle: string;
  teamSubtitle: string;
  teamRoom: string;
  teamJoinTitle: string;
  teamJoinSubtitle: string;
  teamJoinCta: string;
  teamHostLobbyTitle: string;
  teamHostLobbyBody: string;
  teamGuestLobbyTitle: string;
  teamGuestLobbyBody: string;
  teamShareText: string;
  skipRound: string;
  skippedRound: string;
  playAgain: string;
  hostRestart: string;
  newRoom: string;
  rematchNote: string;
  finalStamp: string;
  shareResult: string;
  resultShareText: string;
  matchTimeout: string;
  keepWaiting: string;
  playSolo: string;
};

export const LIVE_GROWTH_COPY: Record<Locale, LiveGrowthCopy> = {
  en: {
    teamBadge: "5 minutes • private • no account", teamTitle: "Your five-minute team warm-up.", teamSubtitle: "Create a private room, paste the link into your call, and start when 2-6 people join.", teamRoom: "Start team room",
    teamJoinTitle: "Your team invited you to draw badly.", teamJoinSubtitle: "Join the private room. No account. About five minutes.", teamJoinCta: "Join team room",
    teamHostLobbyTitle: "Invite your team.", teamHostLobbyBody: "Start when 2-6 people are in.", teamGuestLobbyTitle: "You're in.", teamGuestLobbyBody: "Waiting for the host to start.",
    teamShareText: "Quick team warm-up: join this private drawing room. No account, about five minutes:", skipRound: "Skip this round", skippedRound: "No drawing this round. Bold choice.", playAgain: "Play again", hostRestart: "The host can restart this group.", newRoom: "Start a new room", rematchNote: "Same group. Same link. Fresh prompts.", finalStamp: "Certified drawing damage", shareResult: "Challenge another group", resultShareText: "{name} survived our terrible drawings. Think your group can do worse?", matchTimeout: "No one arrived yet. Keep waiting, invite someone, or play the solo dare.", keepWaiting: "Keep waiting", playSolo: "Play solo dare",
  },
  hi: {
    teamBadge: "5 मिनट • प्राइवेट • बिना अकाउंट", teamTitle: "आपका पांच मिनट का टीम वॉर्म-अप।", teamSubtitle: "प्राइवेट रूम बनाएं, कॉल में लिंक भेजें और 2 से 6 लोगों के जुड़ने पर शुरू करें।", teamRoom: "टीम रूम शुरू करें",
    teamJoinTitle: "आपकी टीम ने आपको खराब ड्रॉ करने के लिए बुलाया है।", teamJoinSubtitle: "प्राइवेट रूम में जुड़ें। अकाउंट नहीं चाहिए। करीब पांच मिनट।", teamJoinCta: "टीम रूम में जुड़ें",
    teamHostLobbyTitle: "अपनी टीम को बुलाएं।", teamHostLobbyBody: "2 से 6 लोग जुड़ जाएं तो शुरू करें।", teamGuestLobbyTitle: "आप जुड़ गए हैं।", teamGuestLobbyBody: "होस्ट के शुरू करने का इंतज़ार है।",
    teamShareText: "जल्दी टीम वॉर्म-अप: इस प्राइवेट ड्रॉइंग रूम में जुड़ें। बिना अकाउंट, करीब पांच मिनट:", skipRound: "यह राउंड छोड़ें", skippedRound: "इस राउंड में ड्रॉइंग नहीं। साहसी फैसला।", playAgain: "फिर खेलें", hostRestart: "होस्ट इस ग्रुप को फिर शुरू कर सकता है।", newRoom: "नया रूम शुरू करें", rematchNote: "वही ग्रुप। वही लिंक। नए शब्द।", finalStamp: "ड्रॉइंग तबाही प्रमाणित", shareResult: "दूसरे ग्रुप को चुनौती दें", resultShareText: "{name} हमारी खराब ड्रॉइंग से बच गए। क्या आपका ग्रुप इससे भी खराब कर सकता है?", matchTimeout: "अभी कोई नहीं आया। इंतजार करें, किसी को बुलाएं या सोलो डेयर खेलें।", keepWaiting: "इंतजार करें", playSolo: "सोलो डेयर खेलें",
  },
  es: {
    teamBadge: "5 minutos • privado • sin cuenta", teamTitle: "El calentamiento de cinco minutos de tu equipo.", teamSubtitle: "Crea una sala privada, pega el enlace en la llamada y empieza cuando entren 2-6 personas.", teamRoom: "Crear sala de equipo",
    teamJoinTitle: "Tu equipo te invitó a dibujar fatal.", teamJoinSubtitle: "Entra en la sala privada. Sin cuenta. Unos cinco minutos.", teamJoinCta: "Entrar en la sala del equipo",
    teamHostLobbyTitle: "Invita a tu equipo.", teamHostLobbyBody: "Empieza cuando haya 2-6 personas.", teamGuestLobbyTitle: "Ya estás dentro.", teamGuestLobbyBody: "Esperando a que el anfitrión empiece.",
    teamShareText: "Calentamiento rápido: entra a esta sala privada de dibujo. Sin cuenta, unos cinco minutos:", skipRound: "Saltar esta ronda", skippedRound: "Sin dibujo en esta ronda. Decisión valiente.", playAgain: "Jugar otra vez", hostRestart: "El anfitrión puede reiniciar este grupo.", newRoom: "Crear una sala nueva", rematchNote: "Mismo grupo. Mismo enlace. Nuevas palabras.", finalStamp: "Daño artístico certificado", shareResult: "Retar a otro grupo", resultShareText: "{name} sobrevivió a nuestros dibujos terribles. ¿Tu grupo puede hacerlo peor?", matchTimeout: "Aún no llegó nadie. Sigue esperando, invita a alguien o juega el reto en solitario.", keepWaiting: "Seguir esperando", playSolo: "Jugar en solitario",
  },
  fr: {
    teamBadge: "5 minutes • privé • sans compte", teamTitle: "L'échauffement de cinq minutes de votre équipe.", teamSubtitle: "Créez une salle privée, collez le lien dans l'appel et démarrez à 2-6 personnes.", teamRoom: "Créer une salle d'équipe",
    teamJoinTitle: "Votre équipe vous invite à dessiner de travers.", teamJoinSubtitle: "Rejoignez la salle privée. Sans compte. Environ cinq minutes.", teamJoinCta: "Rejoindre la salle d'équipe",
    teamHostLobbyTitle: "Invitez votre équipe.", teamHostLobbyBody: "Démarrez quand 2 à 6 personnes sont là.", teamGuestLobbyTitle: "Vous êtes là.", teamGuestLobbyBody: "En attente du lancement par l'hôte.",
    teamShareText: "Échauffement rapide: rejoignez cette salle de dessin privée. Sans compte, environ cinq minutes:", skipRound: "Passer cette manche", skippedRound: "Aucun dessin cette manche. Choix audacieux.", playAgain: "Rejouer", hostRestart: "L'hôte peut relancer ce groupe.", newRoom: "Créer une nouvelle salle", rematchNote: "Même groupe. Même lien. Nouveaux mots.", finalStamp: "Dégâts artistiques certifiés", shareResult: "Défier un autre groupe", resultShareText: "{name} a survécu à nos dessins terribles. Votre groupe peut-il faire pire ?", matchTimeout: "Personne n'est encore arrivé. Attendez, invitez quelqu'un ou jouez en solo.", keepWaiting: "Continuer d'attendre", playSolo: "Jouer en solo",
  },
  "pt-BR": {
    teamBadge: "5 minutos • privado • sem conta", teamTitle: "O aquecimento de cinco minutos do seu time.", teamSubtitle: "Crie uma sala privada, cole o link na chamada e comece quando 2-6 pessoas entrarem.", teamRoom: "Criar sala do time",
    teamJoinTitle: "Seu time convidou você para desenhar mal.", teamJoinSubtitle: "Entre na sala privada. Sem conta. Cerca de cinco minutos.", teamJoinCta: "Entrar na sala do time",
    teamHostLobbyTitle: "Convide seu time.", teamHostLobbyBody: "Comece quando houver de 2 a 6 pessoas.", teamGuestLobbyTitle: "Você entrou.", teamGuestLobbyBody: "Aguardando o host começar.",
    teamShareText: "Aquecimento rápido: entre nesta sala privada de desenho. Sem conta, cerca de cinco minutos:", skipRound: "Pular esta rodada", skippedRound: "Sem desenho nesta rodada. Escolha ousada.", playAgain: "Jogar de novo", hostRestart: "O host pode reiniciar este grupo.", newRoom: "Criar uma nova sala", rematchNote: "Mesmo grupo. Mesmo link. Novas palavras.", finalStamp: "Estrago artístico certificado", shareResult: "Desafiar outro grupo", resultShareText: "{name} sobreviveu aos nossos desenhos terríveis. Seu grupo consegue fazer pior?", matchTimeout: "Ninguém chegou ainda. Espere, convide alguém ou jogue o desafio solo.", keepWaiting: "Continuar esperando", playSolo: "Jogar desafio solo",
  },
  de: {
    teamBadge: "5 Minuten • privat • kein Konto", teamTitle: "Das Fünf-Minuten-Warm-up für euer Team.", teamSubtitle: "Erstellt einen privaten Raum, teilt den Link im Call und startet mit 2-6 Personen.", teamRoom: "Teamraum starten",
    teamJoinTitle: "Dein Team lädt dich zum Schlechtzeichnen ein.", teamJoinSubtitle: "Tritt dem privaten Raum bei. Kein Konto. Etwa fünf Minuten.", teamJoinCta: "Teamraum beitreten",
    teamHostLobbyTitle: "Lade dein Team ein.", teamHostLobbyBody: "Starte, sobald 2-6 Personen da sind.", teamGuestLobbyTitle: "Du bist dabei.", teamGuestLobbyBody: "Wir warten, bis der Host startet.",
    teamShareText: "Kurzes Team-Warm-up: Tritt diesem privaten Zeichenraum bei. Kein Konto, etwa fünf Minuten:", skipRound: "Runde überspringen", skippedRound: "Keine Zeichnung in dieser Runde. Mutige Wahl.", playAgain: "Noch einmal", hostRestart: "Der Host kann diese Gruppe neu starten.", newRoom: "Neuen Raum starten", rematchNote: "Gleiche Gruppe. Gleicher Link. Neue Begriffe.", finalStamp: "Geprüfter Zeichenschaden", shareResult: "Andere Gruppe herausfordern", resultShareText: "{name} hat unsere schrecklichen Zeichnungen überlebt. Kann eure Gruppe es schlimmer?", matchTimeout: "Noch ist niemand da. Warte weiter, lade jemanden ein oder spiele die Solo-Aufgabe.", keepWaiting: "Weiter warten", playSolo: "Solo-Aufgabe spielen",
  },
  ja: {
    teamBadge: "5分 • プライベート • アカウント不要", teamTitle: "チームの5分ウォームアップ。", teamSubtitle: "プライベートルームを作り、通話にリンクを貼り、2〜6人で開始します。", teamRoom: "チームルームを作る",
    teamJoinTitle: "チームから、下手に描こうと招待されています。", teamJoinSubtitle: "プライベートルームに参加しましょう。アカウント不要、約5分です。", teamJoinCta: "チームルームに参加",
    teamHostLobbyTitle: "チームを招待しましょう。", teamHostLobbyBody: "2〜6人集まったら開始できます。", teamGuestLobbyTitle: "参加しました。", teamGuestLobbyBody: "ホストの開始を待っています。",
    teamShareText: "チームの短いウォームアップです。このプライベートお絵描きルームに参加してください。アカウント不要、約5分:", skipRound: "このラウンドをスキップ", skippedRound: "このラウンドは絵なし。大胆な選択です。", playAgain: "もう一度遊ぶ", hostRestart: "ホストがこのグループを再開できます。", newRoom: "新しいルームを作る", rematchNote: "同じメンバー。同じリンク。新しいお題。", finalStamp: "お絵描き被害認定済み", shareResult: "別のグループに挑戦", resultShareText: "{name}は私たちのひどい絵を生き延びました。あなたのグループはもっとひどくできますか？", matchTimeout: "まだ誰も来ていません。待つ、誰かを招待する、または一人用で遊べます。", keepWaiting: "待ち続ける", playSolo: "一人用で遊ぶ",
  },
  ko: {
    teamBadge: "5분 • 비공개 • 계정 불필요", teamTitle: "팀을 위한 5분 워밍업.", teamSubtitle: "비공개 방을 만들고 통화에 링크를 붙인 뒤 2-6명이 모이면 시작하세요.", teamRoom: "팀 방 만들기",
    teamJoinTitle: "팀에서 엉망으로 그려 보자고 초대했어요.", teamJoinSubtitle: "비공개 방에 참여하세요. 계정 없이 약 5분이면 돼요.", teamJoinCta: "팀 방 참여하기",
    teamHostLobbyTitle: "팀을 초대하세요.", teamHostLobbyBody: "2~6명이 모이면 시작할 수 있어요.", teamGuestLobbyTitle: "참여했어요.", teamGuestLobbyBody: "방장이 시작하기를 기다리는 중이에요.",
    teamShareText: "짧은 팀 워밍업입니다. 이 비공개 그림 방에 참여하세요. 계정 없이 약 5분:", skipRound: "이번 라운드 건너뛰기", skippedRound: "이번 라운드는 그림이 없어요. 대담한 선택입니다.", playAgain: "다시 플레이", hostRestart: "방장이 이 그룹을 다시 시작할 수 있어요.", newRoom: "새 방 만들기", rematchNote: "같은 멤버. 같은 링크. 새로운 단어.", finalStamp: "그림 대참사 인증", shareResult: "다른 그룹에 도전하기", resultShareText: "{name}님이 우리의 끔찍한 그림에서 살아남았어요. 여러분의 그룹은 더 심하게 그릴 수 있나요?", matchTimeout: "아직 아무도 오지 않았어요. 더 기다리거나 누군가를 초대하거나 혼자 플레이하세요.", keepWaiting: "계속 기다리기", playSolo: "혼자 플레이",
  },
};

export const SAFE_NAMES = ["Dizzy Panda", "Wobbly Tiger", "Sleepy Fox", "Tiny Whale", "Odd Penguin", "Happy Gecko", "Messy Koala", "Brave Otter", "Silly Yak", "Lucky Crow", "Neon Snail", "Wild Llama"] as const;

export function fillLive(value: string, values: Record<string, string | number>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
