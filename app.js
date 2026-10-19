// --- Dynamic CMS Data ---
let cmsData = { prices: { basePrice: 900, fakePrice: 1300, twoPiecesPrice: 1800 }, inventory: null };
const scriptURL = "https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec";

fetch(scriptURL + "?action=get_data")
    .then(res => res.json())
    .then(data => {
        if(data.prices && data.inventory) {
            let bp = parseFloat(data.prices.basePrice);
            let fp = parseFloat(data.prices.fakePrice);
            let tp = parseFloat(data.prices.twoPiecesPrice);
            
            cmsData = data;
            cmsData.prices.basePrice = isNaN(bp) ? 900 : bp;
            cmsData.prices.fakePrice = isNaN(fp) ? 1300 : fp;
            cmsData.prices.twoPiecesPrice = isNaN(tp) ? 1800 : tp;

            document.querySelectorAll(".product-price-tag").forEach(el => {
                el.innerHTML = `<span>${cmsData.prices.basePrice} <span class="text-xs font-bold text-slate-500">EGP</span></span> <span class="text-xs text-slate-400 line-through font-normal font-mono">${cmsData.prices.fakePrice}</span>`;
            });
            
            // Announcement Bar
            if (cmsData.announcement && cmsData.announcement.active && cmsData.announcement.text) {
                const bar = document.getElementById('cmsAnnouncement');
                if(bar) {
                    bar.innerHTML = cmsData.announcement.text;
                    bar.classList.remove('hidden');
                }
            }

            // Populate Governorates if custom rates exist
            if (cmsData.shippingRates) {
                const govSelect = document.getElementById('custGov');
                if (govSelect) {
                    govSelect.innerHTML = '<option value="">Select Governorate / اختر المحافظة...</option>';
                    Object.keys(cmsData.shippingRates).forEach(gov => {
                        const opt = document.createElement('option');
                        opt.value = gov;
                        opt.textContent = gov;
                        govSelect.appendChild(opt);
                    });
                }
            }
        }
    }).catch(err => console.error("CMS sync:", err));

// --- Products Configuration (6 Distinctive Haute Couture Colors) ---
const colors = [
    { id: 'black', name: 'Onyx Black', hex: '#1f2022', images: ['Black_1.jpg', 'black_2.jpg', 'black_3.jpg'] },
    { id: 'navy', name: 'Royal Navy', hex: '#1b263b', images: ['navy_1.jpg', 'navy_2.jpg', 'navy_3.jpg'] },
    { id: 'blue', name: 'Ceil Blue', hex: '#274c77', images: ['blue_1.jpg', 'blue_2.jpg', 'blue_3.jpg'] },
    { id: 'olive', name: 'Forest Olive', hex: '#4a5d23', images: ['olive_1.jpg', 'olive_2.jpg', 'olive_3.jpg'] },
    { id: 'teal', name: 'Deep Teal', hex: '#1f4e5b', images: ['tael_1.jpg', 'tael_2.jpg', 'tael_3.jpg'] },
    { id: 'pink', name: 'Dusty Rose', hex: '#e5989b', images: ['pink_1.png', 'pink_2.jpg', 'pink_3.jpg'] },
];

let selectedProduct = { color: colors[0], size: null, quantity: 1 };
let currentBaseTotal = 0;

// DOM Elements
const productGrid = document.getElementById('productGrid');
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModal');
const colorSelector = document.getElementById('colorSelector');
const selectedColorName = document.getElementById('selectedColorName');
const selectedSizeLabel = document.getElementById('selectedSizeLabel');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalFakePrice = document.getElementById('modalFakePrice');
const modalMainImg = document.getElementById('modalMainImg');
const modalThumbnails = document.getElementById('modalThumbnails');

const sizeBtns = document.querySelectorAll('.size-btn');
const qtyInput = document.getElementById('qtyInput');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const totalPriceBtn = document.getElementById('totalPriceBtn');
const pricingMessage = document.getElementById('pricingMessage');
const buyBtn = document.getElementById('buyBtn');

// Size Guide Elements
const sizeModal = document.getElementById('sizeModal');
const openSizeGuideBtn = document.getElementById('openSizeGuideBtn');
const openSizeGuideNav = document.getElementById('openSizeGuideNav');
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

// Checkout Elements
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutBtn = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const skipBtn = document.getElementById('skipBtn');

// --- Pricing Logic ---
function calculatePrice(qty) {
    let base = cmsData.prices.basePrice;
    let two = cmsData.prices.twoPiecesPrice;
    if (qty === 1) return { total: base, unit: base, shipping: 'Standard Shipping' };
    if (qty === 2) return { total: two, unit: two / 2, shipping: 'Free Express Shipping' };
    return { total: qty * (two / 2 - 50), unit: (two / 2 - 50), shipping: 'Free Express Shipping' };
}

// --- Initialize Catalog Grid (Clean Orova Minimalist Cards) ---
function initProducts() {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    
    colors.forEach(color => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl transition-all duration-300 group border border-slate-200/90 hover:border-slate-400 overflow-hidden cursor-pointer flex flex-col shadow-sm hover:shadow-xl';
        
        card.innerHTML = `
            <div class="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
                <img src="${color.images[0]}" alt="${color.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" onerror="this.src='https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=80'">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span class="bg-white text-slate-950 font-black px-5 py-2.5 rounded-full text-xs shadow-lg tracking-wider transform translate-y-3 group-hover:translate-y-0 transition-all uppercase">
                        Select Size & Color
                    </span>
                </div>
            </div>
            <div class="p-4 text-center bg-white group-hover:bg-slate-50/50 transition-colors border-t border-slate-100 flex-grow flex flex-col justify-between">
                <div>
                    <h3 class="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight mb-0.5">${color.name}</h3>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Core Scrub Set</div>
                </div>
                <div class="product-price-tag text-slate-900 font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 font-montserrat">
                    <span>${cmsData.prices.basePrice} <span class="text-xs font-bold text-slate-500">EGP</span></span>
                    <span class="text-xs text-slate-400 line-through font-normal font-mono">${cmsData.prices.fakePrice}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openProductModal(color));
        productGrid.appendChild(card);
    });
}

// --- Product Modal Gallery & Details (Orova Layout) ---
function updateModalGallery() {
    if (!modalMainImg || !modalThumbnails) return;
    
    // Set Main Image
    modalMainImg.src = selectedProduct.color.images[0];
    
    // Render 3 Thumbnails
    modalThumbnails.innerHTML = '';
    selectedProduct.color.images.forEach((imgSrc, idx) => {
        const thumb = document.createElement('button');
        thumb.className = `w-14 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${idx === 0 ? 'border-slate-900 shadow-md scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'}`;
        thumb.innerHTML = `<img src="${imgSrc}" class="w-full h-full object-cover">`;
        thumb.addEventListener('click', () => {
            modalMainImg.src = imgSrc;
            Array.from(modalThumbnails.children).forEach(t => {
                t.className = 'w-14 h-16 rounded-lg overflow-hidden border-2 border-slate-200 opacity-60 hover:opacity-100 transition-all cursor-pointer';
            });
            thumb.className = 'w-14 h-16 rounded-lg overflow-hidden border-2 border-slate-900 shadow-md scale-105 transition-all cursor-pointer';
        });
        modalThumbnails.appendChild(thumb);
    });
}

function renderColorSelector() {
    if (!colorSelector) return;
    colorSelector.innerHTML = '';
    colors.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `color-btn w-9 h-9 rounded-full shadow-sm cursor-pointer ${c.id === selectedProduct.color.id ? 'active' : ''}`;
        btn.style.backgroundColor = c.hex;
        btn.title = c.name;
        btn.addEventListener('click', () => {
            selectedProduct.color = c;
            updateModalGallery();
            updateSizeAvailability();
            updateModalUI();
            renderColorSelector();
        });
        colorSelector.appendChild(btn);
    });
}

function updateSizeAvailability() {
    selectedProduct.size = null;
    if (selectedSizeLabel) selectedSizeLabel.innerText = '';
    
    sizeBtns.forEach(btn => {
        btn.classList.remove('active', 'disabled');
        const s = btn.getAttribute('data-size');
        const colorId = selectedProduct.color.id;
        
        let isAvailable = true;
        if (colorId === 'pink') {
            if (s === '3XL') isAvailable = false;
        } else if (colorId === 'olive') {
            if (s !== 'M' && s !== 'L' && s !== 'XXL') isAvailable = false;
        } else if (colorId === 'blue') {
            if (s !== 'XL' && s !== 'XXL') isAvailable = false;
        } else if (colorId === 'teal') {
            if (s !== 'M' && s !== 'XL') isAvailable = false;
        } else if (colorId === 'navy' || colorId === 'black') {
            isAvailable = true;
        }

        if (!isAvailable) {
            btn.classList.add('disabled');
            btn.title = 'Sold Out';
        } else {
            btn.title = `Size ${s}`;
        }
    });
}

sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.classList.contains('disabled')) return;
        setSize(btn.getAttribute('data-size'));
    });
});

function setSize(size) {
    sizeBtns.forEach(b => b.classList.remove('active'));
    const btn = Array.from(sizeBtns).find(b => b.getAttribute('data-size') === size);
    if (btn) btn.classList.add('active');
    selectedProduct.size = size;
    if (selectedSizeLabel) selectedSizeLabel.innerText = size;
}

qtyMinus.addEventListener('click', () => {
    if (selectedProduct.quantity > 1) { 
        selectedProduct.quantity--; 
        updateModalUI(); 
    }
});

qtyPlus.addEventListener('click', () => {
    selectedProduct.quantity++; 
    updateModalUI();
});

function updateModalUI() {
    if (selectedColorName) selectedColorName.innerText = selectedProduct.color.name;
    if (modalTitle) modalTitle.innerText = `${selectedProduct.color.name} Set`;
    if (qtyInput) qtyInput.value = selectedProduct.quantity;

    const pricing = calculatePrice(selectedProduct.quantity);
    currentBaseTotal = pricing.total;
    
    if (modalPrice) modalPrice.innerText = `${currentBaseTotal} EGP`;
    if (modalFakePrice) modalFakePrice.innerText = `${cmsData.prices.fakePrice * selectedProduct.quantity} EGP`;
    if (totalPriceBtn) totalPriceBtn.innerText = `(${currentBaseTotal} EGP)`;

    if (pricingMessage) {
        if (selectedProduct.quantity === 1) {
            pricingMessage.innerHTML = '<i class="fa-solid fa-truck-fast text-gold-600"></i> <span>Add 1 more set to unlock complimentary express delivery</span>';
        } else {
            pricingMessage.innerHTML = '<i class="fa-solid fa-sparkles text-emerald-600"></i> <span class="text-emerald-800 font-bold">Complimentary VIP Express Delivery Unlocked!</span>';
        }
    }
}

function openProductModal(color) {
    selectedProduct.color = color;
    selectedProduct.quantity = 1;
    
    updateModalGallery();
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

if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);
if (productModal) {
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeProductModal();
    });
}

// --- Accordion Toggle Function ---
window.toggleAccordion = function(headerEl) {
    const item = headerEl.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close other open accordions
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    
    if (!isActive) {
        item.classList.add('active');
    }
};

// --- Size Chart Modal Logic ---
function openSizeModalFunc() {
    if (!sizeModal) return;
    sizeModal.classList.remove('hidden');
    setTimeout(() => { sizeModal.classList.add('show'); }, 10);
}
function closeSizeModalFunc() {
    if (!sizeModal) return;
    sizeModal.classList.remove('show');
    setTimeout(() => { sizeModal.classList.add('hidden'); }, 300);
}

if (openSizeGuideBtn) openSizeGuideBtn.addEventListener('click', openSizeModalFunc);
if (openSizeGuideNav) openSizeGuideNav.addEventListener('click', openSizeModalFunc);
if (closeSizeModal) closeSizeModal.addEventListener('click', closeSizeModalFunc);
if (sizeModal) {
    sizeModal.addEventListener('click', (e) => {
        if (e.target === sizeModal) closeSizeModalFunc();
    });
}

// Tab Switching (Chart vs Calculator)
if (tabChart && tabCalc) {
    tabChart.addEventListener('click', () => {
        tabChart.className = 'flex-1 py-2 text-xs font-bold bg-white shadow-sm rounded-md text-slate-900 transition cursor-pointer';
        tabCalc.className = 'flex-1 py-2 text-xs font-bold text-slate-500 transition cursor-pointer';
        contentChart.classList.remove('hidden');
        contentCalc.classList.add('hidden');
    });

    tabCalc.addEventListener('click', () => {
        tabCalc.className = 'flex-1 py-2 text-xs font-bold bg-white shadow-sm rounded-md text-slate-900 transition cursor-pointer';
        tabChart.className = 'flex-1 py-2 text-xs font-bold text-slate-500 transition cursor-pointer';
        contentCalc.classList.remove('hidden');
        contentChart.classList.add('hidden');
    });
}

// Smart Size Calculator Calculation
if (btnCalcSize) {
    btnCalcSize.addEventListener('click', () => {
        const w = parseFloat(calcWeight.value);
        const h = parseFloat(calcHeight.value);
        if (!w || !h) {
            alert('Please enter valid height and weight values');
            return;
        }
        
        let rec = 'L';
        if (w < 65) rec = 'S';
        else if (w >= 65 && w < 78) rec = 'M';
        else if (w >= 78 && w < 90) rec = 'L';
        else if (w >= 90 && w < 102) rec = 'XL';
        else if (w >= 102 && w < 115) rec = 'XXL';
        else rec = '3XL';
        
        recommendedSizeTxt.innerText = rec;
        calcResult.classList.remove('hidden');
    });
}

if (useRecommendedSize) {
    useRecommendedSize.addEventListener('click', () => {
        const rec = recommendedSizeTxt.innerText.trim();
        setSize(rec);
        closeSizeModalFunc();
    });
}

// --- Checkout Modal Logic ---
if (buyBtn) {
    buyBtn.addEventListener('click', () => {
        if (!selectedProduct.size) {
            alert('Please select your preferred size first');
            return;
        }
        checkoutModal.classList.remove('hidden');
        setTimeout(() => { checkoutModal.classList.add('show'); }, 10);
    });
}

if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('show');
        setTimeout(() => { checkoutModal.classList.add('hidden'); }, 300);
    });
}

// --- Order Submission (WhatsApp + Google Sheet + Meta Pixel) ---
function submitOrder(customerData = null) {
    const pricing = calculatePrice(selectedProduct.quantity);
    let finalTotal = pricing.total;
    
    let msg = `*NEW MEDICAL SCRUB ORDER (PIONEER)*\n\n`;
    msg += `• Item: [Core Series] ${selectedProduct.color.name} Set\n`;
    msg += `• Size: ${selectedProduct.size}\n`;
    msg += `• Quantity: ${selectedProduct.quantity}\n`;
    msg += `• Total: ${finalTotal} EGP (${pricing.shipping})\n`;
    msg += `• Policy: Doorstep Inspection with Courier • 3-Day Size Exchange\n\n`;
    
    if (customerData) {
        msg += `*DELIVERY INFORMATION:*\n`;
        msg += `• Name: ${customerData.name}\n`;
        msg += `• Phone: ${customerData.phone}\n`;
        if (customerData.phone2) msg += `• Alt Phone: ${customerData.phone2}\n`;
        msg += `• Governorate: ${customerData.gov}\n`;
        msg += `• Address: ${customerData.address}\n`;
        if (customerData.notes) msg += `• Special Notes: ${customerData.notes}\n`;
    }
    
    const merchantPhone = "201069337788";
    const whatsappUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(msg)}`;
    
    if (customerData) {
        const fullPhone = customerData.phone2 ? `${customerData.phone} / ${customerData.phone2}` : customerData.phone;
        const productDetailsText = `Medical Scrub | ${selectedProduct.color.name} | Size: ${selectedProduct.size} | Qty: ${selectedProduct.quantity} | Total: ${finalTotal}`;
        
        try {
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: customerData.name,
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
            console.error('Save error:', error);
        }
        
        // Notify API
        fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'new_order',
                phone: customerData.phone,
                name: customerData.name,
                details: `Order: ${selectedProduct.color.name} size ${selectedProduct.size}`,
                finalTotal: finalTotal
            })
        }).catch(e => {});
    }

    window.open(whatsappUrl, '_blank');
    if (checkoutModal) {
        checkoutModal.classList.remove('show');
        setTimeout(() => { checkoutModal.classList.add('hidden'); }, 300);
    }
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const phone2 = document.getElementById('custPhone2').value.trim();
        const gov = document.getElementById('custGov').value;
        const address = document.getElementById('custAddress').value.trim();
        const notes = document.getElementById('custNotes').value.trim();
        
        submitOrder({ name, phone, phone2, gov, address, notes });
    });
}

if (skipBtn) {
    skipBtn.addEventListener('click', () => {
        submitOrder(null);
    });
}

// Initialize on Load
initProducts();
