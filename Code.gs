/**
 * Pioneer Medical Wear - Google Apps Script Backend (Code.gs)
 * Version: 2.0 (High Reliability, Multi-Tab, Auto Telegram, Inventory & Meta CAPI)
 * 
 * Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script.
 * 2. Paste this code into Code.gs (replacing everything).
 * 3. In Project Settings -> Script properties, add:
 *    - TG_TOKEN: Your Telegram bot token (from BotFather)
 *    - TG_CHAT_ID: Your Telegram chat ID (group or channel)
 *    - META_CAPI_TOKEN: (Optional) Meta Conversions API Access Token
 * 4. Deploy -> New deployment -> Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Run "Pioneer -> تجهيز الشيت" from the spreadsheet menu bar.
 */

// --- Default Configuration (fallback if not in sheet) ---
const CONFIG = {
  PIXEL_ID: '1835661177259760',
  DEFAULT_PRICES: {
    basePrice: 900,
    twoPiecesPrice: 1800,
    threePlusUnitPrice: 850
  },
  DEFAULT_SHIPPING: {
    'القاهرة': 70,
    'الجيزة': 70,
    'الإسكندرية': 80,
    'القليوبية': 80,
    'الدقهلية': 80,
    'الغربية': 80,
    'الشرقية': 80,
    'المنوفية': 80,
    'البحيرة': 80,
    'بورسعيد': 90,
    'الإسماعيلية': 90,
    'السويس': 90,
    'دمياط': 90,
    'كفر الشيخ': 90,
    'مطروح': 90,
    'الفيوم': 100,
    'بني سويف': 100,
    'المنيا': 100,
    'أسيوط': 100,
    'سوهاج': 100,
    'قنا': 100,
    'الأقصر': 100,
    'أسوان': 100,
    'البحر الأحمر': 100,
    'الوادي الجديد': 100,
    'شمال سيناء': 100,
    'جنوب سيناء': 100
  },
  COLOR_MAP: {
    'black': 'أسود أونيكس (Onyx Black)',
    'navy': 'كحلي ملكي (Royal Navy)',
    'blue': 'أزرق سماوي (Ceil Blue)',
    'burgundy': 'برغندي كلاسيك (Classic Burgundy)',
    'olive': 'زيتوني هادئ (Sage Olive)'
  }
};

// --- Custom Menu in Google Sheets ---
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Pioneer 🩺')
    .addItem('⚙️ تجهيز الشيت (إنشاء التابات والعناوين)', 'setupSheets')
    .addItem('📱 اختبار اتصال تليجرام', 'testTelegram')
    .addItem('🔄 نقل العملاء المحتملين القدام إلى تاب منفصل', 'migrateOldLeads')
    .addItem('📊 تحديث تاب الملخص والتحليلات', 'updateSummaryTab')
    .addToUi();
}

// --- GET Request: Provides Catalog, Prices, Inventory, Shipping ---
function doGet(e) {
  try {
    const action = e?.parameter?.action || 'get_data';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'get_data' || action === 'ping') {
      const prices = getPricesFromSheet(ss);
      const shippingRates = getShippingRatesFromSheet(ss);
      const inventory = getInventoryFromSheet(ss);
      const announcement = getAnnouncementFromSheet(ss);

      const responseData = {
        ok: true,
        prices: prices,
        shippingRates: shippingRates,
        inventory: inventory,
        announcement: announcement
      };

      return ContentService.createTextOutput(JSON.stringify(responseData))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'Pioneer API Active' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- POST Request: Handles Orders & Leads with Strict Lock & Validation ---
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 15 seconds to acquire lock
    lock.waitLock(15000);

    const rawContent = e?.postData?.contents;
    if (!rawContent) {
      return returnJson({ ok: false, error: 'Empty payload' });
    }

    const data = JSON.parse(rawContent);

    // 1. Honeypot check (website field must be strictly empty)
    if (data.website && String(data.website).trim() !== '') {
      return returnJson({ ok: false, error: 'Spam detected' });
    }

    // 2. Daily Rate Limiting (max 400 writes per day)
    if (!checkDailyLimit()) {
      return returnJson({ ok: false, error: 'Daily request quota reached' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const kind = data.kind || (data.orderId ? 'order' : 'lead');

    if (kind === 'order') {
      return handleOrderSubmission(ss, data);
    } else if (kind === 'lead') {
      return handleLeadSubmission(ss, data);
    } else {
      return returnJson({ ok: false, error: 'Unknown kind: ' + kind });
    }

  } catch (err) {
    return returnJson({ ok: false, error: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

// Helper to return JSON output
function returnJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- 1. Order Submission Handler ---
function handleOrderSubmission(ss, data) {
  const name = String(data.name || '').trim();
  const rawPhone = String(data.phone || '').trim();
  const phone = rawPhone.replace(/\D/g, '');
  const gov = String(data.gov || '').trim();
  const address = String(data.address || '').trim();
  const qty = parseInt(data.qty) || 1;
  const colorId = String(data.color || 'navy').toLowerCase();
  const colorName = CONFIG.COLOR_MAP[colorId] || data.color || 'كحلي ملكي';
  const size = String(data.size || 'L').toUpperCase();
  const notes = String(data.notes || '').trim();

  // Egyptian 11 digits validation: 010, 011, 012, 015
  if (!name || name.length < 2) {
    return returnJson({ ok: false, error: 'برجاء كتابة الاسم بشكل صحيح' });
  }
  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    return returnJson({ ok: false, error: 'رقم الموبايل يجب أن يتكون من 11 رقماً ويبدأ بـ 01' });
  }
  if (!gov || !address || address.length < 3) {
    return returnJson({ ok: false, error: 'برجاء اختيار المحافظة وكتابة العنوان بالتفصيل' });
  }

  // Calculate pricing & shipping server-side from Sheet data
  const prices = getPricesFromSheet(ss);
  const shippingRates = getShippingRatesFromSheet(ss);

  let subtotal = 0;
  let isFreeShipping = false;
  if (qty === 1) {
    subtotal = prices.basePrice;
    isFreeShipping = false;
  } else if (qty === 2) {
    subtotal = prices.twoPiecesPrice;
    isFreeShipping = true;
  } else {
    subtotal = qty * prices.threePlusUnitPrice;
    isFreeShipping = true;
  }

  let shippingCost = 0;
  if (!isFreeShipping) {
    shippingCost = shippingRates[gov] !== undefined ? shippingRates[gov] : (CONFIG.DEFAULT_SHIPPING[gov] || 80);
  }

  const finalTotal = subtotal + shippingCost;

  // Generate unique order ID: PW-YYMMDD-XXX
  const orderId = generateOrderId(ss);

  // Write to "الطلبات" sheet
  const ordersSheet = getOrCreateSheet(ss, 'الطلبات');
  const headers = getSheetHeaders(ordersSheet);
  const timestamp = new Date();

  const productDetails = `سكراب: ${colorName} | مقاس: ${size} | كمية: ${qty}`;
  const rowObject = {
    'رقم الطلب': orderId,
    'كود الطلب': orderId,
    'التاريخ': Utilities.formatDate(timestamp, 'Africa/Cairo', 'yyyy-MM-dd HH:mm:ss'),
    'التاريخ والوقت': Utilities.formatDate(timestamp, 'Africa/Cairo', 'yyyy-MM-dd HH:mm:ss'),
    'الاسم': 'د. ' + name,
    'الموبايل': "'" + phone,
    'رقم التليفون': "'" + phone,
    'رقم بديل': data.phone2 ? "'" + data.phone2 : '',
    'المحافظة': gov,
    'العنوان': address,
    'الموديل': 'Pioneer Scrub Haute Couture',
    'المنتج والتفاصيل': productDetails,
    'اللون': colorName,
    'المقاس': size,
    'الكمية': qty,
    'إجمالي السكراب': subtotal,
    'سعر البيع الأساسي': subtotal,
    'مصاريف الشحن': shippingCost,
    'كلفة الشحن': shippingCost,
    'الإجمالي': finalTotal,
    'السعر الإجمالي': finalTotal,
    'طريقة الدفع': 'كاش عند الاستلام',
    'الحالة': 'جديد',
    'حالة الأوردر': 'جديد',
    'ملاحظات': notes || '',
    'كود الخصم': data.promo || '',
    'Event ID': data.eventId || ''
  };

  const newRow = mapObjectToRow(rowObject, headers);
  ordersSheet.appendRow(newRow);

  // Deduct inventory
  deductInventory(ss, colorId, size, qty);

  // If this phone exists in "العملاء المحتملين", update its status to "اشترى"
  updateLeadStatusToConverted(ss, phone, orderId);

  // Send Telegram Notification
  const shippingDesc = isFreeShipping ? 'شحن سريع مجاني 🎁' : `${shippingCost} ج.م مصاريف شحن`;
  const waCustomerMessage = 
    `أهلاً يا دكتور ${name}، مع حضرتك فريق Pioneer للملابس الطبية 👨‍⚕️🩺\n` +
    `تم تسجيل طلبك بنجاح برقم: #${orderId}\n` +
    `• الموديل: ${colorName} - مقاس (${size}) - كمية (${qty})\n` +
    `• المطلوب عند الاستلام: ${finalTotal} ج.م (${subtotal} ج.م سكراب + ${shippingDesc})\n` +
    `• العنوان: ${gov} - ${address}\n` +
    `التأكيد والتوصيل خلال 24 ساعة مع إمكانية المعاينة قبل الدفع.\n` +
    `(للإلغاء أرسل قف)`;

  const waLink = `https://wa.me/2${phone}?text=${encodeURIComponent(waCustomerMessage)}`;

  const tgMessage = 
    `🔴 *[ORDER] طلب جديد مؤكد*\n\n` +
    `🆔 *رقم الطلب:* \`${orderId}\`\n` +
    `👤 *العميل:* د. ${name}\n` +
    `📱 *الموبايل:* \`${phone}\`\n` +
    (data.phone2 ? `📞 *رقم بديل:* \`${data.phone2}\`\n` : '') +
    `📍 *المحافظة:* ${gov}\n` +
    `🏠 *العنوان:* ${address}\n` +
    (notes ? `📝 *ملاحظات:* ${notes}\n` : '') +
    `───────────────\n` +
    `👔 *المنتج:* ${colorName}\n` +
    `📏 *المقاس:* ${size} | *الكمية:* ${qty}\n` +
    `💰 *المطلوب:* *${finalTotal} ج.م* (${subtotal} + ${shippingDesc})\n` +
    `───────────────\n` +
    `💬 [فتح محادثة واتساب لتأكيد الطلب](${waLink})`;

  sendTelegramAlert(tgMessage);

  // Meta CAPI Purchase Event (if token exists)
  if (data.eventId) {
    sendMetaCapiEvent({
      eventName: 'Purchase',
      eventId: data.eventId,
      phone: phone,
      value: finalTotal,
      currency: 'EGP',
      numItems: qty,
      url: data.url,
      ua: data.ua,
      fbp: data.fbp,
      fbc: data.fbc
    });
  }

  return returnJson({
    ok: true,
    orderId: orderId,
    total: finalTotal,
    shipping: shippingCost
  });
}

// --- 2. Lead Submission Handler (Deduplicated, 1 row per phone) ---
function handleLeadSubmission(ss, data) {
  const rawPhone = String(data.phone || '').trim();
  const phone = rawPhone.replace(/\D/g, '');
  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    return returnJson({ ok: false, error: 'رقم الموبايل غير صحيح' });
  }

  const leadsSheet = getOrCreateSheet(ss, 'العملاء المحتملين');
  const headers = getSheetHeaders(leadsSheet);
  const timestamp = new Date();
  const source = data.source || 'استفسار موقع';
  const name = data.name || 'عميل محتمل';
  const color = data.color || '';
  const size = data.size || '';
  const details = data.details || '';

  // Check if phone already converted to buyer
  if (isPhoneAlreadyConverted(ss, phone)) {
    return returnJson({ ok: true, status: 'already_converted_buyer' });
  }

  // Deduplicate by phone: update row if exists, else append
  const phoneColIdx = headers.indexOf('الموبايل') + 1;
  let existingRow = -1;
  if (phoneColIdx > 0 && leadsSheet.getLastRow() > 1) {
    const phones = leadsSheet.getRange(2, phoneColIdx, leadsSheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < phones.length; i++) {
      const p = String(phones[i][0]).replace(/\D/g, '');
      if (p === phone) {
        existingRow = i + 2;
        break;
      }
    }
  }

  const rowData = {
    'التاريخ': Utilities.formatDate(timestamp, 'Africa/Cairo', 'yyyy-MM-dd HH:mm:ss'),
    'الموبايل': "'" + phone,
    'الاسم': name,
    'المصدر': source,
    'اللون': color,
    'المقاس': size,
    'التفاصيل': details,
    'الحالة': 'جديد',
    'آخر تواصل': '',
    'ملاحظات': data.notes || '',
    'Event ID': data.eventId || ''
  };

  if (existingRow > 1) {
    // Update existing row
    const rowValues = mapObjectToRow(rowData, headers);
    leadsSheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    // Append new row
    leadsSheet.appendRow(mapObjectToRow(rowData, headers));
  }

  // Send Telegram Notification
  let priorityTag = '💬 [LEAD]';
  let tgTitle = 'ليد جديد من الموقع';
  let waMsg = '';

  if (source.includes('ترك الفورم') || source.includes('checkout_abandon')) {
    priorityTag = '🚨 [HOT LEAD]';
    tgTitle = 'سلة متروكة في صفحة الشراء';
    waMsg = 
      `أهلاً يا دكتور ${name !== 'عميل محتمل' ? name : ''}، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` +
      `لاحظنا اهتمام حضرتك بسكراب Pioneer لون (${color || 'المميز'}) مقاس (${size || 'المقترح'}).\n` +
      `حابين نتأكد لو في أي استفسار بخصوص المقاس أو معاينة واستلام السكراب نقدر نساعد حضرتك فيه؟\n` +
      `(للإلغاء أرسل قف)`;
  } else if (source.includes('حاسبة') || source.includes('size_guide')) {
    priorityTag = '🟡 [WARM LEAD]';
    tgTitle = 'طلب استشارة ومقاس من الحاسبة';
    waMsg = 
      `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` +
      `بناءً على حساب قياسك في الموقع، مقاسك المقترح هو (${size || '-'}) في سكراب Pioneer (${color || ''}).\n` +
      `يسعدنا حجز وتجهيز طلبك مع إمكانية المعاينة مع المندوب قبل الدفع.\n` +
      `(للإلغاء أرسل قف)`;
  } else if (source.includes('خروج') || source.includes('exit_offer')) {
    priorityTag = '✨ [WARM LEAD]';
    tgTitle = 'تفعيل كود شحن مجاني (PIONEER-VIP)';
    waMsg = 
      `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺\n` +
      `بخصوص كود الشحن المجاني السريع (PIONEER-VIP) الخاص بحضرتك على أول طلب سكراب.\n` +
      `الكود مفعل ومربوط برقمك وصالح لمدة 48 ساعة، تحب نساعدك في حجز مقاسك ولونك المفضل؟\n` +
      `(للإلغاء أرسل قف)`;
  } else {
    waMsg = `أهلاً يا دكتور، مع حضرتك فريق Pioneer للملابس الطبية 🩺 يسعدنا مساعدتك في أي استفسار.\n(للإلغاء أرسل قف)`;
  }

  const waLink = `https://wa.me/2${phone}?text=${encodeURIComponent(waMsg)}`;
  const tgText = 
    `*${priorityTag} ${tgTitle}*\n\n` +
    `👤 *الاسم:* ${name}\n` +
    `📱 *الموبايل:* \`${phone}\`\n` +
    `🎯 *المصدر:* ${source}\n` +
    (color ? `👔 *اللون:* ${color}\n` : '') +
    (size ? `📏 *المقاس:* ${size}\n` : '') +
    (details ? `ℹ️ *التفاصيل:* ${details}\n` : '') +
    `───────────────\n` +
    `💬 [فتح محادثة واتساب فورية](${waLink})`;

  sendTelegramAlert(tgText);

  // Meta CAPI Lead Event
  if (data.eventId) {
    sendMetaCapiEvent({
      eventName: 'Lead',
      eventId: data.eventId,
      phone: phone,
      url: data.url,
      ua: data.ua,
      fbp: data.fbp,
      fbc: data.fbc
    });
  }

  return returnJson({ ok: true });
}

// --- Sheet Read Helpers ---
function getPricesFromSheet(ss) {
  try {
    const dash = ss.getSheetByName('لوحة التحكم');
    if (!dash) return CONFIG.DEFAULT_PRICES;

    // Read cells B4, B5, B6 or find by labels
    const basePrice = parseFloat(dash.getRange('B4').getValue()) || CONFIG.DEFAULT_PRICES.basePrice;
    const twoPiecesPrice = parseFloat(dash.getRange('B5').getValue()) || CONFIG.DEFAULT_PRICES.twoPiecesPrice;
    const threePlusUnitPrice = parseFloat(dash.getRange('B6').getValue()) || CONFIG.DEFAULT_PRICES.threePlusUnitPrice;

    return {
      basePrice: isNaN(basePrice) ? 900 : basePrice,
      twoPiecesPrice: isNaN(twoPiecesPrice) ? 1800 : twoPiecesPrice,
      threePlusUnitPrice: isNaN(threePlusUnitPrice) ? 850 : threePlusUnitPrice
    };
  } catch (e) {
    return CONFIG.DEFAULT_PRICES;
  }
}

function getShippingRatesFromSheet(ss) {
  try {
    const dash = ss.getSheetByName('لوحة التحكم');
    if (!dash) return CONFIG.DEFAULT_SHIPPING;

    // Read range E16:F42 (Governorate & Price)
    const values = dash.getRange('E16:F42').getValues();
    const rates = {};
    for (let i = 0; i < values.length; i++) {
      const gov = String(values[i][0]).trim();
      const rate = parseFloat(values[i][1]);
      if (gov && !isNaN(rate)) {
        rates[gov] = rate;
      }
    }

    if (Object.keys(rates).length > 0) return rates;
    return CONFIG.DEFAULT_SHIPPING;
  } catch (e) {
    return CONFIG.DEFAULT_SHIPPING;
  }
}

function getInventoryFromSheet(ss) {
  try {
    const invSheet = ss.getSheetByName('المخزون');
    if (!invSheet) return null;

    const data = invSheet.getDataRange().getValues();
    if (data.length < 2) return null;

    const headers = data[0].map(h => String(h).trim().toUpperCase());
    const inventory = {};

    for (let r = 1; r < data.length; r++) {
      const colorKey = String(data[r][0]).toLowerCase().trim();
      if (!colorKey) continue;
      inventory[colorKey] = {};

      for (let c = 1; c < headers.length; c++) {
        const size = headers[c];
        const qty = parseInt(data[r][c]);
        inventory[colorKey][size] = isNaN(qty) ? 0 : qty;
      }
    }
    return inventory;
  } catch (e) {
    return null;
  }
}

function getAnnouncementFromSheet(ss) {
  try {
    const dash = ss.getSheetByName('لوحة التحكم');
    if (!dash) return { active: true, text: 'توصيل سريع مجاني عند طلب طقمين أو أكثر • الدفع عند الاستلام' };
    const text = dash.getRange('B10').getValue();
    return {
      active: true,
      text: text ? String(text) : 'توصيل سريع مجاني عند طلب طقمين أو أكثر • الدفع عند الاستلام'
    };
  } catch (e) {
    return { active: true, text: 'توصيل سريع مجاني عند طلب طقمين أو أكثر • الدفع عند الاستلام' };
  }
}

// Deduct inventory after an order
function deductInventory(ss, colorId, size, qty) {
  try {
    const invSheet = ss.getSheetByName('المخزون');
    if (!invSheet) return;

    const data = invSheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0].map(h => String(h).trim().toUpperCase());
    const sizeColIdx = headers.indexOf(size.toUpperCase());
    if (sizeColIdx === -1) return;

    for (let r = 1; r < data.length; r++) {
      const rowColor = String(data[r][0]).toLowerCase().trim();
      if (rowColor === colorId) {
        const currentQty = parseInt(data[r][sizeColIdx]) || 0;
        const newQty = Math.max(0, currentQty - qty);
        invSheet.getRange(r + 1, sizeColIdx + 1).setValue(newQty);
        break;
      }
    }
  } catch (e) {
    console.error('Inventory deduct error: ' + e);
  }
}

// Check if phone already converted
function isPhoneAlreadyConverted(ss, phone) {
  try {
    const ordersSheet = ss.getSheetByName('الطلبات');
    if (!ordersSheet || ordersSheet.getLastRow() < 2) return false;
    const headers = getSheetHeaders(ordersSheet);
    const phoneIdx = headers.indexOf('الموبايل') + 1;
    if (phoneIdx <= 0) return false;

    const phones = ordersSheet.getRange(2, phoneIdx, ordersSheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < phones.length; i++) {
      if (String(phones[i][0]).replace(/\D/g, '') === phone) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Update lead status to "اشترى"
function updateLeadStatusToConverted(ss, phone, orderId) {
  try {
    const leadsSheet = ss.getSheetByName('العملاء المحتملين');
    if (!leadsSheet || leadsSheet.getLastRow() < 2) return;
    const headers = getSheetHeaders(leadsSheet);
    const phoneIdx = headers.indexOf('الموبايل') + 1;
    const statusIdx = headers.indexOf('الحالة') + 1;
    const notesIdx = headers.indexOf('ملاحظات') + 1;
    if (phoneIdx <= 0 || statusIdx <= 0) return;

    const phones = leadsSheet.getRange(2, phoneIdx, leadsSheet.getLastRow() - 1, 1).getValues();
    for (let i = 0; i < phones.length; i++) {
      if (String(phones[i][0]).replace(/\D/g, '') === phone) {
        leadsSheet.getRange(i + 2, statusIdx).setValue('اشترى');
        if (notesIdx > 0) {
          leadsSheet.getRange(i + 2, notesIdx).setValue(`أوردر رقم: ${orderId}`);
        }
      }
    }
  } catch (e) {
    console.error('Update lead status error: ' + e);
  }
}

// Generate Order ID: PW-YYMMDD-XXX
function generateOrderId(ss) {
  const dateStr = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyMMdd');
  const cache = CacheService.getScriptCache();
  let count = parseInt(cache.get('pioneer_order_seq_' + dateStr) || '0');

  if (count === 0) {
    // Read count of today orders from sheet
    const sheet = ss.getSheetByName('الطلبات');
    if (sheet && sheet.getLastRow() > 1) {
      count = sheet.getLastRow() - 1;
    }
  }
  count++;
  cache.put('pioneer_order_seq_' + dateStr, String(count), 21600); // 6 hours

  const seq = ('000' + count).slice(-3);
  return `PW-${dateStr}-${seq}`;
}

// --- Telegram Alerts ---
function sendTelegramAlert(markdownText) {
  try {
    const props = PropertiesService.getScriptProperties();
    const token = props.getProperty('TG_TOKEN');
    const chatId = props.getProperty('TG_CHAT_ID');

    if (!token || !chatId) {
      console.warn('Telegram TG_TOKEN or TG_CHAT_ID missing in Script Properties');
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: markdownText,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error('Telegram alert error: ' + e);
  }
}

// --- Meta CAPI Server Dispatch ---
function sendMetaCapiEvent(eventData) {
  try {
    const props = PropertiesService.getScriptProperties();
    const accessToken = props.getProperty('META_CAPI_TOKEN');
    if (!accessToken) return;

    const pixelId = CONFIG.PIXEL_ID;
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    // Hash phone with SHA-256
    let hashedPhone = null;
    if (eventData.phone) {
      let ph = String(eventData.phone).replace(/\D/g, '');
      if (ph.startsWith('01')) ph = '2' + ph;
      const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, ph, Utilities.Charset.UTF_8);
      hashedPhone = digest.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
    }

    const user_data = {};
    if (hashedPhone) user_data.ph = [hashedPhone];
    if (eventData.fbp) user_data.fbp = eventData.fbp;
    if (eventData.fbc) user_data.fbc = eventData.fbc;
    if (eventData.ua) user_data.client_user_agent = eventData.ua;

    const custom_data = {};
    if (eventData.value !== undefined) {
      custom_data.value = eventData.value;
      custom_data.currency = eventData.currency || 'EGP';
    }
    if (eventData.numItems) custom_data.num_items = eventData.numItems;

    const postBody = {
      data: [{
        event_name: eventData.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventData.eventId,
        event_source_url: eventData.url || 'https://pioneer-wear.vercel.app/',
        action_source: 'website',
        user_data: user_data,
        custom_data: custom_data
      }]
    };

    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(postBody),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error('Meta CAPI error: ' + e);
  }
}

// Daily rate limit check (max 400 writes/day)
function checkDailyLimit() {
  const cache = CacheService.getScriptCache();
  const todayKey = 'daily_write_count_' + Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyyMMdd');
  let currentCount = parseInt(cache.get(todayKey) || '0');
  if (currentCount >= 400) return false;
  cache.put(todayKey, String(currentCount + 1), 86400);
  return true;
}

// --- Sheet Management & Setup ---
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Orders Sheet
  const ordersSheet = getOrCreateSheet(ss, 'الطلبات');
  const orderHeaders = [
    'رقم الطلب', 'التاريخ', 'الاسم', 'الموبايل', 'رقم بديل', 'المحافظة', 'العنوان',
    'الموديل', 'اللون', 'المقاس', 'الكمية', 'إجمالي السكراب', 'مصاريف الشحن',
    'الإجمالي', 'طريقة الدفع', 'الحالة', 'ملاحظات', 'كود الخصم', 'Event ID'
  ];
  setupSheetHeaders(ordersSheet, orderHeaders, '#1B263B');

  // 2. Leads Sheet
  const leadsSheet = getOrCreateSheet(ss, 'العملاء المحتملين');
  const leadHeaders = [
    'التاريخ', 'الموبايل', 'الاسم', 'المصدر', 'اللون', 'المقاس',
    'التفاصيل', 'الحالة', 'آخر تواصل', 'ملاحظات', 'Event ID'
  ];
  setupSheetHeaders(leadsSheet, leadHeaders, '#274C77');

  // 3. Inventory Sheet
  const invSheet = getOrCreateSheet(ss, 'المخزون');
  if (invSheet.getLastRow() === 0) {
    const invHeaders = ['اللون', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
    setupSheetHeaders(invSheet, invHeaders, '#1F2022');
    invSheet.appendRow(['black', 10, 15, 20, 15, 10, 5]);
    invSheet.appendRow(['navy', 15, 20, 25, 20, 10, 5]);
    invSheet.appendRow(['blue', 0, 0, 0, 10, 10, 0]);
    invSheet.appendRow(['burgundy', 10, 15, 15, 10, 5, 0]);
    invSheet.appendRow(['olive', 10, 15, 15, 10, 5, 0]);
  }

  // 4. Summary Sheet
  updateSummaryTab();

  SpreadsheetApp.getUi().alert('✅ تم تجهيز الشيت بنجاح! تم إنشاء التابات وتنسيق العناوين.');
}

function setupSheetHeaders(sheet, headers, bgColor) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    // Check if headers match, set row 1
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

function getOrCreateSheet(ss, name) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  return s;
}

function getSheetHeaders(sheet) {
  if (sheet.getLastRow() < 1) return [];
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  return range.getValues()[0].map(h => String(h).trim());
}

function mapObjectToRow(obj, headers) {
  return headers.map(h => obj[h] !== undefined ? obj[h] : '');
}

// Test Telegram Connection
function testTelegram() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TG_TOKEN');
  const chatId = props.getProperty('TG_CHAT_ID');

  if (!token || !chatId) {
    SpreadsheetApp.getUi().alert('❌ برجاء إضافة TG_TOKEN و TG_CHAT_ID في Script Properties أولاً.');
    return;
  }

  sendTelegramAlert('🩺 *تجربة اتصال Pioneer Medical Wear*\nالاتصال بين جوجل شيت وتليجرام يعمل بنجاح 100%! 🚀');
  SpreadsheetApp.getUi().alert('✅ تم إرسال رسالة تجريبية لتليجرام. تفقد المحادثة الآن!');
}

// Migrate Old Leads from Orders Sheet
function migrateOldLeads() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('الطلبات') || ss.getSheets()[0];
  const leadsSheet = getOrCreateSheet(ss, 'العملاء المحتملين');
  const data = ordersSheet.getDataRange().getValues();

  let migratedCount = 0;
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const details = String(row[16] || row[15] || row[6] || ''); // search for "وزن" or "طول"
    const isLead = details.includes('وزن') || details.includes('طول') || details.includes('استشارة') || details.includes('ليد');

    if (isLead) {
      const phone = String(row[3] || '').replace(/\D/g, '');
      const name = String(row[2] || '');
      leadsSheet.appendRow([
        row[1] || new Date(),
        "'" + phone,
        name,
        'ليد قديم منقول',
        row[7] || '',
        row[8] || '',
        details,
        'قديم',
        '',
        '',
        ''
      ]);
      ordersSheet.getRange(r + 1, 1, 1, ordersSheet.getLastColumn()).setBackground('#E0E0E0');
      migratedCount++;
    }
  }

  SpreadsheetApp.getUi().alert(`✅ تم نقل ${migratedCount} ليد قديم وتظليلهم باللون الرمادي في شيت الطلبات.`);
}

// Update Summary / Analytics Tab
function updateSummaryTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = getOrCreateSheet(ss, 'ملخص');
  summarySheet.clear();

  const ordersSheet = ss.getSheetByName('الطلبات');
  const leadsSheet = ss.getSheetByName('العملاء المحتملين');

  const ordersData = ordersSheet && ordersSheet.getLastRow() > 1 ? ordersSheet.getDataRange().getValues() : [];
  const leadsData = leadsSheet && leadsSheet.getLastRow() > 1 ? leadsSheet.getDataRange().getValues() : [];

  let todayOrders = 0;
  let todayRevenue = 0;
  let todayLeads = 0;
  let last7Orders = 0;
  let last7Revenue = 0;
  const govCounts = {};

  const todayStr = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  // Orders analysis
  for (let i = 1; i < ordersData.length; i++) {
    const dateVal = ordersData[i][1];
    const dateStr = String(dateVal).slice(0, 10);
    const total = parseFloat(ordersData[i][13]) || 0;
    const gov = String(ordersData[i][5] || '').trim();

    if (dateStr === todayStr) {
      todayOrders++;
      todayRevenue += total;
    }
    if (new Date(dateVal) >= sevenDaysAgo) {
      last7Orders++;
      last7Revenue += total;
    }
    if (gov) {
      govCounts[gov] = (govCounts[gov] || 0) + 1;
    }
  }

  // Leads analysis
  for (let i = 1; i < leadsData.length; i++) {
    const dateStr = String(leadsData[i][0]).slice(0, 10);
    if (dateStr === todayStr) todayLeads++;
  }

  // Write Summary Table
  summarySheet.appendRow(['📊 تقرير وملخص أداء Pioneer', Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm')]);
  summarySheet.appendRow(['المؤشر', 'اليوم', 'آخر 7 أيام']);
  summarySheet.appendRow(['📦 عدد الطلبات', todayOrders, last7Orders]);
  summarySheet.appendRow(['💰 الإيرادات (ج.م)', todayRevenue, last7Revenue]);
  summarySheet.appendRow(['🎯 العملاء المحتملين (Leads)', todayLeads, leadsData.length > 1 ? leadsData.length - 1 : 0]);
  summarySheet.appendRow([]);
  summarySheet.appendRow(['📍 أعلى المحافظات طلباً']);

  const sortedGovs = Object.keys(govCounts).sort((a, b) => govCounts[b] - govCounts[a]);
  sortedGovs.slice(0, 5).forEach(g => {
    summarySheet.appendRow([g, govCounts[g]]);
  });

  const range = summarySheet.getRange('A1:C5');
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
}
