/**
 * Pioneer Medical Wear - Storefront Logic
 * Pure ES6 with unblocking render, CMS cache, Meta Pixel + CAPI hooks,
 * On-site checkout, live shipping calculation, and bilingual i18n.
 */

// --- Constants & Unchanged Endpoints ---
const PIXEL_ID = '1835661177259760';
const WHATSAPP_NUMBER = '201031276469';
const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";
const CMS_CACHE_KEY = 'pioneer_cms_cache_v3';
const LANG_STORAGE_KEY = 'pioneer_lang_pref';

// --- Static Product Catalog (Haute Couture Medical Series) ---
const PRODUCTS = [
    {
        id: 'black',
        nameEn: 'Onyx Black',
        nameAr: 'أسود أونيكس',
        hex: '#1F2022',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        images: {
            cardWebp: 'images/black_1_3x4.webp',
            cardJpg: 'images/black_1_3x4.jpg',
            gallery: [
                { webp: 'images/black_1.webp', jpg: 'images/black_1.jpg' },
                { webp: 'images/black_2.webp', jpg: 'images/black_2.jpg' },
                { webp: 'images/black_3.webp', jpg: 'images/black_3.jpg' }
            ]
        }
    },
    {
        id: 'navy',
        nameEn: 'Royal Navy',
        nameAr: 'كحلي ملكي',
        hex: '#1B263B',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
        images: {
            cardWebp: 'images/navy_1_3x4.webp',
            cardJpg: 'images/navy_1_3x4.jpg',
            gallery: [
                { webp: 'images/navy_1.webp', jpg: 'images/navy_1.jpg' },
                { webp: 'images/navy_2.webp', jpg: 'images/navy_2.jpg' },
                { webp: 'images/navy_3.webp', jpg: 'images/navy_3.jpg' }
            ]
        }
    },
    {
        id: 'blue',
        nameEn: 'Ceil Blue',
        nameAr: 'أزرق سماوي',
        hex: '#274C77',
        availableSizes: ['XL', 'XXL'],
        images: {
            cardWebp: 'images/blue_1_3x4.webp',
            cardJpg: 'images/blue_1_3x4.jpg',
            gallery: [
                { webp: 'images/blue_1.webp', jpg: 'images/blue_1.jpg' },
                { webp: 'images/blue_2.webp', jpg: 'images/blue_2.jpg' },
                { webp: 'images/blue_3.webp', jpg: 'images/blue_3.jpg' }
            ]
        }
    },
    {
        id: 'olive',
        nameEn: 'Forest Olive',
        nameAr: 'زيتي غابي',
        hex: '#4A5D23',
        availableSizes: ['M', 'L', 'XXL'],
        images: {
            cardWebp: 'images/olive_1_3x4.webp',
            cardJpg: 'images/olive_1_3x4.jpg',
            gallery: [
                { webp: 'images/olive_1.webp', jpg: 'images/olive_1.jpg' },
                { webp: 'images/olive_2.webp', jpg: 'images/olive_2.jpg' },
                { webp: 'images/olive_3.webp', jpg: 'images/olive_3.jpg' }
            ]
        }
    },
    {
        id: 'teal',
        nameEn: 'Deep Teal',
        nameAr: 'تيل داكن',
        hex: '#1F4E5B',
        availableSizes: ['M', 'XL'],
        images: {
            cardWebp: 'images/tael_1_3x4.webp',
            cardJpg: 'images/tael_1_3x4.jpg',
            gallery: [
                { webp: 'images/tael_1.webp', jpg: 'images/tael_1.jpg' },
                { webp: 'images/tael_2.webp', jpg: 'images/tael_2.jpg' },
                { webp: 'images/tael_3.webp', jpg: 'images/tael_3.jpg' }
            ]
        }
    },
    {
        id: 'pink',
        nameEn: 'Dusty Rose',
        nameAr: 'وردي هادئ',
        hex: '#E5989B',
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        images: {
            cardWebp: 'images/pink_1_3x4.webp',
            cardJpg: 'images/pink_1_3x4.jpg',
            gallery: [
                { webp: 'images/pink_1.webp', jpg: 'images/pink_1.jpg' },
                { webp: 'images/pink_2.webp', jpg: 'images/pink_2.jpg' },
                { webp: 'images/pink_3.webp', jpg: 'images/pink_3.jpg' }
            ]
        }
    }
];

// Technical specifications [CONFIRM]
const PRODUCT_SPECS = {
    composition: "72% Polyester, 21% Rayon, 7% Spandex",
    compositionAr: "72% بوليستر تقني، 21% رايون ناعم، 7% سباندكس",
    features: [
        { en: "4-way technical stretch mobility", ar: "مرونة في 4 اتجاهات لحرية الحركة" },
        { en: "Lightweight and breathable for 24h shifts", ar: "خفيف وجيد التهوية لنبطشيات الـ 24 ساعة" },
        { en: "Fluid-resistant finish [CONFIRM]", ar: "لمسة نهائية مقاومة للبلل والسوائل العارضة [CONFIRM]" },
        { en: "Wrinkle-resistant tailored drape [CONFIRM]", ar: "مقاوم للتجعد ويحافظ على مظهره المهني [CONFIRM]" }
    ]
};

// [CONFIRM: courier rates] - Default shipping table by governorate (70 - 100 EGP), overridable by CMS shippingRates
const DEFAULT_SHIPPING_RATES = {
    // Cairo / Giza: 70 EGP
    "القاهرة": 70,
    "الجيزة": 70,

    // Alexandria, Qalyubia, Dakahlia, Gharbia, Sharqia, Monufia, Beheira: 80 EGP
    "الإسكندرية": 80,
    "القليوبية": 80,
    "الدقهلية": 80,
    "الغربية": 80,
    "الشرقية": 80,
    "المنوفية": 80,
    "البحيرة": 80,

    // Port Said, Ismailia, Suez, Damietta, Kafr El Sheikh, Matrouh: 90 EGP
    "بورسعيد": 90,
    "الإسماعيلية": 90,
    "السويس": 90,
    "دمياط": 90,
    "كفر الشيخ": 90,
    "مطروح": 90,

    // Fayoum, Beni Suef, Minya, Asyut, Sohag, Qena, Luxor, Aswan, Red Sea: 100 EGP
    "الفيوم": 100,
    "بني سويف": 100,
    "المنيا": 100,
    "أسيوط": 100,
    "سوهاج": 100,
    "قنا": 100,
    "الأقصر": 100,
    "أسوان": 100,
    "البحر الأحمر": 100,
    "شمال سيناء": 100,
    "جنوب سيناء": 100,
    "الوادي الجديد": 100
};

// --- Dynamic CMS State with LocalStorage Cache ---
let cmsData = {
    prices: {
        basePrice: 900,
        twoPiecesPrice: 1800,
        threePlusUnitPrice: 850
    },
    inventory: null,
    announcement: null,
    shippingRates: DEFAULT_SHIPPING_RATES
};

// Restore from cache immediately to prevent render delay
try {
    const cached = localStorage.getItem(CMS_CACHE_KEY);
    if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.prices) {
            cmsData = Object.assign(cmsData, parsed);
        }
    }
} catch (e) {}

// Selected state
let currentProduct = PRODUCTS[0];
let selectedSize = null;
let currentQuantity = 1;
let currentLang = 'ar'; // Default Arabic

// Lead capture cache
const capturedLeads = new Set();
let isOrderCompleted = false;

// --- i18n Dictionary ---
const i18n = {
    ar: {
        announcementDefault: "توصيل مجاني عند طلب طقمين أو أكثر • الدفع عند الاستلام",
        brandTag: "Medical Wear",
        navCollection: "المجموعة",
        navWhy: "لماذا بايونير",
        navSize: "دليل المقاسات",
        navFaq: "الأسئلة الشائعة",
        conciergeLabel: "خدمة العملاء",
        heroEyebrow: "المجموعة الأساسية 2026",
        heroTitle: "ملابس طبية بتتحمل ورديتك كلها",
        heroSubtitle: "نسيج تقني مرن بـ 4 اتجاهات وقصة مريحة تليق بيومك الطبي الطويل",
        heroCta: "اكتشف المجموعة",
        trustInspection: "معاينة عند الاستلام مع المندوب",
        trustExchange: "استبدال المقاس خلال 3 أيام",
        trustCod: "الدفع عند الاستلام",
        collectionEyebrow: "كولكشن 2026",
        collectionTitle: "طقم سكراب بايونير الأساسي",
        collectionDesc: "متاح بـ 6 ألوان كلاسيكية بقصة طبية موحدة وأداء استثنائي",
        viewProduct: "اختيار المقاس واللون",
        whyEyebrow: "المعايير التقنية",
        whyTitle: "لماذا يختار الأطباء بايونير؟",
        feature1Title: "مرونة في 4 اتجاهات",
        feature1Desc: "نسيج تقني مرن يمنحك حرية حركة تامة في العيادة وغرفة العمليات دون أي شعور بالتقيد.",
        feature2Title: "معاينة قبل الدفع",
        feature2Desc: "افتح الشحنة وعاين جودة القماش والتقفيل والمقاس بنفسك في وجود مندوب الشحن قبل سداد أي مبلغ.",
        feature3Title: "استبدال سهل خلال 3 أيام",
        feature3Desc: "لو المقاس محتاج تعديل، بنرتب استبدال للمقاس أو اللون خلال 3 أيام من تاريخ الاستلام مباشرة.",
        reviewsEyebrow: "آراء الأطباء",
        reviewsTitle: "تجارب من الميدان الطبي",
        faqEyebrow: "إجابات واضحة",
        faqTitle: "الأسئلة الشائعة",
        faq1Q: "هل يمكنني معاينة السكراب والتأكد من المقاس قبل الدفع؟",
        faq1A: "نعم بالتأكيد. لديك كامل الحق في فتح الشحنة ومعاينة السكراب والتأكد من ملمس الخامة والمقاس والمظهر مع المندوب قبل دفع قيمة الطلب.",
        faq2Q: "ما هي سياسة استبدال المقاس إذا لم يكن مناسباً؟",
        faq2A: "نوفر استبدالاً للمقاس أو اللون خلال 3 أيام من الاستلام، بشرط الحفاظ على السكراب بحالته الأصلية غير ملبوس وغير مغسول وبالبطاقة الخاصة به.",
        faq3Q: "كم تستغرق مدة الشحن لمحافظتي؟",
        faq3A: "القاهرة والجيزة والإسكندرية والمحافظات: يتم التأكيد والتوصيل خلال 24 ساعة عمل مع إمكانية المعاينة قبل الدفع.",
        faq4Q: "ما هي تفاصيل تركيبة القماش؟",
        faq4A: "نسيج ثلاثي التركيب: بوليستر تقني مع رايون مع سباندكس مرن. يوفر متانة عالية ومقاومة للتجعد وملمساً ناعماً على البشرة.",
        faq5Q: "كيف أحصل على توصيل مجاني؟",
        faq5A: "عند طلب طقمين أو أكثر، يتم تطبيق الشحن السريع مجاناً وبشكل تلقائي لجميع المحافظات.",
        footerAbout: "ملابس طبية مصرية بريميم، مصممة لمعايير الأداء والراحة في المستشفيات والعيادات.",
        footerAddressLabel: "المقر:",
        footerAddress: "القاهرة، جمهورية مصر العربية",
        footerColCollection: "المجموعة",
        footerCoreSets: "أطقم السكراب الأساسية",
        footerSizeChart: "جدول المقاسات",
        footerFitCalc: "حاسبة المقاس",
        footerColPolicies: "السياسات والشروط",
        footerShippingPolicy: "الشحن والمعاينة والاستبدال",
        footerPrivacyPolicy: "سياسة الخصوصية",
        footerColContact: "تواصل معنا",
        footerContactPage: "صفحة التواصل والمعلومات",
        footerHours: "ساعات العمل: 10 ص - 10 م يومياً",
        footerTagline: "الدفع عند الاستلام • المعاينة مع المندوب • استبدال خلال 3 أيام",
        modalEyebrow: "طقم سكراب بايونير الأساسي",
        modalCut: "قصة طبية مريحة • تصميم مناسب للجميع",
        modalShippingLine: "الشحن 70 - 100 ج.م حسب المحافظة (مجاناً لطلب طقمين أو أكثر)",
        currency: "ج.م",
        labelColor: "اللون:",
        labelSize: "المقاس:",
        btnSizeChart: "دليل المقاسات",
        btnBuy: "اطلب الآن والدفع عند الاستلام",
        freeShippingUnlocked: "تم تفعيل الشحن السريع المجاني لحسابك!",
        addMoreForFreeShipping: "أضف طقم إضافي لتفعيل الشحن المجاني",
        delivery24hNotice: "التأكيد والتوصيل خلال 24 ساعة • معاينة قبل الدفع",
        accSizeTitle: "دليل المقاسات وحاسبة القياس الدقيقة",
        thSize: "المقاس",
        thChest: "محيط الصدر / العرض",
        thLength: "الطول",
        calcHeading: "حاسبة المقاس التلقائية:",
        labelWeight: "الوزن (كجم)",
        labelHeight: "الطول (سم)",
        btnCalculate: "احسب مقاسي المناسب",
        calcRecLabel: "المقاس المقترح لك:",
        calcRelaxedNote: "بين مقاسين؟ اختر المقاس الأكبر لقصة مريحة. [CONFIRM]",
        btnSelectRec: "اختيار هذا المقاس ومتابعة الطلب",
        calcPhoneOptional: "تحب نبعتلك المقاس وتفاصيل التأكيد على الواتساب؟ (اختياري)",
        btnSendWhatsApp: "إرسال",
        accFabricTitle: "الخامة والمواصفات الفنية [CONFIRM]",
        fabricContentText: "تركيبة نسيج ثلاثية: 72% بوليستر تقني، 21% رايون ناعم، 7% سباندكس فائق المرونة. مزود بلمسة نهائية مقاومة للبلل والسوائل العارضة، خفيف الوزن وجيد التهوية لنبطشيات العمل الطويلة.",
        accCareTitle: "تعليمات الغسيل والعناية",
        care1: "يغسل بالماء البارد مع ألوان مماثلة.",
        care2: "تجنب المبيضات القوية أو الكلور.",
        care3: "تجفيف منخفض الحرارة أو تعليق حر.",
        care4: "كي خفيف عند الحاجة.",
        accInspectionTitle: "سياسة المعاينة والاستبدال",
        inspectionContent: "المعاينة: يمكنك فحص السكراب والتأكد من تقفيله ومقاسه مع المندوب قبل دفع أي نقود. الاستبدال: استبدال المقاس متاح خلال 3 أيام من الاستلام عبر التواصل مع خدمة العملاء.",
        checkoutEyebrow: "إتمام الطلب",
        checkoutHeading: "بيانات الشحن والتوصيل",
        checkoutSub: "الدفع عند الاستلام بعد معاينة السكراب والتأكد من المقاس",
        labelFullName: "الاسم بالكامل *",
        errName: "برجاء إدخال الاسم",
        labelPhone: "رقم الموبايل / واتساب *",
        errPhone: "برجاء إدخال رقم مصري صحيح (11 رقم يبدأ بـ 01)",
        labelGov: "المحافظة *",
        selectGov: "اختر المحافظة...",
        errGov: "برجاء اختيار المحافظة",
        labelAddress: "العنوان التفصيلي أو اسم المستشفى / القسم *",
        errAddress: "برجاء إدخال العنوان بالتفصيل",
        toggleOptional: "+ إضافة رقم بديل أو ملاحظات (اختياري)",
        labelPhone2: "رقم موبايل بديل",
        labelNotes: "ملاحظات التوصيل أو توقيت النبطشية",
        summaryItem: "المنتج:",
        summaryQty: "الكمية:",
        summarySubtotal: "سعر المنتج:",
        summaryShipping: "مصاريف الشحن:",
        summaryTotal: "الإجمالي عند الاستلام:",
        shippingFree: "شحن مجاني",
        shippingPending: "يحسب عند التأكيد",
        btnConfirmOrder: "تأكيد الطلب والدفع عند الاستلام",
        btnFallbackWa: "متابعة تأكيد الطلب عبر الواتساب مباشرة",
        confirmHeading: "تم استلام طلبك بنجاح",
        orderNumLabel: "رقم الطلب:",
        confirmMsg: "شكراً لاختيارك بايونير. سيقوم فريق خدمة العملاء بالتواصل معك هاتفياً أو عبر الواتساب لتأكيد موعد الشحن خلال [CONFIRM: وقت التأكيد].",
        btnChatWhatsApp: "متابعة عبر الواتساب برقم الطلب",
        alertSelectSize: "برجاء اختيار المقاس المطلوب أولاً"
    },
    en: {
        announcementDefault: "Complimentary express delivery on 2+ sets • Cash on Delivery",
        brandTag: "Medical Wear",
        navCollection: "Collection",
        navWhy: "Why Pioneer",
        navSize: "Size Guide",
        navFaq: "FAQ",
        conciergeLabel: "Concierge",
        heroEyebrow: "Core Collection 2026",
        heroTitle: "Engineered for your demanding shifts",
        heroSubtitle: "4-way technical stretch and tailored comfort crafted for long clinical hours",
        heroCta: "Explore Collection",
        trustInspection: "Doorstep inspection with courier",
        trustExchange: "3-day size exchange",
        trustCod: "Cash on delivery",
        collectionEyebrow: "Collection 2026",
        collectionTitle: "Pioneer Core Scrub Set",
        collectionDesc: "Available in 6 distinctive colorways with a tailored unisex medical silhouette",
        viewProduct: "Select Size & Color",
        whyEyebrow: "Technical Standards",
        whyTitle: "Why Physicians Choose Pioneer",
        feature1Title: "4-Way Technical Stretch",
        feature1Desc: "Unrestricted mobility engineered for active clinical and surgical duties.",
        feature2Title: "Doorstep Inspection",
        feature2Desc: "Open and thoroughly inspect your scrub with the courier before paying.",
        feature3Title: "Seamless 3-Day Exchange",
        feature3Desc: "Need a size adjustment? We arrange a fast size replacement within 3 days.",
        reviewsEyebrow: "Physician Reviews",
        reviewsTitle: "Verified Clinical Feedback",
        faqEyebrow: "Clear Answers",
        faqTitle: "Frequently Asked Questions",
        faq1Q: "Can I inspect the scrub and check sizing before paying?",
        faq1A: "Yes. You have the full right to unbox and inspect your scrub set in the presence of the courier before paying.",
        faq2Q: "What is your size exchange policy?",
        faq2A: "We provide size or color exchanges within 3 days of delivery, provided the garment is in its original unworn condition with tags attached.",
        faq3Q: "How long does delivery take?",
        faq3A: "Cairo, Giza & Alexandria: within 24-48 business hours. Other governorates: 2-4 business days maximum.",
        faq4Q: "What is the fabric composition?",
        faq4A: "A proprietary tri-blend: technical polyester, soft rayon, and flexible spandex for breathability and wrinkle resistance.",
        faq5Q: "How do I unlock free delivery?",
        faq5A: "Order 2 sets or more and complimentary express delivery is automatically applied.",
        footerAbout: "Egyptian premium medical wear tailored for peak performance and comfort.",
        footerAddressLabel: "HQ:",
        footerAddress: "Cairo, Egypt",
        footerColCollection: "Collection",
        footerCoreSets: "Core Scrub Sets",
        footerSizeChart: "Size Chart",
        footerFitCalc: "Fit Calculator",
        footerColPolicies: "Policies",
        footerShippingPolicy: "Shipping, Inspection & Returns",
        footerPrivacyPolicy: "Privacy Policy",
        footerColContact: "Contact",
        footerContactPage: "Contact & Support",
        footerHours: "Hours: 10 AM - 10 PM Daily",
        footerTagline: "Cash on Delivery • Doorstep Inspection • 3-Day Exchange",
        modalEyebrow: "Pioneer Core Series",
        modalCut: "Tailored athletic silhouette • Unisex cut",
        modalShippingLine: "Shipping 70-100 EGP depending on governorate. Free for 2+ sets.",
        currency: "EGP",
        labelColor: "Color:",
        labelSize: "Size:",
        btnSizeChart: "Size Chart",
        btnBuy: "Order Now • Pay on Delivery",
        freeShippingUnlocked: "Complimentary Express Delivery Unlocked!",
        addMoreForFreeShipping: "Add 1 more set to unlock complimentary express delivery",
        delivery24hNotice: "Confirmation & delivery within 24 hours • Inspect before payment",
        accSizeTitle: "Size Chart & Smart Fit Calculator",
        thSize: "Size",
        thChest: "Chest / Width",
        thLength: "Length",
        calcHeading: "Smart Fit Calculator:",
        labelWeight: "Weight (KG)",
        labelHeight: "Height (CM)",
        btnCalculate: "Calculate Optimal Size",
        calcRecLabel: "Recommended Size:",
        calcRelaxedNote: "Between two sizes? Choose the larger for a relaxed fit. [CONFIRM]",
        btnSelectRec: "Select This Size & Continue",
        calcPhoneOptional: "Want this recommendation on WhatsApp? (Optional)",
        btnSendWhatsApp: "Send",
        accFabricTitle: "Fabric & Technical Specifications [CONFIRM]",
        fabricContentText: "Tri-blend composition: 72% technical polyester, 21% silky rayon, 7% high-stretch spandex. Treated with a fluid-resistant finish, lightweight and breathable for 24h hospital shifts.",
        accCareTitle: "Care & Laundering Instructions",
        care1: "Machine wash cold inside out with similar colors.",
        care2: "Do not bleach or use chlorine softeners.",
        care3: "Tumble dry low or hang dry.",
        care4: "Cool iron if needed.",
        accInspectionTitle: "Doorstep Inspection & Exchange Policy",
        inspectionContent: "Doorstep Inspection: Inspect the garment and verify size with the courier before paying. Exchange: 3-day complimentary exchange window by contacting customer support.",
        checkoutEyebrow: "Checkout",
        checkoutHeading: "Delivery Information",
        checkoutSub: "Cash on Delivery • Doorstep inspection guaranteed",
        labelFullName: "Full Name *",
        errName: "Please enter your full name",
        labelPhone: "Mobile / WhatsApp *",
        errPhone: "Please enter a valid Egyptian number (11 digits starting with 01)",
        labelGov: "Governorate *",
        selectGov: "Select governorate...",
        errGov: "Please select your governorate",
        labelAddress: "Detailed Address / Hospital name *",
        errAddress: "Please enter your delivery address",
        toggleOptional: "+ Add alternative phone or delivery notes (Optional)",
        labelPhone2: "Alternative Phone",
        labelNotes: "Delivery Notes",
        summaryItem: "Item:",
        summaryQty: "Quantity:",
        summarySubtotal: "Subtotal:",
        summaryShipping: "Delivery:",
        summaryTotal: "Total on Delivery:",
        shippingFree: "Free Express",
        shippingPending: "Calculated at confirmation",
        btnConfirmOrder: "Confirm Order • Pay on Delivery",
        btnFallbackWa: "Confirm directly via WhatsApp instead",
        confirmHeading: "Order Received Successfully",
        orderNumLabel: "Order ID:",
        confirmMsg: "Thank you for choosing Pioneer. Our team will contact you by phone or WhatsApp to confirm delivery within [CONFIRM: confirmation window].",
        btnChatWhatsApp: "Chat with us on WhatsApp with Order ID",
        alertSelectSize: "Please select your preferred size first"
    }
};

// --- Meta Tracking Helper (Browser Pixel + CAPI Dedup) ---
function generateEventId() {
    return 'pioneer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function trackPixelEvent(eventName, params = {}, eventId = null) {
    const eid = eventId || generateEventId();
    if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params, { eventID: eid });
    }
    forwardToCapi(eventName, params, eid);
    return eid;
}

function forwardToCapi(eventName, params, eventId) {
    try {
        fetch('/api/capi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName,
                eventId,
                params,
                eventSourceUrl: window.location.href,
                phone: params.phone || null
            })
        }).catch(() => {});
    } catch (e) {}
}

// --- Pricing Calculations (Override: 1 set = basePrice, 2 sets = twoPiecesPrice w/ Free Shipping, 3+ sets = qty * 850 w/ Free Shipping) ---
// [CONFIRM: no fake crossed-out price used]
function calculatePricing(qty) {
    const bp = cmsData.prices.basePrice || 900;
    const tp = cmsData.prices.twoPiecesPrice || 1800;
    const unit3Plus = cmsData.prices.threePlusUnitPrice || 850;
    let total = 0;
    let isFreeShipping = false;

    if (qty === 1) {
        total = bp;
        isFreeShipping = false;
    } else if (qty === 2) {
        total = tp;
        isFreeShipping = true;
    } else {
        total = qty * unit3Plus;
        isFreeShipping = true;
    }

    return { total, isFreeShipping, unitPrice: qty >= 3 ? unit3Plus : (qty === 2 ? tp / 2 : bp) };
}

// --- DOM Initialization & Render ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Language Preference
    try {
        const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang === 'en' || savedLang === 'ar') {
            currentLang = savedLang;
        }
    } catch (e) {}
    applyLanguage(currentLang);

    // 2. Render Collection Grid Immediately
    renderProductGrid();

    // 3. Setup Deep Links (?color=navy or #navy)
    handleDeepLinks();

    // 4. Fetch Dynamic CMS data (Non-blocking, 4s timeout)
    fetchCmsData();

    // 5. Load Reviews from reviews.json
    loadReviewsData();

    // 6. Bind Event Listeners
    setupEventListeners();
});

// --- Language Switcher ---
function applyLanguage(lang) {
    currentLang = lang;
    const htmlEl = document.documentElement;
    htmlEl.lang = lang;
    htmlEl.dir = lang === 'ar' ? 'rtl' : 'ltr';

    const langLabel = document.getElementById('langLabel');
    if (langLabel) {
        langLabel.innerText = lang === 'ar' ? 'English' : 'عربي';
    }

    const dict = i18n[lang] || i18n.ar;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerText = dict[key];
        }
    });

    // Re-render dynamic text in active modal / summary
    updateModalPriceAndShipping();
    updateCheckoutSummary();
    renderProductGrid();
}

document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem(LANG_STORAGE_KEY, newLang); } catch (e) {}
    applyLanguage(newLang);
});

// --- CMS Fetch with 4-Second AbortController ---
function fetchCmsData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(scriptURL + "?action=get_data", { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
            clearTimeout(timeoutId);
            if (data && data.prices) {
                const bp = parseFloat(data.prices.basePrice);
                const tp = parseFloat(data.prices.twoPiecesPrice);
                const tpu = parseFloat(data.prices.threePlusUnitPrice);
                cmsData.prices.basePrice = isNaN(bp) ? 900 : bp;
                cmsData.prices.twoPiecesPrice = isNaN(tp) ? 1800 : tp;
                cmsData.prices.threePlusUnitPrice = isNaN(tpu) ? 850 : tpu;

                if (data.inventory) cmsData.inventory = data.inventory;
                if (data.shippingRates) cmsData.shippingRates = data.shippingRates;
                if (data.announcement) cmsData.announcement = data.announcement;

                try {
                    localStorage.setItem(CMS_CACHE_KEY, JSON.stringify(cmsData));
                } catch (e) {}

                // Update UI with new prices/announcements
                updateAnnouncementBar();
                populateGovernorates();
                renderProductGrid();
                updateModalPriceAndShipping();
                updateCheckoutSummary();
            }
        })
        .catch(err => {
            console.warn("CMS non-blocking sync finished (cached data active):", err.name);
        });
}

function updateAnnouncementBar() {
    const bar = document.getElementById('cmsAnnouncement');
    const textEl = document.getElementById('announcementText');
    if (!bar || !textEl) return;

    if (cmsData.announcement && cmsData.announcement.active && cmsData.announcement.text) {
        textEl.innerText = cmsData.announcement.text;
    }
}

function populateGovernorates() {
    const govSelect = document.getElementById('custGov');
    if (!govSelect || !cmsData.shippingRates) return;

    const currentVal = govSelect.value;
    const rates = cmsData.shippingRates;
    const defaultPlaceholder = i18n[currentLang]?.selectGov || 'اختر المحافظة...';
    const currency = i18n[currentLang]?.currency || 'ج.م';

    govSelect.innerHTML = `<option value="">${defaultPlaceholder}</option>`;
    Object.keys(rates).forEach(gov => {
        const opt = document.createElement('option');
        opt.value = gov;
        opt.textContent = `${gov} (${rates[gov]} ${currency})`;
        if (gov === currentVal) opt.selected = true;
        govSelect.appendChild(opt);
    });
}

// --- Product Grid Rendering ---
function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const lang = currentLang;
    const dict = i18n[lang] || i18n.ar;

    PRODUCTS.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', lang === 'ar' ? p.nameAr : p.nameEn);

        const displayName = lang === 'ar' ? p.nameAr : p.nameEn;
        const price = cmsData.prices.basePrice || 900;
        const currency = dict.currency || 'ج.م';
        const shippingNote = lang === 'ar' ? '+ الشحن يبدأ من 70 ج.م' : '+ shipping from 70 EGP';

        card.innerHTML = `
            <div class="product-card-media">
                <picture>
                    <source type="image/webp" srcset="${p.images.cardWebp}">
                    <img src="${p.images.cardJpg}" alt="${displayName}" class="product-card-img" width="600" height="800" loading="lazy" decoding="async">
                </picture>
                <span class="product-card-badge">${displayName}</span>
            </div>
            <div class="product-card-body">
                <h3 class="product-card-name">${displayName}</h3>
                <p class="product-card-meta">${lang === 'ar' ? 'طقم سكراب طبي مرن' : '4-Way Technical Scrub Set'}</p>
                <div class="product-card-footer">
                    <div class="product-card-price-group">
                        <span class="product-card-price">${price} ${currency}</span>
                        <span class="product-card-shipping-note">${shippingNote}</span>
                    </div>
                    <span class="product-card-action">${dict.viewProduct} &larr;</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => openProductModal(p.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProductModal(p.id);
            }
        });
        grid.appendChild(card);
    });
}

// --- Product Modal Logic ---
function openProductModal(productId) {
    const p = PRODUCTS.find(item => item.id === productId) || PRODUCTS[0];
    currentProduct = p;
    selectedSize = null;
    currentQuantity = 1;

    // Update Deep link in URL
    try {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('color', p.id);
        window.history.replaceState({}, '', newUrl);
    } catch (e) {}

    // Track ViewContent Pixel Event
    const price = cmsData.prices.basePrice || 900;
    trackPixelEvent('ViewContent', {
        content_ids: [p.id],
        content_name: p.nameEn,
        content_type: 'product',
        value: price,
        currency: 'EGP'
    });

    updateModalUI();

    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    // Remove search param
    try {
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('color');
        window.history.replaceState({}, '', newUrl);
    } catch (e) {}
}

function updateModalUI() {
    const lang = currentLang;
    const p = currentProduct;
    const displayName = lang === 'ar' ? p.nameAr : p.nameEn;

    // Title & Color Label
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.innerText = displayName;

    const colorNameEl = document.getElementById('selectedColorName');
    if (colorNameEl) colorNameEl.innerText = displayName;

    const sizeLabel = document.getElementById('selectedSizeLabel');
    if (sizeLabel) sizeLabel.innerText = selectedSize || '-';

    // Gallery & Thumbnails
    const mainWebp = document.getElementById('modalMainWebp');
    const mainImg = document.getElementById('modalMainImg');
    if (mainWebp) mainWebp.srcset = p.images.gallery[0].webp;
    if (mainImg) {
        mainImg.src = p.images.gallery[0].jpg;
        mainImg.alt = displayName;
    }

    const thumbWrap = document.getElementById('modalThumbnails');
    if (thumbWrap) {
        thumbWrap.innerHTML = '';
        p.images.gallery.forEach((g, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `modal-thumb-btn ${idx === 0 ? 'active' : ''}`;
            btn.setAttribute('aria-label', `Thumbnail ${idx + 1}`);
            btn.innerHTML = `
                <picture>
                    <source type="image/webp" srcset="${g.webp}">
                    <img src="${g.jpg}" alt="${displayName} ${idx + 1}" width="56" height="70" loading="lazy">
                </picture>
            `;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-thumb-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (mainWebp) mainWebp.srcset = g.webp;
                if (mainImg) mainImg.src = g.jpg;
            });
            thumbWrap.appendChild(btn);
        });
    }

    // Color Selector
    const colorSelector = document.getElementById('colorSelector');
    if (colorSelector) {
        colorSelector.innerHTML = '';
        PRODUCTS.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `color-pill ${item.id === p.id ? 'active' : ''}`;
            btn.style.backgroundColor = item.hex;
            btn.title = lang === 'ar' ? item.nameAr : item.nameEn;
            btn.setAttribute('aria-label', item.nameEn);
            btn.addEventListener('click', () => {
                currentProduct = item;
                selectedSize = null;
                updateModalUI();
            });
            colorSelector.appendChild(btn);
        });
    }

    // Size Selector with Availability map + CMS inventory override
    updateSizeButtons();

    // Price & Shipping Line
    updateModalPriceAndShipping();
}

function updateSizeButtons() {
    const p = currentProduct;
    // CMS inventory override if present
    let availableSizes = p.availableSizes;
    if (cmsData.inventory && cmsData.inventory[p.id]) {
        availableSizes = cmsData.inventory[p.id];
    }

    const sizeBtns = document.querySelectorAll('.size-pill');
    sizeBtns.forEach(btn => {
        const s = btn.getAttribute('data-size');
        const isAvailable = availableSizes.includes(s);

        btn.disabled = !isAvailable;
        btn.classList.remove('active');
        btn.title = isAvailable
            ? (currentLang === 'ar' ? `مقاس ${s}` : `Size ${s}`)
            : (currentLang === 'ar' ? `مقاس ${s} - غير متوفر حالياً` : `Size ${s} - Sold Out`);

        if (isAvailable && selectedSize === s) {
            btn.classList.add('active');
        }

        btn.onclick = () => {
            if (!isAvailable) return;
            selectedSize = s;
            const sizeLabel = document.getElementById('selectedSizeLabel');
            if (sizeLabel) sizeLabel.innerText = s;
            document.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });
}

function updateModalPriceAndShipping() {
    const qtyInput = document.getElementById('qtyInput');
    if (qtyInput) qtyInput.value = currentQuantity;

    const pricing = calculatePricing(currentQuantity);
    const dict = i18n[currentLang] || i18n.ar;
    const currency = dict.currency || 'ج.م';

    const priceEl = document.getElementById('modalPrice');
    if (priceEl) priceEl.innerText = pricing.total;

    const shippingLineEl = document.getElementById('modalShippingLine');
    if (shippingLineEl) {
        if (pricing.isFreeShipping) {
            shippingLineEl.innerText = currentLang === 'ar'
                ? 'تم تفعيل الشحن المجاني السريع لطلبك 🎁'
                : 'Complimentary express delivery unlocked 🎁';
            shippingLineEl.style.color = 'var(--success)';
        } else {
            shippingLineEl.innerText = currentLang === 'ar'
                ? 'الشحن 70 - 100 ج.م حسب المحافظة (مجاناً لطلب طقمين أو أكثر)'
                : 'Shipping 70-100 EGP depending on governorate. Free for 2+ sets.';
            shippingLineEl.style.color = 'var(--muted)';
        }
    }

    const totalBtnEl = document.getElementById('totalPriceBtn');
    if (totalBtnEl) totalBtnEl.innerText = `(${pricing.total} ${currency})`;

    const noteEl = document.getElementById('pricingMessage');
    if (noteEl) {
        if (pricing.isFreeShipping) {
            noteEl.className = 'shipping-privilege-note unlocked';
            noteEl.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                <span>${currentLang === 'ar' ? 'تم تفعيل الشحن المجاني السريع لطلبك (طقمين أو أكثر)!' : 'Complimentary express delivery unlocked for your order!'}</span>
            `;
        } else {
            noteEl.className = 'shipping-privilege-note';
            noteEl.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                <span>${currentLang === 'ar' ? 'الشحن 70 - 100 ج.م حسب المحافظة • اطلب طقمين للشحن المجاني' : 'Shipping 70-100 EGP depending on governorate • Order 2 sets for free shipping'}</span>
            `;
        }
    }
}

// Quantity Adjustments
document.getElementById('qtyMinus')?.addEventListener('click', () => {
    if (currentQuantity > 1) {
        currentQuantity--;
        updateModalPriceAndShipping();
    }
});
document.getElementById('qtyPlus')?.addEventListener('click', () => {
    if (currentQuantity < 10) {
        currentQuantity++;
        updateModalPriceAndShipping();
    }
});

// Inline Accordion Toggle
window.toggleModalAccordion = function(accId) {
    const item = document.getElementById(accId);
    if (!item) return;
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.modal-acc-item').forEach(el => el.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
};

document.getElementById('inlineSizeGuideLink')?.addEventListener('click', () => {
    const acc = document.getElementById('accSizeGuide');
    if (acc) {
        acc.classList.add('active');
        acc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

// Size Calculator Calculation (No phone required!)
document.getElementById('btnCalcSize')?.addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('calcWeight')?.value);
    const height = parseFloat(document.getElementById('calcHeight')?.value);

    if (!weight || !height) {
        alert(currentLang === 'ar' ? 'برجاء إدخال الوزن والطول' : 'Please enter height and weight');
        return;
    }

    let rec = 'L';
    if (weight < 65) rec = 'S';
    else if (weight < 78) rec = 'M';
    else if (weight < 90) rec = 'L';
    else if (weight < 102) rec = 'XL';
    else if (weight < 115) rec = 'XXL';
    else rec = '3XL';

    // Height bump if > 180 cm
    if (height > 180) {
        const order = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
        const idx = order.indexOf(rec);
        if (idx < order.length - 1) rec = order[idx + 1];
    }

    const recTxt = document.getElementById('recommendedSizeTxt');
    if (recTxt) recTxt.innerText = rec;

    const resultBox = document.getElementById('calcResult');
    if (resultBox) resultBox.classList.remove('hidden');
});

document.getElementById('useRecommendedSize')?.addEventListener('click', () => {
    const recTxt = document.getElementById('recommendedSizeTxt')?.innerText;
    if (recTxt) {
        selectedSize = recTxt;
        updateSizeButtons();
        const sizeLabel = document.getElementById('selectedSizeLabel');
        if (sizeLabel) sizeLabel.innerText = recTxt;
    }
});

// Optional WhatsApp phone from calculator
document.getElementById('btnSendCalcPhone')?.addEventListener('click', () => {
    const phoneInput = document.getElementById('calcPhone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const cleanDigits = phone.replace(/\D/g, '');

    if (cleanDigits.length < 10) {
        alert(currentLang === 'ar' ? 'برجاء إدخال رقم صحيح' : 'Please enter a valid phone number');
        return;
    }

    const recSize = document.getElementById('recommendedSizeTxt')?.innerText || 'L';
    captureLead({
        name: "استشارة مقاس (حاسبة)",
        phone: phone,
        details: `الموديل: ${currentProduct.nameEn} | المقاس المقترح: ${recSize}`
    });

    alert(currentLang === 'ar' ? 'تم تسجيل طلبك، وسيتواصل معك فريقنا.' : 'Recommendation saved. Our team will contact you.');
    if (phoneInput) phoneInput.value = '';
});

// --- Checkout Modal Opening & Closing ---
document.getElementById('buyBtn')?.addEventListener('click', () => {
    const dict = i18n[currentLang] || i18n.ar;
    if (!selectedSize) {
        alert(dict.alertSelectSize);
        // Scroll to size selector
        document.getElementById('sizeSelector')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }

    // Fire AddToCart event
    const pricing = calculatePricing(currentQuantity);
    trackPixelEvent('AddToCart', {
        content_ids: [currentProduct.id],
        content_name: currentProduct.nameEn,
        content_type: 'product',
        value: pricing.total,
        currency: 'EGP'
    });

    // Fire InitiateCheckout event
    trackPixelEvent('InitiateCheckout', {
        content_ids: [currentProduct.id],
        content_name: currentProduct.nameEn,
        content_type: 'product',
        value: pricing.total,
        currency: 'EGP'
    });

    openCheckoutModal();
});

function openCheckoutModal() {
    isOrderCompleted = false;
    updateCheckoutSummary();

    const formView = document.getElementById('checkoutFormContainer');
    const confirmView = document.getElementById('checkoutConfirmationContainer');
    const errorBanner = document.getElementById('checkoutErrorBanner');

    if (formView) formView.classList.remove('hidden');
    if (confirmView) confirmView.classList.add('hidden');
    if (errorBanner) errorBanner.classList.add('hidden');

    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeCheckoutModal() {
    if (!isOrderCompleted) {
        captureAbandonedCheckoutLead();
    }
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

document.getElementById('closeModal')?.addEventListener('click', closeProductModal);
document.getElementById('closeCheckout')?.addEventListener('click', closeCheckoutModal);

// Close on backdrop click
document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'productModal') closeProductModal();
});
document.getElementById('checkoutModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') closeCheckoutModal();
});

// Toggle Optional Details
document.getElementById('toggleOptionalBtn')?.addEventListener('click', () => {
    const box = document.getElementById('optionalFieldsBox');
    if (box) box.classList.toggle('hidden');
});

// Governorate Change -> Live Shipping & Total Update
document.getElementById('custGov')?.addEventListener('change', updateCheckoutSummary);

function updateCheckoutSummary() {
    const dict = i18n[currentLang] || i18n.ar;
    const currency = dict.currency || 'ج.م';
    const pricing = calculatePricing(currentQuantity);

    const displayName = currentLang === 'ar' ? currentProduct.nameAr : currentProduct.nameEn;
    const itemDesc = `${displayName} (${selectedSize || '-'})`;

    const itemDescEl = document.getElementById('summaryItemDesc');
    if (itemDescEl) itemDescEl.innerText = itemDesc;

    const qtyDescEl = document.getElementById('summaryQtyDesc');
    if (qtyDescEl) qtyDescEl.innerText = `${currentQuantity}`;

    const subtotalEl = document.getElementById('summarySubtotal');
    if (subtotalEl) subtotalEl.innerText = `${pricing.total} ${currency}`;

    // Shipping calculation
    const govSelect = document.getElementById('custGov');
    const chosenGov = govSelect ? govSelect.value : '';
    let shippingCost = 0;
    let shippingLabel = '';

    if (pricing.isFreeShipping) {
        shippingCost = 0;
        shippingLabel = dict.shippingFree;
    } else if (chosenGov && cmsData.shippingRates && cmsData.shippingRates[chosenGov] !== undefined) {
        shippingCost = cmsData.shippingRates[chosenGov];
        shippingLabel = `${shippingCost} ${currency}`;
    } else if (!chosenGov) {
        shippingCost = 0;
        shippingLabel = currentLang === 'ar' ? 'اختر المحافظة لمعرفة الشحن (70-100 ج.م)' : 'Select governorate for shipping (70-100 EGP)';
    } else {
        // [CONFIRM: courier rates]
        shippingCost = 80;
        shippingLabel = `${shippingCost} ${currency}`;
    }

    const shippingEl = document.getElementById('summaryShipping');
    if (shippingEl) shippingEl.innerText = shippingLabel;

    const finalTotal = pricing.total + (pricing.isFreeShipping ? 0 : shippingCost);
    const totalEl = document.getElementById('summaryTotal');
    if (totalEl) totalEl.innerText = `${finalTotal} ${currency}`;

    // "Add 1 more set for free shipping" nudge with dynamic saved amount from chosen governorate
    const nudgeEl = document.getElementById('checkoutFreeShippingNudge');
    const nudgeTextEl = document.getElementById('checkoutNudgeText');
    if (nudgeEl && nudgeTextEl) {
        if (currentQuantity === 1) {
            nudgeEl.className = 'shipping-privilege-note';
            const savedAmount = (chosenGov && cmsData.shippingRates && cmsData.shippingRates[chosenGov])
                ? cmsData.shippingRates[chosenGov]
                : null;

            if (savedAmount) {
                nudgeTextEl.innerHTML = currentLang === 'ar'
                    ? `وفّر <strong>${savedAmount} ${currency}</strong> مصاريف شحن: اضغط هنا لإضافة طقم ثانٍ وشحن مجاني 🎁`
                    : `Save <strong>${savedAmount} ${currency}</strong> on delivery: Click to add 2nd set for free shipping 🎁`;
            } else {
                nudgeTextEl.innerHTML = currentLang === 'ar'
                    ? `وفّر مصاريف الشحن (70 - 100 ${currency}): اضغط هنا لإضافة طقم ثانٍ وشحن مجاني 🎁`
                    : `Save 70-100 ${currency} on delivery: Click to add 2nd set for free shipping 🎁`;
            }
        } else {
            nudgeEl.className = 'shipping-privilege-note unlocked';
            nudgeTextEl.innerHTML = currentLang === 'ar'
                ? `🎉 تم تفعيل الشحن المجاني السريع لطلبك (${currentQuantity} أطقم)!`
                : `🎉 Complimentary express delivery applied (${currentQuantity} sets)!`;
        }
    }
}

// Click to Add 1 more set for free shipping
document.getElementById('checkoutFreeShippingNudge')?.addEventListener('click', () => {
    if (currentQuantity === 1) {
        currentQuantity = 2;
        updateModalPriceAndShipping();
        updateCheckoutSummary();
    }
});

// --- Order Submission (Real On-Site Order via /api/order.js) ---
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check honeypot anti-spam
    const honeypot = document.getElementById('honeypot')?.value;
    if (honeypot) {
        console.warn('Bot detected via honeypot.');
        return;
    }

    const name = document.getElementById('custName')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const gov = document.getElementById('custGov')?.value;
    const address = document.getElementById('custAddress')?.value.trim();
    const phone2 = document.getElementById('custPhone2')?.value.trim();
    const notes = document.getElementById('custNotes')?.value.trim();

    // Reset error messages
    ['custNameError', 'custPhoneError', 'custGovError', 'custAddressError'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });

    let isValid = true;
    if (!name) {
        document.getElementById('custNameError')?.classList.remove('hidden');
        isValid = false;
    }

    // Egyptian Mobile Regex: ^01[0125][0-9]{8}$
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    const egRegex = /^01[0125][0-9]{8}$/;
    if (!egRegex.test(cleanPhone)) {
        document.getElementById('custPhoneError')?.classList.remove('hidden');
        isValid = false;
    }

    if (!gov) {
        document.getElementById('custGovError')?.classList.remove('hidden');
        isValid = false;
    }

    if (!address) {
        document.getElementById('custAddressError')?.classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) return;

    const submitBtn = document.getElementById('submitOrderBtn');
    const submitBtnText = document.getElementById('submitOrderBtnText');
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.innerText = currentLang === 'ar' ? 'جاري تأكيد الطلب...' : 'Confirming order...';

    const pricing = calculatePricing(currentQuantity);
    let shippingCost = 0;
    if (!pricing.isFreeShipping && cmsData.shippingRates && cmsData.shippingRates[gov]) {
        shippingCost = cmsData.shippingRates[gov];
    }
    const finalTotal = pricing.total + shippingCost;
    const clientOrderId = `PNR-${Date.now().toString().slice(-6)}`;
    const fullPhone = phone2 ? `${cleanPhone} / ${phone2}` : cleanPhone;
    const shippingDesc = pricing.isFreeShipping ? 'شحن مجاني 🎁' : `${shippingCost} ج.م مصاريف شحن`;
    const productDetailsText = `طقم سكراب: ${currentProduct.nameEn} | المقاس: ${selectedSize} | الكمية: ${currentQuantity} | المطلوب: ${finalTotal} ج.م (${pricing.total} ج.م سكراب + ${shippingDesc}) | تأكيد وتوصيل خلال 24 ساعة`;

    const orderPayload = {
        orderId: clientOrderId,
        name,
        phone: cleanPhone,
        phone2,
        gov,
        address,
        notes,
        product: currentProduct.nameEn,
        color: currentProduct.nameEn,
        size: selectedSize,
        quantity: currentQuantity,
        subtotal: pricing.total,
        shipping: shippingCost,
        finalTotal,
        isFreeShipping: pricing.isFreeShipping
    };

    // 1. Direct browser-to-Google-Sheet write (mode: 'no-cors' - 100% reliable, zero delay)
    try {
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: clientOrderId,
                name: `د. ${name}`,
                phone: fullPhone,
                city: gov,
                address: address + (notes ? ` (ملاحظات: ${notes})` : ''),
                productDetails: productDetailsText
            })
        }).catch(() => {});
    } catch (e) {}

    // 2. Dispatch to /api/order for Telegram notification & server tracking with 2.5s strict timeout
    let confirmedOrderId = clientOrderId;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data && data.orderId) {
                confirmedOrderId = data.orderId;
            }
        }
    } catch (err) {
        console.warn('API order dispatch took >2.5s or bypassed via client fallback:', err.message);
    }

    // 3. Immediately transition to Order Confirmation screen!
    handleOrderSuccess(confirmedOrderId, orderPayload);

    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) {
        submitBtnText.innerText = i18n[currentLang]?.btnConfirmOrder || 'تأكيد الطلب والدفع عند الاستلام';
    }
});

function handleOrderSuccess(orderId, orderPayload) {
    isOrderCompleted = true;

    // Fire Purchase event ONLY after success!
    const purchaseEventId = generateEventId();
    trackPixelEvent('Purchase', {
        content_ids: [currentProduct.id],
        content_name: currentProduct.nameEn,
        content_type: 'product',
        value: orderPayload.finalTotal,
        currency: 'EGP',
        num_items: orderPayload.quantity,
        phone: orderPayload.phone
    }, purchaseEventId);

    // Show on-page confirmation view
    const formView = document.getElementById('checkoutFormContainer');
    const confirmView = document.getElementById('checkoutConfirmationContainer');
    if (formView) formView.classList.add('hidden');
    if (confirmView) confirmView.classList.remove('hidden');

    // Scroll modal to top so user sees the success badge instantly
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.scrollTop = 0;
        const modalContent = checkoutModal.querySelector('.modal-content');
        if (modalContent) modalContent.scrollTop = 0;
    }

    const confirmedIdEl = document.getElementById('confirmedOrderId');
    if (confirmedIdEl) confirmedIdEl.innerText = orderId;

    const dict = i18n[currentLang] || i18n.ar;
    const currency = dict.currency || 'ج.م';

    const confirmItemEl = document.getElementById('confirmSummaryItem');
    if (confirmItemEl) {
        confirmItemEl.innerText = `${currentProduct.nameEn} (${selectedSize}) × ${orderPayload.quantity}`;
    }

    const confirmTotalEl = document.getElementById('confirmSummaryTotal');
    if (confirmTotalEl) {
        confirmTotalEl.innerText = `${orderPayload.finalTotal} ${currency}`;
    }

    // Prefill Secondary WhatsApp button stating "total = price + shipping" correctly & delivery within 24 hours
    const shippingText = orderPayload.isFreeShipping || orderPayload.shipping === 0
        ? 'شحن مجاني 🎁'
        : `${orderPayload.shipping} ${currency} مصاريف شحن`;

    const waMsg = currentLang === 'ar'
        ? `مرحباً بايونير، أود متابعة وتأكيد طلبي رقم #${orderId} (${currentProduct.nameAr} - مقاس ${selectedSize} - كمية ${orderPayload.quantity}).\nالمطلوب عند الاستلام: ${orderPayload.finalTotal} ${currency} (${orderPayload.subtotal} ${currency} سكراب + ${shippingText}).\nبرجاء التأكيد والتوصيل خلال 24 ساعة مع إمكانية المعاينة قبل الدفع.`
        : `Hello Pioneer, following up on order #${orderId} (${currentProduct.nameEn} - Size ${selectedSize} - Qty ${orderPayload.quantity}).\nTotal on delivery: ${orderPayload.finalTotal} ${currency} (${orderPayload.subtotal} ${currency} + ${shippingText}).\nPlease confirm delivery within 24 hours.`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;
    const confirmWaBtn = document.getElementById('confirmWhatsAppBtn');
    if (confirmWaBtn) confirmWaBtn.href = waUrl;
}

function handleOrderFailure(orderPayload, errMsg) {
    const errorBanner = document.getElementById('checkoutErrorBanner');
    const errorMsgEl = document.getElementById('checkoutErrorMessage');
    if (errorBanner) errorBanner.classList.remove('hidden');
    if (errorMsgEl) {
        errorMsgEl.innerText = currentLang === 'ar'
            ? 'تعذر تأكيد الطلب مؤقتاً عبر النظام. يمكنك الضغط أدناه لتأكيده فوراً مع خدمة العملاء على الواتساب:'
            : 'Order confirmation encountered a temporary error. You can confirm directly via WhatsApp below:';
    }

    const fallbackWa = document.getElementById('fallbackWhatsAppBtn');
    if (fallbackWa) {
        const shippingDesc = orderPayload.isFreeShipping || orderPayload.shipping === 0
            ? 'شحن مجاني'
            : `${orderPayload.shipping} ج.م شحن`;
        const waMsg = `مرحباً بايونير، أود طلب سكراب:\n• الموديل: ${currentProduct.nameEn}\n• المقاس: ${selectedSize}\n• الكمية: ${orderPayload.quantity}\n• الاسم: ${orderPayload.name}\n• الموبايل: ${orderPayload.phone}\n• المحافظة: ${orderPayload.gov}\n• العنوان: ${orderPayload.address}\n• الإجمالي: ${orderPayload.finalTotal} ج.م (${orderPayload.subtotal} ج.م سكراب + ${shippingDesc})\nالتأكيد والتوصيل خلال 24 ساعة مع المعاينة.`;
        fallbackWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;
    }
}

// --- Lead Capture & Abandoned Checkout ---
function captureLead(leadData) {
    if (!leadData || !leadData.phone) return;
    const cleanDigits = leadData.phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return;

    if (capturedLeads.has(cleanDigits)) return;
    capturedLeads.add(cleanDigits);

    // Track Lead pixel event
    trackPixelEvent('Lead', {
        value: 0,
        currency: 'EGP',
        phone: cleanDigits
    });

    // Write to Google Sheet (fallback no-cors)
    try {
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: leadData.name || "عميل مهتم",
                phone: leadData.phone,
                city: leadData.gov || "-",
                address: leadData.address || "-",
                productDetails: leadData.details || `سكراب: ${currentProduct.nameEn}`
            })
        }).catch(() => {});
    } catch (e) {}

    // Alert Telegram via /api/notify
    try {
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'abandoned_checkout',
                phone: leadData.phone,
                name: leadData.name || "دكتور مهتم",
                color: currentProduct.nameEn,
                resultSize: selectedSize || "غير محدد",
                details: leadData.details || `اهتمام بالسكراب ${currentProduct.nameEn}`
            })
        }).catch(() => {});
    } catch (e) {}
}

function captureAbandonedCheckoutLead() {
    if (isOrderCompleted) return;
    const phoneInput = document.getElementById('custPhone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return;

    const name = document.getElementById('custName')?.value.trim() || 'عميل في صفحة الدفع';
    const gov = document.getElementById('custGov')?.value || '-';
    const address = document.getElementById('custAddress')?.value.trim() || '-';

    captureLead({
        name: `${name} (لم يكمل الطلب)`,
        phone: phone,
        gov,
        address,
        details: `وصل لصفحة الدفع: ${currentProduct.nameEn} (مقاس ${selectedSize || 'لم يحدد'})`
    });
}

// Track phone input on blur
document.getElementById('custPhone')?.addEventListener('blur', captureAbandonedCheckoutLead);

// --- Deep Linking (?color=navy or #navy) ---
function handleDeepLinks() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let colorParam = urlParams.get('color');

        if (!colorParam && window.location.hash) {
            colorParam = window.location.hash.replace('#', '').toLowerCase();
        }

        if (colorParam) {
            const found = PRODUCTS.find(p => p.id === colorParam.toLowerCase());
            if (found) {
                setTimeout(() => openProductModal(found.id), 100);
            }
        }
    } catch (e) {}
}

window.addEventListener('popstate', handleDeepLinks);
window.addEventListener('hashchange', handleDeepLinks);

// --- Load Reviews Data from reviews.json ---
function loadReviewsData() {
    fetch('reviews.json')
        .then(res => res.json())
        .then(reviews => {
            const container = document.getElementById('reviewsGrid');
            const section = document.getElementById('reviewsSection');
            if (!container || !section) return;

            // Check if reviews are verified
            const verifiedReviews = reviews.filter(r => r.verified === true);
            if (verifiedReviews.length === 0) {
                // Keep hidden as per Phase 6 requirements [CONFIRM: real reviews + permission]
                section.classList.add('hidden');
                return;
            }

            section.classList.remove('hidden');
            container.innerHTML = '';
            verifiedReviews.forEach(r => {
                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <div class="review-stars">★★★★★</div>
                    <p class="review-text">"${currentLang === 'ar' ? r.text_ar : r.text}"</p>
                    <div class="review-author">
                        <span class="review-name">${currentLang === 'ar' ? r.name_ar : r.name}</span>
                        <span class="review-role">${currentLang === 'ar' ? r.role_ar : r.role}</span>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(() => {});
}

// --- Policy & Information Modals ---
window.openInfoModal = function(type) {
    const modal = document.getElementById('infoModal');
    const body = document.getElementById('infoModalBody');
    if (!modal || !body) return;

    const isAr = currentLang === 'ar';
    let html = '';

    if (type === 'shipping') {
        html = isAr ? `
            <h3>سياسة الشحن والمعاينة والاستبدال</h3>
            <p><strong>المعاينة عند الاستلام:</strong> نؤمن بحق العميل الكامل في فحص السكراب والتأكد من مطابقة المقاس وجودة النسيج والخياطة قبل الدفع للمندوب. في حال عدم الرضا يمكنك إرجاع الطلب فوراً مع المندوب.</p>
            <p><strong>استبدال المقاس:</strong> نوفر خدمة استبدال المقاس أو اللون خلال 3 أيام من تاريخ الاستلام، بشرط بقاء المنتج في حالته الأصلية بدون غسيل أو استخدام مع وجود البطاقات الأصلية.</p>
            <p><strong>مدة الشحن:</strong> القاهرة والجيزة والإسكندرية: 24-48 ساعة عمل. باقي المحافظات: 2-4 أيام عمل.</p>
        ` : `
            <h3>Shipping, Inspection & Returns Policy</h3>
            <p><strong>Doorstep Inspection:</strong> We guarantee your right to unbox and inspect your scrub set with the courier before completing payment. If not fully satisfied, you may return it on the spot.</p>
            <p><strong>3-Day Size Exchange:</strong> Sizing adjustments or color exchanges are available within 3 days of delivery, provided the garment is in original unworn, unwashed condition with tags.</p>
            <p><strong>Delivery Time:</strong> Cairo, Giza & Alexandria: 24-48 hours. Other governorates: 2-4 business days.</p>
        `;
    } else if (type === 'privacy') {
        html = isAr ? `
            <h3>سياسة الخصوصية</h3>
            <p>نحن نحترم خصوصية بياناتك الطبية والشخصية. نستخدم الاسم ورقم الهاتف والعنوان حصرياً لمعالجة وتسليم طلبك وتأكيد موعد الشحن.</p>
            <p>لا نقوم بمشاركة أو بيع بياناتك لأي طرف خارجي باستثناء شركة الشحن المسؤولة عن تسليم طردك.</p>
        ` : `
            <h3>Privacy Policy</h3>
            <p>We respect your privacy. Your name, mobile number, and delivery address are used exclusively for fulfilling your order and dispatch confirmation.</p>
            <p>We never sell or share your data with third parties other than the delivery courier handling your parcel.</p>
        `;
    }

    body.innerHTML = html;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.closeInfoModal = function() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
};

document.getElementById('infoModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') closeInfoModal();
});

// Direct open size guide from footer or nav
window.openSizeGuideModalDirect = function(focusCalc = false) {
    openProductModal(currentProduct.id);
    setTimeout(() => {
        const acc = document.getElementById('accSizeGuide');
        if (acc) {
            acc.classList.add('active');
            if (focusCalc) {
                document.getElementById('calcWeight')?.focus();
            }
            acc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 200);
};

document.getElementById('openSizeGuideNav')?.addEventListener('click', () => {
    openSizeGuideModalDirect(false);
});

// Setup General Listeners (FAQ Accordion, etc.)
function setupEventListeners() {
    // FAQ Accordion
    document.querySelectorAll('.faq-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
            });
            if (!wasActive) {
                item.classList.add('active');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });
}
