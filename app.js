// --- Dynamic CMS Data ---
let cmsData = { prices: { basePrice: 900, fakePrice: 1300, twoPiecesPrice: 1800 }, inventory: null };
const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";

fetch(scriptURL + "?action=get_data")
    .then(res => res.json())
    .then(data => {
        if(data.prices && data.inventory) {
            // Validate prices to prevent Excel errors (like typing names instead of numbers)
            let bp = parseFloat(data.prices.basePrice);
            let fp = parseFloat(data.prices.fakePrice);
            let tp = parseFloat(data.prices.twoPiecesPrice);
            
            cmsData = data;
            cmsData.prices.basePrice = isNaN(bp) ? 900 : bp;
            cmsData.prices.fakePrice = isNaN(fp) ? 1300 : fp;
            cmsData.prices.twoPiecesPrice = isNaN(tp) ? 1800 : tp;

            document.querySelectorAll(".text-red-600.font-black.text-lg").forEach(el => {
                el.innerHTML = `${cmsData.prices.basePrice} ج.م <span class="text-xs text-gray-400 line-through font-normal">${cmsData.prices.fakePrice}</span>`;
            });
            if (typeof selectedProduct !== "undefined" && selectedProduct.color) updateSizeAvailability();
            
            // 1. Announcement Bar
            if (cmsData.announcement && cmsData.announcement.active && cmsData.announcement.text) {
                const bar = document.getElementById('cmsAnnouncement');
                if(bar) {
                    bar.innerHTML = cmsData.announcement.text;
                    bar.classList.remove('hidden');
                    document.body.classList.replace('pt-[36px]', 'pt-[72px]'); // Adjust padding for 2 bars
                }
            }

            // 2. Populate Governorates
            if (cmsData.shippingRates) {
                const govSelect = document.getElementById('custGov');
                if (govSelect) {
                    govSelect.innerHTML = '<option value="">اختر المحافظة...</option>';
                    Object.keys(cmsData.shippingRates).forEach(gov => {
                        const opt = document.createElement('option');
                        opt.value = gov;
                        opt.textContent = gov;
                        govSelect.appendChild(opt);
                    });
                }
            }
        }
    }).catch(err => console.error("Failed to load CMS data:", err));

const colors = [
    { id: 'black', name: 'Black', hex: '#1f2022', images: ['Black_1.jpg', 'black_2.jpg', 'black_3.jpg'] },
    { id: 'teal', name: 'Teal', hex: '#1f4e5b', images: ['tael_1.jpg', 'tael_2.jpg', 'tael_3.jpg'] },
    { id: 'navy', name: 'Navy', hex: '#1b263b', images: ['navy_1.jpg', 'navy_2.jpg', 'navy_3.jpg'] },
    { id: 'blue', name: 'Blue', hex: '#274c77', images: ['blue_1.jpg', 'blue_2.jpg', 'blue_3.jpg'] },
    { id: 'olive', name: 'Olive', hex: '#4a5d23', images: ['olive_1.jpg', 'olive_2.jpg', 'olive_3.jpg'] },
    { id: 'pink', name: 'Pink', hex: '#e5989b', images: ['pink_1.png', 'pink_2.jpg', 'pink_3.jpg'] },
];

let selectedProduct = { color: colors[0], size: null, quantity: 1 };
let currentBaseTotal = 0;
let currentImageIndex = 0;

// DOM Elements
const productGrid = document.getElementById('productGrid');
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModal');
const colorSelector = document.getElementById('colorSelector');
const selectedColorName = document.getElementById('selectedColorName');

const imageSlider = document.getElementById('imageSlider');
const sliderDots = document.getElementById('sliderDots');
const prevImgBtn = document.getElementById('prevImgBtn');
const nextImgBtn = document.getElementById('nextImgBtn');

const sizeBtns = document.querySelectorAll('.size-btn'); 
const qtyInput = document.getElementById('qtyInput');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const modalPrice = document.getElementById('modalPrice');
const totalPriceBtn = document.getElementById('totalPriceBtn');
const pricingMessage = document.getElementById('pricingMessage');
const buyBtn = document.getElementById('buyBtn');
const stockCount = document.getElementById('stockCount');

const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutBtn = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const skipBtn = document.getElementById('skipBtn');
const finalCheckoutPrice = document.getElementById('finalCheckoutPrice');

const urgencyBar = document.getElementById('urgencyBar');
const countdownEl = document.getElementById('countdown');
const globalTimerEl = document.getElementById('globalTimer');
const checkoutTimerEl = document.getElementById('checkoutTimer');
const liveViewersEl = document.getElementById('liveViewers');

// Size Guide Elements
const sizeModal = document.getElementById('sizeModal');
const openSizeGuideBtn = document.getElementById('openSizeGuideBtn');
const closeSizeModal = document.getElementById('closeSizeModal');
const tabCalc = document.getElementById('tabCalc');
const tabChart = document.getElementById('tabChart');
const contentCalc = document.getElementById('contentCalc');
const contentChart = document.getElementById('contentChart');
const btnCalcSize = document.getElementById('btnCalcSize');
const calcWeight = document.getElementById('calcWeight');
const calcHeight = document.getElementById('calcHeight');
const calcResult = document.getElementById('calcResult');
const recommendedSizeTxt = document.getElementById('recommendedSizeTxt');
const useRecommendedSize = document.getElementById('useRecommendedSize');

const stickyCTA = document.getElementById('stickyCTA');

// --- Scroll Logic for Sticky Mobile CTA ---
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) { stickyCTA.classList.add('show-sticky'); } 
    else { stickyCTA.classList.remove('show-sticky'); }
});

// --- Urgency Timers Logic ---
function startTimer(durationMinutes, elementId) {
    let time = durationMinutes * 60;
    const el = document.getElementById(elementId);
    if(!el) return;
    
    const interval = setInterval(() => {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        el.innerHTML = `${minutes}:${seconds}`;
        time--;
        if(time < 0) clearInterval(interval);
    }, 1000);
    return interval;
}
startTimer(15, 'globalTimer');
setInterval(() => {
    liveViewersEl.innerHTML = `${Math.floor(Math.random() * (75 - 25 + 1) + 25)} شخص يشاهدون الآن`;
}, 10000);

// --- Initialize Products ---
function initProducts() {
    colors.forEach(color => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group border border-gray-100 relative';
        const badges = ['🔥 الأكثر طلباً', '⚡ ينفذ سريعاً', '⭐ حصري'];
        const randomBadge = badges[Math.floor(Math.random() * badges.length)];
        
        card.innerHTML = `
            <div class="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full z-10 animate-pulse">
                ${randomBadge}
            </div>
            <div class="relative w-full aspect-[3/4] overflow-hidden bg-gray-100">
                <img src="${color.images[0]}" alt="${color.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" onerror="this.src='https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span class="bg-white text-red-600 font-bold px-4 py-2 rounded-full text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">اختر المقاس</span>
                </div>
            </div>
            <div class="p-3 text-center bg-gray-50 group-hover:bg-red-50 transition-colors">
                <h3 class="font-black text-gray-900 text-sm mb-1">سكراب طبي - ${color.name}</h3>
                <div class="text-red-600 font-black text-lg">${cmsData.prices.basePrice} ج.م <span class="text-xs text-gray-400 line-through font-normal">${cmsData.prices.fakePrice}</span></div>
            </div>
        `;
        card.addEventListener('click', () => openProductModal(color));
        productGrid.appendChild(card);
    });
}

function calculatePrice(qty) {
    let base = cmsData.prices.basePrice;
    let two = cmsData.prices.twoPiecesPrice;
    if (qty === 1) return { total: base, unit: base, shipping: 'يضاف مصاريف الشحن' };
    if (qty === 2) return { total: two, unit: two / 2, shipping: 'شحن مجاني' };
    return { total: qty * (two / 2 - 50), unit: (two / 2 - 50), shipping: 'شحن مجاني' };
}

// --- Slider Logic ---
function initSlider() {
    imageSlider.innerHTML = '';
    sliderDots.innerHTML = '';
    
    selectedProduct.color.images.forEach((imgSrc, index) => {
        // Image Div
        const imgDiv = document.createElement('div');
        imgDiv.className = 'w-full h-full flex-shrink-0';
        imgDiv.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80'">`;
        imageSlider.appendChild(imgDiv);
        
        // Dot
        const dot = document.createElement('button');
        dot.className = `h-2 rounded-full transition-all shadow-sm ${index === 0 ? 'bg-white w-4' : 'bg-white/50 w-2'}`;
        dot.addEventListener('click', (e) => { e.stopPropagation(); currentImageIndex = index; updateSliderPosition(); });
        sliderDots.appendChild(dot);
    });
    
    currentImageIndex = 0;
    updateSliderPosition();
}

function updateSliderPosition() {
    // In RTL, translating positive moves content to the right (showing left items)
    imageSlider.style.transform = `translateX(${currentImageIndex * 100}%)`;
    
    // Update dots
    Array.from(sliderDots.children).forEach((dot, index) => {
        dot.className = `h-2 rounded-full transition-all shadow-sm ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-2'}`;
    });
}

prevImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageIndex = (currentImageIndex - 1 + selectedProduct.color.images.length) % selectedProduct.color.images.length;
    updateSliderPosition();
});

nextImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageIndex = (currentImageIndex + 1) % selectedProduct.color.images.length;
    updateSliderPosition();
});


// --- Product Modal Logic ---
function renderColorSelector() {
    colorSelector.innerHTML = '';
    colors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `color-btn w-10 h-10 rounded-full shadow-md cursor-pointer ${c.id === selectedProduct.color.id ? 'active' : ''}`;
        btn.style.backgroundColor = c.hex;
        btn.addEventListener('click', () => {
            selectedProduct.color = c;
            stockCount.innerText = Math.floor(Math.random() * 12) + 7;
            initSlider(); // Re-init slider with new images
            updateSizeAvailability();
            updateModalUI();
            renderColorSelector();
        });
        colorSelector.appendChild(btn);
    });
}

function updateSizeAvailability() {
    selectedProduct.size = null; // reset size on color change
    sizeBtns.forEach(b => {
        b.classList.remove('active', 'border-dark');
        b.classList.add('border-gray-200');
        const s = b.getAttribute('data-size');
        const color = selectedProduct.color.id;
        
        let isAvailable = true;
        
        if (color === 'pink') {
            if (s === '3XL') isAvailable = false;
        } else if (color === 'olive') {
            if (s !== 'M' && s !== 'L' && s !== 'XXL') isAvailable = false;
        } else if (color === 'blue') {
            if (s !== 'XL' && s !== 'XXL') isAvailable = false;
        } else if (color === 'navy') {
            if (s !== 'M' && s !== 'L' && s !== 'XL' && s !== 'XXL') isAvailable = false;
        } else if (color === 'teal') {
            if (s !== 'M' && s !== 'XL') isAvailable = false;
        } else if (color === 'black') {
            if (s !== 'M' && s !== 'L') isAvailable = false;
        }

        if(!isAvailable) {
            b.className = 'size-btn w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold text-gray-300 relative overflow-hidden cursor-not-allowed';
            b.innerHTML = `${s}<div class="absolute w-full h-0.5 bg-red-400 rotate-45 top-1/2 left-0 -mt-[1px]"></div>`;
            return;
        }

        // Available sizes
        b.className = 'size-btn w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold hover:border-dark transition cursor-pointer';
        b.innerHTML = s;
    });
}

sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if(btn.classList.contains('cursor-not-allowed')) return;
        setSize(btn.getAttribute('data-size'));
    });
});

function setSize(size) {
    sizeBtns.forEach(b => {
        b.classList.remove('active', 'border-dark');
        b.classList.add('border-gray-200');
    });
    const btn = Array.from(sizeBtns).find(b => b.getAttribute('data-size') === size);
    if(btn) {
        btn.classList.add('active', 'border-dark');
        btn.classList.remove('border-gray-200');
    }
    selectedProduct.size = size;
    stockCount.innerText = Math.floor(Math.random() * 8) + 4;
}

qtyMinus.addEventListener('click', () => {
    if (selectedProduct.quantity > 1) { selectedProduct.quantity--; updateModalUI(); }
});
qtyPlus.addEventListener('click', () => {
    selectedProduct.quantity++; updateModalUI();
});

let urgencyCountdownInterval;
function updateModalUI() {
    selectedColorName.innerText = selectedProduct.color.name;
    qtyInput.value = selectedProduct.quantity;

    const pricing = calculatePrice(selectedProduct.quantity);
    currentBaseTotal = pricing.total;
    modalPrice.innerText = `${currentBaseTotal} ج.م`;
    totalPriceBtn.innerText = `(${currentBaseTotal} ج.م)`;

    if (selectedProduct.quantity === 1) {
        pricingMessage.className = 'bg-blue-50 border border-blue-200 text-blue-700 p-2.5 rounded-xl text-xs sm:text-sm font-bold text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<i class="fa-solid fa-gift animate-pulse text-lg"></i> <span>أضف قطعة أخرى للحصول على شحن مجاني!</span>';
        urgencyBar.classList.add('hidden');
    } else if (selectedProduct.quantity === 2) {
        pricingMessage.className = 'bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-xs sm:text-sm font-black text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<span class="text-lg">🎉</span> <span>شحن مجاني! أضف قطعة ثالثة وسينخفض السعر لـ 850 ج.م للقطعة.</span>';
        if(urgencyBar.classList.contains('hidden')){
            urgencyBar.classList.remove('hidden');
            clearInterval(urgencyCountdownInterval);
            urgencyCountdownInterval = startTimer(30, 'countdown');
        }
    } else {
        pricingMessage.className = 'bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-xs sm:text-sm font-black text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<span class="text-lg">🔥</span> <span>السعر الآن 850 ج.م للقطعة + شحن مجاني!</span>';
    }
}

function openProductModal(color) {
    selectedProduct.color = color;
    selectedProduct.quantity = 1;
    stockCount.innerText = Math.floor(Math.random() * 15) + 8; 
    
    initSlider(); // Initialize slider images for this color
    updateSizeAvailability();
    updateModalUI();
    renderColorSelector();
    
    productModal.classList.remove('hidden');
    setTimeout(() => { productModal.classList.add('show'); }, 10);
}

function closeProductModal() {
    productModal.classList.remove('show');
    setTimeout(() => { productModal.classList.add('hidden'); }, 300);
}
closeModalBtn.addEventListener('click', closeProductModal);
productModal.addEventListener('click', (e) => { if(e.target === productModal) closeProductModal(); });

// --- Size Guide Logic ---
openSizeGuideBtn.addEventListener('click', () => {
    sizeModal.classList.remove('hidden');
    setTimeout(() => { sizeModal.classList.add('show'); }, 10);
});

closeSizeModal.addEventListener('click', closeSizeGuide);
sizeModal.addEventListener('click', (e) => { if(e.target === sizeModal) closeSizeGuide(); });

function closeSizeGuide() {
    sizeModal.classList.remove('show');
    setTimeout(() => { sizeModal.classList.add('hidden'); }, 300);
}

tabCalc.addEventListener('click', () => {
    tabCalc.className = 'flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded-md text-red-600 transition';
    tabChart.className = 'flex-1 py-2 text-sm font-bold text-gray-500 transition';
    contentCalc.classList.remove('hidden');
    contentChart.classList.add('hidden');
});

tabChart.addEventListener('click', () => {
    tabChart.className = 'flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded-md text-red-600 transition';
    tabCalc.className = 'flex-1 py-2 text-sm font-bold text-gray-500 transition';
    contentChart.classList.remove('hidden');
    contentCalc.classList.add('hidden');
});

btnCalcSize.addEventListener('click', () => {
    const w = parseInt(calcWeight.value);
    const h = parseInt(calcHeight.value);
    const phone = document.getElementById('calcPhone').value.trim();
    
    if(!w || !h) { alert('برجاء إدخال الوزن والطول'); return; }
    if(phone.length < 10) { alert('برجاء إدخال رقم الواتساب لمعرفة النتيجة بدقة ولنتواصل معك إذا لزم الأمر'); return; }
    
    let color = selectedProduct.color.id;
    let idealSize = 'XXL';
    if(w < 55) idealSize = 'S';
    else if(w >= 55 && w < 65) idealSize = 'M';
    else if(w >= 65 && w < 75) idealSize = 'L';
    else if(w >= 75 && w <= 85) idealSize = 'XL';
    else if(w > 85 && w <= 100) idealSize = 'XXL';
    else idealSize = '3XL';

    function checkStock(s, c) {
        if (c === 'pink') return s !== '3XL';
        if (c === 'olive') return s === 'M' || s === 'L' || s === 'XXL';
        if (c === 'blue') return s === 'XL' || s === 'XXL';
        if (c === 'navy') return s === 'M' || s === 'L' || s === 'XL' || s === 'XXL';
        if (c === 'teal') return s === 'M' || s === 'XL';
        if (c === 'black') return s === 'M' || s === 'L';
        return true;
    }

    let recSize = idealSize;
    if (!checkStock(idealSize, color)) {
        if (idealSize === 'L') {
            if (w <= 69 && checkStock('M', color)) recSize = 'M';
            else if (w >= 70 && checkStock('XL', color)) recSize = 'XL';
        } else if (idealSize === 'XL') {
            if (w <= 79 && checkStock('L', color)) recSize = 'L';
            else if (w >= 80 && checkStock('XXL', color)) recSize = 'XXL';
        } else if (idealSize === 'M') {
            if (w >= 60 && checkStock('L', color)) recSize = 'L';
            else if (w <= 59 && checkStock('S', color)) recSize = 'S';
        } else if (idealSize === 'XXL') {
            if (w <= 90 && checkStock('XL', color)) recSize = 'XL';
        }
    }
    
    recommendedSizeTxt.innerText = recSize;
    calcResult.classList.remove('hidden');
    
    // Send lead to Google Sheets
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
    fetch(scriptURL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: "استشارة مقاس", 
            phone: phone, 
            city: "-", address: "-", 
            productDetails: `الوزن: ${w}, الطول: ${h}, النتيجة: ${recSize}` 
        })
    }).catch(e => console.log(e));

    // Send to Vercel API for Telegram + Gemini
    fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'size_guide',
            phone: phone,
            details: `وزن: ${w}، طول: ${h}`,
            weight: w,
            height: h,
            resultSize: recSize
        })
    }).catch(e=>{});
});

useRecommendedSize.addEventListener('click', () => {
    if(recommendedSizeTxt.innerText !== 'XXL') {
        setSize(recommendedSizeTxt.innerText);
        closeSizeGuide();
    } else {
        alert('نعتذر، مقاس XXL نفذ من المخزون حالياً.');
    }
});

// --- Checkout Flow ---
let checkoutInterval;
buyBtn.addEventListener('click', () => {
    if (!selectedProduct.size) {
        alert('يرجى اختيار المقاس أولاً قبل المتابعة!');
        return;
    }
    
    // Meta Pixel AddToCart
    if (typeof fbq === 'function') {
        fbq('track', 'AddToCart', {
            value: calculatePrice(selectedProduct.quantity).total,
            currency: 'EGP',
            content_ids: [selectedProduct.color.id],
            content_type: 'product'
        });
    }
    
    closeProductModal();
    // Instead of checkout, show Upsell Modal!
    selectedProduct.upsell = 0; // reset
    openUpsellModal();
});

const upsellModal = document.getElementById('upsellModal');
const acceptUpsellBtn = document.getElementById('acceptUpsellBtn');
const rejectUpsellBtn = document.getElementById('rejectUpsellBtn');
const closeUpsellBtn = document.getElementById('closeUpsell');

function openUpsellModal() {
    upsellModal.classList.remove('hidden');
    setTimeout(() => { upsellModal.classList.add('show'); }, 10);
}

function closeUpsellModal() {
    upsellModal.classList.remove('show');
    setTimeout(() => { upsellModal.classList.add('hidden'); }, 300);
}

closeUpsellBtn.addEventListener('click', () => {
    closeUpsellModal();
    openCheckoutModal();
});

rejectUpsellBtn.addEventListener('click', () => {
    selectedProduct.upsell = 0;
    closeUpsellModal();
    openCheckoutModal();
});

acceptUpsellBtn.addEventListener('click', () => {
    selectedProduct.upsell = 99; // Medical Cap Price
    closeUpsellModal();
    openCheckoutModal();
});

let currentPromoDiscount = 0; // percentage
let currentPromoCodeStr = "";

function updateCheckoutPrice() {
    let base = currentBaseTotal; // this already includes exit-intent 50 EGP discount if active
    let shipping = 0;
    
    // Upsell
    if (selectedProduct.upsell > 0) {
        base += selectedProduct.upsell;
    }
    
    // Shipping based on Governorate (only if qty == 1)
    if (selectedProduct.quantity === 1) {
        const gov = document.getElementById('custGov').value;
        if (gov && cmsData && cmsData.shippingRates && cmsData.shippingRates[gov]) {
            shipping = cmsData.shippingRates[gov];
        }
    }
    
    // Promo Code discount
    let promoDiscountAmt = 0;
    if (currentPromoDiscount > 0) {
        promoDiscountAmt = (base * currentPromoDiscount) / 100;
    }
    
    let finalTotal = base + shipping - promoDiscountAmt;
    
    let text = `${finalTotal}`;
    if (shipping > 0) text += ` (شامل الشحن)`;
    else if (selectedProduct.quantity === 1) text += ` (+ مصاريف الشحن)`;
    else text += ` (شحن مجاني)`;
    
    finalCheckoutPrice.innerText = text;
}

// Add event listeners for dynamic checkout
document.getElementById('custGov')?.addEventListener('change', updateCheckoutPrice);

document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
    const code = document.getElementById('promoCode').value.trim().toUpperCase();
    const msgEl = document.getElementById('promoMessage');
    
    if(!code) return;
    
    if (cmsData && cmsData.promoCodes && cmsData.promoCodes[code]) {
        currentPromoDiscount = cmsData.promoCodes[code];
        currentPromoCodeStr = code;
        msgEl.textContent = `✅ تم تفعيل خصم ${currentPromoDiscount}% بنجاح!`;
        msgEl.className = "text-xs font-bold mt-1 text-green-600";
        msgEl.classList.remove('hidden');
        updateCheckoutPrice();
    } else {
        currentPromoDiscount = 0;
        currentPromoCodeStr = "";
        msgEl.textContent = "❌ كود الخصم غير صحيح أو منتهي الصلاحية";
        msgEl.className = "text-xs font-bold mt-1 text-red-600";
        msgEl.classList.remove('hidden');
        updateCheckoutPrice();
    }
});

function openCheckoutModal() {
    updateCheckoutPrice();

    const surpriseBox = document.getElementById('shippingSurpriseBox');
    if(selectedProduct.quantity === 1) {
        surpriseBox.classList.remove('hidden');
    } else {
        surpriseBox.classList.add('hidden');
    }

    checkoutModal.classList.remove('hidden');
    setTimeout(() => {
        checkoutModal.classList.add('show');
        clearInterval(checkoutInterval);
        checkoutInterval = startTimer(5, 'checkoutTimer');
    }, 10);
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('show');
    setTimeout(() => {
        checkoutModal.classList.add('hidden');
        clearInterval(checkoutInterval);
    }, 300);
}
closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

function submitOrder(customerData = null) {
    const pricing = calculatePrice(selectedProduct.quantity);
    let finalTotal = pricing.total;
    let shippingAdded = 0;
    
    // Add upsell to final total before calculating discount
    if (selectedProduct.upsell > 0) {
        finalTotal += selectedProduct.upsell;
    }
    
    if (customerData) {
        if (selectedProduct.quantity === 1 && cmsData && cmsData.shippingRates && cmsData.shippingRates[customerData.gov]) {
            shippingAdded = cmsData.shippingRates[customerData.gov];
        }
        if (currentPromoDiscount > 0) {
            finalTotal = finalTotal - (finalTotal * currentPromoDiscount / 100);
        } else if (hasActiveDiscount) {
            finalTotal = finalTotal - (finalTotal * 5 / 100);
        }
        finalTotal += shippingAdded;
    }
    
    let msg = `*طلب سكراب جديد*\n\n`;
    msg += `- المنتج: Medical Scrub\n`;
    if (selectedProduct.upsell > 0) {
        msg += `- إضافات: Medical Cap (Bandana) مطابق للون\n`;
    }
    msg += `- اللون: ${selectedProduct.color.name}\n`;
    msg += `- المقاس: ${selectedProduct.size}\n`;
    msg += `- الكمية: ${selectedProduct.quantity}\n`;
    
    if (selectedProduct.quantity === 1) {
        msg += `- السعر الإجمالي: ${finalTotal} ج.م (+ مصاريف الشحن)\n`;
        msg += `*ملاحظة هامة: إضافة قطعة ثانية يوفر شحن مجاني!*\n\n`;
    } else {
        msg += `- السعر الإجمالي: ${finalTotal} ج.م (${pricing.shipping})\n\n`;
    }
    
    if (customerData) {
        msg += `*بيانات العميل:*\n`;
        msg += `- الاسم: ${customerData.name}\n`;
        msg += `- المحافظة: ${customerData.gov}\n`;
        msg += `- العنوان: ${customerData.address}\n`;
        msg += `- رقم الهاتف: ${customerData.phone}\n`;
        if (customerData.phone2) {
            msg += `- رقم هاتف إضافي: ${customerData.phone2}\n`;
        }
        if (customerData.notes) {
            msg += `- ملاحظات العميل: ${customerData.notes}\n`;
        }
        if (currentPromoCodeStr) {
            msg += `- كود الخصم المستخدم: ${currentPromoCodeStr} (${currentPromoDiscount}%)\n`;
        }
    }
    
    let whatsappUrl = `https://wa.me/201099365738?text=${encodeURIComponent(msg)}`;
    
    if (customerData) {
        buyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تأكيد الطلب...';
        
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        let productDetailsText = `اللون: ${selectedProduct.color.name} | المقاس: ${selectedProduct.size} | الكمية: ${selectedProduct.quantity} | الإجمالي: ${finalTotal}`;
        if (selectedProduct.upsell > 0) {
            productDetailsText += ` | إضافة: Bandana Cap`;
        }
        if (customerData.notes) {
            productDetailsText += ` | ملاحظات: ${customerData.notes}`;
        }
        if (currentPromoCodeStr) {
            productDetailsText += ` | كود خصم: ${currentPromoCodeStr} (${currentPromoDiscount}%)`;
        }
        let fullPhone = customerData.phone;
        if (customerData.phone2) fullPhone += " / " + customerData.phone2;
        
        try {
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: customerData.name + " (مكتمل)",
                    phone: fullPhone,
                    city: customerData.gov,
                    address: customerData.address,
                    productDetails: productDetailsText
                })
            });
            
            // Meta Pixel Purchase
            if (typeof fbq === 'function') {
                fbq('track', 'Purchase', {
                    value: finalTotal,
                    currency: 'EGP',
                    content_ids: [selectedProduct.color.id],
                    content_type: 'product'
                });
            }
        } catch (error) {
            console.error('Error saving to sheet:', error);
        }
        // ------------------------------------------------

    } else {
        msg += `*طلب سريع (بدون تسجيل مسبق)*\n`;
    }
    
    const merchantPhone = "201070331386"; 
    const encodedMsg = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${merchantPhone}?text=${encodedMsg}`;
    
    if (customerData && customerData.phone) {
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'new_order',
                phone: customerData.phone,
                details: `طلب شراء سكراب ${selectedProduct.color.name} مقاس ${selectedProduct.size}`,
                name: customerData.name,
                color: selectedProduct.color.name,
                resultSize: selectedProduct.size,
                finalTotal: finalTotal
            })
        }).catch(e=>{});
    }

    window.open(whatsappUrl, '_blank');
    closeCheckoutModal();
}

let isSubmitted = false;

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    isSubmitted = true;
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const phone2 = document.getElementById('custPhone2').value;
    const gov = document.getElementById('custGov').value;
    const address = document.getElementById('custAddress').value;
    const notes = document.getElementById('custNotes').value;
    
    submitOrder({ name, phone, phone2, gov, address, notes });
    closeModalFunc(document.getElementById('checkoutModal'));
});

// -- Abandoned Checkout Tracking (تتبع العملاء الذين لم يكملوا الطلب) --
let hasSentPartial = false;
document.getElementById('custPhone').addEventListener('blur', (e) => {
    const phoneVal = e.target.value.trim();
    const nameVal = document.getElementById('custName').value.trim();
    if (phoneVal.length >= 10 && !hasSentPartial && !isSubmitted) {
        hasSentPartial = true; 
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: (nameVal || "بدون اسم") + " (لم يكمل الأوردر)",
                phone: phoneVal,
                city: "-",
                address: "-",
                productDetails: `Medical Scrub | ${selectedProduct.color.name} | ${selectedProduct.size} | Qty: ${selectedProduct.quantity}`
            })
        }).catch(err => console.log(err));
    }
});

skipBtn.addEventListener('click', () => { submitOrder(null); });

// --- Social Proof Toasts ---
const names = ['أحمد', 'محمد', 'محمود', 'سارة', 'نهى', 'كريم', 'مصطفى', 'ياسمين', 'إسلام', 'نورهان'];
const govs = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا', 'أسيوط', 'الزقازيق'];
function showPurchaseToast() {
    const name = names[Math.floor(Math.random() * names.length)];
    const gov = govs[Math.floor(Math.random() * govs.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = 'bg-white rounded-xl shadow-2xl border-l-4 border-red-600 p-3 flex items-center gap-3 toast-enter pointer-events-auto max-w-xs';
    toast.innerHTML = `
        <div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200"><img src="${color.images[0]}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80'"></div>
        <div class="flex-grow">
            <div class="text-sm font-bold text-gray-800">${name} من ${gov}</div>
            <div class="text-xs text-gray-500 mt-0.5">اشترى سكراب ${color.name} الآن!</div>
        </div>
        <div class="text-red-500 text-xs font-bold animate-pulse">منذ لحظات</div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
setTimeout(() => {
    showPurchaseToast();
    setInterval(showPurchaseToast, Math.random() * 7000 + 8000);
}, 3000);

// --- Exit Intent Popup Logic ---
const exitPopup = document.getElementById('exitPopup');
const closeExitPopupBtn = document.getElementById('closeExitPopup');
const claimExitDiscountBtn = document.getElementById('claimExitDiscountBtn');
let hasShownExitPopup = false;
let exitTimerInterval;
let hasActiveDiscount = false;

function showExitPopup() {
    if (hasShownExitPopup || isSubmitted) return;
    
    // Don't show if they are already in the checkout or product modal
    if (checkoutModal.classList.contains('show') || productModal.classList.contains('show')) return;
    
    hasShownExitPopup = true;
    exitPopup.classList.remove('hidden');
    setTimeout(() => { exitPopup.classList.add('show', 'opacity-100'); }, 10);
    
    exitTimerInterval = startTimer(5, 'exitTimer');
}

function hideExitPopup() {
    exitPopup.classList.remove('show', 'opacity-100');
    setTimeout(() => { exitPopup.classList.add('hidden'); }, 300);
}

// Desktop: Mouse leaves top of viewport
document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 0) {
        showExitPopup();
    }
});

// Mobile: Back Button Trap (Exit Intent)
let historyTrapped = false;
function trapHistory() {
    if (!historyTrapped) {
        history.pushState(null, null, location.href);
        historyTrapped = true;
    }
}
// Browsers require a user interaction before allowing history manipulation to trap back button
document.addEventListener('click', trapHistory, {once: true});
document.addEventListener('touchstart', trapHistory, {once: true});
document.addEventListener('scroll', trapHistory, {once: true});

window.addEventListener('popstate', (e) => {
    if (!hasShownExitPopup && !isSubmitted) {
        showExitPopup();
        history.pushState(null, null, location.href);
    }
});

// For Facebook In-App Browser (where the 'X' button kills the page instantly)
// We must predict the exit before they press X.
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    let st = window.pageYOffset || document.documentElement.scrollTop;
    // Fast scroll up (usually means they are looking for the X or menu)
    if (lastScrollTop - st > 70) {
        showExitPopup();
    }
    lastScrollTop = st <= 0 ? 0 : st;
    
    // Reset idle timer on scroll
    resetIdleTimer();
});

// Idle timer: if they stop scrolling/touching for 25 seconds, pop the discount
let idleTimer;
function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        showExitPopup();
    }, 25000);
}
document.addEventListener('touchstart', resetIdleTimer);
document.addEventListener('mousemove', resetIdleTimer);
resetIdleTimer(); // start it initially

closeExitPopupBtn.addEventListener('click', hideExitPopup);
exitPopup.addEventListener('click', (e) => { if(e.target === exitPopup) hideExitPopup(); });

claimExitDiscountBtn.addEventListener('click', () => {
    if (!hasActiveDiscount) {
        // Phone capture step
        const phone = document.getElementById('exitPhoneInput').value.trim();
        if (phone.length < 10) { alert('برجاء إدخال رقم واتساب صحيح لتتلقى الكود'); return; }
        
        // Save lead to Google Sheets
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        fetch(scriptURL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: "صائد المنسحبين (طلب خصم)", 
                phone: phone, 
                city: "-", address: "-", 
                productDetails: "العميل استلم كود خصم 5% (DOCTOR5)" 
            })
        }).catch(err => console.log(err));
        
        // Send to Vercel API for Telegram + Gemini
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'exit_intent',
                phone: phone,
                details: "استلم كود DOCTOR5"
            })
        }).catch(e=>{});
        
        // Show code
        document.getElementById('exitPhoneContainer').classList.add('hidden');
        document.getElementById('exitCodeContainer').classList.remove('hidden');
        document.getElementById('exitPopupText').innerHTML = 'تهانينا! الكود صالح لمدة <span class="bg-yellow-200 px-1 rounded text-dark">5 دقائق</span> فقط!';
        claimExitDiscountBtn.innerText = 'استخدم الخصم الآن!';
        hasActiveDiscount = true;
    } else {
        // Apply discount step
        hideExitPopup();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        
        stickyCTA.innerHTML = `
            <div class="text-right flex-grow">
                <div class="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mb-0.5">✅ تم تفعيل كود DOCTOR5</div>
                <div class="text-sm font-black text-gray-900 leading-none">استمتع بخصم 5% على طلبك</div>
            </div>
        `;
    }
});

// Override calculatePrice to apply the 5% discount if active
const originalCalculatePrice = calculatePrice;
calculatePrice = function(qty) {
    let pricing = originalCalculatePrice(qty);
    if (hasActiveDiscount) {
        pricing.total = Math.floor(pricing.total - 50);
        // Note: we don't change the shipping text, just the total amount
    }
    return pricing;
}

initProducts();
