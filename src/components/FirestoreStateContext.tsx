/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  collection, doc, getDocs, setDoc as firestoreSetDoc, updateDoc as firestoreUpdateDoc, deleteDoc, getDoc, query, orderBy, onSnapshot, where, limit 
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
  addEngineer: (engineer: Omit<Engineer, 'id' | 'createdAt'>, password?: string) => Promise<void>;
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
  refreshUserSession?: () => void;
  currentUserRole: 'client' | 'engineer' | 'admin';
  currentUserId: string | null;
  logout: () => Promise<void>;
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

export const FirebaseStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const hasSubscribedOnce = useRef<boolean>(false);

  // Dynamic User Session for Data Isolation
  // Start role as 'client' with no active ID initially to prevent rendering Admin UI before auth check finishes.
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'engineer' | 'admin'>('client');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Listen to Firebase Auth state changes as the single source of truth
  useEffect(() => {
    if (!isFirebaseConnected) {
      return;
    }

    let unsubscribeAuth: (() => void) | null = null;
    let isMounted = true;

    const setupAuthListener = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuthService();

        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (!isMounted) return;
          console.log("[AuthListener] onAuthStateChanged fired. Current Firebase User:", user ? user.email : "None");
          console.log("[Auth] auth initialized");

          let resolvedRole: 'client' | 'engineer' | 'admin' = 'client';
          let resolvedUserId: string | null = null;

          if (user) {
            const email = user.email?.toLowerCase();
            if (email === 'harebsalman@gmail.com') {
              console.log("[AuthListener] Valid authenticated Admin session confirmed:", email);
              localStorage.setItem('royal_user_role', 'admin');
              resolvedRole = 'admin';
              resolvedUserId = 'admin';
            } else {
              // Check if they are an engineer or client
              const savedRole = localStorage.getItem('royal_user_role');
              if (savedRole === 'engineer') {
                resolvedRole = 'engineer';
                const savedUserJson = localStorage.getItem('royal_logged_in_user');
                if (savedUserJson) {
                  try {
                    const u = JSON.parse(savedUserJson);
                    if (u && u.id) resolvedUserId = u.id;
                  } catch (e) {}
                }
                if (!resolvedUserId) {
                  resolvedUserId = user.uid;
                }
              } else {
                // Try fetching user record directly from database
                try {
                  const db = getDb();
                  const docSnap = await getDoc(doc(db, 'users', user.uid));
                  if (docSnap.exists() && docSnap.data().role === 'engineer') {
                    console.log("[AuthListener] Valid authenticated Engineer session confirmed from DB:", email);
                    resolvedRole = 'engineer';
                    resolvedUserId = user.uid;
                    localStorage.setItem('royal_user_role', 'engineer');
                    localStorage.setItem('royal_logged_in_user', JSON.stringify({
                      id: user.uid,
                      email: user.email,
                      role: 'engineer',
                      ...docSnap.data()
                    }));
                  } else {
                    console.log("[AuthListener] Valid session confirmed (Client):", email);
                    resolvedRole = 'client';
                    let cid = localStorage.getItem('royal_client_uid');
                    if (!cid) {
                      cid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
                      localStorage.setItem('royal_client_uid', cid);
                    }
                    resolvedUserId = cid;
                  }
                } catch (dbErr) {
                  console.log("[AuthListener] Direct DB check failed, falling back to local storage:", dbErr);
                  if (savedRole === 'engineer') {
                    resolvedRole = 'engineer';
                    const savedUserJson = localStorage.getItem('royal_logged_in_user');
                    if (savedUserJson) {
                      try {
                        const u = JSON.parse(savedUserJson);
                        if (u && u.id) resolvedUserId = u.id;
                      } catch (e) {}
                    }
                    if (!resolvedUserId) resolvedUserId = user.uid;
                  } else {
                    resolvedRole = 'client';
                    let cid = localStorage.getItem('royal_client_uid');
                    if (!cid) {
                      cid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
                      localStorage.setItem('royal_client_uid', cid);
                    }
                    resolvedUserId = cid;
                  }
                }
              }
            }
          } else {
            console.log("[AuthListener] No active Firebase Auth session. Rejecting / clearing any stale role state.");
            localStorage.removeItem('royal_user_role');
            localStorage.removeItem('royal_logged_in_user');
            resolvedRole = 'client';
            
            let cid = localStorage.getItem('royal_client_uid');
            if (!cid) {
              cid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
              localStorage.setItem('royal_client_uid', cid);
            }
            resolvedUserId = cid;
          }

          setCurrentUserRole(resolvedRole);
          setCurrentUserId(resolvedUserId);
          setIsAuthLoading(false);
          console.log(`[Auth] role resolved: ${resolvedRole}`);
        });
      } catch (e) {
        console.error("[AuthListener] Error importing/setting up onAuthStateChanged:", e);
        setIsAuthLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      isMounted = false;
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, [isFirebaseConnected]);

  const refreshUserSession = () => {
    const savedRole = localStorage.getItem('royal_user_role') as 'client' | 'engineer' | 'admin' | null;
    const savedUserJson = localStorage.getItem('royal_logged_in_user');
    
    let role: 'client' | 'engineer' | 'admin' = 'client';
    let uid: string | null = null;
    
    if (savedRole === 'admin') {
      role = 'admin';
      uid = 'admin';
    } else if (savedRole === 'engineer') {
      role = 'engineer';
      if (savedUserJson) {
        try {
          const u = JSON.parse(savedUserJson);
          if (u && u.id) uid = u.id;
        } catch (e) {}
      }
    } else {
      role = 'client';
      uid = localStorage.getItem('royal_client_uid');
      if (!uid) {
        uid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        localStorage.setItem('royal_client_uid', uid);
      }
    }
    
    setCurrentUserRole(role);
    setCurrentUserId(uid);
    console.log(`[FirestoreSession] Session refreshed: role=${role}, uid=${uid}`);
    console.log(`[Auth] role resolved: ${role}`);
  };

  // Centralized robust logout execution
  const logout = async () => {
    console.log("[Auth] Logout execution initiated.");
    
    // Clear all local storage role and user states
    localStorage.removeItem('royal_user_role');
    localStorage.removeItem('royal_logged_in_user');
    
    // Generate fresh clean client ID for the guest state
    const newCid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    localStorage.setItem('royal_client_uid', newCid);
    
    // Sign out from Firebase Auth if connected
    if (isFirebaseConnected && isFirebaseReady()) {
      try {
        const { getAuth, signOut } = await import('firebase/auth');
        const auth = getAuth();
        await signOut(auth);
        console.log("[Auth] Firebase Auth signOut successful.");
      } catch (err) {
        console.error("[Auth] Error during Firebase Auth signOut:", err);
      }
    }
    
    // Reset React state
    setCurrentUserRole('client');
    setCurrentUserId(newCid);
    
    console.log("[Auth] Logout execution completed successfully. Reloading page...");
    window.location.reload();
  };

  // App states
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [designRequests, setDesignRequests] = useState<DesignRequest[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(mockCompanySettings);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(mockSocialLinks);
  const [bedroomOptions, setBedroomOptions] = useState<BedroomOption[]>([]);
  const [bedroomSubmissions, setBedroomSubmissions] = useState<BedroomSubmission[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<TicketNotification[]>([]);

  // Check if Firebase is ready initially
  useEffect(() => {
    const checkInit = async () => {
      console.log("[AuthInit] Initializing application auth bootstrap check...");
      if (isFirebaseReady()) {
        console.log("[AuthInit] Firebase is configured and ready. Setting isFirebaseConnected to true.");
        setIsFirebaseConnected(true);
        await syncDataFromFirebase();
      } else {
        console.log("[AuthInit] Firebase is NOT configured. Operating in high-fidelity local demo mode.");
        // Restoring local storage session immediately for demo mode
        const savedRole = localStorage.getItem('royal_user_role') as 'client' | 'engineer' | 'admin' | null;
        const role = savedRole || 'client';
        setCurrentUserRole(role);
        console.log("[AuthInit] Restored local demo role:", role);

        let uid: string | null = null;
        if (role === 'admin') {
          uid = 'admin';
        } else if (role === 'engineer') {
          const savedUserJson = localStorage.getItem('royal_logged_in_user');
          if (savedUserJson) {
            try {
              const u = JSON.parse(savedUserJson);
              if (u && u.id) uid = u.id;
            } catch (e) {}
          }
        }
        if (!uid) {
          uid = localStorage.getItem('royal_client_uid');
          if (!uid) {
            uid = `client_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
            localStorage.setItem('royal_client_uid', uid);
          }
        }
        setCurrentUserId(uid);
        console.log("[AuthInit] Restored local demo uid:", uid);

        setLoading(false);
        setIsAuthLoading(false);
      }
    };
    checkInit();
  }, []);

  const syncDataFromFirebase = async () => {
    try {
      setLoading(true);
      // Give Firestore listeners a fraction of a second to start loading initial cached values
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (error) {
      console.error("Error starting real-time sync loader:", error);
      setLoading(false);
    }
  };

  // Dynamic Real-Time Subscriptions with Query-Level Data Isolation
  useEffect(() => {
    if (!isFirebaseConnected) return;
    if (isAuthLoading) {
      console.log("[FirestoreSecurity] Deferring subscriptions until Auth state has loaded and role resolution is complete.");
      return;
    }

    if (!hasSubscribedOnce.current) {
      console.log("[Subscription] subscriptions started");
      hasSubscribedOnce.current = true;
    } else {
      console.log("[Subscription] subscriptions restarted");
    }

    console.log(`[FirestoreSecurity] Rebuilding dynamic isolated subscriptions: role=${currentUserRole}, uid=${currentUserId}`);
    const db = getDb();
    const unsubscribes: (() => void)[] = [];

    // 1. Subscribe to Categories (Public, Real-time)
    try {
      const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
        const catList: Category[] = [];
        snapshot.forEach(docSnap => {
          catList.push(docSnap.data() as Category);
        });
        setCategories(catList);
      }, (error) => {
        console.warn("Categories subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up Categories subscription:", e);
    }

    // 2. Subscribe to Projects (Public, Real-time, Ordered)
    try {
      const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(qProjects, (snapshot) => {
        const projList: Project[] = [];
        snapshot.forEach(docSnap => {
          projList.push(docSnap.data() as Project);
        });
        setProjects(projList);
      }, (error) => {
        console.warn("Projects subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up Projects subscription:", e);
    }

    // 3. Subscribe to Color Variants (Public, Real-time, Ordered)
    try {
      const qColors = query(collection(db, 'colorVariants'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(qColors, (snapshot) => {
        const colorList: ColorVariant[] = [];
        snapshot.forEach(docSnap => {
          colorList.push(docSnap.data() as ColorVariant);
        });
        setColorVariants(colorList);
      }, (error) => {
        console.warn("ColorVariants subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up ColorVariants subscription:", e);
    }

    // 4. Subscribe to Bedroom Options (Public, Real-time, Ordered)
    try {
      const qBedroomOptions = query(collection(db, 'bedroomOptions'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(qBedroomOptions, (snapshot) => {
        const list: BedroomOption[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as BedroomOption);
        });
        setBedroomOptions(list);
      }, (error) => {
        console.warn("BedroomOptions subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up BedroomOptions subscription:", e);
    }

    // 5. Subscribe to Engineers (Public, Real-time, Client-side sorted)
    try {
console.log("[EngineersSubscription] Subscribing to 'engineers' collection where role == 'engineer'");
      const qEngineers = querycollection(db, 'engineers'), where('role', '==', 'engineer'));
      const unsub = onSnapshot(qEngineers, (snapshot) => {
        const list: Engineer[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            specialty: data.specialty || data.specialization || '',
            specialization: data.specialization || data.specialty || '',
            active: data.active !== false && data.status !== 'disabled',
            status: data.status || (data.active !== false ? 'active' : 'disabled'),
            role: 'engineer',
            createdAt: data.createdAt || 0,
            currentTickets: data.currentTickets || 0,
            currentProjects: data.currentProjects || 0,
          } as Engineer);
        });

        // Client-side sort descending by createdAt
        list.sort((a, b) => b.createdAt - a.createdAt);

        console.log(`[EngineersSubscription] SUCCESSFUL SYNC FROM COLLECTION: 'users'`);
        console.log(`- Number of engineers loaded: ${list.length}`);
        console.log(`- Engineer IDs returned: ${JSON.stringify(list.map(e => e.id))}`);
        list.forEach(e => {
          console.log(`  * Document path: users/${e.id}`);
        });

        setEngineers(list);
      }, (error) => {
        console.warn("[EngineersSubscription] Subscription restricted/deferred for this role (clients/guests lack directory read access). Details:", error.message);
        setEngineers([]);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.warn("[EngineersSubscription] Error setting up Engineers subscription:", e);
    }

    // 6. Subscribe to Company Settings (Single Document, Real-time with auto-seed fallback)
    try {
      const unsub = onSnapshot(doc(db, 'companySettings', 'main'), async (snapshot) => {
        if (snapshot.exists()) {
          setCompanySettings(snapshot.data() as CompanySettings);
        } else {
          try {
            await setDoc(doc(db, 'companySettings', 'main'), mockCompanySettings);
          } catch (e) {
            console.error("Error auto-seeding company settings in snapshot:", e);
          }
        }
      }, (error) => {
        console.warn("CompanySettings subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up CompanySettings subscription:", e);
    }

    // 7. Subscribe to Social Links (Single Document, Real-time with auto-seed fallback)
    try {
      const unsub = onSnapshot(doc(db, 'socialLinks', 'main'), async (snapshot) => {
        if (snapshot.exists()) {
          setSocialLinks(snapshot.data() as SocialLinks);
        } else {
          try {
            await setDoc(doc(db, 'socialLinks', 'main'), mockSocialLinks);
          } catch (e) {
            console.error("Error auto-seeding social links in snapshot:", e);
          }
        }
      }, (error) => {
        console.warn("SocialLinks subscription error:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up SocialLinks subscription:", e);
    }

    // 8. Subscribe to Design Requests
    try {
      let qRequests;
      if (currentUserRole === 'admin') {
        qRequests = query(collection(db, 'designRequests'));
      } else if (currentUserRole === 'engineer') {
        qRequests = query(collection(db, 'designRequests'), where('assignedEngineerId', '==', currentUserId));
      } else {
        // Client data isolation - only their requests
        qRequests = query(collection(db, 'designRequests'), where('clientId', '==', currentUserId));
      }

      const unsub = onSnapshot(qRequests, (snapshot) => {
        const reqList: DesignRequest[] = [];
        snapshot.forEach(docSnap => {
          reqList.push(docSnap.data() as DesignRequest);
        });
        // Sort on client side to avoid Firestore composite index requirements
        reqList.sort((a, b) => b.createdAt - a.createdAt);
        setDesignRequests(reqList);
      }, (error) => {
        console.warn("DesignRequests isolated read error/blocked:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up isolated DesignRequests subscription:", e);
    }

    // 9. Subscribe to Bedroom Submissions
    try {
      let qSubmissions;
      if (currentUserRole === 'admin') {
        qSubmissions = query(collection(db, 'bedroomSubmissions'));
      } else if (currentUserRole === 'engineer') {
        qSubmissions = query(collection(db, 'bedroomSubmissions'), where('assignedEngineerId', '==', currentUserId));
      } else {
        // Client data isolation - only their submissions
        qSubmissions = query(collection(db, 'bedroomSubmissions'), where('clientId', '==', currentUserId));
      }

      const unsub = onSnapshot(qSubmissions, (snapshot) => {
        const list: BedroomSubmission[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as BedroomSubmission);
        });
        // Sort on client side
        list.sort((a, b) => b.createdAt - a.createdAt);
        setBedroomSubmissions(list);
      }, (error) => {
        console.warn("BedroomSubmissions isolated read error/blocked:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up isolated BedroomSubmissions subscription:", e);
    }

    // 10. Subscribe to Tickets
    try {
      let qTickets;
      if (currentUserRole === 'admin') {
        qTickets = query(collection(db, 'tickets'));
      } else if (currentUserRole === 'engineer') {
        qTickets = query(collection(db, 'tickets'), where('assignedEngineerId', '==', currentUserId));
      } else {
        // Client data isolation - only their tickets
        qTickets = query(collection(db, 'tickets'), where('clientId', '==', currentUserId));
      }

      const unsub = onSnapshot(qTickets, (snapshot) => {
        const list: Ticket[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Ticket);
        });
        // Sort on client side
        list.sort((a, b) => b.createdAt - a.createdAt);
        setTickets(list);
      }, (error) => {
        console.warn("Tickets isolated read error/blocked:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up isolated Tickets subscription:", e);
    }

    // 11. Subscribe to Messages
    try {
      let qMessages;
      if (currentUserRole === 'admin') {
        qMessages = query(collection(db, 'messages'));
      } else if (currentUserRole === 'engineer') {
        qMessages = query(collection(db, 'messages'), where('assignedEngineerId', '==', currentUserId));
      } else {
        // Client data isolation - only messages from their tickets
        qMessages = query(collection(db, 'messages'), where('clientId', '==', currentUserId));
      }

      const unsub = onSnapshot(qMessages, (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Message);
        });
        // Sort ascending for chat stream
        list.sort((a, b) => a.createdAt - b.createdAt);
        setMessages(list);
      }, (error) => {
        console.warn("Messages isolated read error/blocked:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up isolated Messages subscription:", e);
    }

    // 12. Subscribe to Notifications
    try {
      let qNotifs;
      if (currentUserRole === 'admin') {
        qNotifs = query(collection(db, 'notifications'), where('recipientId', '==', 'admin'));
      } else if (currentUserRole === 'engineer') {
        let engineerEmail = 'none';
        const savedUserJson = localStorage.getItem('royal_logged_in_user');
        if (savedUserJson) {
          try {
            const u = JSON.parse(savedUserJson);
            if (u && u.email) engineerEmail = u.email;
          } catch(e) {}
        }
        qNotifs = query(collection(db, 'notifications'), where('recipientId', '==', engineerEmail));
      } else {
        // Client data isolation - only notifications of recipient client belonging to their specific ID
        qNotifs = query(collection(db, 'notifications'), where('recipientId', '==', 'client'), where('clientId', '==', currentUserId));
      }

      const unsub = onSnapshot(qNotifs, (snapshot) => {
        const list: TicketNotification[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as TicketNotification);
        });
        // Sort descending
        list.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(list);
      }, (error) => {
        console.warn("Notifications isolated read error/blocked:", error.message);
      });
      unsubscribes.push(unsub);
    } catch (e) {
      console.error("Error setting up isolated Notifications subscription:", e);
    }

    return () => {
      console.log("[FirestoreSecurity] Cleaning up isolated subscriptions...");
      unsubscribes.forEach(unsub => unsub());
    };
  }, [isFirebaseConnected, currentUserRole, currentUserId, isAuthLoading]);

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
      assignedEngineerName: null,
      clientId: currentUserId || localStorage.getItem('royal_client_uid') || undefined
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
      let req = designRequests.find(r => r.id === id);
      if (!req && isFirebaseConnected) {
        try {
          const db = getDb();
          const docSnap = await getDoc(doc(db, 'designRequests', id));
          if (docSnap.exists()) {
            req = docSnap.data() as DesignRequest;
          }
        } catch (err) {
          console.error("Direct fetch of designRequest failed during approval:", err);
        }
      }
      if (req) {
        const engId = additionalFields?.assignedEngineerId || req.assignedEngineerId || undefined;
        const engName = additionalFields?.assignedEngineerName || req.assignedEngineerName || undefined;
        const engAt = additionalFields?.assignedAt || req.assignedAt || undefined;

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
          engAt,
          req.clientId
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
      assignedEngineerName: null,
      clientId: currentUserId || localStorage.getItem('royal_client_uid') || undefined
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
      let sub = bedroomSubmissions.find(s => s.id === id);
      if (!sub && isFirebaseConnected) {
        try {
          const db = getDb();
          const docSnap = await getDoc(doc(db, 'bedroomSubmissions', id));
          if (docSnap.exists()) {
            sub = docSnap.data() as BedroomSubmission;
          }
        } catch (err) {
          console.error("Direct fetch of bedroomSubmission failed during approval:", err);
        }
      }
      if (sub) {
        const engId = additionalFields?.assignedEngineerId || sub.assignedEngineerId || undefined;
        const engName = additionalFields?.assignedEngineerName || sub.assignedEngineerName || undefined;
        const engAt = additionalFields?.assignedAt || sub.assignedAt || undefined;

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
          engAt,
          sub.clientId
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
  const addEngineer = async (engineer: Omit<Engineer, 'id' | 'createdAt'>, password?: string) => {
    let newId = `eng_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    console.log(`[addEngineer] Initiating engineer creation. Provided email: ${engineer.email}`);

    if (currentUserRole !== 'admin') {
      console.error("[Security] Unauthorized attempt to add engineer. Role is:", currentUserRole);
      throw new Error("عذراً، صلاحية مدير النظام مطلوبة لإجراء هذه العملية.");
    }

    if (isFirebaseConnected) {
      try {
        const config = getActiveConfig();
        const { getApps, initializeApp, deleteApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');

        let secondaryApp;
        const apps = getApps();
        const existingApp = apps.find(app => app.name === 'SecondaryRegister');
        if (existingApp) {
          secondaryApp = existingApp;
        } else {
          secondaryApp = initializeApp(config, 'SecondaryRegister');
        }

        const secondaryAuth = getAuth(secondaryApp);
        
        console.log(`[addEngineer] Calling createUserWithEmailAndPassword on secondary Auth... Email: ${engineer.email.trim()}`);
        
        // Attempt creating the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          engineer.email.trim(),
          password || 'RoyalGroup@2026'
        );
        
        newId = userCredential.user.uid;
        console.log(`[addEngineer] Auth creation result: SUCCESS.`);
        console.log(`- generated uid: ${newId}`);
        console.log(`- email: ${userCredential.user.email}`);
        console.log(`- userCredential:`, userCredential);

        // Clean up secondary session immediately
        await signOut(secondaryAuth);
        try {
          await deleteApp(secondaryApp);
        } catch (delErr) {
          console.warn("Could not delete secondary app:", delErr);
        }

        // Define createEngineer() to handle Firestore writes to single source of truth 'users' collection
        const createEngineer = async (engineerId: string, email: string) => {
          console.log(`[createEngineer] Saving engineer document to Firestore...`);
          console.log(`- engineerId: ${engineerId}`);
          console.log(`- email: ${email}`);

          const db = getDb();
          const newEng: Engineer = {
            active: true,
            status: 'active',
            role: 'engineer',
            ...engineer,
            id: engineerId,
            createdAt: Date.now()
          };

          console.log(`[createEngineer] Writing to 'users' collection with ID: ${engineerId}`);
          await setDoc(doc(db, 'users', engineerId), newEng);
          console.log(`- Firestore write result ('users'): SUCCESS`);
        };

        // Call the nested createEngineer function to write to Firestore
        await createEngineer(newId, engineer.email.trim().toLowerCase());

      } catch (error: any) {
        console.error("[addEngineer] Failed to create engineer auth/firestore account:", error);
        let errorMsg = error?.message || 'حدث خطأ أثناء إنشاء حساب المهندس.';
        if (error?.code === 'auth/email-already-in-use') {
          errorMsg = 'هذا البريد الإلكتروني مستخدم بالفعل في النظام.';
        } else if (error?.code === 'auth/weak-password') {
          errorMsg = 'كلمة المرور ضعيفة للغاية. يرجى اختيار كلمة مرور أقوى.';
        }
        throw new Error(errorMsg);
      }
    } else {
      const newEng: Engineer = {
        active: true,
        status: 'active',
        role: 'engineer',
        ...engineer,
        id: newId,
        createdAt: Date.now()
      };
      console.log(`[addEngineer] Saved new engineer locally (No Firebase connection).`);
      console.log(`- generated uid / engineerId: ${newId}`);
      console.log(`- email: ${engineer.email}`);
      setEngineers(prev => [newEng, ...prev]);
    }
  };

  /**
   * Project Ticket System: Update an engineer (Admin)
   */
  const updateEngineer = async (id: string, updates: Partial<Engineer>) => {
    console.log("NEW UPDATE ENGINEER CODE RUNNING");
    console.log(`[updateEngineer] Attempting to update engineer in 'users' collection. Target ID: ${id}, Updates:`, updates);

    if (currentUserRole !== 'admin') {
      console.error("[Security] Unauthorized attempt to update engineer. Role is:", currentUserRole);
      throw new Error("عذراً، صلاحية مدير النظام مطلوبة لإجراء هذه العملية.");
    }

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        const userRef = doc(db, 'users', id);
        const userSnap = await getDoc(userRef);

        console.log(`[updateEngineer] Checking existence in 'users' collection. ID: ${id}, Exists: ${userSnap.exists()}`);

        if (userSnap.exists()) {
          console.log(`[updateEngineer] Document exists. Performing update for ID: ${id}`);
          
          // Map active to status if needed
          const mappedUpdates = { ...updates };
          if (updates.active !== undefined) {
            mappedUpdates.status = updates.active ? 'active' : 'disabled';
          }
          await updateDoc(userRef, mappedUpdates);
        } else {
          throw new Error('المهندس المطلوب تعديله غير موجود في قاعدة البيانات.');
        }
      } catch (error) {
        console.error(`[updateEngineer] Error during save/update for ID: ${id}:`, error);
        handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
      }
    } else {
      setEngineers(prev => prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          if (updates.active !== undefined) {
            updated.status = updates.active ? 'active' : 'disabled';
          }
          return updated;
        }
        return e;
      }));
    }
  };

  /**
   * Project Ticket System: Delete an engineer (Admin)
   */
  const deleteEngineer = async (id: string) => {
    console.log(`[deleteEngineer] Attempting to delete engineer. Target ID: ${id}`);

    if (currentUserRole !== 'admin') {
      console.error("[Security] Unauthorized attempt to delete engineer. Role is:", currentUserRole);
      throw new Error("عذراً، صلاحية مدير النظام مطلوبة لإجراء هذه العملية.");
    }

    if (isFirebaseConnected) {
      try {
        const db = getDb();
        await deleteDoc(doc(db, 'users', id));
        console.log(`[deleteEngineer] SUCCESSFUL DELETION of users/${id}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
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
    assignedAt?: number,
    clientId?: string
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
      assignedAt,
      clientId: clientId || undefined
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

    const participants = ['admin'];
    if (clientId) participants.push(`client:${clientId}`);
    if (assignedEngineerId) participants.push(`engineer:${assignedEngineerId}`);

    console.log("[ChatRoom Creation Audit]", {
      ticketId,
      clientId: clientId || 'N/A',
      assignedEngineerId: assignedEngineerId || 'N/A',
      chatRoomId: ticketId,
      participants
    });

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
          createdAt: Date.now(),
          clientId: clientId || undefined,
          assignedEngineerId: assignedEngineerId || null
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
        createdAt: Date.now(),
        clientId: clientId || undefined,
        assignedEngineerId: assignedEngineerId || null
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

    const db = getDb();
    const currentClientId = currentUserId || localStorage.getItem('royal_client_uid') || undefined;

    // 1. Search existing tickets first (Local state)
    let existingTicket = tickets.find(t => 
      t.id.toUpperCase() === q || 
      t.clientPhone === queryStr || 
      (t.trackingId && t.trackingId.toUpperCase() === q) ||
      (t.requestId && t.requestId.toUpperCase() === q)
    );

    // 2. Search existing tickets directly in Firestore if not found (because local state is isolated)
    if (!existingTicket && isFirebaseConnected) {
      try {
        const tDoc = await getDoc(doc(db, 'tickets', q));
        if (tDoc.exists()) {
          existingTicket = tDoc.data() as Ticket;
        } else {
          const snapPhone = await getDocs(query(collection(db, 'tickets'), where('clientPhone', '==', queryStr)));
          if (!snapPhone.empty) {
            existingTicket = snapPhone.docs[0].data() as Ticket;
          } else {
            const snapTracking = await getDocs(query(collection(db, 'tickets'), where('trackingId', '==', q)));
            if (!snapTracking.empty) {
              existingTicket = snapTracking.docs[0].data() as Ticket;
            } else {
              const snapRequest = await getDocs(query(collection(db, 'tickets'), where('requestId', '==', q)));
              if (!snapRequest.empty) {
                existingTicket = snapRequest.docs[0].data() as Ticket;
              }
            }
          }
        }
      } catch (err) {
        console.error("[findOrCreateTicketByTrackingOrPhone] Direct ticket lookup failed:", err);
      }
    }

    // Link/Associate the found ticket and its messages with the current client ID!
    if (existingTicket) {
      if (isFirebaseConnected && currentClientId && existingTicket.clientId !== currentClientId) {
        try {
          console.log(`[findOrCreateTicketByTrackingOrPhone] Linking existing ticket ${existingTicket.id} to clientId: ${currentClientId}`);
          await updateDoc(doc(db, 'tickets', existingTicket.id), { clientId: currentClientId });
          existingTicket.clientId = currentClientId;

          // Also link all existing messages for this ticket!
          const msgsSnap = await getDocs(query(collection(db, 'messages'), where('ticketId', '==', existingTicket.id)));
          for (const msgDoc of msgsSnap.docs) {
            await updateDoc(doc(db, 'messages', msgDoc.id), { clientId: currentClientId });
          }
        } catch (err) {
          console.error("[findOrCreateTicketByTrackingOrPhone] Error linking ticket/messages:", err);
        }
      }

      const req = designRequests.find(r => r.id === existingTicket.requestId || r.requestNumber === existingTicket.trackingId);
      const sub = bedroomSubmissions.find(s => s.id === existingTicket.requestId || s.requestNumber === existingTicket.trackingId);
      if ((req && req.status === 'pending') || (sub && sub.status === 'pending')) {
        return null;
      }
      return existingTicket;
    }

    // 3. Search approved Design Requests (Local + Firestore direct)
    let req = designRequests.find(r => 
      (r.requestNumber && r.requestNumber.toUpperCase() === q) || 
      r.id.toUpperCase() === q || 
      r.phone === queryStr
    );

    if (!req && isFirebaseConnected) {
      try {
        const snapDr1 = await getDocs(query(collection(db, 'designRequests'), where('requestNumber', '==', q)));
        const snapDr2 = await getDocs(query(collection(db, 'designRequests'), where('phone', '==', queryStr)));
        let foundDr = snapDr1.docs[0]?.data() as DesignRequest || snapDr2.docs[0]?.data() as DesignRequest;
        if (!foundDr && q.length > 5) {
          const drDoc = await getDoc(doc(db, 'designRequests', q));
          if (drDoc.exists()) foundDr = drDoc.data() as DesignRequest;
        }

        if (foundDr) {
          req = foundDr;
          if (currentClientId && foundDr.clientId !== currentClientId) {
            console.log(`[findOrCreateTicketByTrackingOrPhone] Linking designRequest ${foundDr.id} to clientId: ${currentClientId}`);
            await updateDoc(doc(db, 'designRequests', foundDr.id), { clientId: currentClientId });
          }
        }
      } catch (err) {
        console.error("[findOrCreateTicketByTrackingOrPhone] Direct designRequest lookup failed:", err);
      }
    }

    if (req && req.status !== 'pending') {
      let t = tickets.find(x => x.requestId === req.id || x.sourceId === req.id);
      if (!t && isFirebaseConnected) {
        try {
          const snapT = await getDocs(query(collection(db, 'tickets'), where('requestId', '==', req.id)));
          if (!snapT.empty) {
            t = snapT.docs[0].data() as Ticket;
            if (currentClientId && t.clientId !== currentClientId) {
              await updateDoc(doc(db, 'tickets', t.id), { clientId: currentClientId });
            }
          }
        } catch (err) {}
      }
      if (t) return t;
    }

    // 4. Search approved Bedroom Submissions (Local + Firestore direct)
    let sub = bedroomSubmissions.find(s => 
      (s.requestNumber && s.requestNumber.toUpperCase() === q) || 
      s.id.toUpperCase() === q || 
      s.clientPhone === queryStr
    );

    if (!sub && isFirebaseConnected) {
      try {
        const snapBs1 = await getDocs(query(collection(db, 'bedroomSubmissions'), where('requestNumber', '==', q)));
        const snapBs2 = await getDocs(query(collection(db, 'bedroomSubmissions'), where('clientPhone', '==', queryStr)));
        let foundBs = snapBs1.docs[0]?.data() as BedroomSubmission || snapBs2.docs[0]?.data() as BedroomSubmission;
        if (!foundBs && q.length > 5) {
          const bsDoc = await getDoc(doc(db, 'bedroomSubmissions', q));
          if (bsDoc.exists()) foundBs = bsDoc.data() as BedroomSubmission;
        }

        if (foundBs) {
          sub = foundBs;
          if (currentClientId && foundBs.clientId !== currentClientId) {
            console.log(`[findOrCreateTicketByTrackingOrPhone] Linking bedroomSubmission ${foundBs.id} to clientId: ${currentClientId}`);
            await updateDoc(doc(db, 'bedroomSubmissions', foundBs.id), { clientId: currentClientId });
          }
        }
      } catch (err) {
        console.error("[findOrCreateTicketByTrackingOrPhone] Direct bedroomSubmission lookup failed:", err);
      }
    }

    if (sub && sub.status !== 'pending') {
      let t = tickets.find(x => x.requestId === sub.id || x.sourceId === sub.id);
      if (!t && isFirebaseConnected) {
        try {
          const snapT = await getDocs(query(collection(db, 'tickets'), where('requestId', '==', sub.id)));
          if (!snapT.empty) {
            t = snapT.docs[0].data() as Ticket;
            if (currentClientId && t.clientId !== currentClientId) {
              await updateDoc(doc(db, 'tickets', t.id), { clientId: currentClientId });
            }
          }
        } catch (err) {}
      }
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

    let finalClientId = (ticket as any).clientId || currentUserId || localStorage.getItem('royal_client_uid') || undefined;
    if (ticket.requestId) {
      const assocReq = designRequests.find(r => r.id === ticket.requestId) || bedroomSubmissions.find(s => s.id === ticket.requestId);
      if (assocReq && assocReq.clientId) {
        finalClientId = assocReq.clientId;
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
      updatedAt: Date.now(),
      clientId: finalClientId
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
          createdAt: Date.now(),
          clientId: finalClientId
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
        createdAt: Date.now(),
        clientId: finalClientId
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
    const ticketObj = tickets.find(t => t.id === id);
    let finalClientId = ticketObj?.clientId;
    let finalAssignedEngineerId = ticketObj?.assignedEngineerId;

    if (!ticketObj && isFirebaseConnected) {
      try {
        const db = getDb();
        const tSnap = await getDoc(doc(db, 'tickets', id));
        if (tSnap.exists()) {
          const tData = tSnap.data() as Ticket;
          finalClientId = tData.clientId;
          finalAssignedEngineerId = tData.assignedEngineerId;
        }
      } catch (err) {
        console.error("Failed to fetch ticket for updateTicketStatus:", err);
      }
    }

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
          createdAt: Date.now(),
          clientId: finalClientId || undefined,
          assignedEngineerId: finalAssignedEngineerId || null
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
        createdAt: Date.now(),
        clientId: finalClientId || undefined,
        assignedEngineerId: finalAssignedEngineerId || null
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
    const ticketObj = tickets.find(t => t.id === id);
    let finalClientId = ticketObj?.clientId;

    if (!ticketObj && isFirebaseConnected) {
      try {
        const db = getDb();
        const tSnap = await getDoc(doc(db, 'tickets', id));
        if (tSnap.exists()) {
          finalClientId = (tSnap.data() as Ticket).clientId;
        }
      } catch (err) {
        console.error("Failed to fetch ticket for assignTicket:", err);
      }
    }

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
          createdAt: Date.now(),
          clientId: finalClientId || undefined,
          assignedEngineerId: engineerId || null
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
        createdAt: Date.now(),
        clientId: finalClientId || undefined,
        assignedEngineerId: engineerId || null
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

    const ticketObj = tickets.find(t => t.id === msg.ticketId);

    const newMsg: Message = {
      ...msg,
      id: newId,
      attachments: attachmentsList.length > 0 ? attachmentsList : undefined,
      createdAt: Date.now(),
      clientId: ticketObj?.clientId || undefined,
      assignedEngineerId: ticketObj?.assignedEngineerId || null
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
    const associatedTicket = tickets.find(t => t.id === notification.ticketId);
    const newNotif: TicketNotification = {
      ...notification,
      id: newId,
      read: false,
      createdAt: Date.now(),
      clientId: associatedTicket?.clientId || undefined,
      assignedEngineerId: associatedTicket?.assignedEngineerId || null
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
      loading: loading || isAuthLoading,
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
      deleteTicket,
      refreshUserSession,
      currentUserRole,
      currentUserId,
      logout
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
