import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  getDoc, 
  deleteDoc,
  query,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, deleteObject } from 'firebase/storage';

const config = {
  apiKey: "AIzaSyAzvH4G-FjQ0ESVU8eIjxrdsR8OGqaEAZI",
  authDomain: "royal-group-interior.firebaseapp.com",
  projectId: "royal-group-interior",
  storageBucket: "royal-group-interior.firebasestorage.app",
  messagingSenderId: "1092390097047",
  appId: "1:1092390097047:web:0add0db39538fc075d99d2",
  firestoreDatabaseId: "ai-studio-royalgroup-9ad9c5e1-ff84-4044-be12-d1feb03a7592"
};

const mockCategories = [
  { id: '1', name: 'صالات', slug: 'living-rooms' },
  { id: '2', name: 'مطابخ', slug: 'kitchens' },
  { id: '3', name: 'غرف نوم', slug: 'bedrooms' },
  { id: '4', name: 'غرف ملابس', slug: 'dressing-rooms' },
  { id: '5', name: 'حمامات', slug: 'bathrooms' },
  { id: '6', name: 'غرف غسيل', slug: 'laundry-rooms' },
  { id: '7', name: 'غرف أطفال', slug: 'kids-rooms' }
];

const mockCompanySettings = {
  address: "بغداد - القادسية - مقابل جامع أم الطبول",
  phone: "07704679311",
  whatsapp: "07704679311",
  aboutText: "تأسست شركة Royal Group لتكون الرائدة في مجال التصميم الداخلي الفاخر والتنفيذ المتكامل في العراق. نحن نؤمن بأن المساحات التي نعيش ونعمل بها يجب أن تعكس الرقي والراحة المطلقة. يضم فريقنا نخبة من المهندسين والمصممين ذوي الخبرة الطويلة، لنقدم لعملائنا تجربة متكاملة تبدأ من الفكرة والمخططات ثلاثية الأبعاد وحتى تسليم المفتاح بأعلى معايير الجودة والإتقان.",
  aboutImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200"
};

const mockSocialLinks = {
  instagram: "https://instagram.com/royalgroup",
  facebook: "https://facebook.com/royalgroup",
  tiktok: "https://tiktok.com/@royalgroup",
  youtube: "https://youtube.com/royalgroup"
};

const mockProjects = [
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
    createdAt: Date.now()
  }
];

const mockColorVariants = [
  { id: "w_1", name: "سنديان طبيعي", type: "wood", colorValue: "#C4A482", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000", createdAt: 1 },
  { id: "w_2", name: "جوز داكن", type: "wood", colorValue: "#5C4033", image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1000", createdAt: 2 }
];

async function run() {
  console.log("=== بدء تشغيل اختبار وتغذية قاعدة بيانات Firestore ===");
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app, config.firestoreDatabaseId);
  const storage = getStorage(app);

  let authOk = false;
  let firestoreOk = false;
  let storageOk = false;

  const email = "admin@royalgroup.com";
  const password = "AdminPassword123!";

  // 1. Authenticate
  try {
    console.log(`جاري محاولة تسجيل الدخول كمسؤول: ${email}...`);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✓ تم تسجيل الدخول بنجاح! UID: ${cred.user.uid}`);
    authOk = true;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      console.log(`المستخدم غير موجود. جاري محاولة إنشاء الحساب لـ ${email}...`);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`✓ تم إنشاء الحساب وتسجيل الدخول بنجاح! UID: ${cred.user.uid}`);
        authOk = true;
      } catch (createError: any) {
        console.error("✗ فشل إنشاء حساب المسؤول:", createError.message);
      }
    } else {
      console.error("✗ فشل تسجيل الدخول:", error.message);
    }
  }

  if (!authOk) {
    console.log("تنبيه: سيتم إكمال الفحص بدون مصادقة المسؤول (قد تفشل بعض عمليات الكتابة)...");
  }

  // 2. Seeding/Checking Firestore
  try {
    const collectionsToSeed = [
      { name: 'categories', data: mockCategories, isSingleDoc: false },
      { name: 'projects', data: mockProjects, isSingleDoc: false },
      { name: 'colorVariants', data: mockColorVariants, isSingleDoc: false },
      { 
        name: 'projectImages', 
        data: [{
          id: 'placeholder_init',
          title: 'Royal Group Default Concept',
          url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
          createdAt: Date.now()
        }], 
        isSingleDoc: false 
      },
      { 
        name: 'designRequests', 
        data: [{
          id: 'placeholder_init',
          name: 'بوابة رويال جروب',
          phone: '+9647700000000',
          city: 'بغداد',
          projectType: 'residential',
          area: '250',
          budget: 'medium',
          status: 'reviewed',
          createdAt: Date.now()
        }], 
        isSingleDoc: false 
      },
      { name: 'companySettings', data: [mockCompanySettings], docId: 'main', isSingleDoc: true },
      { name: 'socialLinks', data: [mockSocialLinks], docId: 'main', isSingleDoc: true }
    ];

    for (const colInfo of collectionsToSeed) {
      console.log(`\nفحص الـ Collection: ${colInfo.name}...`);
      const colRef = collection(db, colInfo.name);
      
      const snapshot = await getDocs(query(colRef, limit(1)));
      
      if (snapshot.empty) {
        console.log(`الـ Collection ${colInfo.name} فارغة. جاري إضافة مستندات...`);
        if (colInfo.isSingleDoc) {
          const docId = colInfo.docId || 'main';
          await setDoc(doc(db, colInfo.name, docId), colInfo.data[0]);
          console.log(`✓ تم بذر: ${colInfo.name}/${docId}`);
        } else {
          for (const item of colInfo.data) {
            const docId = (item as any).id || `doc_${Date.now()}`;
            await setDoc(doc(db, colInfo.name, docId), item);
            console.log(`✓ تم بذر مستند: ${docId}`);
          }
        }
      } else {
        console.log(`الـ Collection ${colInfo.name} تحتوي بالفعل على بيانات.`);
      }
    }

    // Output all documents currently in projects
    const projectsSnap = await getDocs(collection(db, 'projects'));
    console.log(`\n✓ نجاح الاتصال بـ Firestore! إجمالي عدد المستندات في projects: ${projectsSnap.size}`);
    firestoreOk = true;
  } catch (error: any) {
    console.error("✗ فشل فحص وبذر Firestore:", error.message);
  }

  // 3. Storage connection test
  try {
    console.log("\nجاري اختبار التخزين السحابي (Storage)...");
    const testContent = "Royal Group Test Storage File";
    const blob = new Blob([testContent], { type: 'text/plain' });
    const fileRef = ref(storage, 'test/connection_test.txt');
    await uploadBytes(fileRef, blob);
    console.log("✓ تم رفع ملف تجريبي إلى Storage بنجاح!");
    await deleteObject(fileRef);
    console.log("✓ تم حذف الملف التجريبي بنجاح!");
    storageOk = true;
  } catch (error: any) {
    console.error("✗ فشل اختبار التخزين السحابي (Storage):", error.message);
  }

  console.log("\n=== التقرير النهائي ===");
  console.log(`اتصال Authentication: ${authOk ? "✓ ناجح" : "✗ فشل"}`);
  console.log(`اتصال Firestore: ${firestoreOk ? "✓ ناجح" : "✗ فشل"}`);
  console.log(`اتصال Storage: ${storageOk ? "✓ ناجح" : "✗ فشل"}`);
  console.log("=====================\n");
}

run().catch(console.error);
