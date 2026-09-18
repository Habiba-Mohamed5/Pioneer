// --- NEW: Dynamic CMS Data ---
let cmsData = { prices: { basePrice: 900, fakePrice: 1300, twoPiecesPrice: 1800 }, inventory: null };
const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";
fetch(scriptURL + "?action=get_data").then(res => res.json()).then(data => { if(data.prices && data.inventory) { cmsData = data; document.querySelectorAll(".text-red-600.font-black.text-lg").forEach(el => { el.innerHTML = `${cmsData.prices.basePrice} ج.م <span class="text-xs text-gray-400 line-through font-normal">${cmsData.prices.fakePrice}</span>`; }); if (typeof selectedProduct !== "undefined" && selectedProduct.color) updateSizeAvailability(); } }).catch(err => console.error("Failed to load CMS data:", err));
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
    liveViewersEl.innerHTML = `${Math.floor(Math.random() * (75 - 25 + 1) + 25)} Ø´Ø®Øµ ÙŠØ´Ø§Ù‡Ø¯ÙˆÙ† Ø§Ù„Ø¢Ù†`;
}, 10000);

// --- Initialize Products ---
function initProducts() {
    colors.forEach(color => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group border border-gray-100 relative';
        card.className = 'bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer group hover:shadow-md transition-all border border-gray-100';
        card.innerHTML = `
            <div class="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img src="${color.images[0]}" alt="${color.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="p-3 text-center bg-gray-50 group-hover:bg-red-50 transition-colors">
                <h3 class="font-black text-gray-900 text-sm mb-1">Ø³ÙƒØ±Ø§Ø¨ Ø·Ø¨ÙŠ - ${color.name}</h3>
                <div class="text-red-600 font-black text-lg">${cmsData.prices.basePrice} Ø¬.Ù… <span class="text-xs text-gray-400 line-through font-normal">${cmsData.prices.fakePrice}</span></div>
            </div>
        `;
        card.addEventListener('click', () => openProductModal(color));
        productGrid.appendChild(card);
    });
}

function calculatePrice(qty) {
    let base = cmsData.prices.basePrice;
    let two = cmsData.prices.twoPiecesPrice;
    if (qty === 1) return { total: base, unit: base, shipping: 'ÙŠØ¶Ø§Ù Ù…ØµØ§Ø±ÙŠÙ Ø§Ù„Ø´Ø­Ù†' };
    if (qty === 2) return { total: two, unit: two / 2, shipping: 'Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ' };
    return { total: qty * (two / 2 - 50), unit: (two / 2 - 50), shipping: 'Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ' };
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
        
        if (cmsData.inventory && cmsData.inventory[color]) {
            isAvailable = cmsData.inventory[color][s] > 0;
        } else {
            // Fallback hardcoded if API failed
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
    modalPrice.innerText = `${currentBaseTotal} Ø¬.Ù…`;
    totalPriceBtn.innerText = `(${currentBaseTotal} Ø¬.Ù…)`;

    if (selectedProduct.quantity === 1) {
        pricingMessage.className = 'bg-blue-50 border border-blue-200 text-blue-700 p-2.5 rounded-xl text-xs sm:text-sm font-bold text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<i class="fa-solid fa-gift animate-pulse text-lg"></i> <span>Ø£Ø¶Ù Ù‚Ø·Ø¹Ø© Ø£Ø®Ø±Ù‰ Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ!</span>';
        urgencyBar.classList.add('hidden');
    } else if (selectedProduct.quantity === 2) {
        pricingMessage.className = 'bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-xs sm:text-sm font-black text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<span class="text-lg">ðŸŽ‰</span> <span>Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ! Ø£Ø¶Ù Ù‚Ø·Ø¹Ø© Ø«Ø§Ù„Ø«Ø© ÙˆØ³ÙŠÙ†Ø®ÙØ¶ Ø§Ù„Ø³Ø¹Ø± Ù„Ù€ 850 Ø¬.Ù… Ù„Ù„Ù‚Ø·Ø¹Ø©.</span>';
        if(urgencyBar.classList.contains('hidden')){
            urgencyBar.classList.remove('hidden');
            clearInterval(urgencyCountdownInterval);
            urgencyCountdownInterval = startTimer(30, 'countdown');
        }
    } else {
        pricingMessage.className = 'bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-xs sm:text-sm font-black text-center mb-3 transition-all flex items-center justify-center gap-2 shadow-sm';
        pricingMessage.innerHTML = '<span class="text-lg">ðŸ”¥</span> <span>Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¢Ù† 850 Ø¬.Ù… Ù„Ù„Ù‚Ø·Ø¹Ø© + Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ!</span>';
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
    
    if(!w || !h) { alert('Ø¨Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„ÙˆØ²Ù† ÙˆØ§Ù„Ø·ÙˆÙ„'); return; }
    if(phone.length < 10) { alert('Ø¨Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù…Ø¹Ø±ÙØ© Ø§Ù„Ù†ØªÙŠØ¬Ø© Ø¨Ø¯Ù‚Ø© ÙˆÙ„Ù†ØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ø¥Ø°Ø§ Ù„Ø²Ù… Ø§Ù„Ø£Ù…Ø±'); return; }
    
    let color = selectedProduct.color.id;
    let idealSize = 'XXL';
    if(w < 55) idealSize = 'S';
    else if(w >= 55 && w < 65) idealSize = 'M';
    else if(w >= 65 && w < 75) idealSize = 'L';
    else if(w >= 75 && w <= 85) idealSize = 'XL';
    else if(w > 85 && w <= 100) idealSize = 'XXL';
    else idealSize = '3XL';

    function checkStock(s, c) {
        if (cmsData.inventory && cmsData.inventory[c]) {
            return cmsData.inventory[c][s] > 0;
        }
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
            name: "Ø§Ø³ØªØ´Ø§Ø±Ø© Ù…Ù‚Ø§Ø³", 
            phone: phone, 
            city: "-", address: "-", 
            productDetails: `Ø§Ù„ÙˆØ²Ù†: ${w}, Ø§Ù„Ø·ÙˆÙ„: ${h}, Ø§Ù„Ù†ØªÙŠØ¬Ø©: ${recSize}` 
        })
    }).catch(e => console.log(e));

    // Send to Vercel API for Telegram + Gemini
    fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'size_guide',
            phone: phone,
            details: `ÙˆØ²Ù†: ${w}ØŒ Ø·ÙˆÙ„: ${h}`,
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
        alert('Ù†Ø¹ØªØ°Ø±ØŒ Ù…Ù‚Ø§Ø³ XXL Ù†ÙØ° Ù…Ù† Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ø­Ø§Ù„ÙŠØ§Ù‹.');
    }
});

// --- Checkout Flow ---
let checkoutInterval;
buyBtn.addEventListener('click', () => {
    if (!selectedProduct.size) {
        alert('Ø³Ø§Ø±Ø¹ Ø¨Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù…Ù‚Ø§Ø³ Ù‚Ø¨Ù„ Ù†ÙØ§Ø° Ø§Ù„ÙƒÙ…ÙŠØ©!');
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
    }, 300);
}
closeCheckoutBtn.addEventListener('click', closeCheckoutModal);

function submitOrder(customerData = null) {
    const pricing = calculatePrice(selectedProduct.quantity);
    let finalTotal = pricing.total;
    
    let msg = `*Ø·Ù„Ø¨ Ù…Ø³ØªØ¹Ø¬Ù„ ðŸš¨*\n\n`;
    msg += `- Ø§Ù„Ù…Ù†ØªØ¬: Medical Scrub\n`;
    msg += `- Ø§Ù„Ù„ÙˆÙ†: ${selectedProduct.color.name}\n`;
    msg += `- Ø§Ù„Ù…Ù‚Ø§Ø³: ${selectedProduct.size}\n`;
    msg += `- Ø§Ù„ÙƒÙ…ÙŠØ©: ${selectedProduct.quantity}\n`;
    
    if (selectedProduct.quantity === 1) {
        msg += `- Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${finalTotal} Ø¬.Ù… (+ Ù…ØµØ§Ø±ÙŠÙ Ø§Ù„Ø´Ø­Ù†)\n`;
        msg += `*Ø¹Ø±Ø¶ Ø®Ø§Øµ: Ø¶ÙŠÙ Ù‚Ø·Ø¹Ø© ÙƒÙ…Ø§Ù† ÙˆØ®Ø¯ Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ!*\n\n`;
    } else {
        msg += `- Ø§Ù„Ø³Ø¹Ø± Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${finalTotal} Ø¬.Ù… (${pricing.shipping})\n\n`;
    }
    
    if (customerData) {
        msg += `*Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„:*\n`;
        msg += `- Ø§Ù„Ø§Ø³Ù…: ${customerData.name}\n`;
        msg += `- Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©: ${customerData.gov}\n`;
        msg += `- Ø§Ù„Ø¹Ù†ÙˆØ§Ù†: ${customerData.address}\n`;
        msg += `- Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ: ${customerData.phone}\n`;
        if (customerData.phone2) {
            msg += `- Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ø¨Ø¯ÙŠÙ„: ${customerData.phone2}\n`;
        }
        if (customerData.notes) {
            msg += `- Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ø¹Ù…ÙŠÙ„: ${customerData.notes}\n`;
        }
        msg += `\n`;

        // -- Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ù„Ù‰ Google Sheets ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ© --
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        
        let productDetailsText = `Ø§Ù„Ù„ÙˆÙ†: ${selectedProduct.color.name} | Ø§Ù„Ù…Ù‚Ø§Ø³: ${selectedProduct.size} | Ø§Ù„ÙƒÙ…ÙŠØ©: ${selectedProduct.quantity} | Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${finalTotal}`;
        if (customerData.notes) {
            productDetailsText += ` | Ù…Ù„Ø§Ø­Ø¸Ø§Øª: ${customerData.notes}`;
        }
        let fullPhone = customerData.phone;
        if (customerData.phone2) fullPhone += " / " + customerData.phone2;
        
        try {
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: customerData.name + " (Ù…ÙƒØªÙ…Ù„)",
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
        msg += `*Ø·Ù„Ø¨ Ø³Ø±ÙŠØ¹ (Ø¨Ø¯ÙˆÙ† ØªØ³Ø¬ÙŠÙ„ Ù…Ø³Ø¨Ù‚)*\n`;
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
                details: `Ø·Ù„Ø¨ Ø´Ø±Ø§Ø¡ Ø³ÙƒØ±Ø§Ø¨ ${selectedProduct.color.name} Ù…Ù‚Ø§Ø³ ${selectedProduct.size}`,
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

// -- Abandoned Checkout Tracking (ØªØªØ¨Ø¹ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø°ÙŠÙ† Ù„Ù… ÙŠÙƒÙ…Ù„ÙˆØ§ Ø§Ù„Ø·Ù„Ø¨) --
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
                name: (nameVal || "Ø¨Ø¯ÙˆÙ† Ø§Ø³Ù…") + " (Ù„Ù… ÙŠÙƒÙ…Ù„ Ø§Ù„Ø£ÙˆØ±Ø¯Ø±)",
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
const names = ['Ø£Ø­Ù…Ø¯', 'Ù…Ø­Ù…Ø¯', 'Ù…Ø­Ù…ÙˆØ¯', 'Ø³Ø§Ø±Ø©', 'Ù†Ù‡Ù‰', 'ÙƒØ±ÙŠÙ…', 'Ù…ØµØ·ÙÙ‰', 'ÙŠØ§Ø³Ù…ÙŠÙ†', 'Ø¥Ø³Ù„Ø§Ù…', 'Ù†ÙˆØ±Ù‡Ø§Ù†'];
const govs = ['Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©', 'Ø§Ù„Ø¬ÙŠØ²Ø©', 'Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©', 'Ø§Ù„Ù…Ù†ØµÙˆØ±Ø©', 'Ø·Ù†Ø·Ø§', 'Ø£Ø³ÙŠÙˆØ·', 'Ø§Ù„Ø²Ù‚Ø§Ø²ÙŠÙ‚'];
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
            <div class="text-sm font-bold text-gray-800">${name} Ù…Ù† ${gov}</div>
            <div class="text-xs text-gray-500 mt-0.5">Ø§Ø´ØªØ±Ù‰ Ø³ÙƒØ±Ø§Ø¨ ${color.name} Ø§Ù„Ø¢Ù†!</div>
        </div>
        <div class="text-red-500 text-xs font-bold animate-pulse">Ù…Ù†Ø° Ù„Ø­Ø¸Ø§Øª</div>
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
        if (phone.length < 10) { alert('Ø¨Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ ØµØ­ÙŠØ­ Ù„ØªØªÙ„Ù‚Ù‰ Ø§Ù„ÙƒÙˆØ¯'); return; }
        
        // Save lead to Google Sheets
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec';
        fetch(scriptURL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: "ØµØ§Ø¦Ø¯ Ø§Ù„Ù…Ù†Ø³Ø­Ø¨ÙŠÙ† (Ø·Ù„Ø¨ Ø®ØµÙ…)", 
                phone: phone, 
                city: "-", address: "-", 
                productDetails: "Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ø³ØªÙ„Ù… ÙƒÙˆØ¯ Ø®ØµÙ… 5% (DOCTOR5)" 
            })
        }).catch(err => console.log(err));
        
        // Send to Vercel API for Telegram + Gemini
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'exit_intent',
                phone: phone,
                details: "Ø§Ø³ØªÙ„Ù… ÙƒÙˆØ¯ DOCTOR5"
            })
        }).catch(e=>{});
        
        // Show code
        document.getElementById('exitPhoneContainer').classList.add('hidden');
        document.getElementById('exitCodeContainer').classList.remove('hidden');
        document.getElementById('exitPopupText').innerHTML = 'ØªÙ‡Ø§Ù†ÙŠÙ†Ø§! Ø§Ù„ÙƒÙˆØ¯ ØµØ§Ù„Ø­ Ù„Ù…Ø¯Ø© <span class="bg-yellow-200 px-1 rounded text-dark">5 Ø¯Ù‚Ø§Ø¦Ù‚</span> ÙÙ‚Ø·!';
        claimExitDiscountBtn.innerText = 'Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø®ØµÙ… Ø§Ù„Ø¢Ù†!';
        hasActiveDiscount = true;
    } else {
        // Apply discount step
        hideExitPopup();
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        
        stickyCTA.innerHTML = `
            <div class="text-right flex-grow">
                <div class="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mb-0.5">âœ… ØªÙ… ØªÙØ¹ÙŠÙ„ ÙƒÙˆØ¯ DOCTOR5</div>
                <div class="text-sm font-black text-gray-900 leading-none">Ø§Ø³ØªÙ…ØªØ¹ Ø¨Ø®ØµÙ… 5% Ø¹Ù„Ù‰ Ø·Ù„Ø¨Ùƒ</div>
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
