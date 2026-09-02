"""Single source for every visible string.

Rewrites the dictionary inside js/i18n.js and refreshes the Arabic fallback text
sitting in index.html, so the markup a visitor sees without JavaScript can never
drift from the dictionary.

Arabic house style, set by the client on 2026-09-02:
  - Modern Standard Arabic, never Egyptian colloquial
  - no diacritics at all
  - prices in US dollars; the company is not Egyptian, so no nationality claims
  - no reference to the client's other company or its projects
"""

import io
import json
import re
import unicodedata

AR = {
    "meta": {
        "title": "بوابتك | برمجيات وأتمتة تدير أعمالك من دونك",
        "description": "بوابتك شركة برمجيات تبني تطبيقات الويب والهواتف، وأتمتة العمليات وربط الأنظمة، ووكلاء الذكاء الاصطناعي. نسلم أنظمة تعمل، لا عروضا تقديمية. احجز استشارة مجانية مدتها 20 دقيقة.",
    },
    "brand": {"name": "بوابتك"},
    "a11y": {
        "skip": "انتقل إلى المحتوى",
        "diagram": "مخطط: طلب جديد، تحقق وتصنيف، تحديث الأنظمة، إشعار وفاتورة",
    },
    "nav": {
        "label": "القائمة الرئيسية",
        "services": "الخدمات",
        "process": "كيف نعمل",
        "work": "أعمالنا",
        "pricing": "الأسعار",
        "faq": "الأسئلة",
        "cta": "احجز استشارة",
        "menuOpen": "فتح القائمة",
        "menuClose": "إغلاق القائمة",
    },
    "lang": {"switch": "Switch to English"},
    "hero": {
        "title": "برمجيات وأتمتة تدير أعمالك من دونك",
        "sub": "نبني الأنظمة والتطبيقات وعمليات الأتمتة التي ترفع العمل اليدوي عن فريقك، ونسلمها وهي تعمل، لا عروضا تقديمية.",
        "ctaPrimary": "احجز استشارة مجانية",
        "ctaSecondary": "شاهد أعمالنا",
        "trustLabel": "أرقام بوابتك",
        "trust1": "مشروع منجز",
        "trust2": "أسابيع متوسط التسليم",
        "trust3": "أشهر دعم بعد الإطلاق",
    },
    "menu": {"note": "استشارة مجانية مدتها 20 دقيقة، دون أي التزام."},
    "results": {
        "label": "نتائج من أعمالنا",
        "oneNum": "70%",
        "one": "انخفاض في زمن معالجة الطلبات",
        "twoNum": "5",
        "two": "أنظمة موحدة في واجهة واحدة",
        "threeNum": "80%",
        "three": "من الاستفسارات يجيب عنها روبوت محادثة",
    },
    "services": {
        "title": "ما نبنيه",
        "sub": "كل خدمة تنتهي بنظام يعمل بين يدي فريقك، لا بتقرير.",
        "a1": "الأتمتة وربط الأنظمة",
        "a2": "نربط أنظمتك الحالية ببعضها ونزيل الخطوات اليدوية، من الطلب إلى الفاتورة دون تدخل.",
        "b1": "تطبيقات ويب مخصصة",
        "b2": "نظام مبني على طريقة عملك أنت، لا قالب جاهز غيرت ألوانه.",
        "c1": "وكلاء ذكاء اصطناعي وروبوتات محادثة",
        "c2": "مرتبطة ببياناتك، تجيب بدقة، وتحول المحادثة إلى موظف عند الحاجة.",
        "d1": "تطبيقات الهواتف",
        "d2": "iOS وأندرويد من قاعدة كود واحدة، بأداء أصلي.",
        "e1": "المتاجر الإلكترونية",
        "e2": "متجر سريع يبيع فعلا. الدفع والشحن والمخزون مرتبطة ببعضها.",
        "f1": "الصيانة والتطوير المستمر",
        "f2": "فريق ثابت يطور ويصلح شهريا بدلا من البحث عن فريق في كل مرة.",
    },
    "automation": {
        "title": "كيف تعمل الأتمتة",
        "sub": "يدخل الطلب من جهة، ويخرج فاتورة وإشعارا من الجهة الأخرى، دون أن يفتح أحد جدول بيانات.",
        "s1": "طلب جديد",
        "s1d": "من الموقع أو واتساب أو المندوب",
        "s2": "تحقق وتصنيف",
        "s2d": "الرصيد والعميل والأولوية",
        "s3": "تحديث الأنظمة",
        "s3d": "المخزون والحسابات والشحن",
        "s4": "إشعار وفاتورة",
        "s4d": "للعميل وللفريق في اللحظة نفسها",
        "m1n": "-70%",
        "m1": "من الوقت اليدوي",
        "m2n": "0",
        "m2": "أخطاء إدخال",
        "m3n": "24/7",
        "m3": "تشغيل متواصل",
        "cta": "حدثنا عن عملية لديك",
    },
    "process": {
        "title": "كيف نعمل",
        "sub": "أربع خطوات، لكل واحدة مخرج تراه.",
        "s1": "نفهم",
        "s1d": "جلسة مدتها 20 دقيقة تنتهي بنطاق واضح ومكتوب.",
        "s2": "نخطط",
        "s2d": "عرض سعر بمدة وتسليمات محددة. لا مفاجآت بعده.",
        "s3": "نبني",
        "s3d": "تسليم أسبوعي تراه يعمل، لا تقريرا عنه.",
        "s4": "نسلم وندعم",
        "s4d": "تدريب فريقك، وثلاثة أشهر دعم مشمولة.",
    },
    "work": {
        "title": "أعمالنا",
        "sub": "نماذج من نوع العمل الذي نسلمه.",
        "more": "التفاصيل",
        "c1": "أتمتة دورة الطلبات",
        "c1p": "كانت الطلبات تنتقل يدويا بين أكثر من برنامج، وكل نقل احتمال خطأ.",
        "c1m": "من زمن المعالجة",
        "c2": "توحيد الأنظمة في لوحة واحدة",
        "c2p": "كل قسم يعمل على نظام منفصل، دون صورة واحدة للعمل.",
        "c2m": "أنظمة في واجهة واحدة",
        "c3": "روبوت محادثة على بيانات العميل",
        "c3p": "فريق الدعم يجيب عن الأسئلة نفسها كل يوم بدل التركيز في الحالات الصعبة.",
        "c3m": "من الاستفسارات",
    },
    "stack": {
        "title": "نختار الأداة حسب المشكلة، لا حسب الرائج",
        "label": "التقنيات التي نعمل بها",
    },
    "why": {
        "title": "لماذا بوابتك",
        "w1": "كود تملكه",
        "w1d": "التسليم بالمستودع والتوثيق كاملا. لا احتكار ولا ارتباط بنا.",
        "w2": "مدد حقيقية",
        "w2d": "نقول ستة أسابيع حين تكون ستة أسابيع.",
        "w3": "شخص واحد يرد عليك",
        "w3d": "مدير حساب واحد ثابت، لا تذكرة في طابور.",
        "w4": "عربية مبنية بإتقان",
        "w4d": "الاتجاه من اليمين والخطوط والمحتوى العربي مبنية بشكل صحيح من اليوم الأول، لا مترجمة لاحقا.",
    },
    "pricing": {
        "title": "الأسعار",
        "sub": "الأسعار تقديرية وتتحدد بعد جلسة تحديد النطاق. لا رسوم خفية.",
        "from": "يبدأ من",
        "badge": "الأكثر طلبا",
        "cta": "احجز جلسة نطاق",
        "p1": "الإطلاق",
        "p1w": "فكرة أو موقع أول",
        "p1a": "500",
        "p1c": "دولار",
        "p1f1": "صفحة هبوط أو موقع تعريفي",
        "p1f2": "تصميم مخصص",
        "p1f3": "تحسين أساسي لمحركات البحث",
        "p1f4": "تسليم خلال أسبوعين إلى ثلاثة",
        "p2": "النمو",
        "p2w": "شركة تحتاج نظاما",
        "p2a": "1,900",
        "p2c": "دولار",
        "p2f1": "نظام أو تطبيق مخصص",
        "p2f2": "لوحة تحكم",
        "p2f3": "تكاملات مع أنظمتك",
        "p2f4": "ثلاثة أشهر دعم",
        "p3": "حسب الطلب",
        "p3w": "مؤسسة أو أتمتة معقدة",
        "p3a": "حسب النطاق",
        "p3c": "",
        "p3f1": "فريق مخصص",
        "p3f2": "أتمتة وربط أنظمة",
        "p3f3": "اتفاقية مستوى خدمة",
        "p3f4": "تطوير مستمر",
    },
    "quotes": {
        "title": "آراء العملاء",
        "q1": "مكان اقتباس العميل الأول. سطران على الأكثر.",
        "n1": "اسم العميل",
        "r1": "المسمى الوظيفي، الشركة",
        "q2": "مكان اقتباس العميل الثاني. سطران على الأكثر.",
        "n2": "اسم العميل",
        "r2": "المسمى الوظيفي، الشركة",
        "q3": "مكان اقتباس العميل الثالث. سطران على الأكثر.",
        "n3": "اسم العميل",
        "r3": "المسمى الوظيفي، الشركة",
    },
    "faq": {
        "title": "أسئلة متكررة",
        "q1": "كم يستغرق العمل؟",
        "a1": "الموقع التعريفي من أسبوعين إلى ثلاثة. النظام أو التطبيق المخصص ستة أسابيع في المتوسط. تتحدد المدة وتكتب في العرض بعد جلسة النطاق، ولا تتغير بعدها إلا إذا غيرت النطاق.",
        "q2": "هل تعملون بعقد؟",
        "a2": "نعم. عقد مكتوب يحدد النطاق والتسليمات والمدة والدفعات وحقوق الملكية. لا يبدأ أي عمل دون عقد.",
        "q3": "هل الكود ملكي؟",
        "a3": "ملكك بالكامل من يوم التسليم. نسلمك المستودع والتوثيق وبيانات الاستضافة. وإذا قررت المتابعة مع فريق آخر، لا شيء يعوقك.",
        "q4": "هل تدعمون بعد الإطلاق؟",
        "a4": "ثلاثة أشهر دعم مشمولة في باقة النمو، تغطي إصلاح الأعطال والتعديلات الصغيرة. بعدها هناك باقة صيانة شهرية اختيارية.",
        "q5": "هل تعملون مع فريق تقني قائم لدي؟",
        "a5": "نعم. نعمل إلى جانب فريقك في المستودع نفسه، بمراجعة كود ومعايير متفق عليها، أو نأخذ جزءا محددا ونسلمه جاهزا للدمج.",
        "q6": "كيف تتم الدفعات؟",
        "a6": "دفعات مرتبطة بالتسليمات لا بالوقت. الدفعة الأولى عند بدء العمل والباقي عند كل تسليم متفق عليه. التفاصيل تكتب في العرض.",
    },
    "contact": {
        "title": "ابدأ من بوابة واحدة",
        "sub": "أرسل لنا موجزا مختصرا، ونعود إليك في يوم العمل نفسه بموعد استشارة مدتها 20 دقيقة.",
        "name": "الاسم",
        "namePh": "الاسم الكامل",
        "phone": "واتساب أو هاتف",
        "phonePh": "رقم الهاتف مع رمز الدولة",
        "email": "البريد الإلكتروني",
        "emailPh": "name@company.com",
        "service": "نوع الخدمة",
        "servicePick": "اختر الخدمة",
        "details": "موجز مختصر",
        "detailsOpt": "اختياري",
        "detailsPh": "ما المشكلة التي تريد حلها؟",
        "submit": "أرسل الطلب",
        "sending": "جار الإرسال…",
        "or": "أو",
        "whatsapp": "راسلنا على واتساب",
        "errName": "اكتب اسمك من فضلك.",
        "errPhone": "اكتب رقم واتساب أو هاتف صحيحا.",
        "errEmail": "اكتب بريدا إلكترونيا صحيحا.",
        "errService": "اختر نوع الخدمة.",
        "errForm": "هناك حقول تحتاج مراجعة.",
        "errSend": "تعذر إرسال الطلب الآن. راسلنا على واتساب من فضلك.",
        "okTitle": "وصلنا طلبك",
        "okBody": "سنعود إليك في يوم العمل نفسه. وإذا كان الأمر عاجلا، راسلنا على واتساب الآن.",
        "okAgain": "أرسل طلبا آخر",
    },
    "footer": {
        "about": "عن بوابتك",
        "aboutText": "شركة برمجيات تبني الأنظمة والتطبيقات وعمليات الأتمتة التي ترفع العمل اليدوي عن الفرق.",
        "services": "الخدمات",
        "links": "روابط",
        "contact": "تواصل",
        "whatsapp": "واتساب",
        "email": "البريد الإلكتروني",
        "linkedin": "لينكدإن",
        "rights": "جميع الحقوق محفوظة",
        "privacy": "سياسة الخصوصية",
    },
}

EN = {
    "meta": {
        "title": "Bawabtak | Software and automation that runs your business without you",
        "description": "Bawabtak is a software company building web and mobile apps, process automation and system integrations, and AI agents. We deliver systems that work, not slide decks. Book a free 20-minute call.",
    },
    "brand": {"name": "Bawabtak"},
    "a11y": {
        "skip": "Skip to content",
        "diagram": "Diagram: new order, check and classify, update systems, notify and invoice",
    },
    "nav": {
        "label": "Main navigation",
        "services": "Services",
        "process": "Process",
        "work": "Work",
        "pricing": "Pricing",
        "faq": "FAQ",
        "cta": "Book a call",
        "menuOpen": "Open menu",
        "menuClose": "Close menu",
    },
    "lang": {"switch": "التبديل إلى العربية"},
    "hero": {
        "title": "Software and automation that runs your business without you",
        "sub": "We build the systems, apps and automations that take manual work off your team, and hand them over working, not as slide decks.",
        "ctaPrimary": "Book a free call",
        "ctaSecondary": "See our work",
        "trustLabel": "Bawabtak in numbers",
        "trust1": "projects delivered",
        "trust2": "weeks average delivery",
        "trust3": "months of post-launch support",
    },
    "menu": {"note": "A free 20-minute call, no commitment."},
    "results": {
        "label": "Results from our work",
        "oneNum": "70%",
        "one": "cut from order processing time",
        "twoNum": "5",
        "two": "systems joined behind one screen",
        "threeNum": "80%",
        "three": "of enquiries answered by a chatbot",
    },
    "services": {
        "title": "What we build",
        "sub": "Every one of these ends as a working system in your team's hands, not as a report.",
        "a1": "Automation and integrations",
        "a2": "We connect the systems you already run and remove the manual steps, from order to invoice with nobody in the middle.",
        "b1": "Custom web apps",
        "b2": "A system built around the way you work, not a template with the colours changed.",
        "c1": "AI agents and chatbots",
        "c2": "Connected to your data, answering accurately, and handing over to a person when they should.",
        "d1": "Mobile apps",
        "d2": "iOS and Android from one codebase, at native speed.",
        "e1": "E-commerce",
        "e2": "A fast store that actually sells. Payment, shipping and stock wired together.",
        "f1": "Maintenance and ongoing development",
        "f2": "A steady team improving and fixing every month, instead of a new search each time.",
    },
    "automation": {
        "title": "How the automation works",
        "sub": "An order goes in one side and comes out the other as an invoice and a notification, without anyone opening a spreadsheet.",
        "s1": "New order",
        "s1d": "From the site, WhatsApp or a rep",
        "s2": "Check and classify",
        "s2d": "Stock, customer, priority",
        "s3": "Update systems",
        "s3d": "Inventory, accounts, shipping",
        "s4": "Notify and invoice",
        "s4d": "Customer and team at the same moment",
        "m1n": "-70%",
        "m1": "of the manual time",
        "m2n": "0",
        "m2": "entry errors",
        "m3n": "24/7",
        "m3": "continuous operation",
        "cta": "Tell us about a process",
    },
    "process": {
        "title": "How we work",
        "sub": "Four steps, and each one has an output you can see.",
        "s1": "Understand",
        "s1d": "A 20-minute call that ends in a clear written scope.",
        "s2": "Plan",
        "s2d": "A quote with a fixed duration and named deliverables. No surprises after it.",
        "s3": "Build",
        "s3d": "Something working handed over every week, not a report about it.",
        "s4": "Deliver and support",
        "s4d": "Training for your team, and three months of support included.",
    },
    "work": {
        "title": "Our work",
        "sub": "Examples of the kind of work we deliver.",
        "more": "Details",
        "c1": "Order cycle automation",
        "c1p": "Orders moved by hand between several programs, and every move was a chance to get it wrong.",
        "c1m": "of processing time",
        "c2": "Systems joined behind one screen",
        "c2p": "Each department ran a separate system, with no single picture of the work.",
        "c2m": "systems behind one screen",
        "c3": "A chatbot on the client's own data",
        "c3p": "The support team answered the same questions daily instead of working the hard cases.",
        "c3m": "of enquiries",
    },
    "stack": {
        "title": "We pick tools for the problem, not for the trend",
        "label": "The technologies we work with",
    },
    "why": {
        "title": "Why Bawabtak",
        "w1": "Code you own",
        "w1d": "Handed over as the repository with full documentation. No lock-in and no dependency on us.",
        "w2": "Honest timelines",
        "w2d": "We say six weeks when it is six weeks.",
        "w3": "One person who answers",
        "w3d": "A single account manager, not a ticket in a queue.",
        "w4": "Arabic built properly",
        "w4d": "Right-to-left, typefaces and Arabic content built correctly from day one, not translated afterwards.",
    },
    "pricing": {
        "title": "Pricing",
        "sub": "These are estimates and get fixed after the scoping call. No hidden fees.",
        "from": "From",
        "badge": "Most chosen",
        "cta": "Book a scoping call",
        "p1": "Launch",
        "p1w": "An idea or a first site",
        "p1a": "500",
        "p1c": "USD",
        "p1f1": "Landing page or company site",
        "p1f2": "Custom design",
        "p1f3": "Baseline search optimisation",
        "p1f4": "Delivered in two to three weeks",
        "p2": "Growth",
        "p2w": "A company that needs a system",
        "p2a": "1,900",
        "p2c": "USD",
        "p2f1": "Custom system or app",
        "p2f2": "Admin dashboard",
        "p2f3": "Integrations with your systems",
        "p2f4": "Three months of support",
        "p3": "Bespoke",
        "p3w": "An enterprise or complex automation",
        "p3a": "Scope based",
        "p3c": "",
        "p3f1": "Dedicated team",
        "p3f2": "Automation and integrations",
        "p3f3": "Service level agreement",
        "p3f4": "Continuous development",
    },
    "quotes": {
        "title": "What clients say",
        "q1": "Placeholder for the first client quote. Two lines at most.",
        "n1": "Client name",
        "r1": "Role, company",
        "q2": "Placeholder for the second client quote. Two lines at most.",
        "n2": "Client name",
        "r2": "Role, company",
        "q3": "Placeholder for the third client quote. Two lines at most.",
        "n3": "Client name",
        "r3": "Role, company",
    },
    "faq": {
        "title": "Frequent questions",
        "q1": "How long does it take?",
        "a1": "A company site takes two to three weeks. A custom system or app averages six weeks. The duration is fixed and written into the quote after the scoping call, and it does not move unless you change the scope.",
        "q2": "Do you work under contract?",
        "a2": "Yes. A written contract setting out scope, deliverables, duration, payments and ownership. No work starts without one.",
        "q3": "Do I own the code?",
        "a3": "Entirely, from the day we hand over. You get the repository, the documentation and the hosting details. If you decide to continue with another team, nothing stands in your way.",
        "q4": "Do you support the product after launch?",
        "a4": "Three months of support are included in the Growth package, covering fixes and small changes. After that there is an optional monthly maintenance package.",
        "q5": "Can you work with my existing technical team?",
        "a5": "Yes. We work alongside your team in the same repository, with code review and agreed standards, or we take a defined piece and hand it back ready to merge.",
        "q6": "How do payments work?",
        "a6": "In instalments tied to deliverables, not to time. The first on kick-off and the rest on each agreed handover. The details are written into the quote.",
    },
    "contact": {
        "title": "Start at one gateway",
        "sub": "Send us a short brief and we will come back the same working day with a time for a 20-minute call.",
        "name": "Name",
        "namePh": "Your full name",
        "phone": "WhatsApp or phone",
        "phonePh": "Phone number with country code",
        "email": "Email",
        "emailPh": "name@company.com",
        "service": "Service",
        "servicePick": "Choose a service",
        "details": "Short brief",
        "detailsOpt": "optional",
        "detailsPh": "What problem are you trying to solve?",
        "submit": "Send request",
        "sending": "Sending…",
        "or": "or",
        "whatsapp": "Message us on WhatsApp",
        "errName": "Please enter your name.",
        "errPhone": "Please enter a valid WhatsApp or phone number.",
        "errEmail": "Please enter a valid email address.",
        "errService": "Please choose a service.",
        "errForm": "Some fields need attention.",
        "errSend": "We could not send the request right now. Please message us on WhatsApp.",
        "okTitle": "We have your request",
        "okBody": "We will come back to you the same working day. If it is urgent, message us on WhatsApp now.",
        "okAgain": "Send another request",
    },
    "footer": {
        "about": "About Bawabtak",
        "aboutText": "A software company building the systems, apps and automations that take manual work off teams.",
        "services": "Services",
        "links": "Links",
        "contact": "Contact",
        "whatsapp": "WhatsApp",
        "email": "Email",
        "linkedin": "LinkedIn",
        "rights": "All rights reserved",
        "privacy": "Privacy policy",
    },
}

# ---------------------------------------------------------------- guardrails
DIACRITICS = set(range(0x064B, 0x0653)) | {0x0670, 0x0653, 0x0654, 0x0655}
BANNED_COLLOQUIAL = [
    "بتاع", "بيبقى", "عايز", "إزاي", "اللي", "مش ", "بنشتغل", "شغال",
    "دلوقتي", "كده", "بيرد", "علشان", "عشان", "بتتسأل", "احكيلي",
]


def flatten(d, prefix=""):
    for key, value in d.items():
        path = f"{prefix}{key}"
        if isinstance(value, dict):
            yield from flatten(value, path + ".")
        else:
            yield path, value


AR_FLAT = dict(flatten(AR))
EN_FLAT = dict(flatten(EN))

assert set(AR_FLAT) == set(EN_FLAT), (
    "key mismatch: " + str(set(AR_FLAT) ^ set(EN_FLAT))
)

problems = []
for key, value in AR_FLAT.items():
    for ch in value:
        if ord(ch) in DIACRITICS:
            problems.append(f"{key}: diacritic {unicodedata.name(ch, hex(ord(ch)))} in {value!r}")
            break
    for word in BANNED_COLLOQUIAL:
        if word in value:
            problems.append(f"{key}: colloquial {word!r} in {value!r}")
if problems:
    raise SystemExit("Arabic house style violations:\n  " + "\n  ".join(problems))

# ------------------------------------------------------------- emit js dict
def js_object(d, indent):
    pad = " " * indent
    lines = ["{"]
    for key, value in d.items():
        if isinstance(value, dict):
            lines.append(f"{pad}  {key}: {js_object(value, indent + 2)},")
        else:
            lines.append(f"{pad}  {key}: {json.dumps(value, ensure_ascii=False)},")
    lines.append(pad + "}")
    return "\n".join(lines)


block = (
    "export const dict = {\n"
    "  ar: " + js_object(AR, 2) + ",\n\n"
    "  en: " + js_object(EN, 2) + ",\n"
    "};"
)

p = "js/i18n.js"
src = io.open(p, encoding="utf-8").read()
start = src.index("export const dict = {")
end = src.index("\nconst root = document.documentElement;")
io.open(p, "w", encoding="utf-8").write(src[:start] + block + "\n" + src[end:])
print(f"js/i18n.js: {len(AR_FLAT)} keys per language")

# ------------------------------------------- refresh the html fallback text
p = "index.html"
html = io.open(p, encoding="utf-8").read()

missing = []


def swap_text(match):
    open_tag, body, close = match.group(1), match.group(2), match.group(3)
    key = match.group("key")
    if key not in AR_FLAT:
        missing.append(key)
        return match.group(0)
    return open_tag + AR_FLAT[key] + close


html, n_text = re.subn(
    r'(<[a-zA-Z0-9]+[^>]*\sdata-i18n="(?P<key>[^"]+)"[^>]*>)([^<]*)(</)',
    lambda m: m.group(1) + (AR_FLAT.get(m.group("key")) or missing.append(m.group("key")) or m.group(3)) + m.group(4),
    html,
)

n_attr = 0


def swap_attrs(match):
    global n_attr
    tag = match.group(0)
    pairs = re.search(r'data-i18n-attr="([^"]+)"', tag).group(1)
    for pair in pairs.split(";"):
        if ":" not in pair:
            continue
        attr, key = pair.split(":", 1)
        attr, key = attr.strip(), key.strip()
        if key not in AR_FLAT:
            missing.append(key)
            continue
        value = AR_FLAT[key].replace('"', "&quot;")
        new_tag, count = re.subn(rf'(\s{re.escape(attr)}=")[^"]*(")', rf'\g<1>{value}\g<2>', tag)
        if count:
            tag = new_tag
            n_attr += 1
    return tag


html = re.sub(r"<[a-zA-Z0-9]+[^>]*\sdata-i18n-attr=\"[^\"]+\"[^>]*>", swap_attrs, html)

if missing:
    raise SystemExit("keys used in markup but absent from the dictionary: " + ", ".join(sorted(set(missing))))

io.open(p, "w", encoding="utf-8").write(html)
print(f"index.html: {n_text} text nodes, {n_attr} attributes refreshed")
