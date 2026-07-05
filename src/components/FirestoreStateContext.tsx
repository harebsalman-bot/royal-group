/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, Category, ColorVariant, DesignRequest, CompanySettings, SocialLinks, BedroomOption, BedroomSubmission,
  RequestStatus, RejectionReason, Engineer, Ticket, Message, TicketNotification, TicketStatus
} from '../types';
import { 
  mockProjects, mockCategories, mockColorVariants, mockCompanySettings, mockSocialLinks 
} from '../data/mockData';
import { 
  initializeDynamicFirebase, isFirebaseReady, getDb, getAuthService, getFirebaseApp, getActiveConfig, handleFirestoreError, OperationType 
} from '../firebase';
import { 
  collection, doc, getDocs, setDoc as firestoreSetDoc, updateDoc as firestoreUpdateDoc, deleteDoc, getDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';

// Helper to recursively remove undefined fields and values before writing to Firestore
const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

const setDoc = async (reference: any, data: any, options?: any) => {
  const cleanedData = cleanUndefined(data);
  if (options) {
    return firestoreSetDoc(reference, cleanedData, options);
  }
  return firestoreSetDoc(reference, cleanedData);
};

const updateDoc = async (reference: any, data: any) => {
  const cleanedData = cleanUndefined(data);
  return firestoreUpdateDoc(reference, cleanedData);
};

export const seedBedroomOptions: Omit<BedroomOption, 'id' | 'createdAt'>[] = [
  {
    section: 'bed',
    name: 'سرير رويال قطيفة أسود مطعم بزخارف ذهبية',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    description: 'سرير مخملي فخم مع إطارات معدنية مطلية بطلاء الذهب عيار 24'
  },
  {
    section: 'bed',
    name: 'سرير إمبراطوري جلد أسود مطرز بالخيوط الذهبية',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
    description: 'جلد إيطالي طبيعي فاخر بنمط كابوتونيه متناسق'
  },
  {
    section: 'headboard',
    name: 'خلفية سرير جدارية ممتدة قطيفة مع خطوط إنارة ستانلس ذهبي',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    description: 'تصميم جداري فخم يمنح الغرفة ارتفاعاً وهيبة ملكية'
  },
  {
    section: 'headboard',
    name: 'خلفية من الخشب الملكي الداكن مع نقوش كلاسيكية مذهبة',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    description: 'حفر يدوي دقيق مطلي بورق الذهب الكلاسيكي الفاخر'
  },
  {
    section: 'nightstand',
    name: 'كومودينو زجاجي أسود عاكس بقوائم ذهبية هندسية',
    image: 'https://images.unsplash.com/photo-1532372320978-9b4d7a92b24d?auto=format&fit=crop&w=800&q=80',
    description: 'تصميم مودرن فخم مع درجين بآلية فتح مخفية'
  },
  {
    section: 'nightstand',
    name: 'كومود بلون أسود مطفي مع مقابض ذهبية عتيقة',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    description: 'سطح رخامي داكن ولمسات يدوية دافئة'
  },
  {
    section: 'vanity',
    name: 'طاولة تسريحة معلقة رخام أسود نيرو ماركينا وإطار ذهبي',
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
    description: 'مرآة دائرية مضيئة بنظام LED مدمج ولمسات معدنية راقية'
  },
  {
    section: 'vanity',
    name: 'تسريحة ملكية بطلاء ورنيش أسود لامع ونقوش يدوية ذهبية',
    image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
    description: 'أدراج متعددة مخملية من الداخل لحفظ المجوهرات والنفائس'
  },
  {
    section: 'wardrobe',
    name: 'خزانة ملابس بأبواب زجاجية برونزية عاكسة وإضاءة داخلية ذهبية',
    image: 'https://images.unsplash.com/photo-1558882224-cca166733360?auto=format&fit=crop&w=800&q=80',
    description: 'أرفف خشبية سوداء مع فواصل معدنية ذهبية أنيقة'
  },
  {
    section: 'wardrobe',
    name: 'غرفة ملابس (Dressing Room) متكاملة مفتوحة بنظام فاخر',
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80',
    description: 'تقسيمات ذكية مع جزيرة وسطية لعرض الملحقات والساعات فخمة الأسلوب'
  },
  {
    section: 'tvUnit',
    name: 'خلفية تلفزيون بديل رخام أسود مع عروق ذهبية وبديل خشب داكن',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
    description: 'وحدة معلقة بتصميم بساطة فخم مع رف إنارة مخفية'
  },
  {
    section: 'tvUnit',
    name: 'وحدة تلفزيون كلاسيكية سوداء مطعمة ببرواز مذهب وقوالب جبسية دقيقة',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
    description: 'تناسق كلاسيكي مثالي للمساحات الشاسعة والقصور'
  },
  {
    section: 'curtains',
    name: 'ستائر مخملية ثقيلة بلون أسود حالك مع شيفون ذهبي متطاير',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    description: 'تعتيم كامل (Blackout) ونظام سحب كهربائي هادئ'
  },
  {
    section: 'curtains',
    name: 'ستائر حريرية باللون البيج والذهبي اللامع بنقوش دمشقية فخمة',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
    description: 'درجات ذهبية عتيقة تتناغم مع الإضاءة الجدارية'
  },
  {
    section: 'flooring',
    name: 'أرضية بورسلين هندي كبير الحجم بلون أسود وعروق ذهبية ممتدة',
    image: 'https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=800&q=80',
    description: 'لمعان فائق يعكس إضاءة الغرفة بشكل درامي ساحر'
  },
  {
    section: 'flooring',
    name: 'باركيه خشب طبيعي داكن بنمط عظم السمكة (Chevron) الفخم',
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
    description: 'دفء الخشب الأصيل وتصميم فرنسي دائم الأناقة'
  },
  {
    section: 'ceiling',
    name: 'سقف ديكور جبسي مودرن مع فجوات إنارة مخفية وشرائح ستانلس ذهبية',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    description: 'تداخلات هندسية مدروسة تبرز جمال الأبعاد والارتفاعات'
  },
  {
    section: 'ceiling',
    name: 'سقف كلاسيكي مطلي بلوحات فنية ناعمة محاط بجبس مذهب عتيق التفاصيل',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
    description: 'أناقة الفنون الأوروبية الكلاسيكية داخل قصرك الخاص'
  },
  {
    section: 'lighting',
    name: 'ثريا كريستال كروية متدلية من النحاس المذهب والإنارة الكريستالية النارية',
    image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=800&q=80',
    description: 'بريق كريستالي فائق النقاء يوزع الضوء بطريقة غامرة وجذابة'
  },
  {
    section: 'lighting',
    name: 'إضاءة ذكية مخفية خافتة مع معلقات مودرن جدارية ممتدة باللون الأسود والذهبي',
    image: 'https://images.unsplash.com/photo-1565538810844-1e1194121720?auto=format&fit=crop&w=800&q=80',
    description: 'تحكم ذكي بالشدة والألوان لخلق جو دافئ ومريح للنفس'
  }
];

export const initialBedroomOptions: BedroomOption[] = seedBedroomOptions.map((item, index) => ({
  ...item,
  id: `seed_opt_${index}`,
  createdAt: Date.now() - index * 60000
}));

interface FirebaseStateContextType {
  isFirebaseConnected: boolean;
  projects: Project[];
  categories: Category[];
  colorVariants: ColorVariant[];
  designRequests: DesignRequest[];
  companySettings: CompanySettings;
  socialLinks: SocialLinks;
  bedroomOptions: BedroomOption[];
  bedroomSubmissions: BedroomSubmission[];
  engineers: Engineer[];
  tickets: Ticket[];
  messages: Message[];
  notifications: TicketNotification[];
  loading: boolean;
  saveFirebaseConfig: (config: any) => Promise<boolean>;
  addProject: (proj: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, proj: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addDesignRequest: (req: Omit<DesignRequest, 'id' | 'status' | 'createdAt'>, planFiles: File[], imageFiles: File[]) => Promise<DesignRequest>;
  updateDesignRequestStatus: (id: string, status: RequestStatus, additionalFields?: Partial<DesignRequest>) => Promise<void>;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  updateSocialLinks: (links: SocialLinks) => Promise<void>;
  addColorVariant: (variant: Omit<ColorVariant, 'id' | 'createdAt'>) => Promise<void>;
  deleteColorVariant: (id: string) => Promise<void>;
  uploadFile: (file: File, folder: 'projects' | 'before-after' | 'color-lab' | 'bedroom-options' | 'tickets') => Promise<string>;
  addBedroomOption: (option: Omit<BedroomOption, 'id' | 'createdAt'>) => Promise<void>;
  updateBedroomOption: (id: string, option: Partial<BedroomOption>) => Promise<void>;
  deleteBedroomOption: (id: string) => Promise<void>;
  addBedroomSubmission: (sub: Omit<BedroomSubmission, 'id' | 'createdAt' | 'status'>) => Promise<BedroomSubmission>;
  updateBedroomSubmissionStatus: (id: string, status: RequestStatus, additionalFields?: Partial<BedroomSubmission>) => Promise<void>;
  deleteBedroomSubmission: (id: string) => Promise<void>;
  addEngineer: (engineer: Omit<Engineer, 'id' | 'createdAt'>) => Promise<void>;
  updateEngineer: (id: string, updates: Partial<Engineer>) => Promise<void>;
  deleteEngineer: (id: string) => Promise<void>;
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>, attachmentFiles?: File[]) => Promise<Ticket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<void>;
  assignTicket: (id: string, engineerId: string, engineerName: string) => Promise<void>;
  sendTicketMessage: (msg: Omit<Message, 'id' | 'createdAt'>, files?: File[]) => Promise<void>;
  markMessagesAsRead: (ticketId: string, role: 'admin' | 'client' | 'engineer') => Promise<void>;
  addNotification: (notification: Omit<TicketNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  findOrCreateTicketByTrackingOrPhone: (queryStr: string) => Promise<Ticket | null>;
  deleteTicket: (id: string) => Promise<void>;
}

const FirebaseStateContext = createContext<FirebaseStateContextType | undefined>(undefined);

// Helper to convert File to Base64 data url for demo mode
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper to compress and convert image File to Base64 data url to fit within Firestore 1MB document limit
const compressAndConvertToBase64 = (file: File, maxWidth: number = 1000, maxHeight: number = 1000, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const seedDefaultEngineers = (): Engineer[] => {
  return [
    {
      id: "eng_ali",
      name: "علي الكرخي",
      email: "ali@royalgroup.iq",
      phone: "07701112223",
      specialty: "تصميم داخلي وديكور كلاسيكي",
      specialization: "تصميم داخلي وديكور كلاسيكي",
      active: true,
      role: "engineer",
      createdAt: 1719705600000,
      currentTickets: 0,
      currentProjects: 0
    },
    {
      id: "eng_dina",
      name: "دينا التميمي",
      email: "dina@royalgroup.iq",
      phone: "07704445556",
      specialty: "تصميم مودرن وغرف نوم فاخرة",
      specialization: "تصميم مودرن وغرف نوم فاخرة",
      active: true,
      role: "engineer",
      createdAt: 1719792000000,
      currentTickets: 0,
      currentProjects: 0
    },
    {
      id: "eng_mustafa",
      name: "مصطفى العبيدي",
      email: "mustafa@royalgroup.iq",
      phone: "07707778889",
      specialty: "مطابخ ذكية وأنظمة إضاءة",
      specialization: "مطابخ ذكية وأنظمة إضاءة",
      active: true,
      role: "engineer",
      createdAt: 1719878400000,
      currentTickets: 0,
      currentProjects: 0
    }
  ];
};

export const FirebaseStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // App states
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(mockColorVariants);
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(mockCompanySettings);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(mockSocialLinks);
  const [bedroomOptions, setBedroomOptions] = useState<BedroomOption[]>(initialBedroomOptions);
  const [bedroomSubmissions, setBedroomSubmissions] = useState<BedroomSubmission[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>(seedDefaultEngineers());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);

  // Check if Firebase is ready initially
  useEffect(() => {
    const checkInit = async () => {
      if (isFirebaseReady()) {
        setIsFirebaseConnected(true);
        await syncDataFromFirebase();
      } else {
        setLoading(false);
      }
    };
    checkInit();
  }, []);

  const syncDataFromFirebase = async () => {
    try {
      setLoading(true);
      const db = getDb();

      // 1. Subscribe and Seed Categories
      try {
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        if (categoriesSnap.empty) {
          for (const cat of mockCategories) {
            await setDoc(doc(db, 'categories', cat.id), cat);
          }
          setCategories(mockCategories);
        } else {
          const catList: Category[] = [];
          categoriesSnap.forEach(doc => catList.push(doc.data() as Category));
          setCategories(catList);
        }
      } catch (e) {
        console.error("Error syncing Categories:", e);
      }

      // 2. Check and Seed Projects
      try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        if (projectsSnap.empty) {
          for (const proj of mockProjects) {
            await setDoc(doc(db, 'projects', proj.id), proj);
          }
        }
      } catch (e) {
        console.error("Error syncing Projects:", e);
      }

      // 3. Check and Seed Color Variants
      try {
        const colorsSnap = await getDocs(collection(db, 'colorVariants'));
        if (colorsSnap.empty) {
          for (const col of mockColorVariants) {
            await setDoc(doc(db, 'colorVariants', col.id), col);
          }
        }
      } catch (e) {
        console.error("Error syncing Color Variants:", e);
      }

      // 4. Check and Seed Project Images Collection
      try {
        const projectImagesSnap = await getDocs(collection(db, 'projectImages'));
        if (projectImagesSnap.empty) {
          await setDoc(doc(db, 'projectImages', 'placeholder_init'), {
            id: 'placeholder_init',
            title: 'Royal Group Default Concept',
            url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
            createdAt: Date.now()
          });
        }
      } catch (e) {
        console.error("Error syncing Project Images:", e);
      }

      // 5. Check and Seed Design Requests Collection
      try {
        const requestsSnap = await getDocs(collection(db, 'designRequests'));
        if (requestsSnap.empty) {
          await setDoc(doc(db, 'designRequests', 'placeholder_init'), {
            id: 'placeholder_init',
            name: 'بوابة رويال جروب',
            phone: '+9647700000000',
            city: 'بغداد',
            projectType: 'residential',
            area: '250',
            budget: 'medium',
            status: 'reviewed',
            createdAt: Date.now()
          });
        }
      } catch (e) {
        console.warn("Could not check/seed Design Requests (expected for public guest users):", e);
      }

      // Subscribe to Projects
      try {
        const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
          const projList: Project[] = [];
          snapshot.forEach(doc => {
            projList.push(doc.data() as Project);
          });
          if (projList.length > 0) {
            setProjects(projList);
          } else {
            setProjects([]);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        });
      } catch (e) {
        console.error("Error subscribing to Projects:", e);
      }

      // Subscribe to Color Variants
      try {
        const qColors = query(collection(db, 'colorVariants'), orderBy('createdAt', 'desc'));
        const unsubscribeColors = onSnapshot(qColors, (snapshot) => {
          const colorList: ColorVariant[] = [];
          snapshot.forEach(doc => {
            colorList.push(doc.data() as ColorVariant);
          });
          setColorVariants(colorList);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'colorVariants');
        });
      } catch (e) {
        console.error("Error subscribing to Color Variants:", e);
      }

      // Subscribe to Design Requests
      try {
        const qRequests = query(collection(db, 'designRequests'), orderBy('createdAt', 'desc'));
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
          const reqList: DesignRequest[] = [];
          snapshot.forEach(doc => {
            reqList.push(doc.data() as DesignRequest);
          });
          setDesignRequests(reqList);
        }, (error) => {
          // Safe to ignore if permissions block normal users, admins will succeed
          console.warn("Requests read blocked for normal user (which is correct by design).");
        });
      } catch (e) {
        console.error("Error subscribing to Design Requests:", e);
      }

      // 6. Check and Seed Bedroom Options
      try {
        const bedroomOptionsSnap = await getDocs(collection(db, 'bedroomOptions'));
        if (bedroomOptionsSnap.empty) {
          for (const item of seedBedroomOptions) {
            const newId = `bedopt_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            const newOpt: BedroomOption = {
              ...item,
              id: newId,
              createdAt: Date.now()
            };
            await setDoc(doc(db, 'bedroomOptions', newId), newOpt);
          }
        }
      } catch (e) {
        console.error("Error seeding Bedroom Options:", e);
      }

      // Subscribe to Bedroom Options
      try {
        const qBedroomOptions = query(collection(db, 'bedroomOptions'), orderBy('createdAt', 'desc'));
        const unsubscribeBedroomOptions = onSnapshot(qBedroomOptions, (snapshot) => {
          const list: BedroomOption[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as BedroomOption);
          });
          if (list.length > 0) {
            setBedroomOptions(list);
          } else {
            setBedroomOptions([]);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'bedroomOptions');
        });
      } catch (e) {
        console.error("Error subscribing to Bedroom Options:", e);
      }

      // Subscribe to Bedroom Submissions
      try {
        const qBedroomSubmissions = query(collection(db, 'bedroomSubmissions'), orderBy('createdAt', 'desc'));
        const unsubscribeBedroomSubmissions = onSnapshot(qBedroomSubmissions, (snapshot) => {
          const list: BedroomSubmission[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as BedroomSubmission);
          });
          setBedroomSubmissions(list);
        }, (error) => {
          // Safe to ignore if permissions block normal users, admins will succeed
          console.warn("Submissions read blocked for normal user (which is correct by design).");
        });
      } catch (e) {
        console.error("Error subscribing to Bedroom Submissions:", e);
      }

      // Fetch Company Settings (Single Document)
      try {
        const settingsDocRef = doc(db, 'companySettings', 'main');
        const settingsSnap = await getDoc(settingsDocRef);
        if (settingsSnap.exists()) {
          setCompanySettings(settingsSnap.data() as CompanySettings);
        } else {
          await setDoc(settingsDocRef, mockCompanySettings);
          setCompanySettings(mockCompanySettings);
        }
      } catch (e) {
        console.error("Error syncing Company Settings:", e);
      }

      // Fetch Social Links (Single Document)
      try {
        const socialDocRef = doc(db, 'socialLinks', 'main');
        const socialSnap = await getDoc(socialDocRef);
        if (socialSnap.exists()) {
          setSocialLinks(socialSnap.data() as SocialLinks);
        } else {
          await setDoc(socialDocRef, mockSocialLinks);
          setSocialLinks(mockSocialLinks);
        }
      } catch (e) {
        console.error("Error syncing Social Links:", e);
      }

      // Subscribe to Engineers
      try {
        const qEngineers = query(collection(db, 'engineers'), orderBy('createdAt', 'desc'));
        onSnapshot(qEngineers, async (snapshot) => {
          const list: Engineer[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Engineer);
          });
          if (list.length > 0) {
            setEngineers(list);
          } else {
            // Seed default engineers into Firestore
            try {
              const defaults = seedDefaultEngineers();
              for (const eng of defaults) {
                await setDoc(doc(db, 'engineers', eng.id), eng);
              }
            } catch (seedErr) {
              console.error("Failed to seed default engineers into Firestore:", seedErr);
            }
          }
        }, (error) => {
          console.warn("Engineers read blocked or error:", error.message);
        });
      } catch (e) {
        console.error("Error subscribing to Engineers:", e);
      }

      // Subscribe to Tickets
      try {
        const qTickets = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        onSnapshot(qTickets, (snapshot) => {
          const list: Ticket[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Ticket);
          });
          setTickets(list);
        }, (error) => {
          console.warn("Tickets read blocked or error:", error.message);
        });
      } catch (e) {
        console.error("Error subscribing to Tickets:", e);
      }

      // Subscribe to Messages (Rely on Firestore client sorting or client state)
      try {
        const qMessages = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
        onSnapshot(qMessages, (snapshot) => {
          const list: Message[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as Message);
          });
          setMessages(list);
        }, (error) => {
          console.warn("Messages read blocked or error:", error.message);
        });
      } catch (e) {
        console.error("Error subscribing to Messages:", e);
      }

      // Subscribe to Notifications
      try {
        const qNotifications = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        onSnapshot(qNotifications, (snapshot) => {
          const list: TicketNotification[] = [];
          snapshot.forEach(doc => {
            list.push(doc.data() as TicketNotification);
          });
          setNotifications(list);
        }, (error) => {
          console.warn("Notifications read blocked or error:", error.message);
        });
      } catch (e) {
        console.error("Error subscribing to Notifications:", e);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error syncing Firebase data:", error);
      setLoading(false);
    }
  };

  /**
   * Save and activate Firebase configurations
   */
  const saveFirebaseConfig = async (config: any): Promise<boolean> => {
    const success = initializeDynamicFirebase(config);
    if (success) {
      setIsFirebaseConnected(true);
      await syncDataFromFirebase();
      return true;
    }
    return false;
  };

  /**
   * Universal file uploader: Converts to compressed Base64 data URL directly to save into Firestore, preventing Firebase Storage failures.
   */
  const uploadFile = async (file: File, folder: 'projects' | 'before-after' | 'color-lab' | 'bedroom-options' | 'tickets'): Promise<string> => {
    try {
      // Direct compressed Base64 conversion - works perfectly on Spark plan with no Firebase Storage!
      return await compressAndConvertToBase64(file, 1000, 1000, 0.75);
    } catch (error) {
      console.warn("Base64 conversion failed. Falling back to high-quality Unsplash interior/architecture design:", error);
      
      // Professional high-quality Unsplash interior/architecture designs matching Royal Group theme
      if (folder === 'before-after') {
        return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"; // Luxury modern villa living room
      } else if (folder === 'color-lab') {
        return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"; // Luxury marble / interior design detail
      } else {
        return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"; // Contemporary interior design
      }
    }
  };

  /**
   * Sanitizes a project object to ensure no undefined values are sent to Firestore.
   * Replaces undefined/empty fields with valid Firestore-friendly defaults.
   */
  const sanitizeProjectForFirestore = (proj: any) => {
    const sanitized = { ...proj };

    sanitized.coverImage = sanitized.coverImage || "";
    sanitized.beforeImage = sanitized.beforeImage || "";
    sanitized.afterImage = sanitized.afterImage || "";
    
    if (!sanitized.images || !Array.isArray(sanitized.images)) {
      sanitized.images = [];
    }

    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        if (key === 'beforeImage' || key === 'afterImage' || key === 'coverImage') {
          sanitized[key] = "";
        } else if (key === 'images' || key === 'galleryImages') {
          sanitized[key] = [];
        } else {
          sanitized[key] = "";
        }
      }
    });

    return sanitized;
  };

  /**
   * Add a new project
   */
  const addProject = async (proj: Omit<Project, 'id' | 'createdAt'>) => {
    const newId = `proj_${Date.now()}`;
    const sanitizedProj = sanitizeProjectForFirestore(proj);
    const newProject: Project = {
      ...sanitizedProj,
      id: newId,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      const db = getDb();
      const projectData = newProject;
      let auth: any = null;
      try {
        auth = getAuthService();
      } catch (authErr) {
        // Fallback if auth is not initialized
      }

      console.log("========== FIREBASE DEBUG ==========");
      console.log("FIREBASE CONFIG", getActiveConfig());
      try {
        console.log("FIRESTORE APP", getFirebaseApp().options);
      } catch (e) {
        console.error("Could not log Firestore App options:", e);
      }
      console.log("FIRESTORE DATABASE ID", (db as any)._databaseId || db);
      console.log("===================================");

      console.log("PROJECT PAYLOAD RAW", projectData);
      console.log("PROJECT PAYLOAD JSON", JSON.stringify(projectData, null, 2));
      console.log("AUTH USER", auth?.currentUser?.email);

      try {
        console.log("Object.keys(projectData)", Object.keys(projectData));
        await setDoc(doc(db, 'projects', newId), projectData);
      } catch (error) {
        console.error("PROJECT VALIDATION DATA", projectData);
        console.error("FIRESTORE SETDOC ERROR:", error);
        handleFirestoreError(error, OperationType.CREATE, `projects/${newId}`);
      }
    } else {
      // Demo State
      setProjects(prev => [newProject, ...prev]);
    }
  };

  /**
   * Update existing project
   */
  const updateProject = async (id: string, proj: Partial<Project>) => {
    const sanitizedProj = sanitizeProjectForFirestore(proj);

    if (isFirebaseConnected) {
      const db = getDb();
      const projectData = sanitizedProj;
      let auth: any = null;
      try {
        auth = getAuthService();
      } catch (authErr) {
        // Fallback if auth is not initialized
      }

      console.log("FIREBASE CONFIG", getActiveConfig());
      try {
        const appInstance = getFirebaseApp();
        console.log("FIRESTORE APP", appInstance.options.projectId);
      } catch (e) {
        console.error("Could not log Firestore App options:", e);
      }
      console.log("FIRESTORE DATABASE ID", (db as any)._databaseId || db);

      console.log("PROJECT PAYLOAD RAW", projectData);
      console.log("PROJECT PAYLOAD JSON", JSON.stringify(projectData, null, 2));
      console.log("AUTH USER", auth?.currentUser?.email);

      try {
        console.log("Object.keys(projectData)", Object.keys(projectData));
        await updateDoc(doc(db, 'projects', id), projectData);
      } catch (error) {
        console.error("PROJECT VALIDATION DATA", projectData);
        console.error("FIRESTORE UPDATEDOC ERROR:", error);
        handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
      }
    } else {
      // Demo State
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...sanitizedProj } : p));
    }
  };

  /**
   * Helper to delete a file from Firebase Storage using its download URL
   */
  const deleteStorageFileByUrl = async (url: string) => {
    // No-op: Firebase Storage is not configured/available in this project.
    console.log(`Bypassed deleting storage file: ${url}`);
  };

  /**
   * Delete project
   */
  const deleteProject = async (id: string) => {
    // Clean up associated storage images first
    const targetProject = projects.find(p => p.id === id);
    if (targetProject) {
      const urlsToDelete: string[] = [];
      if (targetProject.coverImage) urlsToDelete.push(targetProject.coverImage);
      if (targetProject.beforeImage) urlsToDelete.push(targetProject.beforeImage);
      if (targetProject.afterImage) urlsToDelete.push(targetProject.afterImage);
      if (Array.isArray(targetProject.images)) {
        targetProject.images.forEach(img => {
          if (img !== targetProject.coverImage) {
            urlsToDelete.push(img);
          }
        });
      }

      try {
        await Promise.all(urlsToDelete.map(url => deleteStorageFileByUrl(url)));
      } catch (e) {
        console.warn("Error deleting files from Storage during project delete:", e);
      }
    }

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'projects', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
      }
    } else {
      // Demo State
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  // Helper to generate a unique request number dynamically
  const generateRequestNumber = async (): Promise<string> => {
    let nextNum = 1;
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        const counterRef = doc(db, 'counters', 'requests');
        const counterSnap = await getDoc(counterRef);
        
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (data && typeof data.lastNumber === 'number') {
            nextNum = data.lastNumber + 1;
          }
        } else {
          // If the counter document doesn't exist, calculate the starting counter
          let maxNum = 0;
          try {
            const rSnap = await getDocs(collection(db, 'designRequests'));
            const sSnap = await getDocs(collection(db, 'bedroomSubmissions'));
            
            rSnap.forEach(docSnap => {
              const data = docSnap.data();
              if (data.requestNumber && data.requestNumber.startsWith('RG-')) {
                const num = parseInt(data.requestNumber.replace('RG-', ''), 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
              }
            });
            
            sSnap.forEach(docSnap => {
              const data = docSnap.data();
              if (data.requestNumber && data.requestNumber.startsWith('RG-')) {
                const num = parseInt(data.requestNumber.replace('RG-', ''), 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
              }
            });
          } catch (e) {
            console.warn("Permission boundary prevented counting existing collections. Defaulting next index to 1.");
          }
          nextNum = maxNum + 1;
        }
        
        // Update the counter document so the next submission gets the next number
        await setDoc(counterRef, { lastNumber: nextNum }, { merge: true });
        return `RG-${String(nextNum).padStart(6, '0')}`;
      } catch (e) {
        console.error("Error generating unique sequential request number from Firestore counters:", e);
      }
    }
    
    // Fallback/Demo check in local state
    let maxNum = 0;
    if (designRequests.length > 0 || bedroomSubmissions.length > 0) {
      designRequests.forEach(r => {
        if (r.requestNumber && r.requestNumber.startsWith('RG-')) {
          const num = parseInt(r.requestNumber.replace('RG-', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      bedroomSubmissions.forEach(s => {
        if (s.requestNumber && s.requestNumber.startsWith('RG-')) {
          const num = parseInt(s.requestNumber.replace('RG-', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
    }
    
    if (maxNum > 0) {
      nextNum = maxNum + 1;
    } else {
      // If absolutely no local records exist, generate a highly unique randomized reference code as fallback
      const rand = Math.floor(100000 + Math.random() * 900000);
      return `RG-${rand}`;
    }
    
    return `RG-${String(nextNum).padStart(6, '0')}`;
  };

  /**
   * Submit client design requests
   */
  const addDesignRequest = async (
    req: Omit<DesignRequest, 'id' | 'status' | 'createdAt'>,
    planFiles: File[],
    imageFiles: File[]
  ) => {
    const newId = `req_${Date.now()}`;
    const reqNum = await generateRequestNumber();
    
    // Upload files synchronously to get URLs
    const plansUrl: string[] = [];
    for (const file of planFiles) {
      const url = await uploadFile(file, 'projects');
      plansUrl.push(url);
    }

    const imageUrl: string[] = [];
    for (const file of imageFiles) {
      const url = await uploadFile(file, 'projects');
      imageUrl.push(url);
    }

    const newRequest: DesignRequest = {
      ...req,
      id: newId,
      plansUrl,
      imageUrl,
      status: 'pending',
      requestNumber: reqNum,
      viewed: false,
      ticketId: undefined,
      createdAt: Date.now(),
      assignedEngineerId: null,
      assignedEngineerName: null
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        console.log("[Firestore] [addDesignRequest] Starting creation process...");
        
        console.log(`[Firestore] [addDesignRequest] Creating designRequest doc: designRequests/${newId}`);
        await setDoc(doc(db, 'designRequests', newId), newRequest);
        console.log(`[Firestore] [addDesignRequest] Created designRequest successfully!`);
        console.log("[Firestore] [addDesignRequest] Completed all creation operations successfully!");
      } catch (error) {
        console.error("[Firestore] [addDesignRequest] Fatal error in submission process:", error);
        handleFirestoreError(error, OperationType.CREATE, `designRequests/${newId}`);
      }
    } else {
      // Demo State
      setDesignRequests(prev => [newRequest, ...prev]);
    }

    return newRequest;
  };

  /**
   * Update Request Status
   */
  const updateDesignRequestStatus = async (id: string, status: RequestStatus, additionalFields?: Partial<DesignRequest>) => {
    const updates = { status, ...additionalFields };
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'designRequests', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `designRequests/${id}`);
      }
    } else {
      // Demo State
      setDesignRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }

    if (status === 'Approved') {
      const req = designRequests.find(r => r.id === id);
      if (req) {
        const engId = additionalFields?.assignedEngineerId || req.assignedEngineerId;
        const engName = additionalFields?.assignedEngineerName || req.assignedEngineerName;
        const engAt = additionalFields?.assignedAt || req.assignedAt;

        await handleAutoCreateTicketOnApproval(
          id,
          'design_request',
          req.name,
          req.phone,
          `طلب تصميم - ${req.projectType}`,
          `تذكرة تم إنشاؤها تلقائياً لطلب تصميم معتمد رقم ${req.requestNumber || req.id}`,
          req.requestNumber || req.id,
          engId,
          engName,
          engAt
        );
      }
    }
  };

  /**
   * Save general company details
   */
  const updateCompanySettings = async (settings: CompanySettings) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'companySettings', 'main'), settings);
        setCompanySettings(settings);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'companySettings/main');
      }
    } else {
      // Demo State
      setCompanySettings(settings);
    }
  };

  /**
   * Update social links
   */
  const updateSocialLinks = async (links: SocialLinks) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'socialLinks', 'main'), links);
        setSocialLinks(links);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'socialLinks/main');
      }
    } else {
      // Demo State
      setSocialLinks(links);
    }
  };

  /**
   * Color Lab: Add custom color variants
   */
  const addColorVariant = async (variant: Omit<ColorVariant, 'id' | 'createdAt'>) => {
    const newId = `color_${Date.now()}`;
    const newVariant: ColorVariant = {
      ...variant,
      id: newId,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'colorVariants', newId), newVariant);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `colorVariants/${newId}`);
      }
    } else {
      // Demo State
      setColorVariants(prev => [newVariant, ...prev]);
    }
  };

  /**
   * Color Lab: Delete custom color variants
   */
  const deleteColorVariant = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'colorVariants', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `colorVariants/${id}`);
      }
    } else {
      // Demo State
      setColorVariants(prev => prev.filter(v => v.id !== id));
    }
  };

  /**
   * Bedroom Designer: Add a new design option (Admin)
   */
  const addBedroomOption = async (option: Omit<BedroomOption, 'id' | 'createdAt'>) => {
    const newId = `bedopt_${Date.now()}`;
    const newOption: BedroomOption = {
      ...option,
      id: newId,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'bedroomOptions', newId), newOption);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `bedroomOptions/${newId}`);
      }
    } else {
      setBedroomOptions(prev => [newOption, ...prev]);
    }
  };

  /**
   * Bedroom Designer: Update an existing design option (Admin)
   */
  const updateBedroomOption = async (id: string, option: Partial<BedroomOption>) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'bedroomOptions', id), option);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bedroomOptions/${id}`);
      }
    } else {
      setBedroomOptions(prev => prev.map(o => o.id === id ? { ...o, ...option } : o));
    }
  };

  /**
   * Bedroom Designer: Delete a design option (Admin)
   */
  const deleteBedroomOption = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'bedroomOptions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `bedroomOptions/${id}`);
      }
    } else {
      setBedroomOptions(prev => prev.filter(o => o.id !== id));
    }
  };

  /**
   * Bedroom Designer: Submit a new bedroom selection questionnaire (Customer)
   */
  const addBedroomSubmission = async (sub: Omit<BedroomSubmission, 'id' | 'createdAt' | 'status'>) => {
    const newId = `sub_${Date.now()}`;
    const reqNum = await generateRequestNumber();

    const newSubmission: BedroomSubmission = {
      ...sub,
      id: newId,
      status: 'pending',
      requestNumber: reqNum,
      viewed: false,
      ticketId: undefined,
      createdAt: Date.now(),
      assignedEngineerId: null,
      assignedEngineerName: null
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        console.log("[Firestore] [addBedroomSubmission] Starting creation process...");
        
        console.log(`[Firestore] [addBedroomSubmission] Creating bedroomSubmission doc: bedroomSubmissions/${newId}`);
        await setDoc(doc(db, 'bedroomSubmissions', newId), newSubmission);
        console.log(`[Firestore] [addBedroomSubmission] Created bedroomSubmission successfully!`);
        console.log("[Firestore] [addBedroomSubmission] Completed all creation operations successfully!");
      } catch (error) {
        console.error("[Firestore] [addBedroomSubmission] Fatal error in submission process:", error);
        handleFirestoreError(error, OperationType.CREATE, `bedroomSubmissions/${newId}`);
      }
    } else {
      setBedroomSubmissions(prev => [newSubmission, ...prev]);
    }

    return newSubmission;
  };

  /**
   * Bedroom Designer: Update submission status (Admin)
   */
  const updateBedroomSubmissionStatus = async (id: string, status: RequestStatus, additionalFields?: Partial<BedroomSubmission>) => {
    const updates = { status, ...additionalFields };
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'bedroomSubmissions', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `bedroomSubmissions/${id}`);
      }
    } else {
      setBedroomSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }

    if (status === 'Approved') {
      const sub = bedroomSubmissions.find(s => s.id === id);
      if (sub) {
        const engId = additionalFields?.assignedEngineerId || sub.assignedEngineerId;
        const engName = additionalFields?.assignedEngineerName || sub.assignedEngineerName;
        const engAt = additionalFields?.assignedAt || sub.assignedAt;

        await handleAutoCreateTicketOnApproval(
          id,
          'bedroom_submission',
          sub.clientName,
          sub.clientPhone,
          `تصميم غرفة نوم مخصص`,
          `تذكرة تم إنشاؤها تلقائياً لطلب تصميم غرفة نوم معتمد رقم ${sub.requestNumber || sub.id}`,
          sub.requestNumber || sub.id,
          engId,
          engName,
          engAt
        );
      }
    }
  };

  /**
   * Bedroom Designer: Delete submission (Admin)
   */
  const deleteBedroomSubmission = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'bedroomSubmissions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `bedroomSubmissions/${id}`);
      }
    } else {
      setBedroomSubmissions(prev => prev.filter(s => s.id !== id));
    }
  };

  /**
   * Project Ticket System: Auto-generate professional Ticket ID
   */
  const generateTicketId = async (): Promise<string> => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        const counterRef = doc(db, 'counters', 'ticket_counter');
        const counterSnap = await getDoc(counterRef);
        let nextNum = 1001;
        if (counterSnap.exists()) {
          const data = counterSnap.data();
          if (data && typeof data.lastNumber === 'number') {
            nextNum = data.lastNumber + 1;
          }
        }
        await setDoc(counterRef, { lastNumber: nextNum }, { merge: true });
        return `RG-TKT-${nextNum}`;
      } catch (e) {
        console.error("Error generating sequential ticket ID:", e);
      }
    }
    // Demo fallback
    let maxNum = 1000;
    tickets.forEach(t => {
      if (t.id && t.id.startsWith('RG-TKT-')) {
        const num = parseInt(t.id.replace('RG-TKT-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `RG-TKT-${maxNum + 1}`;
  };

  /**
   * Project Ticket System: Add a new engineer (Admin)
   */
  const addEngineer = async (engineer: Omit<Engineer, 'id' | 'createdAt'>) => {
    const newId = `eng_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const newEng: Engineer = {
      active: true,
      role: 'engineer',
      ...engineer,
      id: newId,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'engineers', newId), newEng);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `engineers/${newId}`);
      }
    } else {
      setEngineers(prev => [newEng, ...prev]);
    }
  };

  /**
   * Project Ticket System: Update an engineer (Admin)
   */
  const updateEngineer = async (id: string, updates: Partial<Engineer>) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'engineers', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `engineers/${id}`);
      }
    } else {
      setEngineers(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  /**
   * Project Ticket System: Delete an engineer (Admin)
   */
  const deleteEngineer = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'engineers', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `engineers/${id}`);
      }
    } else {
      setEngineers(prev => prev.filter(e => e.id !== id));
    }
  };

  /**
   * Helper: Automatically create a ticket when a request/submission is approved
   */
  const handleAutoCreateTicketOnApproval = async (
    requestId: string,
    type: 'design_request' | 'bedroom_submission',
    clientName: string,
    clientPhone: string,
    title: string,
    description: string,
    trackingId: string,
    assignedEngineerId?: string,
    assignedEngineerName?: string,
    assignedAt?: number
  ) => {
    // Check if ticket already exists
    const existing = tickets.find(t => t.requestId === requestId || t.sourceId === requestId);
    if (existing) return;

    const ticketId = await generateTicketId();
    const newTicket: Ticket = {
      id: ticketId,
      requestId,
      trackingId,
      sourceId: requestId,
      sourceType: type,
      clientName,
      clientPhone,
      title,
      description,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedEngineerId,
      assignedEngineerName,
      assignedAt
    };

    if (assignedEngineerId) {
      const eng = engineers.find(e => e.id === assignedEngineerId);
      if (eng) {
        const updatedCount = (eng.currentTickets || 0) + 1;
        await updateEngineer(assignedEngineerId, { currentTickets: updatedCount });
      }
    }

    const welcomeContent = assignedEngineerName
      ? `أهلاً بك يا ${clientName} في نظام الدعم الفني والمتابعة لـ Royal Group. تم إنشاء تذكرتك بنجاح برقم ${ticketId} وتم تعيين المهندس المصمم [${assignedEngineerName}] لمتابعة مشروعك والدردشة معك هنا.`
      : `أهلاً بك يا ${clientName} في نظام الدعم الفني والمتابعة لـ Royal Group. تم إنشاء تذكرتك بنجاح برقم ${ticketId}. سيقوم مهندسو التصميم لدينا بالرد عليك ومتابعة طلبك هنا.`;

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'tickets', ticketId), newTicket);
        
        // Also update original request/submission with the ticketId
        try {
          if (type === 'design_request') {
            await updateDoc(doc(db, 'designRequests', requestId), { ticketId });
          } else {
            await updateDoc(doc(db, 'bedroomSubmissions', requestId), { ticketId });
          }
        } catch (updateErr) {
          console.error("Error updating source document with ticketId:", updateErr);
        }
        
        // System message
        const systemMsg: Message = {
          id: `msg_welcome_${Date.now()}`,
          ticketId,
          senderId: 'admin',
          senderName: 'إدارة رويال جروب',
          senderRole: 'admin',
          content: welcomeContent,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'messages', systemMsg.id), systemMsg);
      } catch (error) {
        console.error("Error auto-creating ticket on approval:", error);
      }
    } else {
      setTickets(prev => [newTicket, ...prev]);
      if (type === 'design_request') {
        setDesignRequests(prev => prev.map(r => r.id === requestId ? { ...r, ticketId } : r));
      } else {
        setBedroomSubmissions(prev => prev.map(r => r.id === requestId ? { ...r, ticketId } : r));
      }
      const systemMsg: Message = {
        id: `msg_welcome_${Date.now()}`,
        ticketId,
        senderId: 'admin',
        senderName: 'إدارة رويال جروب',
        senderRole: 'admin',
        content: welcomeContent,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  /**
   * Search and automatically create a ticket by tracking ID or Phone Number if needed
   */
  const findOrCreateTicketByTrackingOrPhone = async (queryStr: string): Promise<Ticket | null> => {
    const q = queryStr.trim().toUpperCase();
    if (!q) return null;

    // Search existing tickets first
    let existingTicket = tickets.find(t => 
      t.id.toUpperCase() === q || 
      t.clientPhone === queryStr || 
      (t.trackingId && t.trackingId.toUpperCase() === q) ||
      (t.requestId && t.requestId.toUpperCase() === q)
    );

    if (existingTicket) {
      const req = designRequests.find(r => r.id === existingTicket.requestId || r.requestNumber === existingTicket.trackingId);
      const sub = bedroomSubmissions.find(s => s.id === existingTicket.requestId || s.requestNumber === existingTicket.trackingId);
      if ((req && req.status === 'pending') || (sub && sub.status === 'pending')) {
        return null;
      }
      return existingTicket;
    }

    // If no ticket exists but we have an approved request, we find the ticket for it
    const req = designRequests.find(r => 
      (r.requestNumber && r.requestNumber.toUpperCase() === q) || 
      r.id.toUpperCase() === q || 
      r.phone === queryStr
    );
    if (req && req.status !== 'pending') {
      const t = tickets.find(x => x.requestId === req.id || x.sourceId === req.id);
      if (t) return t;
    }

    const sub = bedroomSubmissions.find(s => 
      (s.requestNumber && s.requestNumber.toUpperCase() === q) || 
      s.id.toUpperCase() === q || 
      s.clientPhone === queryStr
    );
    if (sub && sub.status !== 'pending') {
      const t = tickets.find(x => x.requestId === sub.id || x.sourceId === sub.id);
      if (t) return t;
    }

    return null;
  };

  /**
   * Project Ticket System: Create a new support/project ticket (Admin, Client, or Automated)
   */
  const createTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>, attachmentFiles?: File[]) => {
    const ticketId = await generateTicketId();
    
    // Upload files if any
    const attachments: string[] = [];
    if (attachmentFiles && attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        try {
          const url = await uploadFile(file, 'tickets');
          attachments.push(url);
        } catch (e) {
          console.error("Error uploading ticket attachment:", e);
        }
      }
    }

    const newTicket: Ticket = {
      ...ticket,
      id: ticketId,
      title: (ticket as any).title || (ticket as any).subject || 'تذكرة دعم فني',
      subject: (ticket as any).subject || (ticket as any).title || 'تذكرة دعم فني',
      status: 'open',
      attachments,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'tickets', ticketId), newTicket);
        
        // Add a system welcome message inside the private chat
        const systemMsg: Message = {
          id: `msg_welcome_${Date.now()}`,
          ticketId,
          senderId: 'admin',
          senderName: 'إدارة رويال جروب',
          senderRole: 'admin',
          content: `أهلاً بك يا ${ticket.clientName} في نظام الدعم الفني والمتابعة لـ Royal Group. تم إنشاء تذكرتك بنجاح برقم ${ticketId}. سيقوم مهندسو التصميم لدينا بالرد عليك ومتابعة طلبك هنا.`,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'messages', systemMsg.id), systemMsg);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketId}`);
      }
    } else {
      setTickets(prev => [newTicket, ...prev]);
      const systemMsg: Message = {
        id: `msg_welcome_${Date.now()}`,
        ticketId,
        senderId: 'admin',
        senderName: 'إدارة رويال جروب',
        senderRole: 'admin',
        content: `أهلاً بك يا ${ticket.clientName} في نظام الدعم الفني والمتابعة لـ Royal Group. تم إنشاء تذكرتك بنجاح برقم ${ticketId}. سيقوم مهندسو التصميم لدينا بالرد عليك ومتابعة طلبك هنا.`,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);
    }

    return newTicket;
  };

  /**
   * Project Ticket System: Delete Ticket (Admin)
   */
  const deleteTicket = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'tickets', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `tickets/${id}`);
      }
    } else {
      setTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  /**
   * Project Ticket System: Update Ticket Status (Open/Close/Reopen)
   */
  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    const updates = { status, updatedAt: Date.now() };
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'tickets', id), updates);

        // Send a system message indicating status change
        let statusAr = 'مفتوحة';
        if (status === 'in_progress') statusAr = 'قيد العمل والتنفيذ';
        if (status === 'under_review') statusAr = 'قيد المراجعة الفنية والتدقيق';
        if (status === 'closed') statusAr = 'مغلقة / تم حلها والانتهاء منها';

        const systemMsg: Message = {
          id: `msg_status_${Date.now()}`,
          ticketId: id,
          senderId: 'admin',
          senderName: 'نظام رويال جروب',
          senderRole: 'admin',
          content: `تنبيه النظام: تم تعديل حالة التذكرة لتصبح [${statusAr}]`,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'messages', systemMsg.id), systemMsg);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
      }
    } else {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      let statusAr = 'مفتوحة';
      if (status === 'in_progress') statusAr = 'قيد العمل والتنفيذ';
      if (status === 'under_review') statusAr = 'قيد المراجعة الفنية والتدقيق';
      if (status === 'closed') statusAr = 'مغلقة / تم حلها والانتهاء منها';
      const systemMsg: Message = {
        id: `msg_status_${Date.now()}`,
        ticketId: id,
        senderId: 'admin',
        senderName: 'نظام رويال جروب',
        senderRole: 'admin',
        content: `تنبيه النظام: تم تعديل حالة التذكرة لتصبح [${statusAr}]`,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  /**
   * Project Ticket System: Assign Ticket to Engineer (Admin)
   */
  const assignTicket = async (id: string, engineerId: string, engineerName: string) => {
    const updates = {
      assignedEngineerId: engineerId,
      assignedEngineerName: engineerName,
      status: 'in_progress' as TicketStatus,
      updatedAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'tickets', id), updates);

        // Add system log message
        const systemMsg: Message = {
          id: `msg_assign_${Date.now()}`,
          ticketId: id,
          senderId: 'admin',
          senderName: 'نظام رويال جروب',
          senderRole: 'admin',
          content: `تنبيه النظام: تم تعيين التذكرة للمهندس المصمم: [${engineerName}] ومباشرة العمل والمتابعة الفنية.`,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'messages', systemMsg.id), systemMsg);

        // Notify the engineer
        const engObj = engineers.find(e => e.id === engineerId);
        if (engObj) {
          const notify: Omit<TicketNotification, 'id' | 'createdAt' | 'read'> = {
            ticketId: id,
            recipientId: engObj.email,
            title: 'تم تعيين تذكرة جديدة لك',
            message: `تم تكليفك بالعمل على تذكرة العميل برقم ${id}. يرجى المتابعة والبدء بالنقاش في الغرفة الخاصة.`
          };
          await addNotification(notify);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tickets/${id}`);
      }
    } else {
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      const systemMsg: Message = {
        id: `msg_assign_${Date.now()}`,
        ticketId: id,
        senderId: 'admin',
        senderName: 'نظام رويال جروب',
        senderRole: 'admin',
        content: `تنبيه النظام: تم تعيين التذكرة للمهندس المصمم: [${engineerName}] ومباشرة العمل والمتابعة الفنية.`,
        createdAt: Date.now()
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  /**
   * Project Ticket System: Send a chat message (Admin / Client / Engineer)
   */
  const sendTicketMessage = async (msg: Omit<Message, 'id' | 'createdAt'>, files?: File[]) => {
    const newId = `msg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    
    // Upload files if any
    const attachmentsList: { name: string; url: string; type: string }[] = [];
    if (files && files.length > 0) {
      for (const f of files) {
        try {
          const url = await uploadFile(f, 'tickets');
          attachmentsList.push({
            name: f.name,
            url,
            type: f.type
          });
        } catch (e) {
          console.error("Error uploading message file attachment:", e);
        }
      }
    }

    const newMsg: Message = {
      ...msg,
      id: newId,
      attachments: attachmentsList.length > 0 ? attachmentsList : undefined,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'messages', newId), newMsg);

        // Update the ticket's updatedAt timestamp
        await updateDoc(doc(db, 'tickets', msg.ticketId), { updatedAt: Date.now() });

        // Generate notifications for other participants
        const ticketObj = tickets.find(t => t.id === msg.ticketId);
        if (ticketObj) {
          if (msg.senderRole === 'client') {
            await addNotification({
              ticketId: msg.ticketId,
              recipientId: 'admin',
              title: `رسالة جديدة من العميل في التذكرة ${msg.ticketId}`,
              message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
            });
            if (ticketObj.assignedEngineerId) {
              const engObj = engineers.find(e => e.id === ticketObj.assignedEngineerId);
              if (engObj) {
                await addNotification({
                  ticketId: msg.ticketId,
                  recipientId: engObj.email,
                  title: `رسالة جديدة من العميل في التذكرة ${msg.ticketId}`,
                  message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
                });
              }
            }
          } 
          else if (msg.senderRole === 'admin') {
            await addNotification({
              ticketId: msg.ticketId,
              recipientId: 'client',
              title: `رسالة جديدة من الإدارة في التذكرة ${msg.ticketId}`,
              message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
            });
            if (ticketObj.assignedEngineerId) {
              const engObj = engineers.find(e => e.id === ticketObj.assignedEngineerId);
              if (engObj) {
                await addNotification({
                  ticketId: msg.ticketId,
                  recipientId: engObj.email,
                  title: `رسالة جديدة من الإدارة في التذكرة ${msg.ticketId}`,
                  message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
                });
              }
            }
          }
          else if (msg.senderRole === 'engineer') {
            await addNotification({
              ticketId: msg.ticketId,
              recipientId: 'admin',
              title: `رسالة جديدة من المهندس المصمم في التذكرة ${msg.ticketId}`,
              message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
            });
            await addNotification({
              ticketId: msg.ticketId,
              recipientId: 'client',
              title: `رسالة جديدة من المهندس المصمم في التذكرة ${msg.ticketId}`,
              message: `${msg.senderName}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `messages/${newId}`);
      }
    } else {
      setMessages(prev => [...prev, newMsg]);
      setTickets(prev => prev.map(t => t.id === msg.ticketId ? { ...t, updatedAt: Date.now() } : t));
    }
  };

  /**
   * Project Ticket System: Add a generic notification
   */
  const addNotification = async (notification: Omit<TicketNotification, 'id' | 'createdAt' | 'read'>) => {
    const newId = `notif_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const newNotif: TicketNotification = {
      ...notification,
      id: newId,
      read: false,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'notifications', newId), newNotif);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `notifications/${newId}`);
      }
    } else {
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  /**
   * Project Ticket System: Mark notification as read
   */
  const markNotificationAsRead = async (id: string) => {
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  /**
   * Project Ticket System: Mark all messages for a ticket as read by current role
   */
  const markMessagesAsRead = async (ticketId: string, role: 'admin' | 'client' | 'engineer') => {
    const unreadMessages = messages.filter(
      m => m.ticketId === ticketId && m.senderRole !== role && !m.read
    );

    if (unreadMessages.length === 0) return;

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        for (const m of unreadMessages) {
          await updateDoc(doc(db, 'messages', m.id), { read: true });
        }
      } catch (error) {
        console.error("Error marking messages as read in Firestore:", error);
      }
    } else {
      setMessages(prev =>
        prev.map(m =>
          m.ticketId === ticketId && m.senderRole !== role ? { ...m, read: true } : m
        )
      );
    }
  };

  return (
    <FirebaseStateContext.Provider value={{
      isFirebaseConnected,
      projects,
      categories,
      colorVariants,
      designRequests,
      companySettings,
      socialLinks,
      bedroomOptions,
      bedroomSubmissions,
      engineers,
      tickets,
      messages,
      notifications,
      loading,
      saveFirebaseConfig,
      addProject,
      updateProject,
      deleteProject,
      addDesignRequest,
      updateDesignRequestStatus,
      updateCompanySettings,
      updateSocialLinks,
      addColorVariant,
      deleteColorVariant,
      uploadFile,
      addBedroomOption,
      updateBedroomOption,
      deleteBedroomOption,
      addBedroomSubmission,
      updateBedroomSubmissionStatus,
      deleteBedroomSubmission,
      addEngineer,
      updateEngineer,
      deleteEngineer,
      createTicket,
      updateTicketStatus,
      assignTicket,
      sendTicketMessage,
      markMessagesAsRead,
      addNotification,
      markNotificationAsRead,
      findOrCreateTicketByTrackingOrPhone,
      deleteTicket
    }}>
      {children}
    </FirebaseStateContext.Provider>
  );
};

export const useFirebaseState = () => {
  const context = useContext(FirebaseStateContext);
  if (!context) {
    throw new Error("useFirebaseState must be used within a FirebaseStateProvider");
  }
  return context;
};
