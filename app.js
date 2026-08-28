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
                <div class="text-red-600 font-black text-lg">900 ج.م <span class="text-xs text-gray-400 line-through font-normal">1100</span></div>
            </div>
        `;
        card.addEventListener('click', () => openProductModal(color));
        productGrid.appendChild(card);
    });
}

function calculatePrice(qty) {
    if (qty === 1) return { total: 900, unit: 900, shipping: 'يضاف مصاريف الشحن' };
    if (qty === 2) return { total: 1750, unit: 875, shipping: 'شحن مجاني' };
    return { total: qty * 850, unit: 850, shipping: 'شحن مجاني' };
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
        
        // S and 3XL always out of stock globally
        if(s === 'S' || s === '3XL') {
            b.className = 'size-btn w-10 h-10 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold text-gray-300 relative overflow-hidden cursor-not-allowed';
            b.innerHTML = `${s}<div class="absolute w-full h-0.5 bg-red-400 rotate-45 top-1/2 left-0 -mt-[1px]"></div>`;
            return;
        }
        
        // Teal logic: only M and L available (disable XL and XXL)
        if(selectedProduct.color.id === 'teal' && (s === 'XL' || s === 'XXL')) {
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
    if(!w || !h) { alert('برجاء إدخال الوزن والطول'); return; }
    
    let recSize = 'M';
    if(w < 55) recSize = 'S';
    else if(w >= 55 && w < 65) recSize = 'M';
    else if(w >= 65 && w < 75) recSize = 'L';
    else if(w >= 75 && w <= 85) recSize = 'XL';
    else recSize = 'XXL'; 
    
    recommendedSizeTxt.innerText = recSize;
    calcResult.classList.remove('hidden');
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
        alert('سارع باختيار المقاس قبل نفاذ الكمية!');
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
    openCheckoutModal();
});

function updateCheckoutPrice() {
    finalCheckoutPrice.innerText = currentBaseTotal;
}

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
        triggerAbandonedCart();
    }, 300);
}
closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

function submitOrder(customerData = null) {
    const pricing = calculatePrice(selectedProduct.quantity);
    let finalTotal = pricing.total;
    
    let msg = `*طلب مستعجل 🚨*\n\n`;
    msg += `- المنتج: Medical Scrub\n`;
    msg += `- اللون: ${selectedProduct.color.name}\n`;
    msg += `- المقاس: ${selectedProduct.size}\n`;
    msg += `- الكمية: ${selectedProduct.quantity}\n`;
    
    if (selectedProduct.quantity === 1) {
        msg += `- السعر الإجمالي للمنتجات: ${finalTotal} ج.م\n`;
        msg += `🎁 (ملاحظة هامة: تم إخبار العميل بحصوله على خصم 20% من مصاريف الشحن الأساسية)\n\n`;
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
            msg += `- رقم هاتف بديل: ${customerData.phone2}\n`;
        }
        if (customerData.notes) {
            msg += `- ملاحظات العميل: ${customerData.notes}\n`;
        }
        msg += `\n`;

        // -- إرسال البيانات إلى Google Sheets في الخلفية --
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        
        let productDetailsText = `اللون: ${selectedProduct.color.name} | المقاس: ${selectedProduct.size} | الكمية: ${selectedProduct.quantity} | الإجمالي: ${finalTotal}`;
        if (customerData.notes) {
            productDetailsText += ` | ملاحظات: ${customerData.notes}`;
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

// تتبع السلة المتروكة عند إغلاق النافذة بدون تأكيد الطلب
let hasSentPartial = false;
function triggerAbandonedCart() {
    const phoneVal = document.getElementById('custPhone').value.trim();
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
}

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

initProducts();
