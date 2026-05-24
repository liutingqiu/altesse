/* ============================================================
   ALTESSE — main.js
   Frontend: 作品加载 + 语言切换 + 渐显 + 表单
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  let currentLang = localStorage.getItem('altesse_lang') || 'en';
  let translations = {};
  let cachedWorks = [], cachedCollections = [], cachedSettings = null;

  function escAttr(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ═══════════════════════════════
  // Translations
  // ═══════════════════════════════

  const embedded = {
    en: { intro_sub: 'Every gown a poem. Every stitch a word. Every silhouette a story — handcrafted in our Parisian atelier, where tradition meets transcendence.', craft_title: 'The Art of the Hand', craft_p1: 'In an age of machines, we choose needles. Each ALTESSE gown requires between 180 and 350 hours of handwork — embroidery, feathering, draping, beading — executed by our atelier\'s petites mains.', craft_p2: 'No two pieces are identical. No detail is invisible. This is couture as it was meant to be: slow, deliberate, irreplaceable.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Behind an unmarked door on Rue Cambon, our atelier has been creating couture since 2020. Seven artisans, one vision: to dress the woman who understands that true luxury is time.', atelier_p2: 'Every client begins with a private consultation. Measurements are taken. Fabrics are presented. A toile is crafted. Only then does the gown begin its journey from bolt to body.', atelier_cta: 'Request a Consultation', contact_title: 'Rendez-vous', contact_sub: 'Every ALTESSE gown begins with a conversation.', contact_name: 'Name', contact_email: 'Email', contact_phone: 'Phone', contact_subject: 'Subject', contact_message: 'Your Message', contact_send: 'Send Inquiry', contact_success: 'Thank you for your inquiry. Our atelier director will be in touch within 48 hours.', about_intro: 'ALTESSE was born from a singular conviction: that the most powerful thing a woman can wear is the dress that makes her feel invincible.', nav_collections: 'Collections', nav_atelier: 'Atelier', nav_about: 'L\'Histoire', nav_contact: 'Rendez-vous', footer_tagline: 'Haute Couture · Paris' },
    zh: { intro_sub: '每一件礼服都是一首诗。每一针是一个词。每一个轮廓是一个故事——在我们巴黎工坊手工制作，传统与超越在此交汇。', craft_title: '手工的艺术', craft_p1: '在机器的时代，我们选择针线。每一件ALTESSE礼服需要180至350小时的手工——刺绣、羽毛处理、立体剪裁、珠饰——由我们工坊的 petites mains 完成。', craft_p2: '没有两件是相同的。没有细节是隐形的。这就是高级定制本该有的样子：缓慢、深思熟虑、不可替代。', atelier_title: '巴黎康朋街31号', atelier_p1: '在康朋街一扇无名门后，我们的工坊自2020年起创作高定礼服。七位匠人，一个愿景：为懂得真正的奢华是时间的女性着装。', atelier_p2: '每位客户从私人咨询开始。量体。面料展示。制作胚样。只有到那时，礼服才开始了从布匹到身体之旅。', atelier_cta: '预约咨询', contact_title: '预约', contact_sub: '每一件ALTESSE礼服，都始于一场对话。', contact_name: '姓名', contact_email: '邮箱', contact_phone: '电话', contact_subject: '主题', contact_message: '您的留言', contact_send: '发送咨询', contact_success: '感谢您的咨询。我们的工坊总监将在48小时内与您联系。', about_intro: 'ALTESSE诞生于一个信念：一个女人能穿的最强大的东西，是让她感到不可战胜的礼服。', nav_collections: '系列', nav_atelier: '工坊', nav_about: '品牌故事', nav_contact: '预约', footer_tagline: '高级定制 · 巴黎' },
    es: { intro_sub: 'Cada vestido es un poema. Cada puntada, una palabra. Cada silueta, una historia — hecha a mano en nuestro taller parisino, donde la tradición se une a la trascendencia.', craft_title: 'El Arte de la Mano', craft_p1: 'En la era de las máquinas, elegimos agujas. Cada vestido ALTESSE requiere entre 180 y 350 horas de trabajo artesanal — bordado, plumaje, drapeado, abalorios — ejecutado por nuestras petites mains.', craft_p2: 'No hay dos piezas idénticas. Ningún detalle es invisible. Así es la alta costura: lenta, deliberada, irremplazable.', atelier_title: '31 Rue Cambon, París', atelier_p1: 'Detrás de una puerta sin marcar en Rue Cambon, nuestro taller crea alta costura desde 2020. Siete artesanas, una visión: vestir a la mujer que entiende que el verdadero lujo es el tiempo.', atelier_p2: 'Cada clienta comienza con una consulta privada. Se toman medidas. Se presentan telas. Se confecciona una toile. Solo entonces el vestido comienza su viaje del tejido al cuerpo.', atelier_cta: 'Solicitar una Consulta', contact_title: 'Cita', contact_sub: 'Cada vestido ALTESSE comienza con una conversación.', contact_name: 'Nombre', contact_email: 'Correo', contact_phone: 'Teléfono', contact_subject: 'Asunto', contact_message: 'Su Mensaje', contact_send: 'Enviar', contact_success: 'Gracias por su consulta. Nuestra directora de taller le contactará en 48 horas.', about_intro: 'ALTESSE nació de una convicción: lo más poderoso que una mujer puede llevar es el vestido que la hace sentir invencible.', nav_collections: 'Colecciones', nav_atelier: 'Taller', nav_about: 'Historia', nav_contact: 'Cita', footer_tagline: 'Alta Costura · París' },
    fr: { intro_sub: 'Chaque robe est un poème. Chaque point, un mot. Chaque silhouette, une histoire — façonnée à la main dans notre atelier parisien, où la tradition rencontre la transcendance.', craft_title: 'L\'Art de la Main', craft_p1: 'À l\'ère des machines, nous choisissons les aiguilles. Chaque robe ALTESSE exige entre 180 et 350 heures de travail manuel — broderie, plumage, drapé, perlage — exécuté par nos petites mains.', craft_p2: 'Aucune pièce n\'est identique. Aucun détail n\'est invisible. Voilà la haute couture telle qu\'elle doit être : lente, délibérée, irremplaçable.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Derrière une porte anonyme de la Rue Cambon, notre atelier crée de la haute couture depuis 2020. Sept artisans, une vision : habiller la femme qui comprend que le vrai luxe, c\'est le temps.', atelier_p2: 'Chaque cliente commence par une consultation privée. Les mesures sont prises. Les tissus sont présentés. Une toile est réalisée. Alors seulement la robe entame son voyage du métrage au corps.', atelier_cta: 'Demander une Consultation', contact_title: 'Rendez-vous', contact_sub: 'Chaque robe ALTESSE commence par une conversation.', contact_name: 'Nom', contact_email: 'Email', contact_phone: 'Téléphone', contact_subject: 'Sujet', contact_message: 'Votre Message', contact_send: 'Envoyer', contact_success: 'Merci de votre demande. Notre directrice d\'atelier vous contactera sous 48 heures.', about_intro: 'ALTESSE est née d\'une conviction : ce qu\'une femme peut porter de plus puissant, c\'est la robe qui la fait se sentir invincible.', nav_collections: 'Collections', nav_atelier: 'Atelier', nav_about: 'L\'Histoire', nav_contact: 'Rendez-vous', footer_tagline: 'Haute Couture · Paris' },
    ru: { intro_sub: 'Каждое платье — поэма. Каждый стежок — слово. Каждый силуэт — история, созданная вручную в нашем парижском ателье, где традиция встречается с трансцендентностью.', craft_title: 'Искусство Руки', craft_p1: 'В эпоху машин мы выбираем иглы. Каждое платье ALTESSE требует от 180 до 350 часов ручной работы — вышивка, оперение, драпировка, бисероплетение — выполненной нашими petites mains.', craft_p2: 'Нет двух одинаковых изделий. Ни одна деталь не остаётся невидимой. Это кутюр, каким он должен быть: медленный, обдуманный, незаменимый.', atelier_title: '31 Rue Cambon, Париж', atelier_p1: 'За неприметной дверью на Rue Cambon наше ателье создаёт высокую моду с 2020 года. Семь мастеров, одно видение: одевать женщину, которая понимает, что истинная роскошь — это время.', atelier_p2: 'Каждая клиентка начинает с частной консультации. Снимаются мерки. Представляются ткани. Создаётся туаль. Только после этого платье начинает свой путь от ткани к телу.', atelier_cta: 'Запросить Консультацию', contact_title: 'Запись', contact_sub: 'Каждое платье ALTESSE начинается с разговора.', contact_name: 'Имя', contact_email: 'Email', contact_phone: 'Телефон', contact_subject: 'Тема', contact_message: 'Ваше Сообщение', contact_send: 'Отправить', contact_success: 'Благодарим за обращение. Наш директор ателье свяжется с вами в течение 48 часов.', about_intro: 'ALTESSE родилась из убеждения: самое мощное, что может надеть женщина — это платье, в котором она чувствует себя непобедимой.', nav_collections: 'Коллекции', nav_atelier: 'Ателье', nav_about: 'История', nav_contact: 'Запись', footer_tagline: 'Высокая Мода · Париж' },
    ar: { intro_sub: 'كل فستان قصيدة. كل غرزة كلمة. كل صورة ظلية قصة — مصنوعة يدوياً في مشغلنا الباريسي، حيث يلتقي التقليد بالسمو.', craft_title: 'فن اليد', craft_p1: 'في عصر الآلات، نختار الإبر. كل فستان من ALTESSE يتطلب ما بين 180 و350 ساعة من العمل اليدوي — تطريز، ريش، drapé، خرز — ينفذها حرفيونا الصغار.', craft_p2: 'لا توجد قطعتان متطابقتان. لا تفصيل غير مرئي. هذه هي الأزياء الراقية كما ينبغي أن تكون: بطيئة، مدروسة، لا تُستبدل.', atelier_title: '31 شارع كامبون، باريس', atelier_p1: 'خلف باب غير معلّم في شارع كامبون، يبدع مشغلنا الأزياء الراقية منذ عام 2020. سبعة حرفيين، رؤية واحدة: إلباس المرأة التي تدرك أن الرفاهية الحقيقية هي الوقت.', atelier_p2: 'تبدأ كل عميلة باستشارة خاصة. تؤخذ القياسات. تُعرض الأقمشة. يُصنع توile. عندها فقط يبدأ الفستان رحلته من القماش إلى الجسد.', atelier_cta: 'طلب استشارة', contact_title: 'موعد', contact_sub: 'كل فستان ALTESSE يبدأ بمحادثة.', contact_name: 'الاسم', contact_email: 'البريد', contact_phone: 'الهاتف', contact_subject: 'الموضوع', contact_message: 'رسالتك', contact_send: 'إرسال', contact_success: 'شكراً على استفسارك. سيتواصل معك مدير المشغل خلال 48 ساعة.', about_intro: 'وُلدت ALTESSE من قناعة واحدة: أقوى ما يمكن أن ترتديه المرأة هو الفستان الذي يجعلها تشعر أنها لا تُقهر.', nav_collections: 'المجموعات', nav_atelier: 'المشغل', nav_about: 'قصتنا', nav_contact: 'موعد', footer_tagline: 'أزياء راقية · باريس' },
    ja: { intro_sub: 'すべてのドレスは一篇の詩。ひと針ひと針が言葉。ひとつのシルエットが物語——伝統と超越が出会うパリのアトリエで、手仕事によって紡がれます。', craft_title: '手の芸術', craft_p1: '機械の時代に、私たちは針を選びます。ALTESSEの各ドレスには180〜350時間の手仕事——刺繍、フェザリング、ドレープ、ビーズ細工——が必要です。', craft_p2: '同じ作品は二つとありません。見えない細部など存在しません。これこそがクチュールのあるべき姿です：ゆっくりと、熟考され、かけがえのないもの。', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'カンボン通りの無名の扉の奥で、私たちのアトリエは2020年からクチュールを創り続けています。7人の職人、ひとつのビジョン：真の贅沢とは時間であると理解する女性を纏うこと。', atelier_p2: 'すべてのクライアントはプライベートコンサルテーションから始まります。採寸。生地のご提案。トワルの制作。そして初めて、ドレスは布から身体への旅を始めるのです。', atelier_cta: 'コンサルテーションを依頼', contact_title: '予約', contact_sub: 'ALTESSEのすべてのドレスは、対話から始まります。', contact_name: 'お名前', contact_email: 'メール', contact_phone: '電話', contact_subject: '件名', contact_message: 'メッセージ', contact_send: '送信', contact_success: 'お問い合わせありがとうございます。アトリエディレクターより48時間以内にご連絡いたします。', about_intro: 'ALTESSEは一つの信念から生まれました：女性が身に着けられる最も強力なものは、自分を無敵だと感じさせるドレスである。', nav_collections: 'コレクション', nav_atelier: 'アトリエ', nav_about: 'ストーリー', nav_contact: '予約', footer_tagline: 'オートクチュール · パリ' },
    ko: { intro_sub: '모든 드레스는 한 편의 시입니다. 바늘 한 땀 한 땀이 단어이고, 각 실루엣은 이야기입니다 — 전통과 초월이 만나는 파리 아틀리에에서 손으로 빚어냅니다.', craft_title: '손의 예술', craft_p1: '기계의 시대에, 우리는 바늘을 선택합니다. ALTESSE의 각 드레스는 180시간에서 350시간의 수작업 — 자수, 깃털 장식, 드레이핑, 비즈 장식 — 을 필요로 합니다.', craft_p2: '똑같은 작품은 존재하지 않습니다. 보이지 않는 디테일은 없습니다. 이것이 쿠튀르의 본질입니다: 느리고, 의도적이며, 대체할 수 없는 것.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: '캉봉 거리의 표지 없는 문 뒤에서, 우리의 아틀리에는 2020년부터 쿠튀르를 창조해 왔습니다. 일곱 명의 장인, 하나의 비전: 진정한 럭셔리는 시간임을 이해하는 여성을 위한 옷.', atelier_p2: '모든 클라이언트는 프라이빗 상담으로 시작합니다. 치수를 재고, 원단을 제안하며, 투알을 제작합니다. 그제서야 드레스는 원단에서 신체로의 여정을 시작합니다.', atelier_cta: '상담 신청', contact_title: '예약', contact_sub: 'ALTESSE의 모든 드레스는 대화에서 시작됩니다.', contact_name: '이름', contact_email: '이메일', contact_phone: '전화', contact_subject: '제목', contact_message: '메시지', contact_send: '보내기', contact_success: '문의해 주셔서 감사합니다. 아틀리에 디렉터가 48시간 내에 연락드리겠습니다.', about_intro: 'ALTESSE는 하나의 신념에서 탄생했습니다: 여성이 입을 수 있는 가장 강력한 것은 자신을 무적으로 느끼게 하는 드레스라는 것.', nav_collections: '컬렉션', nav_atelier: '아틀리에', nav_about: '스토리', nav_contact: '예약', footer_tagline: '오트 쿠튀르 · 파리' },
    de: { intro_sub: 'Jedes Kleid ein Gedicht. Jeder Stich ein Wort. Jede Silhouette eine Geschichte — handgefertigt in unserem Pariser Atelier, wo Tradition auf Transzendenz trifft.', craft_title: 'Die Kunst der Hand', craft_p1: 'Im Zeitalter der Maschinen wählen wir Nadeln. Jedes ALTESSE-Kleid erfordert zwischen 180 und 350 Stunden Handarbeit — Stickerei, Federung, Drapierung, Perlenstickerei — ausgeführt von unseren petites mains.', craft_p2: 'Kein Stück gleicht dem anderen. Kein Detail bleibt unsichtbar. So ist Couture, wie sie sein soll: langsam, bedacht, unersetzlich.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Hinter einer unscheinbaren Tür an der Rue Cambon kreiert unser Atelier seit 2020 Haute Couture. Sieben Kunsthandwerker, eine Vision: die Frau zu kleiden, die versteht, dass wahrer Luxus Zeit ist.', atelier_p2: 'Jede Kundin beginnt mit einer privaten Beratung. Maße werden genommen. Stoffe werden präsentiert. Eine Toile wird gefertigt. Erst dann beginnt das Kleid seine Reise vom Stoff zum Körper.', atelier_cta: 'Beratung Anfordern', contact_title: 'Termin', contact_sub: 'Jedes ALTESSE-Kleid beginnt mit einem Gespräch.', contact_name: 'Name', contact_email: 'E-Mail', contact_phone: 'Telefon', contact_subject: 'Betreff', contact_message: 'Ihre Nachricht', contact_send: 'Senden', contact_success: 'Vielen Dank für Ihre Anfrage. Unsere Atelierleiterin wird sich innerhalb von 48 Stunden bei Ihnen melden.', about_intro: 'ALTESSE entstand aus einer Überzeugung: Das Mächtigste, was eine Frau tragen kann, ist das Kleid, in dem sie sich unbesiegbar fühlt.', nav_collections: 'Kollektionen', nav_atelier: 'Atelier', nav_about: 'Geschichte', nav_contact: 'Termin', footer_tagline: 'Haute Couture · Paris' },
    pt: { intro_sub: 'Cada vestido é um poema. Cada ponto, uma palavra. Cada silhueta, uma história — feita à mão no nosso atelier parisiense, onde a tradição encontra a transcendência.', craft_title: 'A Arte da Mão', craft_p1: 'Na era das máquinas, escolhemos agulhas. Cada vestido ALTESSE exige entre 180 e 350 horas de trabalho manual — bordado, emplumação, drapeado, miçangas — executado pelas nossas petites mains.', craft_p2: 'Não há duas peças iguais. Nenhum detalhe é invisível. Isto é a alta-costura como deve ser: lenta, deliberada, insubstituível.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Atrás de uma porta discreta na Rue Cambon, o nosso atelier cria alta-costura desde 2020. Sete artesãs, uma visão: vestir a mulher que compreende que o verdadeiro luxo é o tempo.', atelier_p2: 'Cada cliente começa com uma consulta privada. Tiram-se as medidas. Apresentam-se os tecidos. Confecciona-se uma toile. Só então o vestido inicia a sua viagem do tecido ao corpo.', atelier_cta: 'Solicitar Consulta', contact_title: 'Marcação', contact_sub: 'Cada vestido ALTESSE começa com uma conversa.', contact_name: 'Nome', contact_email: 'Email', contact_phone: 'Telefone', contact_subject: 'Assunto', contact_message: 'A Sua Mensagem', contact_send: 'Enviar', contact_success: 'Obrigado pelo seu contacto. A nossa diretora de atelier entrará em contacto dentro de 48 horas.', about_intro: 'ALTESSE nasceu de uma convicção: a coisa mais poderosa que uma mulher pode vestir é o vestido que a faz sentir invencível.', nav_collections: 'Coleções', nav_atelier: 'Atelier', nav_about: 'História', nav_contact: 'Marcação', footer_tagline: 'Alta-Costura · Paris' },
    hi: { intro_sub: 'हर गाउन एक कविता है। हर टांका एक शब्द। हर सिल्हूट एक कहानी — हमारे पेरिस के एटेलियर में हस्तनिर्मित, जहाँ परंपरा और उत्कृष्टता का मिलन होता है।', craft_title: 'हाथ की कला', craft_p1: 'मशीनों के युग में, हम सुइयाँ चुनते हैं। प्रत्येक ALTESSE गाउन को 180 से 350 घंटे की हस्तकला की आवश्यकता होती है — कढ़ाई, पंख सज्जा, ड्रेपिंग, बीडिंग — हमारी petites mains द्वारा निष्पादित।', craft_p2: 'कोई भी दो पीस एक जैसे नहीं। कोई विवरण अदृश्य नहीं। यही कूटूर का सही रूप है: धीमा, सुविचारित, अपूरणीय।', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Rue Cambon पर एक अनाम दरवाजे के पीछे, हमारा एटेलियर 2020 से कूटूर रच रहा है। सात शिल्पकार, एक दृष्टि: उस महिला को पहनाना जो समझती है कि सच्ची विलासिता समय है।', atelier_p2: 'प्रत्येक ग्राहक एक निजी परामर्श से शुरू करती है। माप लिए जाते हैं। कपड़े प्रस्तुत किए जाते हैं। एक ट्वॉइल बनाया जाता है। तभी गाउन कपड़े से शरीर तक की अपनी यात्रा शुरू करता है।', atelier_cta: 'परामर्श का अनुरोध करें', contact_title: 'नियुक्ति', contact_sub: 'हर ALTESSE गाउन एक बातचीत से शुरू होता है।', contact_name: 'नाम', contact_email: 'ईमेल', contact_phone: 'फ़ोन', contact_subject: 'विषय', contact_message: 'आपका संदेश', contact_send: 'भेजें', contact_success: 'आपकी पूछताछ के लिए धन्यवाद। हमारी एटेलियर निदेशक 48 घंटों के भीतर संपर्क करेंगी।', about_intro: 'ALTESSE एक विश्वास से जन्मा: सबसे शक्तिशाली चीज़ जो एक महिला पहन सकती है, वह पोशाक है जो उसे अजेय महसूस कराती है।', nav_collections: 'संग्रह', nav_atelier: 'एटेलियर', nav_about: 'कहानी', nav_contact: 'नियुक्ति', footer_tagline: 'हॉट कूटूर · पेरिस' },
    id: { intro_sub: 'Setiap gaun adalah puisi. Setiap jahitan adalah kata. Setiap siluet adalah cerita — dibuat dengan tangan di atelier Paris kami, di mana tradisi bertemu transendensi.', craft_title: 'Seni Tangan', craft_p1: 'Di era mesin, kami memilih jarum. Setiap gaun ALTESSE membutuhkan 180 hingga 350 jam kerja tangan — sulaman, bulu, draping, manik-manik — dikerjakan oleh petites mains kami.', craft_p2: 'Tidak ada dua karya yang identik. Tidak ada detail yang tak terlihat. Inilah couture sebagaimana mestinya: lambat, disengaja, tak tergantikan.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Di balik pintu tak bertanda di Rue Cambon, atelier kami telah menciptakan couture sejak 2020. Tujuh pengrajin, satu visi: mendandani wanita yang memahami bahwa kemewahan sejati adalah waktu.', atelier_p2: 'Setiap klien dimulai dengan konsultasi pribadi. Pengukuran dilakukan. Kain-kain dipresentasikan. Toile dibuat. Barulah gaun memulai perjalanannya dari kain ke tubuh.', atelier_cta: 'Minta Konsultasi', contact_title: 'Janji Temu', contact_sub: 'Setiap gaun ALTESSE dimulai dengan percakapan.', contact_name: 'Nama', contact_email: 'Email', contact_phone: 'Telepon', contact_subject: 'Subjek', contact_message: 'Pesan Anda', contact_send: 'Kirim', contact_success: 'Terima kasih atas pertanyaan Anda. Direktur atelier kami akan menghubungi dalam 48 jam.', about_intro: 'ALTESSE lahir dari satu keyakinan: hal paling kuat yang bisa dikenakan seorang wanita adalah gaun yang membuatnya merasa tak terkalahkan.', nav_collections: 'Koleksi', nav_atelier: 'Atelier', nav_about: 'Cerita', nav_contact: 'Janji Temu', footer_tagline: 'Haute Couture · Paris' },
    tr: { intro_sub: 'Her elbise bir şiirdir. Her dikiş bir kelime. Her silüet bir hikâye — geleneğin aşkınlıkla buluştuğu Paris atölyemizde el yapımı.', craft_title: 'Elin Sanatı', craft_p1: 'Makineler çağında, biz iğneleri seçiyoruz. Her ALTESSE elbisesi 180 ila 350 saat arası el işçiliği gerektirir — nakış, tüy işleme, drapaj, boncuk işleme — petites mains\'lerimiz tarafından gerçekleştirilir.', craft_p2: 'Hiçbir parça birbirinin aynısı değildir. Hiçbir detay görünmez değildir. Couture böyle olmalıdır: yavaş, kasıtlı, yeri doldurulamaz.', atelier_title: '31 Rue Cambon, Paris', atelier_p1: 'Rue Cambon\'da işaretsiz bir kapının ardında, atölyemiz 2020\'den beri couture yaratıyor. Yedi zanaatkâr, tek bir vizyon: gerçek lüksün zaman olduğunu anlayan kadını giydirmek.', atelier_p2: 'Her müşteri özel bir danışmanlıkla başlar. Ölçüler alınır. Kumaşlar sunulur. Bir tuval hazırlanır. Ancak o zaman elbise kumaştan bedene yolculuğuna başlar.', atelier_cta: 'Danışmanlık Talep Et', contact_title: 'Randevu', contact_sub: 'Her ALTESSE elbisesi bir sohbetle başlar.', contact_name: 'İsim', contact_email: 'E-posta', contact_phone: 'Telefon', contact_subject: 'Konu', contact_message: 'Mesajınız', contact_send: 'Gönder', contact_success: 'Talebiniz için teşekkür ederiz. Atölye direktörümüz 48 saat içinde sizinle iletişime geçecektir.', about_intro: 'ALTESSE tek bir inançtan doğdu: bir kadının giyebileceği en güçlü şey, onu yenilmez hissettiren elbisedir.', nav_collections: 'Koleksiyonlar', nav_atelier: 'Atölye', nav_about: 'Hikâye', nav_contact: 'Randevu', footer_tagline: 'Haute Couture · Paris' },
    it: { intro_sub: 'Ogni abito è una poesia. Ogni punto, una parola. Ogni silhouette, una storia — realizzata a mano nel nostro atelier parigino, dove la tradizione incontra la trascendenza.', craft_title: 'L\'Arte della Mano', craft_p1: 'Nell\'era delle macchine, scegliamo gli aghi. Ogni abito ALTESSE richiede dalle 180 alle 350 ore di lavoro manuale — ricamo, piumaggio, drappeggio, perline — eseguito dalle nostre petites mains.', craft_p2: 'Nessun capo è identico a un altro. Nessun dettaglio è invisibile. Questa è l\'alta moda come dovrebbe essere: lenta, deliberata, insostituibile.', atelier_title: '31 Rue Cambon, Parigi', atelier_p1: 'Dietro una porta anonima in Rue Cambon, il nostro atelier crea alta moda dal 2020. Sette artigiane, una visione: vestire la donna che comprende che il vero lusso è il tempo.', atelier_p2: 'Ogni cliente inizia con una consulenza privata. Si prendono le misure. Si presentano i tessuti. Si realizza una toile. Solo allora l\'abito inizia il suo viaggio dalla stoffa al corpo.', atelier_cta: 'Richiedi una Consulenza', contact_title: 'Appuntamento', contact_sub: 'Ogni abito ALTESSE inizia con una conversazione.', contact_name: 'Nome', contact_email: 'Email', contact_phone: 'Telefono', contact_subject: 'Oggetto', contact_message: 'Il Suo Messaggio', contact_send: 'Invia', contact_success: 'Grazie per la Sua richiesta. La nostra direttrice d\'atelier La contatterà entro 48 ore.', about_intro: 'ALTESSE è nata da una convinzione: la cosa più potente che una donna possa indossare è l\'abito che la fa sentire invincibile.', nav_collections: 'Collezioni', nav_atelier: 'Atelier', nav_about: 'La Storia', nav_contact: 'Appuntamento', footer_tagline: 'Alta Moda · Parigi' }
  };

  async function loadTranslations(lang) {
    translations = embedded[lang] || embedded.en;
    currentLang = lang;
    localStorage.setItem('altesse_lang', lang);
    applyTranslations();
    refreshAllDynamicContent();
  }

  function applyTranslations() {
    $$('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (translations[k]) el.textContent = translations[k]; });
    // 更新导航链接文案（按href匹配，避免索引错位）
    const navLinks = $('#navLinks');
    if (navLinks) {
      const map = {
        'collections.html': 'nav_collections',
        'about.html': 'nav_about',
        'contact.html': 'nav_contact'
      };
      navLinks.querySelectorAll('li:not(.dropdown) > a').forEach(a => {
        const href = a.getAttribute('href');
        for (const [path, key] of Object.entries(map)) {
          if (href && href.includes(path) && translations[key]) {
            a.textContent = translations[key];
          }
        }
      });
    }
  }

  function t(key) { return translations[key] || key; }

  function refreshAllDynamicContent() {
    if (cachedWorks.length) renderFeaturedWorks();
    if (cachedCollections.length) renderCollections();
    if (cachedSettings) {
      const bar = $('#announcementBar');
      if (bar && cachedSettings.announcement) {
        // 公告栏：优先取对应语言文本，fallback 英文
        const langKey = {
          en:'text', zh:'textZh', es:'textEs', fr:'textFr', ru:'textRu', ar:'textAr',
          ja:'textJa', ko:'textKo', de:'textDe', pt:'textPt', hi:'textHi', id:'textId', tr:'textTr', it:'textIt'
        }[currentLang];
        const ann = cachedSettings.announcement;
        const txt = (langKey && ann[langKey]) || ann.text || '';
        bar.textContent = txt;
      }
    }
  }

  // ═══════════════════════════════
  // API
  // ═══════════════════════════════

  async function api(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }

  // ═══════════════════════════════
  // Featured Works
  // ═══════════════════════════════

  async function loadFeaturedWorks() {
    try {
      cachedWorks = await api('/api/works?featured=true');
      renderFeaturedWorks();
      // 更新Hero图片为第一个featured作品的首图
      const heroImg = $('#heroImg');
      if (heroImg && cachedWorks.length && cachedWorks[0].images && cachedWorks[0].images[0]) {
        heroImg.src = cachedWorks[0].images[0];
        heroImg.alt = cachedWorks[0].name || 'ALTESSE';
      }
    } catch (e) { console.error(e); }
  }

  function renderFeaturedWorks() {
    const grid = $('#featuredWorks');
    if (!grid || !cachedWorks.length) return;
    grid.innerHTML = cachedWorks.slice(0, 4).map((w, i) => {
      const name = currentLang === 'zh' && w.nameZh ? w.nameZh : w.name;
      return `<a href="atelier.html?id=${w.id}" class="work-item">
        <img src="${escAttr(w.images[0])}" alt="${escAttr(name)}" loading="lazy">
        <div class="work-item-info"><h3>${name}</h3><p>${{ en:'Discover', zh:'探索', es:'Descubrir', fr:'Découvrir', ru:'Открыть', ar:'اكتشف', ja:'探索', ko:'발견', de:'Entdecken', pt:'Descobrir', hi:'खोजें', id:'Jelajahi', tr:'Keşfet', it:'Scopri' }[currentLang] || 'Discover'}</p></div>
      </a>`;
    }).join('');
  }

  // ═══════════════════════════════
  // Collections
  // ═══════════════════════════════

  async function loadCollections() {
    try { cachedCollections = await api('/api/collections'); renderCollections(); } catch (e) { console.error(e); }
  }

  function renderCollections() {
    const grid = $('#collectionsGrid');
    if (!grid || !cachedCollections.length) return;
    grid.innerHTML = cachedCollections.map(c => {
      const name = currentLang === 'zh' && c.nameZh ? c.nameZh : c.name;
      const desc = currentLang === 'zh' && c.descriptionZh ? c.descriptionZh : c.description;
      return `<a href="collections.html?id=${c.id}" class="collection-card">
        <img src="${escAttr(c.coverImage)}" alt="${escAttr(name)}" loading="lazy">
        <div class="collection-card-info"><h3>${name}</h3><p>${desc.slice(0, 60)}</p></div>
      </a>`;
    }).join('');
  }

  // ═══════════════════════════════
  // Settings
  // ═══════════════════════════════

  async function loadSettings() {
    try { cachedSettings = await api('/api/settings'); document.title = cachedSettings.siteName + ' — ' + cachedSettings.siteTagline; } catch (e) { console.error(e); }
  }

  // ═══════════════════════════════
  // Reveal
  // ═══════════════════════════════

  function initReveal() {
    const obs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => obs.observe(el));
  }

  // ═══════════════════════════════
  // Nav
  // ═══════════════════════════════

  function initNav() {
    $('#navToggle')?.addEventListener('click', () => $('#navLinks').classList.toggle('open'));
    $('#navLinks')?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('open')));
    // 滚动监听：导航栏背景变化
    const nav = $('#nav');
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 60) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  // ═══════════════════════════════
  // Lang Switcher
  // ═══════════════════════════════

  function initLangSwitcher() {
    const s = $('#langSwitcher');
    if (s) { s.value = currentLang; s.addEventListener('change', () => loadTranslations(s.value)); }
  }

  // ═══════════════════════════════
  // Toast
  // ═══════════════════════════════

  function toast(msg, type) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'toast ' + type + ' show';
    clearTimeout(t._tid); t._tid = setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ═══════════════════════════════
  // Contact form
  // ═══════════════════════════════

  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = { name: $('#cf_name')?.value?.trim(), email: $('#cf_email')?.value?.trim(), phone: $('#cf_phone')?.value?.trim(), subject: $('#cf_subject')?.value, message: $('#cf_message')?.value?.trim() };
      if (!data.name || !data.email || !data.message) { toast('Please fill all required fields.', 'error'); return; }
      try {
        await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        form.style.display = 'none';
        const s = $('#formSuccess'); if (s) s.classList.add('visible');
      } catch { toast('Something went wrong.', 'error'); }
    });
  }

  // ═══════════════════════════════
  // Init
  // ═══════════════════════════════

  document.addEventListener('DOMContentLoaded', async () => {
    loadTranslations(currentLang);
    initLangSwitcher();
    initNav();
    initReveal();
    initContactForm();
    await Promise.all([loadSettings(), loadFeaturedWorks(), loadCollections()]);
  });

  // ── Lightbox ──
  function initLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<span class="lightbox-close">&times;</span><span class="lightbox-prev">&lsaquo;</span><span class="lightbox-next">&rsaquo;</span><img src="" alt="">';
    document.body.appendChild(overlay);
    const img = overlay.querySelector('img');
    const close = overlay.querySelector('.lightbox-close');
    const prev = overlay.querySelector('.lightbox-prev');
    const next = overlay.querySelector('.lightbox-next');
    let gallery = [], idx = 0;

    function open(srcs, i) { gallery = srcs; idx = i; img.src = gallery[idx]; overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function shut() { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    function go(d) { idx = (idx + d + gallery.length) % gallery.length; img.src = gallery[idx]; }

    close.addEventListener('click', shut);
    overlay.addEventListener('click', e => { if (e.target === overlay) shut(); });
    prev.addEventListener('click', e => { e.stopPropagation(); go(-1); });
    next.addEventListener('click', e => { e.stopPropagation(); go(1); });
    document.addEventListener('keydown', e => { if (!overlay.classList.contains('open')) return; if (e.key === 'Escape') shut(); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });

    // Delegate: any <img> inside .works-asymmetric, .atelier-gallery, .collection-block-image, .craft-images, .collection-works
    document.addEventListener('click', e => {
      const t = e.target;
      if (t.tagName !== 'IMG') return;
      const container = t.closest('.works-asymmetric, .atelier-gallery, .collection-block-image, .craft-images, .collection-works, .atelier-image');
      if (!container) return;
      const imgs = [...container.querySelectorAll('img')];
      const i = imgs.indexOf(t);
      if (i >= 0) open(imgs.map(el => el.src), i);
    });
  }

  // ── Hero Carousel ──
  function initHeroCarousel() {
    const slides = $$('.hero-slide');
    const dots = $$('.hero-dots span');
    const prevBtn = $('#heroPrev');
    const nextBtn = $('#heroNext');
    if (!slides.length) return;
    let cur = 0, timer;
    function go(nextIdx) {
      const newIdx = (nextIdx + slides.length) % slides.length;
      if (newIdx === cur) return;
      slides[cur].classList.remove('active');
      dots[cur].classList.remove('active');
      slides[newIdx].classList.add('active');
      dots[newIdx].classList.add('active');
      cur = newIdx;
    }
    function restart() { clearInterval(timer); timer = setInterval(() => go(cur + 1), 6000); }
    if (prevBtn) prevBtn.addEventListener('click', () => { go(cur - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { go(cur + 1); restart(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); restart(); }));
    timer = setInterval(() => go(cur + 1), 6000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadTranslations(currentLang);
    initLangSwitcher();
    initNav();
    initReveal();
    initHeroCarousel();
    initContactForm();
    initLightbox();
    loadSettings();
    loadFeaturedWorks();
    loadCollections();
  });

  // ── Expose for sub-pages ──
  window.ALTESSE = { api, currentLang, t, toast };
})();
