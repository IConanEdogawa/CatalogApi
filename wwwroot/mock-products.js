(() => {
  const STORAGE_KEY = "catalog_mock_products_dev_v2";

  const a = [
    { id: 3001, site: "a", imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/tablet-k10", cost: "366000", text: "Lenovo Xiaoxin K10 10.9-inch 8GB/128GB", createdAt: "2026-01-10T09:00:00Z" },
    { id: 3002, site: "a", imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/tablet-k10", cost: "148790", text: "Lenovo Xiaoxin K10 10.9-inch 8GB/128GB [[PRICE_META:{\"additionalInfo\":\"Korean Wi-Fi model, includes case and tempered glass.\"}]]", createdAt: "2026-01-19T09:00:00Z" },
    { id: 3003, site: "a", imageUrl: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/legion-y700", cost: "1047600", text: "Lenovo Legion Y700 Gen3 Tablet 12GB/256GB", createdAt: "2026-02-20T09:00:00Z" },
    { id: 3004, site: "a", imageUrl: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/legion-y700", cost: "447200", text: "Lenovo Legion Y700 Gen3 Tablet 12GB/256GB [[PRICE_META:{\"additionalInfo\":\"CN ROM with English setup guide included.\"}]]", createdAt: "2026-03-05T09:00:00Z" },
    { id: 3005, site: "a", imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/waplo-pc10", cost: "559000", text: "Waplo PC 10.1 tablet 8GB/128GB", createdAt: "2026-02-10T09:00:00Z" },
    { id: 3006, site: "a", imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/waplo-pc10", cost: "389000", text: "Waplo PC 10.1 tablet 8GB/128GB", createdAt: "2026-03-06T09:00:00Z" },
    { id: 3007, site: "a", imageUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/galaxy-tab-s9", cost: "1220000", text: "Galaxy Tab S9 Ultra 12GB/256GB", createdAt: "2026-02-01T09:00:00Z" },
    { id: 3008, site: "a", imageUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/galaxy-tab-s9", cost: "975000", text: "Galaxy Tab S9 Ultra 12GB/256GB", createdAt: "2026-03-01T09:00:00Z" },
    { id: 3009, site: "a", imageUrl: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/ipad-air", cost: "980000", text: "iPad Air M2 11-inch 128GB", createdAt: "2026-01-11T09:00:00Z" },
    { id: 3010, site: "a", imageUrl: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/ipad-air", cost: "864000", text: "iPad Air M2 11-inch 128GB [[PRICE_META:{\"additionalInfo\":\"Apple Pencil Pro supported. Delivery 3-5 business days.\"}]]", createdAt: "2026-02-28T09:00:00Z" },
    { id: 3011, site: "a", imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/xiaomi-pad-7", cost: "488000", text: "Xiaomi Pad 7 8GB/256GB", createdAt: "2026-02-04T09:00:00Z" },
    { id: 3012, site: "a", imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/xiaomi-pad-7", cost: "411000", text: "Xiaomi Pad 7 8GB/256GB", createdAt: "2026-03-02T09:00:00Z" },
    { id: 3013, site: "a", imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/oneplus-pad-2", cost: "659000", text: "OnePlus Pad 2 12GB/256GB", createdAt: "2026-01-25T09:00:00Z" },
    { id: 3014, site: "a", imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/oneplus-pad-2", cost: "529000", text: "OnePlus Pad 2 12GB/256GB [[PRICE_META:{\"additionalInfo\":\"Global ROM, OTA updates available.\"}]]", createdAt: "2026-03-04T09:00:00Z" },
    { id: 3015, site: "a", imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/lenovo-m11", cost: "299000", text: "Lenovo M11 8GB/128GB + case bundle", createdAt: "2026-02-08T09:00:00Z" },
    { id: 3016, site: "a", imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/lenovo-m11", cost: "239000", text: "Lenovo M11 8GB/128GB + case bundle", createdAt: "2026-03-06T09:00:00Z" },
    { id: 3017, site: "a", imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/huawei-matepad", cost: "888000", text: "Huawei MatePad Pro 12.2 12GB/512GB", createdAt: "2026-01-19T09:00:00Z" },
    { id: 3018, site: "a", imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/huawei-matepad", cost: "742000", text: "Huawei MatePad Pro 12.2 12GB/512GB [[PRICE_META:{\"additionalInfo\":\"No Google Play preinstalled. HMS ecosystem.\"}]]", createdAt: "2026-03-07T09:00:00Z" },
    { id: 3019, site: "a", imageUrl: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/redmi-pad-pro", cost: "379000", text: "Redmi Pad Pro 8GB/256GB", createdAt: "2026-01-14T09:00:00Z" },
    { id: 3020, site: "a", imageUrl: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/redmi-pad-pro", cost: "312000", text: "Redmi Pad Pro 8GB/256GB", createdAt: "2026-02-27T09:00:00Z" },
    { id: 3021, site: "a", imageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/teclast-t65", cost: "349000", text: "Teclast T65 Max 12GB/256GB", createdAt: "2026-01-30T09:00:00Z" },
    { id: 3022, site: "a", imageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/teclast-t65", cost: "274000", text: "Teclast T65 Max 12GB/256GB", createdAt: "2026-03-05T09:00:00Z" },
    { id: 3023, site: "a", imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/alldocube-iplay60", cost: "265000", text: "Alldocube iPlay 60 Pro 8GB/256GB", createdAt: "2026-02-03T09:00:00Z" },
    { id: 3024, site: "a", imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/p/alldocube-iplay60", cost: "219000", text: "Alldocube iPlay 60 Pro 8GB/256GB", createdAt: "2026-03-01T09:00:00Z" }
  ];

  const b = [
    { id: 9101, site: "b", imageUrl: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9101", cost: "1290000", text: "Aurum Workstation Pro, 32GB RAM", createdAt: "2026-02-01T09:00:00Z" },
    { id: 9102, site: "b", imageUrl: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9101", cost: "1090000", text: "Aurum Workstation Pro, 32GB RAM", createdAt: "2026-03-01T09:00:00Z" },
    { id: 9103, site: "b", imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9103", cost: "349000", text: "Executive curved display 34-inch", createdAt: "2026-02-15T09:00:00Z" },
    { id: 9104, site: "b", imageUrl: "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9104", cost: "215000", text: "Boardroom audio dock", createdAt: "2026-02-19T09:00:00Z" },
    { id: 9105, site: "b", imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9105", cost: "132000", text: "Portable SSD set", createdAt: "2026-02-28T09:00:00Z" }
  ];

  const c = [
    { id: 9201, site: "c", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9201", cost: "1580000", text: "Aether Core Engine v3", createdAt: "2026-01-22T09:00:00Z" },
    { id: 9202, site: "c", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9201", cost: "1390000", text: "Aether Core Engine v3 [[PRICE_META:{\"additionalInfo\":\"Prototype batch. Extended warranty available.\"}]]", createdAt: "2026-03-03T09:00:00Z" },
    { id: 9203, site: "c", imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9203", cost: "480000", text: "Brass-tier command tablet", createdAt: "2026-02-07T09:00:00Z" },
    { id: 9204, site: "c", imageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9204", cost: "730000", text: "Signal matrix console", createdAt: "2026-02-18T09:00:00Z" },
    { id: 9205, site: "c", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1200&q=80&auto=format&fit=crop", linkUrl: "https://example.com/item/9205", cost: "142000", text: "Encrypted relay modem", createdAt: "2026-03-05T09:00:00Z" }
  ];

  const base = { a, b, c };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        window.CATALOG_MOCK_PRODUCTS = parsed;
      } else {
        window.CATALOG_MOCK_PRODUCTS = base;
      }
    } else {
      window.CATALOG_MOCK_PRODUCTS = base;
    }
  } catch {
    window.CATALOG_MOCK_PRODUCTS = base;
  }
})();
