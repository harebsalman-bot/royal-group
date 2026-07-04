/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Project, Category, ColorVariant, DesignRequest, CompanySettings, SocialLinks, BedroomOption, BedroomSubmission,
  RequestStatus, RejectionReason
} from '../types';
import { 
  mockProjects, mockCategories, mockColorVariants, mockCompanySettings, mockSocialLinks 
} from '../data/mockData';
import { 
  initializeDynamicFirebase, isFirebaseReady, getDb, handleFirestoreError, OperationType 
} from '../firebase';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
  loading: boolean;
  saveFirebaseConfig: (config: any) => Promise<boolean>;
  addProject: (proj: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, proj: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addDesignRequest: (req: Omit<DesignRequest, 'id' | 'status' | 'createdAt'>, planFiles: File[], imageFiles: File[]) => Promise<void>;
  updateDesignRequestStatus: (id: string, status: RequestStatus, additionalFields?: Partial<DesignRequest>) => Promise<void>;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  updateSocialLinks: (links: SocialLinks) => Promise<void>;
  addColorVariant: (variant: Omit<ColorVariant, 'id' | 'createdAt'>) => Promise<void>;
  deleteColorVariant: (id: string) => Promise<void>;
  uploadFile: (file: File, folder: 'projects' | 'before-after' | 'color-lab' | 'bedroom-options') => Promise<string>;
  addBedroomOption: (option: Omit<BedroomOption, 'id' | 'createdAt'>) => Promise<void>;
  updateBedroomOption: (id: string, option: Partial<BedroomOption>) => Promise<void>;
  deleteBedroomOption: (id: string) => Promise<void>;
  addBedroomSubmission: (sub: Omit<BedroomSubmission, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateBedroomSubmissionStatus: (id: string, status: RequestStatus, additionalFields?: Partial<BedroomSubmission>) => Promise<void>;
  deleteBedroomSubmission: (id: string) => Promise<void>;
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

      // 2. Check and Seed Projects
      const projectsSnap = await getDocs(collection(db, 'projects'));
      if (projectsSnap.empty) {
        for (const proj of mockProjects) {
          await setDoc(doc(db, 'projects', proj.id), proj);
        }
      }

      // 3. Check and Seed Color Variants
      const colorsSnap = await getDocs(collection(db, 'colorVariants'));
      if (colorsSnap.empty) {
        for (const col of mockColorVariants) {
          await setDoc(doc(db, 'colorVariants', col.id), col);
        }
      }

      // 4. Check and Seed Project Images Collection
      const projectImagesSnap = await getDocs(collection(db, 'projectImages'));
      if (projectImagesSnap.empty) {
        await setDoc(doc(db, 'projectImages', 'placeholder_init'), {
          id: 'placeholder_init',
          title: 'Royal Group Default Concept',
          url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
          createdAt: Date.now()
        });
      }

      // 5. Check and Seed Design Requests Collection
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

      // Subscribe to Projects
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

      // Subscribe to Color Variants
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

      // Subscribe to Design Requests
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

      // 6. Check and Seed Bedroom Options
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

      // Subscribe to Bedroom Options
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

      // Subscribe to Bedroom Submissions
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

      // Fetch Company Settings (Single Document)
      const settingsDocRef = doc(db, 'companySettings', 'main');
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        setCompanySettings(settingsSnap.data() as CompanySettings);
      } else {
        await setDoc(settingsDocRef, mockCompanySettings);
        setCompanySettings(mockCompanySettings);
      }

      // Fetch Social Links (Single Document)
      const socialDocRef = doc(db, 'socialLinks', 'main');
      const socialSnap = await getDoc(socialDocRef);
      if (socialSnap.exists()) {
        setSocialLinks(socialSnap.data() as SocialLinks);
      } else {
        await setDoc(socialDocRef, mockSocialLinks);
        setSocialLinks(mockSocialLinks);
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
   * Universal file uploader: Uploads to Firebase Storage if connected, otherwise Base64 or Unsplash placeholders
   */
  const uploadFile = async (file: File, folder: 'projects' | 'before-after' | 'color-lab'): Promise<string> => {
    if (isFirebaseConnected) {
      try {
        const storage = getStorage();
        const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const fileRef = ref(storage, `${folder}/${uniqueName}`);
        const snapshot = await uploadBytes(fileRef, file);
        return await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.warn("Storage upload failed or is not configured. Falling back to local/Base64/Placeholder URL:", error);
        
        // If file is small, encode to Base64 to preserve custom user input
        if (file.size < 250 * 1024) {
          try {
            return await fileToBase64(file);
          } catch (e) {
            console.error("Base64 fallback failed:", e);
          }
        }
        
        // Professional high-quality Unsplash interior/architecture designs matching Royal Group theme
        if (folder === 'before-after') {
          return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"; // Luxury modern villa living room
        } else if (folder === 'color-lab') {
          return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"; // Luxury marble / interior design detail
        } else {
          return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"; // Contemporary interior design
        }
      }
    } else {
      // In Demo Mode, encode file to Base64 to render immediately
      return await fileToBase64(file);
    }
  };

  /**
   * Add a new project
   */
  const addProject = async (proj: Omit<Project, 'id' | 'createdAt'>) => {
    const newId = `proj_${Date.now()}`;
    const newProject: Project = {
      ...proj,
      id: newId,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'projects', newId), newProject);
      } catch (error) {
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
    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await updateDoc(doc(db, 'projects', id), proj);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
      }
    } else {
      // Demo State
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...proj } : p));
    }
  };

  /**
   * Delete project
   */
  const deleteProject = async (id: string) => {
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
    let maxNum = 0;
    if (isFirebaseConnected) {
      try {
        const db = getDb();
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
        console.error("Error generating unique request number from Firestore:", e);
      }
    }
    
    // Fallback/Demo check in local state
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
    
    return `RG-${String(maxNum + 1).padStart(6, '0')}`;
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
      status: 'New',
      requestNumber: reqNum,
      viewed: false,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'designRequests', newId), newRequest);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `designRequests/${newId}`);
      }
    } else {
      // Demo State
      setDesignRequests(prev => [newRequest, ...prev]);
    }
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
      status: 'New',
      requestNumber: reqNum,
      viewed: false,
      createdAt: Date.now()
    };

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await setDoc(doc(db, 'bedroomSubmissions', newId), newSubmission);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `bedroomSubmissions/${newId}`);
      }
    } else {
      setBedroomSubmissions(prev => [newSubmission, ...prev]);
    }
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
      deleteBedroomSubmission
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
