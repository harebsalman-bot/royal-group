/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Category, ColorVariant, CompanySettings, SocialLinks } from '../types';

export const mockCategories: Category[] = [
  { id: '1', name: 'صالات', slug: 'living-rooms' },
  { id: '2', name: 'مطابخ', slug: 'kitchens' },
  { id: '3', name: 'غرف نوم', slug: 'bedrooms' },
  { id: '4', name: 'غرف ملابس', slug: 'dressing-rooms' },
  { id: '5', name: 'حمامات', slug: 'bathrooms' },
  { id: '6', name: 'غرف غسيل', slug: 'laundry-rooms' },
  { id: '7', name: 'غرف أطفال', slug: 'kids-rooms' }
];

export const mockCompanySettings: CompanySettings = {
  address: "بغداد - القادسية - مقابل جامع أم الطبول",
  phone: "07704679311",
  whatsapp: "07704679311",
  aboutText: "تأسست شركة Royal Group لتكون الرائدة في مجال التصميم الداخلي الفاخر والتنفيذ المتكامل في العراق. نحن نؤمن بأن المساحات التي نعيش ونعمل بها يجب أن تعكس الرقي والراحة المطلقة. يضم فريقنا نخبة من المهندسين والمصممين ذوي الخبرة الطويلة، لنقدم لعملائنا تجربة متكاملة تبدأ من الفكرة والمخططات ثلاثية الأبعاد وحتى تسليم المفتاح بأعلى معايير الجودة والإتقان.",
  aboutImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200"
};

export const mockSocialLinks: SocialLinks = {
  instagram: "https://instagram.com/royalgroup",
  facebook: "https://facebook.com/royalgroup",
  tiktok: "https://tiktok.com/@royalgroup",
  youtube: "https://youtube.com/royalgroup"
};

export const mockProjects: Project[] = [
  {
    id: "proj_1",
    title: "مجلس المنصور الفاخر",
    description: "تصميم وتنفيذ صالة استقبال ضيوف كلاسيكية مع دمج لمسات عصرية فاخرة. تم استخدام خشب السنديان مع تطعيمات ذهبية فريدة، بالإضافة إلى إنارة مخفية مخصصة لإضفاء جو دافئ ومثالي.",
    area: "85 م²",
    city: "بغداد - المنصور",
    coverImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000",
      "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000",
    category: "صالات",
    featured: true,
    createdAt: 1719878400000 // 2026-07-02
  },
  {
    id: "proj_2",
    title: "مطبخ رويال غريج الجاديرية",
    description: "مطبخ متكامل بتصميم مودرن فائق الحداثة، يدمج بين لون الغريج الهادئ والرخام الإيطالي الفاخر. تم تزويد المطبخ بأحدث الأنظمة الذكية للتخزين والإنارة التفاعلية.",
    area: "35 م²",
    city: "بغداد - الجادرية",
    coverImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000",
      "https://images.unsplash.com/photo-1556911220-1111c412991b?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000",
    category: "مطابخ",
    featured: true,
    createdAt: 1719792000000
  },
  {
    id: "proj_3",
    title: "جناح نوم القادسية الرئيسي",
    description: "جناح نوم رئيسي يبعث على الراحة والهدوء باستخدام ألوان النود والذهبي المطفي. تم تكسية الجدران ببديل الرخام والخشب مع إضاءات ليد مخفية مدمجة بالكامل في السقف والسرير.",
    area: "48 م²",
    city: "بغداد - القادسية",
    coverImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1000",
      "https://images.unsplash.com/photo-1617806118233-18e1db207f62?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000",
    category: "غرف نوم",
    featured: true,
    createdAt: 1719705600000
  },
  {
    id: "proj_4",
    title: "غرفة ملابس الخشب الإيطالي اليرموك",
    description: "غرفة ملابس واسعة ومفتوحة مصممة باستخدام خشب السنديان الداكن عالي المقاومة والزجاج المظلل العاكس، مع تقسيم ذكي للأدراج والرفوف لتوفير أكبر قدر من المساحة العملية والأناقة.",
    area: "24 م²",
    city: "بغداد - اليرموك",
    coverImage: "https://images.unsplash.com/photo-1558882224-cca166733360?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1558882224-cca166733360?q=80&w=1000",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1558882224-cca166733360?q=80&w=1000",
    category: "غرف ملابس",
    featured: false,
    createdAt: 1719619200000
  },
  {
    id: "proj_5",
    title: "حمام فيلا الوزيرية الرخامي",
    description: "حمام فاخر تم تصميمه بالكامل برخام الكالكاتا الذهبي الفخم والبورسلان الإيطالي كبير الحجم. يحتوي على مغسلة مزدوجة مصممة خصيصاً مع جاكوزي وإنارات ذكية مضادة للرطوبة.",
    area: "18 م²",
    city: "بغداد - الوزيرية",
    coverImage: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1000",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1000",
    category: "حمامات",
    featured: false,
    createdAt: 1719532800000
  },
  {
    id: "proj_6",
    title: "غرفة غسيل متكاملة اليرموك",
    description: "غرفة غسيل عملية ومنظمة للغاية، مجهزة بأحدث الخزائن المدمجة لاستغلال المساحات الرأسية، وأسطح متينة لطي الملابس وسلال فرز أنيقة.",
    area: "12 م²",
    city: "بغداد - اليرموك",
    coverImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000"
    ],
    beforeImage: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=1000",
    afterImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000",
    category: "غرف غسيل",
    featured: false,
    createdAt: 1719446400000
  }
];

export const mockColorVariants: ColorVariant[] = [
  // Woods
  { id: "w_1", name: "سنديان طبيعي", type: "wood", colorValue: "#C4A482", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000", createdAt: 1 },
  { id: "w_2", name: "جوز داكن", type: "wood", colorValue: "#5C4033", image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1000", createdAt: 2 },
  { id: "w_3", name: "كشمير فاخر", type: "wood", colorValue: "#D2B48C", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1000", createdAt: 3 },
  
  // Marbles
  { id: "m_1", name: "كرارا الإيطالي الأبيض", type: "marble", colorValue: "#EAEAEA", image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=1000", createdAt: 4 },
  { id: "m_2", name: "أسود لوران الذهبي", type: "marble", colorValue: "#1C1C1C", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000", createdAt: 5 },
  
  // Walls
  { id: "l_1", name: "غريج ملكي دافئ", type: "wall", colorValue: "#B1A796", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000", createdAt: 6 },
  { id: "l_2", name: "أبيض لؤلؤي صافي", type: "wall", colorValue: "#F4F1EA", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000", createdAt: 7 },
  { id: "l_3", name: "فحمي عميق غامض", type: "wall", colorValue: "#2A2D34", image: "https://images.unsplash.com/photo-1558882224-cca166733360?q=80&w=1000", createdAt: 8 },

  // Floorings
  { id: "f_1", name: "باركيه طبيعي دافئ", type: "flooring", colorValue: "#B8860B", image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1000", createdAt: 9 },
  { id: "f_2", name: "بورسلان رمادي مصقول", type: "flooring", colorValue: "#808080", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1000", createdAt: 10 }
];
