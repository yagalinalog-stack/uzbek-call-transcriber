import { ProcessingResult } from "./types";

export const exampleCalls: ProcessingResult[] = [
  {
    fileName: "tashkent_delivery_call_094.wav",
    fileSize: "4.2 MB",
    processingTimeMs: 3840,
    metadata: {
      speakersCount: 2,
      languageConfidence: "high",
    },
    summary: {
      title: "Доставка посылки Самарканд — Ташкент",
      description: "Согласование деталей доставки курьерской службой: времени получения, стоимости и адреса получателя.",
      keyPoints: [
        "Отправитель хочет передать коробку весом около 5 кг из Самарканда в Ташкент.",
        "Стоимость стандартной доставки составляет 45,000 сум, экспресс-доставки — 80,000 сум.",
        "Выбран экспресс-вариант с гарантированной доставкой до 12:00 следующего дня.",
        "Курьер прибудет за посылкой сегодня с 15:00 до 17:00 по адресу ул. Регистан, 45.",
      ],
    },
    dialogue: [
      {
        speaker: "Оператор (Шехроз)",
        uzbekText: "Assalomu alaykum! 'Toshkent Express' kuryerlik xizmati, eshitaman. Ismim Shahruz. Sizga qanday yordam bera olaman?",
        russianText: "Здравствуйте! Курьерская служба 'Ташкент Экспресс' слушает. Меня зовут Шахруз. Чем я могу вам помочь?",
        timestamp: "00:01",
      },
      {
        speaker: "Клиент (Алишер)",
        uzbekText: "Vaalaykum assalom. Yaxshimisiz, Shahruz aka? Men Samarqanddan Toshkentga bitta posylka yubormoqchi edim. Og'irligi besh kilo atrofida, kiyim-kechaklar.",
        russianText: "И вам здравствуйте. Как вы, брат Шахруз? Я хотел отправить посылку из Самарканда в Ташкент. Вес около пяти килограммов, одежда.",
        timestamp: "00:08",
      },
      {
        speaker: "Оператор (Шехроз)",
        uzbekText: "Tushunarli. Samarqanddan Toshkentgacha yetkazib berishning ikki xil turi bor. Oddiy yetkazib berish 45 ming so'm bo'ladi, ikki kunda boradi. Ekspress turi esa ertaga soat o'nikkigacha yetib boradi, narxi 80 ming so'm.",
        russianText: "Понятно. Доставка из Самарканда в Ташкент бывает двух видов. Обычная доставка стоит 45 тысяч сумов, занимает два дня. Экспресс-доставка прибудет завтра до 12:00, цена 80 тысяч сумов.",
        timestamp: "00:20",
      },
      {
        speaker: "Клиент (Алишер)",
        uzbekText: "Iye, judayam yaxshi-ku! Menga ekspressi ma'qul. Sababi ertaga tushgacha akam Toshkentda qabul qilib olishi shart, zarur narsalar bor edi ichida.",
        russianText: "О, отлично! Мне подходит экспресс. Потому что завтра до обеда мой брат в Ташкенте обязательно должен получить её, внутри важные вещи.",
        timestamp: "00:34",
      },
      {
        speaker: "Оператор (Шехроз)",
        uzbekText: "Xo'p, bo'ladi. Unda bugun Samarqanddagi manzilingizdan posylkani olib ketish uchun kuryer yuboraman. Manzilni to'liq ayta olasizmi?",
        russianText: "Хорошо, договорились. Тогда сегодня я отправлю курьера по вашему адресу в Самарканде, чтобы забрать посылку. Можете назвать точный адрес?",
        timestamp: "00:43",
      },
      {
        speaker: "Клиент (Алишер)",
        uzbekText: "Ha, yozib oling: Samarqand shahri, Registon ko'chasi, qirq beshinchi uy. Mo'ljal: Registon maydonining orqasidagi dorixona.",
        russianText: "Да, записывайте: город Самарканд, улица Регистан, дом 45. Ориентир: аптека позади площади Регистан.",
        timestamp: "00:52",
      },
      {
        speaker: "Оператор (Шехроз)",
        uzbekText: "Yozib oldim. Kuryerimiz bugun soat uchdan beshgacha boradi. Iltimos, telefoningiz o'chiq bo'lmasin, yetib borishdan oldin telefon qiladi.",
        russianText: "Записал. Наш курьер приедет сегодня с трех до пяти часов. Пожалуйста, держите телефон включенным, он позвонит перед прибытием.",
        timestamp: "01:05",
      },
      {
        speaker: "Клиент (Алишер)",
        uzbekText: "Rahmat, aka. Telefonim doim yoniq. Akamning ham telefon raqamini hozir sms qilib yuboraman.",
        russianText: "Спасибо, брат. Мой телефон всегда включен. Номер телефона брата я тоже сейчас отправлю по смс.",
        timestamp: "01:13",
      },
      {
        speaker: "Оператор (Шехроз)",
        uzbekText: "Juda soz, Alisher aka. Sms kelsa, tizimga kiritib qo'yamiz. Xizmatingizdan mamnunmiz, salomat bo'ling!",
        russianText: "Очень хорошо, Алишер-ака. Как придет смс, внесем в систему. Рады помочь, будьте здоровы!",
        timestamp: "01:21",
      },
      {
        speaker: "Клиент (Алишер)",
        uzbekText: "Rahmat katta, ishlaringizga omad!",
        russianText: "Большое спасибо, удачи в работе!",
        timestamp: "01:27",
      },
    ],
  },
  {
    fileName: "stroy_materials_inquiry.mp3",
    fileSize: "5.8 MB",
    processingTimeMs: 4520,
    metadata: {
      speakersCount: 2,
      languageConfidence: "medium",
    },
    summary: {
      title: "Закупка стройматериалов (Цемент и Арматура)",
      description: "Запрос оптовых цен на цемент М500 и арматуру 12мм для строительного объекта с обсуждением скидки на объем.",
      keyPoints: [
        "Покупателю требуется 15 тонн цемента марки М500 и 4 тонны арматуры класса А500С диаметром 12 мм.",
        "Цена цемента составляет 850,000 сум за тонну, арматуры — 9,800,000 сум за тонну.",
        "Менеджер предложил бесплатную доставку по Ташкенту при покупке этого объема в качестве скидки.",
        "Оплата согласована по безналичному расчету (перечислением) с НДС, отправка счета на Telegram.",
      ],
    },
    dialogue: [
      {
        speaker: "Менеджер (Дильшод)",
        uzbekText: "Alo, eshitaman! 'StroySnab' metall va sement ulgurji ombori, Dilshodman. Assalomu alaykum.",
        russianText: "Алло, слушаю! Оптовый склад металла и цемента 'СтройСнаб', я Дильшод. Здравствуйте.",
        timestamp: "00:02",
      },
      {
        speaker: "Заказчик (Рустам)",
        uzbekText: "Assalomu alaykum, Dilshod aka. Men qurilish ob'ektiga material so'ramoqchi edim. Bizga M500 markali sement va o'nikkilik armatura kerak.",
        russianText: "Здравствуйте, Дильшод-ака. Я хотел спросить материалы для строительного объекта. Нам нужен цемент марки М500 и арматура двенадцатого диаметра.",
        timestamp: "00:10",
      },
      {
        speaker: "Менеджер (Дильшод)",
        uzbekText: "Hozir ko'rib beraman... [shovqin] Armatura 12 talik bor, sement ham bor, yangi keldi. Hajmi qancha sizga aka?",
        russianText: "Сейчас посмотрю... [шум] Арматура 12-ка есть, цемент тоже есть, только что пришел. Какой объем вам нужен, брат?",
        timestamp: "00:19",
      },
      {
        speaker: "Заказчик (Рустам)",
        uzbekText: "Sementdan 15 tonna kerak, qopda bo'lsin, 50 kilolik. Armaturadan esa 4 tonna kerak bo'ladi, 12 metrlik kesilgan.",
        russianText: "Цемента нужно 15 тонн, обязательно в мешках по 50 кг. Арматуры понадобится 4 тонны, нарезанной по 12 метров.",
        timestamp: "00:27",
      },
      {
        speaker: "Менеджер (Дильшод)",
        uzbekText: "Yaxshi hajm. Sementni tonnasini 850 ming so'mdan qilib beramiz. Armatura tonnasi hozir 9 million 800 ming so'm turibdi. Agar shu hajmni olsangiz, Toshkent ichida dostavkasini bepul qilib beraman, mashina topamiz.",
        russianText: "Хороший объем. Цемент отдадим по 850 тысяч сумов за тонну. Арматура сейчас стоит 9 миллионов 800 тысяч сумов за тонну. Если заберете этот объем, я сделаю бесплатную доставку по Ташкенту, машину найдем.",
        timestamp: "00:39",
      },
      {
        speaker: "Заказчик (Рустам)",
        uzbekText: "Dostavka bepul bo'lsa juda yaxshi ekan, aka. To'lov qanday bo'ladi? Bizga perechisleniye bilan kerak, NDSI bormi?",
        russianText: "Если доставка бесплатная, то это очень хорошо, брат. Как будет проходить оплата? Нам нужно по перечислению (безналичному расчету), НДС есть?",
        timestamp: "00:54",
      },
      {
        speaker: "Менеджер (Дильшод)",
        uzbekText: "Albatta, biz rasmiy ishlaymiz, QQS (NDS) bor. Kompaniyangiz rekvizitlarini telegramdan tashlasangiz, hisob-faktura chiqarib beraman.",
        russianText: "Конечно, мы работаем официально, НДС есть. Если скинете реквизиты вашей компании в Telegram, я выпишу счет-фактуру.",
        timestamp: "01:04",
      },
      {
        speaker: "Заказчик (Рустам)",
        uzbekText: "Hozir sizga shu raqamga telegramdan tashlayman. To'lov qilganimizdan keyin qachon yetkazib berasiz?",
        russianText: "Сейчас отправлю вам в Telegram на этот номер. После оплаты когда доставите?",
        timestamp: "01:14",
      },
      {
        speaker: "Менеджер (Дильшод)",
        uzbekText: "To'lov tushishi bilan ertasiga ertalab ob'ektga boradi. Kechasi yuklab qo'yamiz.",
        russianText: "Как только оплата поступит, на следующее утро будет на объекте. Загрузим ночью.",
        timestamp: "01:21",
      },
      {
        speaker: "Заказчик (Рустам)",
        uzbekText: "Bo'ldi akam, hozir shartnoma va rekvizit yuboraman. Rahmat!",
        russianText: "Договорились, брат, сейчас отправлю реквизиты. Спасибо!",
        timestamp: "01:26",
      },
    ],
  },
];
