import {
  Category,
  Customer,
  CustomerAddress,
  DeliveryLocality,
  DeliveryLocalityId,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ShopSettings,
} from '../types';
import { safeStorage, StorageKeys } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Configured 4 delivery service localities in Coimbatore
export const SUPPORTED_LOCALITIES: DeliveryLocality[] = [
  {
    id: 'press-colony',
    nameEn: 'Press Colony',
    nameTa: 'பிரஸ் காலனி',
    isAvailable: true,
    defaultPincode: '641019',
  },
  {
    id: 'veerapandi-pirivu',
    nameEn: 'Veerapandi Pirivu',
    nameTa: 'வீரபாண்டி பிரிவு',
    isAvailable: true,
    defaultPincode: '641019',
  },
  {
    id: 'periyanaickenpalayam',
    nameEn: 'Periyanaickenpalayam',
    nameTa: 'பெரியநாயக்கன்பாளையம்',
    isAvailable: true,
    defaultPincode: '641020',
  },
  {
    id: 'mathampalayam',
    nameEn: 'Mathampalayam',
    nameTa: 'மாதம்பாளையம்',
    isAvailable: true,
    defaultPincode: '641019',
  },
];

// Confirmed shop settings - No unconfirmed Halal claims, no hardcoded unconfirmed free delivery thresholds
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  isOpen: true,
  orderAcceptancePaused: false,
  pauseReasonEn: 'Our kitchen counter is currently experiencing heavy orders. Ordering will resume shortly.',
  pauseReasonTa: 'கடையில் தற்போது கூட்டம் அதிகமாக உள்ளதால் ஆர்டர்கள் தற்காலிகமாக நிறுத்தப்பட்டுள்ளன. விரைவில் தொடங்கும்.',
  minOrderAmount: 120,
  deliveryFee: 30,
  freeDeliveryThreshold: 499,
  storePhone: '+919843599030',
  storeAddressEn: '81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019',
  storeAddressTa: '81, திருவள்ளுவர் நகர், பிரஸ் காலனி, கோயம்புத்தூர், தமிழ்நாடு 641019',
  storeMapUrl: 'https://www.google.com/maps/search/?api=1&query=The+Raakky+Chicken+81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore',
  estimatedDeliveryMins: 35,
  estimatedPickupMins: 15,
  bannerMessageEn: 'Fresh broiler chicken cut on demand. Select your preferred cut and package.',
  bannerMessageTa: 'புத்தம் புதிய பிராய்லர் சிக்கன். உங்கள் விருப்பத்திற்கு ஏற்ப வெட்டித் தரப்படும்.',
  openingHours: {
    weekdays: '7:00 AM – 9:00 PM',
    sunday: '4:00 AM – 9:00 PM',
  },
};

// 5 Confirmed Broiler Chicken Categories (No Country Chicken, No Marinated)
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-curry-chukka',
    slug: 'curry-chukka',
    nameEn: 'Curry & Chukka',
    nameTa: 'குழம்பு & சுக்கா வெட்டுகள்',
    descriptionEn: 'Evenly cut fresh broiler pieces for gravies, salna, and dry chukka roasts.',
    descriptionTa: 'அன்றாட வீட்டு குழம்பு, சால்னா மற்றும் சுக்காவுக்கு ஏற்றவாறு நறுக்கப்பட்ட துண்டுகள்.',
    iconName: 'ChefHat',
    displayOrder: 1,
  },
  {
    id: 'cat-bone-in',
    slug: 'bone-in',
    nameEn: 'Bone-in Cuts',
    nameTa: 'எலும்புடன் சிக்கன் வெட்டுகள்',
    descriptionEn: 'Selected leg drumsticks, wings, thigh cuts and traditional bone-in pieces.',
    descriptionTa: 'லெக் பீஸ், விங்ஸ், தொடைப் பகுதி மற்றும் எலும்புடன் கூடிய புதிய கறி வெட்டுகள்.',
    iconName: 'Sparkles',
    displayOrder: 2,
  },
  {
    id: 'cat-boneless',
    slug: 'boneless',
    nameEn: 'Boneless',
    nameTa: 'எலும்பில்லாத சிக்கன்',
    descriptionEn: 'Lean, trimmed boneless breast fillets and tender boneless cubes.',
    descriptionTa: 'எலும்பு நீக்கப்பட்ட சுத்தமான மார்பு மற்றும் சதை துண்டுகள். சமைக்க மிக எளிதானது.',
    iconName: 'Flame',
    displayOrder: 3,
  },
  {
    id: 'cat-fry-cuts',
    slug: 'fry-cuts',
    nameEn: 'Fry Cuts',
    nameTa: 'வறுவல் துண்டுகள்',
    descriptionEn: 'Bite-sized plain chicken cuts for frying. Plain meat, no seasoning.',
    descriptionTa: 'வீட்டில் வறுக்க ஏற்றவாறு சிறிய துண்டுகளாக வெட்டப்பட்ட சாதாரண சிக்கன். மசாலா சேர்க்கப்படவில்லை.',
    iconName: 'Utensils',
    displayOrder: 4,
  },
  {
    id: 'cat-liver-feet',
    slug: 'liver-feet',
    nameEn: 'Liver & Feet',
    nameTa: 'ஈரல் & கோழிக்கால்',
    descriptionEn: 'Cleaned fresh chicken liver and trimmed chicken feet for soups and roasts.',
    descriptionTa: 'சுத்தப்படுத்தப்பட்ட பிரஷ் சிக்கன் ஈரல் மற்றும் சூப்புக்கான கோழிக்கால்.',
    iconName: 'Soup',
    displayOrder: 5,
  },
];

// 15 Confirmed Broiler Products (Broiler Only, No Marinated, No Halal claims)
export const INITIAL_PRODUCTS: Product[] = [
  // 1. CHICKEN BREAST
  {
    id: 'prod-breast',
    categoryId: 'cat-boneless',
    nameEn: 'Chicken Breast',
    nameTa: 'சிக்கன் மார்பு கறி',
    slug: 'chicken-breast',
    shortDescEn: 'Whole boneless breast fillet. Tender, lean meat with minimal fat.',
    shortDescTa: 'எலும்பில்லாத முழு மார்பு கறி. மென்மையான சதைப்பகுதி, குறைந்த கொழுப்பு.',
    descriptionEn: 'Fresh broiler chicken breast fillets, deboned and trimmed of excess fat. Note: Approximate weight is ~200g - 280g per individual piece; actual piece weight may vary naturally.',
    descriptionTa: 'புத்தம் புதிய பிராய்லர் சிக்கன் மார்பு கறி. எலும்பு மற்றும் கொழுப்பு நீக்கப்பட்டது. ஒரு துண்டின் சராசரி எடை சுமார் 200 முதல் 280 கிராம் வரை இருக்கும்; தனிப்பட்ட துண்டின் எடை மாறுபடலாம்.',
    imageUrl: '/images/products/chicken-breast-fillet.jpg',
    isAvailable: true,
    isFeatured: true,
    isPopular: true,
    supportedCuts: ['standard_cut', 'boneless_cubes'],
    allowSkinSelection: false,
    bonelessType: 'breast',
    approxWeightPerPiece: {
      minGrams: 200,
      maxGrams: 280,
      noteEn: 'Approx. 200g – 280g per piece (individual piece weights vary)',
      noteTa: 'சுமார் 200 – 280 கிராம் ஒரு துண்டு (தனிப்பட்ட எடை மாறுபடலாம்)',
    },
    searchAliases: ['breast', 'chicken breast', 'marbu kari', 'fillet', 'lean chicken'],
    storageTipsEn: 'Refrigerate at 0°C – 4°C. Cook within 24 hours of delivery.',
    storageTipsTa: '0°C முதல் 4°C வரை குளிர்சாதனத்தில் வைக்கவும். 24 மணி நேரத்திற்குள் சமைக்கவும்.',
    variants: [
      {
        id: 'var-breast-250g',
        productId: 'prod-breast',
        weightGrams: 250,
        weightLabelEn: '250g (Quarter Kg)',
        weightLabelTa: '250 கிராம் (கால் கிலோ)',
        price: 85,
        isAvailable: true,
      },
      {
        id: 'var-breast-500g',
        productId: 'prod-breast',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 165,
        isAvailable: true,
      },
      {
        id: 'var-breast-1kg',
        productId: 'prod-breast',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 320,
        isAvailable: true,
      },
    ],
  },


  // 3. CHICKEN LEG / DRUMSTICK
  {
    id: 'prod-leg',
    categoryId: 'cat-bone-in',
    nameEn: 'Chicken Leg Pieces',
    nameTa: 'சிக்கன் லெக் பீஸ்',
    slug: 'chicken-leg-pieces',
    shortDescEn: 'Fresh broiler drumsticks with plump, succulent meat on the bone.',
    shortDescTa: 'சுவையான சதைப்பற்றுள்ள சிக்கன் லெக் பீஸ்கள் (டிரம்ஸ்டிக்).',
    descriptionEn: 'Fresh chicken drumstick portions, cleaned and trimmed. Plump and juicy on the bone. Approximate piece counts: ~4 to 5 pieces in 500g, ~8 to 10 pieces in 1kg (piece counts are approximate and depend on individual bird size).',
    descriptionTa: 'புத்தம் புதிய சிக்கன் லெக் பீஸ்கள். சுத்தம் செய்து தரப்படுகிறது. 500 கிராமில் சுமார் 4-5 துண்டுகளும், 1 கிலோவில் சுமார் 8-10 துண்டுகளும் இருக்கும் (துண்டுகளின் எண்ணிக்கை தோராயமானது).',
    imageUrl: '/images/products/chicken-leg-drumsticks.jpg',
    isAvailable: true,
    isFeatured: true,
    isPopular: true,
    supportedCuts: ['drumstick_cut'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_off',
    approxPieceCount: {
      500: { min: 4, max: 5 },
      1000: { min: 8, max: 10 },
    },
    searchAliases: ['leg', 'drumstick', 'leg piece', 'chicken leg', 'kaal piece'],
    variants: [
      {
        id: 'var-leg-500g',
        productId: 'prod-leg',
        weightGrams: 500,
        weightLabelEn: '500g (~4 to 5 Pieces)',
        weightLabelTa: '500 கிராம் (சுமார் 4-5 துண்டுகள்)',
        price: 155,
        isAvailable: true,
      },
      {
        id: 'var-leg-1kg',
        productId: 'prod-leg',
        weightGrams: 1000,
        weightLabelEn: '1kg (~8 to 10 Pieces)',
        weightLabelTa: '1 கிலோ (சுமார் 8-10 துண்டுகள்)',
        price: 295,
        isAvailable: true,
      },
    ],
  },

  // 4. CHICKEN WINGS
  {
    id: 'prod-wings',
    categoryId: 'cat-bone-in',
    nameEn: 'Fresh Chicken Wings',
    nameTa: 'சிக்கன் விங்ஸ்',
    slug: 'fresh-chicken-wings',
    shortDescEn: 'Trimmed chicken wing portions. Ideal for pan roasting and crisp frying.',
    shortDescTa: 'வறுவலுக்கு ஏற்றவாறு சுத்தப்படுத்தப்பட்ட புதிய சிறகுப் பகுதிகள்.',
    descriptionEn: 'Cleaned broiler chicken wings consisting of wingettes and drumettes. Skin-on by default to retain moisture during shallow pan frying or roasting.',
    descriptionTa: 'சுத்தப்படுத்தப்பட்ட பிராய்லர் சிக்கன் விங்ஸ் துண்டுகள். வறுவல் மற்றும் மிளகு ரோஸ்ட் செய்ய சிறந்தது. இயல்பாக தோலுடன் வழங்கப்படுகிறது.',
    imageUrl: '/images/products/chicken-wings.jpg',
    isAvailable: true,
    isFeatured: false,
    isPopular: true,
    supportedCuts: ['wings_cut'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_on',
    searchAliases: ['wings', 'chicken wings', 'siragu', 'wing pieces'],
    variants: [
      {
        id: 'var-wings-500g',
        productId: 'prod-wings',
        weightGrams: 500,
        weightLabelEn: '500g Pack',
        weightLabelTa: '500 கிராம் பாக்கெட்',
        price: 125,
        isAvailable: true,
      },
      {
        id: 'var-wings-1kg',
        productId: 'prod-wings',
        weightGrams: 1000,
        weightLabelEn: '1kg Pack',
        weightLabelTa: '1 கிலோ பாக்கெட்',
        price: 240,
        isAvailable: true,
      },
    ],
  },

  // 5. CHICKEN THIGH
  {
    id: 'prod-thigh',
    categoryId: 'cat-bone-in',
    nameEn: 'Chicken Thigh Pieces',
    nameTa: 'சிக்கன் தொடைப் பகுதி',
    slug: 'chicken-thigh-pieces',
    shortDescEn: 'Juicy, flavourful dark meat cuts that stay tender during slow cooking.',
    shortDescTa: 'குழம்பு மற்றும் பிரியாணியில் மென்மையாக வேகக்கூடிய சுவையான தொடை கறி.',
    descriptionEn: 'Fresh chicken thigh portions. Naturally moist and flavourful cut that stays tender without drying out. Choose bone-in or boneless preparation as required.',
    descriptionTa: 'புத்தம் புதிய சிக்கன் தொடைப் பகுதி. சமைக்கும்போது மிருதுவாகவும் சுவையாகவும் இருக்கும். எலும்புடன் அல்லது எலும்பு நீக்கி உங்கள் விருப்பப்படி தேர்வு செய்யலாம்.',
    imageUrl: '/images/products/chicken-thigh-quarters.jpg',
    isAvailable: true,
    isFeatured: false,
    isPopular: true,
    supportedCuts: ['thigh_bone_in', 'thigh_boneless'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_off',
    searchAliases: ['thigh', 'chicken thigh', 'thodai kari', 'thigh piece'],
    variants: [
      {
        id: 'var-thigh-500g',
        productId: 'prod-thigh',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 145,
        isAvailable: true,
      },
      {
        id: 'var-thigh-1kg',
        productId: 'prod-thigh',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 280,
        isAvailable: true,
      },
    ],
  },

  // 6. BONELESS CHICKEN (MIXED CUBES)
  {
    id: 'prod-boneless-mixed',
    categoryId: 'cat-boneless',
    nameEn: 'Boneless Chicken',
    nameTa: 'எலும்பில்லாத சிக்கன்',
    slug: 'boneless-chicken',
    shortDescEn: 'Tender, skinless boneless cubes. Mixed cut from breast and thigh meat.',
    shortDescTa: 'தோல் மற்றும் எலும்பு நீக்கப்பட்ட மென்மையான கறித் துண்டுகள் (மார்பு மற்றும் தொடை கலவை).',
    descriptionEn: 'Skinless boneless chicken cubes cut from fresh breast and thigh portions. Completely deboned and fat-trimmed. Clean and convenient for noodles, fried rice, tikka, and dry fries. Skin-on option is not applicable.',
    descriptionTa: 'எலும்பு மற்றும் தோல் நீக்கப்பட்ட நடுத்தர கறித் துண்டுகள். மார்பு மற்றும் தொடைப் பகுதியிலிருந்து வெட்டப்பட்டது. சில்லி சிக்கன், ஃப்ரைட் ரைஸ், நூடுல்ஸ் செய்ய எளிதானது. தோலுடன் வழங்கப்படுவதில்லை.',
    imageUrl: '/images/products/chicken-boneless-cubes.jpg',
    isAvailable: true,
    isFeatured: true,
    isPopular: true,
    supportedCuts: ['boneless_cubes'],
    allowSkinSelection: false,
    bonelessType: 'mixed',
    searchAliases: ['boneless', 'elumbu illa', 'boneless chicken', 'cubes', 'boneless cut'],
    variants: [
      {
        id: 'var-boneless-250g',
        productId: 'prod-boneless-mixed',
        weightGrams: 250,
        weightLabelEn: '250g (Quarter Kg)',
        weightLabelTa: '250 கிராம் (கால் கிலோ)',
        price: 85,
        isAvailable: true,
      },
      {
        id: 'var-boneless-500g',
        productId: 'prod-boneless-mixed',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 165,
        isAvailable: true,
      },
      {
        id: 'var-boneless-1kg',
        productId: 'prod-boneless-mixed',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 320,
        isAvailable: true,
      },
    ],
  },

  // 7. CHICKEN WITH BONE
  {
    id: 'prod-with-bone',
    categoryId: 'cat-bone-in',
    nameEn: 'Chicken With Bone',
    nameTa: 'எலும்புடன் சிக்கன்',
    slug: 'chicken-with-bone',
    shortDescEn: 'Traditional bone-in chicken mix for rich, flavourful home-style curries & roasts.',
    shortDescTa: 'பாரம்பரிய முறைப்படி எலும்புடன் வெட்டப்பட்ட கறி. குழம்பு மற்றும் வறுவலுக்கு சிறந்தது.',
    descriptionEn: 'Mixed bone-in broiler chicken cuts containing a natural proportion of meat, bone, and ribs. Releases rich natural stock and marrow flavour during cooking.',
    descriptionTa: 'எலும்புடன் கூடிய பிராய்லர் சிக்கன் துண்டுகள். குழம்பு மற்றும் கிரேவிகளில் சமைக்கும் போது சிறந்த நறுமணமும் சுவையும் கொடுக்கும்.',
    imageUrl: '/images/products/chicken-curry-cut.jpg',
    isAvailable: true,
    isFeatured: false,
    isPopular: false,
    supportedCuts: ['curry_medium', 'curry_small', 'chukka_cut'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_off',
    searchAliases: ['with bone', 'bone in', 'bone chicken', 'elumbudan', 'elumbu kari', 'chukka', 'sukka'],
    variants: [
      {
        id: 'var-withbone-500g',
        productId: 'prod-with-bone',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 120,
        isAvailable: true,
      },
      {
        id: 'var-withbone-1kg',
        productId: 'prod-with-bone',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 230,
        isAvailable: true,
      },
      {
        id: 'var-withbone-2kg',
        productId: 'prod-with-bone',
        weightGrams: 2000,
        weightLabelEn: '2kg Family Pack',
        weightLabelTa: '2 கிலோ குடும்ப பாக்கெட்',
        price: 450,
        isAvailable: true,
      },
    ],
  },

  // 8. CHICKEN 65 FRY CUT (PLAIN, NOT MARINATED, NO SEASONING)
  {
    id: 'prod-chicken-65-fry',
    categoryId: 'cat-fry-cuts',
    nameEn: 'Chicken 65 Fry Pieces',
    nameTa: 'சிக்கன் 65 வறுவல் துண்டுகள்',
    slug: 'chicken-65-fry-pieces',
    shortDescEn: 'Fresh plain broiler chicken cut into bite-sized fry pieces. Not marinated.',
    shortDescTa: 'சிக்கன் 65 வறுவலுக்கு ஏற்றவாறு துண்டாக்கப்பட்ட புதிய கறி. மசாலா சேர்க்கப்படவில்லை.',
    descriptionEn: 'Fresh broiler chicken cut into bite-sized, skinless pieces suitable for preparing Chicken 65 at home. Note: Marinade, masala, and seasoning are NOT included. This is unseasoned, plain fresh chicken.',
    descriptionTa: 'வீட்டில் சிக்கன் 65 சமைக்க ஏற்றவாறு சிறிய அளவிலான தோல் நீக்கிய துண்டுகளாக வெட்டப்பட்டது. குறிப்பு: இதில் மசாலா அல்லது ஊறவைப்பு சேர்க்கப்படவில்லை. இது சாதாரண புத்தம் புதிய கறி மட்டுமே.',
    imageUrl: '/images/products/chicken-65-fry.jpg',
    isAvailable: true,
    isFeatured: true,
    isPopular: true,
    supportedCuts: ['fry_bite_size'],
    allowSkinSelection: false,
    searchAliases: ['chicken 65', 'fry pieces', '65 cut', 'fry cut', '65 pieces', 'varuval'],
    variants: [
      {
        id: 'var-65fry-250g',
        productId: 'prod-chicken-65-fry',
        weightGrams: 250,
        weightLabelEn: '250g (Quarter Kg)',
        weightLabelTa: '250 கிராம் (கால் கிலோ)',
        price: 75,
        isAvailable: true,
      },
      {
        id: 'var-65fry-500g',
        productId: 'prod-chicken-65-fry',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 140,
        isAvailable: true,
      },
      {
        id: 'var-65fry-1kg',
        productId: 'prod-chicken-65-fry',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 270,
        isAvailable: true,
      },
    ],
  },

  // 9. CHICKEN CURRY PIECES
  {
    id: 'prod-curry-pieces',
    categoryId: 'cat-curry-chukka',
    nameEn: 'Chicken Curry Pieces',
    nameTa: 'சிக்கன் குழம்பு துண்டுகள்',
    slug: 'chicken-curry-pieces',
    shortDescEn: 'Everyday medium bone-in chicken pieces for homestyle curry and gravy.',
    shortDescTa: 'அன்றாட வீட்டு சிக்கன் குழம்பு மற்றும் கிரேவிக்கு ஏற்ற நடுத்தர கறித் துண்டுகள்.',
    descriptionEn: 'Fresh broiler chicken chopped into neat 14 to 16 medium-sized pieces. Balanced mix of meat and bone. Ideal for chettinad gravies, salna, and Sunday family curries.',
    descriptionTa: 'பிராய்லர் சிக்கன் 14 முதல் 16 நடுத்தர துண்டுகளாக வெட்டப்படுகிறது. எலும்பும் சதையும் சமமாக கலந்தது. செட்டிநாடு குழம்பு, சால்னா மற்றும் கிரேவிகளுக்கு மிகச் சிறந்தது.',
    imageUrl: '/images/products/chicken-curry.jpg',
    isAvailable: true,
    isFeatured: true,
    isPopular: true,
    supportedCuts: ['curry_medium', 'curry_small'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_off',
    searchAliases: ['curry', 'curry cut', 'curry pieces', 'kulambu', 'kulambu thundugal', 'chicken curry'],
    variants: [
      {
        id: 'var-curry-500g',
        productId: 'prod-curry-pieces',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 120,
        isAvailable: true,
      },
      {
        id: 'var-curry-1kg',
        productId: 'prod-curry-pieces',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 230,
        isAvailable: true,
      },
      {
        id: 'var-curry-2kg',
        productId: 'prod-curry-pieces',
        weightGrams: 2000,
        weightLabelEn: '2kg Family Pack',
        weightLabelTa: '2 கிலோ குடும்ப பாக்கெட்',
        price: 450,
        isAvailable: true,
      },
    ],
  },

  // 10. CHICKEN BIRYANI CUT (LARGE PIECES)
  {
    id: 'prod-biryani-cut',
    categoryId: 'cat-curry-chukka',
    nameEn: 'Chicken Biryani Cut (Large Cuts)',
    nameTa: 'சிக்கன் பிரியாணி பெரிய துண்டுகள்',
    slug: 'chicken-biryani-cut',
    shortDescEn: 'Large succulent bone-in pieces specially portioned for traditional Dum Biryani.',
    shortDescTa: 'பாரம்பரிய பிரியாணிக்கு ஏற்றவாறு பெரிய அளவில் நறுக்கப்பட்ட கறித் துண்டுகள்.',
    descriptionEn: 'Fresh broiler chicken portioned into generous, large cuts (approx. 6 to 8 pieces per kg). Perfect for slow dum cooking so pieces stay succulent and hold their shape.',
    descriptionTa: 'பிராய்லர் சிக்கன் பெரிய துண்டுகளாக (1 கிலோவிற்கு சுமார் 6-8 துண்டுகள்) வெட்டப்படுகிறது. தம் போடும்போது துண்டுகள் உடையாமல் சுவையாக இருக்கும்.',
    imageUrl: '/images/products/chicken-biryani.jpg',
    isAvailable: true,
    isPopular: true,
    isFeatured: true,
    supportedCuts: ['curry_medium'],
    allowSkinSelection: true,
    defaultSkinType: 'skin_off',
    searchAliases: ['biryani', 'biriyani cut', 'briyani', 'large cut', 'biryani pieces', 'dum biryani'],
    variants: [
      {
        id: 'var-biryani-500g',
        productId: 'prod-biryani-cut',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 125,
        isAvailable: true,
      },
      {
        id: 'var-biryani-1kg',
        productId: 'prod-biryani-cut',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 240,
        isAvailable: true,
      },
      {
        id: 'var-biryani-2kg',
        productId: 'prod-biryani-cut',
        weightGrams: 2000,
        weightLabelEn: '2kg Family Pack',
        weightLabelTa: '2 கிலோ குடும்ப பாக்கெட்',
        price: 470,
        isAvailable: true,
      },
    ],
  },

  // 11. CHICKEN LOLLIPOP CUT
  {
    id: 'prod-lollipop',
    categoryId: 'cat-fry-cuts',
    nameEn: 'Chicken Lollipop Cut',
    nameTa: 'சிக்கன் லாலிபாப் வெட்டு',
    slug: 'chicken-lollipop-cut',
    shortDescEn: 'Clean French-trimmed chicken wing drumettes shaped for crispy frying.',
    shortDescTa: 'லாலிபாப் வடிவில் சுத்தமாக நறுக்கப்பட்ட விங்ஸ் துண்டுகள். வறுவலுக்கு ஏற்றது.',
    descriptionEn: 'Fresh chicken wing drumettes neatly scored and pushed down to create lollipop handles. Unseasoned plain meat for frying or tandoor at home.',
    descriptionTa: 'புத்தம் புதிய சிக்கன் விங்ஸ் லாலிபாப் வடிவத்தில் சுத்தமாக நறுக்கப்பட்டது. மசாலா சேர்க்கப்படாத சாதாரண புத்தம் புதிய கறி.',
    imageUrl: '/images/products/chicken-lollipop.jpg',
    isAvailable: true,
    isPopular: true,
    isFeatured: true,
    supportedCuts: ['wings_cut'],
    allowSkinSelection: false,
    searchAliases: ['lollipop', 'chicken lollipop', 'drumette', 'lollypop', 'lollipop fry'],
    variants: [
      {
        id: 'var-lollipop-500g',
        productId: 'prod-lollipop',
        weightGrams: 500,
        weightLabelEn: '500g (~8 to 10 pcs)',
        weightLabelTa: '500 கிராம் (சுமார் 8-10 துண்டுகள்)',
        price: 160,
        isAvailable: true,
      },
      {
        id: 'var-lollipop-1kg',
        productId: 'prod-lollipop',
        weightGrams: 1000,
        weightLabelEn: '1kg (~16 to 20 pcs)',
        weightLabelTa: '1 கிலோ (சுமார் 16-20 துண்டுகள்)',
        price: 310,
        isAvailable: true,
      },
    ],
  },

  // 12. CHICKEN KEEMA (MINCED CHICKEN)
  {
    id: 'prod-keema',
    categoryId: 'cat-boneless',
    nameEn: 'Fresh Chicken Keema (Mince)',
    nameTa: 'சிக்கன் கீமா (கொத்துக்கறி)',
    slug: 'chicken-keema-minced',
    shortDescEn: 'Freshly minced boneless chicken. Fine texture for kola urundai, cutlets & curries.',
    shortDescTa: 'புதிதாக கொத்தப்பட்ட எலும்பில்லாத சிக்கன் கொத்துக்கறி. கோலா உருண்டைக்கு சிறந்தது.',
    descriptionEn: 'Finely minced boneless broiler chicken meat. Clean, lean, and freshly prepared. Ideal for homemade chicken kola urundai, keema parotta, samosas, and stuffing.',
    descriptionTa: 'எலும்பு நீக்கப்பட்டு மென்மையாக கொத்தப்பட்ட புத்தம் புதிய பிராய்லர் சிக்கன். கோலா உருண்டை, கீமா கிரேவி, சமோசா மற்றும் கட்லெட் செய்ய சிறந்தது.',
    imageUrl: '/images/products/chicken-minced.jpg',
    isAvailable: true,
    isPopular: false,
    isFeatured: true,
    supportedCuts: ['standard_cut'],
    allowSkinSelection: false,
    searchAliases: ['keema', 'kheema', 'mince', 'minced chicken', 'kothu kari'],
    variants: [
      {
        id: 'var-keema-250g',
        productId: 'prod-keema',
        weightGrams: 250,
        weightLabelEn: '250g (Quarter Kg)',
        weightLabelTa: '250 கிராம் (கால் கிலோ)',
        price: 90,
        isAvailable: true,
      },
      {
        id: 'var-keema-500g',
        productId: 'prod-keema',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 175,
        isAvailable: true,
      },
      {
        id: 'var-keema-1kg',
        productId: 'prod-keema',
        weightGrams: 1000,
        weightLabelEn: '1kg (Full Kg)',
        weightLabelTa: '1 கிலோ (முழு கிலோ)',
        price: 340,
        isAvailable: true,
      },
    ],
  },

  // 13. CHICKEN LIVER (SEPARATE LISTING, NO SKIN/CUT SELECTORS)
  {
    id: 'prod-liver',
    categoryId: 'cat-liver-feet',
    nameEn: 'Chicken Liver',
    nameTa: 'சிக்கன் ஈரல்',
    slug: 'chicken-liver',
    shortDescEn: 'Cleaned fresh chicken liver portions. Tender, nutrient-dense cut.',
    shortDescTa: 'சுத்தம் செய்யப்பட்ட புதிய சிக்கன் ஈரல். இரும்புச்சத்து மற்றும் சத்துக்கள் நிறைந்தது.',
    descriptionEn: 'Fresh broiler chicken liver portions, trimmed and washed. Very tender and cooks fast. Perfect for pepper dry fry or homestyle spicy liver roast.',
    descriptionTa: 'புத்தம் புதிய சிக்கன் ஈரல் துண்டுகள். மென்மையானது, விரைவாக வேகும். மிளகு வறுவல் மற்றும் கிரேவி செய்ய அருமையானது. தோல் அல்லது வெட்டு விருப்பங்கள் பொருந்தாது.',
    imageUrl: '/images/products/chicken-liver.jpg',
    isAvailable: true,
    isFeatured: false,
    supportedCuts: ['standard_cut'],
    allowSkinSelection: false,
    searchAliases: ['liver', 'eral', 'chicken liver', 'eeral', 'liver fry'],
    variants: [
      {
        id: 'var-liver-250g',
        productId: 'prod-liver',
        weightGrams: 250,
        weightLabelEn: '250g (Quarter Kg)',
        weightLabelTa: '250 கிராம் (கால் கிலோ)',
        price: 60,
        isAvailable: true,
      },
      {
        id: 'var-liver-500g',
        productId: 'prod-liver',
        weightGrams: 500,
        weightLabelEn: '500g (Half Kg)',
        weightLabelTa: '500 கிராம் (அரை கிலோ)',
        price: 110,
        isAvailable: true,
      },
    ],
  },

  // 14. CHICKEN FEET (SEPARATE LISTING, NO SKIN/CUT SELECTORS)
  {
    id: 'prod-feet',
    categoryId: 'cat-liver-feet',
    nameEn: 'Chicken Feet',
    nameTa: 'கோழிக்கால்',
    slug: 'chicken-feet',
    shortDescEn: 'Cleaned and nail-trimmed chicken feet. Collagen-rich cut for soups.',
    shortDescTa: 'சுத்தம் செய்து நகங்கள் வெட்டப்பட்ட கோழிக்கால்கள். சூப் மற்றும் ரசத்திற்கு ஏற்றது.',
    descriptionEn: 'Fresh broiler chicken feet, properly scaled, outer yellow skin peeled, and nails clipped clean. Traditionally used for preparing collagen-rich bone broth, pepper soup, and nourishing rasam.',
    descriptionTa: 'நகங்கள் வெட்டப்பட்டு நன்கு சுத்தம் செய்யப்பட்ட புதிய கோழிக்கால்கள். ஆரோக்கியமான கொலாஜன் சத்து நிறைந்த சூப், மிளகு ரசம் மற்றும் சாறு தயாரிக்கப் பயன்படுகிறது.',
    imageUrl: '/images/products/chicken-feet.jpg',
    isAvailable: true,
    isFeatured: false,
    supportedCuts: ['standard_cut'],
    allowSkinSelection: false,
    searchAliases: ['feet', 'chicken feet', 'kaal', 'soup kaal', 'collagen', 'kozhi kaal'],
    variants: [
      {
        id: 'var-feet-500g',
        productId: 'prod-feet',
        weightGrams: 500,
        weightLabelEn: '500g Pack',
        weightLabelTa: '500 கிராம் பாக்கெட்',
        price: 80,
        isAvailable: true,
      },
      {
        id: 'var-feet-1kg',
        productId: 'prod-feet',
        weightGrams: 1000,
        weightLabelEn: '1kg Pack',
        weightLabelTa: '1 கிலோ பாக்கெட்',
        price: 150,
        isAvailable: true,
      },
    ],
  },
];

function getStoredOrders(): Order[] {
  return safeStorage.get<Order[]>(StorageKeys.ORDERS, []);
}

function saveStoredOrders(orders: Order[]): void {
  safeStorage.set(StorageKeys.ORDERS, orders);
}

/**
 * Calculates genuine product popularity based on COMPLETED customer purchases
 * in the last 30 days (excludes PENDING, REJECTED, CANCELLED, REFUNDED).
 */
export function calculateCompletedPurchasesCount(productId: string): number {
  const orders = getStoredOrders();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return orders
    .filter(
      o =>
        o.status === 'COMPLETED' &&
        new Date(o.createdAt).getTime() >= thirtyDaysAgo
    )
    .reduce((sum, order) => {
      const matchingItems = order.items.filter(i => i.productId === productId);
      const qty = matchingItems.reduce((acc, curr) => acc + curr.quantity, 0);
      return sum + qty;
    }, 0);
}

/**
 * Determines whether a variant qualifies as "Best Value"
 * based on actual configured price per kilogram relative to other variants of that product.
 */
export function isBestValueVariant(variant: { weightGrams: number; price: number }, allVariants: { weightGrams: number; price: number }[]): boolean {
  if (allVariants.length <= 1) return false;
  const unitPrices = allVariants.map(v => ({
    ...v,
    pricePerKg: (v.price / v.weightGrams) * 1000,
  }));
  const minPricePerKg = Math.min(...unitPrices.map(u => u.pricePerKg));
  const currentPricePerKg = (variant.price / variant.weightGrams) * 1000;

  // Only if this variant is the lowest price/kg AND strictly cheaper per kg than the smallest package
  const smallest = allVariants.reduce((prev, curr) => (curr.weightGrams < prev.weightGrams ? curr : prev));
  const smallestPricePerKg = (smallest.price / smallest.weightGrams) * 1000;

  return Math.abs(currentPricePerKg - minPricePerKg) < 0.01 && currentPricePerKg < smallestPricePerKg - 5;
}

export const api = {
  async getShopSettings(): Promise<ShopSettings> {
    try {
      const res = await fetch(`${API_BASE_URL}/shop/settings`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SHOP_SETTINGS;
  },

  async getDeliveryLocalities(): Promise<DeliveryLocality[]> {
    return SUPPORTED_LOCALITIES;
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return INITIAL_CATEGORIES;
  },

  async getProducts(params?: {
    category?: string;
    search?: string;
    inStockOnly?: boolean;
    sortBy?: 'featured' | 'popular' | 'best-value' | 'price-asc' | 'price-desc' | 'name';
  }): Promise<Product[]> {
    try {
      const url = new URL(`${API_BASE_URL}/products`, window.location.origin);
      if (params?.category) url.searchParams.set('category', params.category);
      if (params?.search) url.searchParams.set('search', params.search);
      const res = await fetch(url.toString());
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    let list = [...INITIAL_PRODUCTS];

    if (params?.category && params.category !== 'all') {
      list = list.filter(p => p.categoryId === params.category);
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.toLowerCase().trim();
      list = list.filter(p => {
        const matchName =
          p.nameEn.toLowerCase().includes(s) ||
          p.nameTa.toLowerCase().includes(s) ||
          p.shortDescEn.toLowerCase().includes(s) ||
          p.shortDescTa.toLowerCase().includes(s);
        const matchAlias = p.searchAliases.some(alias => alias.toLowerCase().includes(s) || s.includes(alias.toLowerCase()));
        return matchName || matchAlias;
      });
    }

    if (params?.inStockOnly) {
      list = list.filter(p => p.isAvailable && p.variants.some(v => v.isAvailable));
    }

    // Sort order
    if (params?.sortBy === 'price-asc') {
      list.sort((a, b) => Math.min(...a.variants.map(v => v.price)) - Math.min(...b.variants.map(v => v.price)));
    } else if (params?.sortBy === 'price-desc') {
      list.sort((a, b) => Math.min(...b.variants.map(v => v.price)) - Math.min(...a.variants.map(v => v.price)));
    } else if (params?.sortBy === 'name') {
      list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    } else if (params?.sortBy === 'popular') {
      list.sort((a, b) => calculateCompletedPurchasesCount(b.id) - calculateCompletedPurchasesCount(a.id));
    }

    return list;
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return INITIAL_PRODUCTS.find(p => p.id === id || p.slug === id) || null;
  },

  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    await new Promise(r => setTimeout(r, 600));
    return { success: true, message: 'OTP sent to mobile (Development Test Code: 123456)' };
  },

  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; customer: Customer; token: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    await new Promise(r => setTimeout(r, 600));
    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Invalid verification code');
    }

    const existingCustomer = safeStorage.get<Customer | null>(StorageKeys.CUSTOMER, null);
    const customer: Customer = {
      id: existingCustomer?.id || `cust-${Date.now()}`,
      phone,
      name: existingCustomer?.name || 'Customer',
      email: existingCustomer?.email,
      isPhoneVerified: true,
      addresses: existingCustomer?.addresses || [
        {
          id: 'addr-default',
          label: 'Home',
          recipientName: existingCustomer?.name || 'Customer',
          recipientPhone: phone,
          localityId: 'press-colony',
          localityName: 'Press Colony',
          flatNumber: 'Door 12',
          streetAddress: 'Thiruvalluvar Nagar 2nd Street',
          landmark: 'Near Government High School',
          pincode: '641019',
          deliveryNotes: 'Leave with family',
          isDefault: true,
        },
      ],
      defaultAddressId: existingCustomer?.defaultAddressId || 'addr-default',
      createdAt: existingCustomer?.createdAt || new Date().toISOString(),
    };

    safeStorage.set(StorageKeys.CUSTOMER, customer);
    const token = `jwt_mock_${Date.now()}`;
    safeStorage.setString(StorageKeys.TOKEN, token);

    return { success: true, customer, token };
  },

  async updateCustomerProfile(updates: Partial<Customer>): Promise<Customer> {
    const existing = safeStorage.get<Customer | null>(StorageKeys.CUSTOMER, null);
    if (!existing) {
      throw new Error('Not authenticated');
    }
    const updated: Customer = {
      ...existing,
      ...updates,
    };
    safeStorage.set(StorageKeys.CUSTOMER, updated);
    return updated;
  },

  async createOrder(payload: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    orderType: 'DELIVERY' | 'PICKUP';
    deliveryAddress?: CustomerAddress;
    paymentMethod: PaymentMethod;
    paymentStatus?: 'PENDING' | 'PAID';
    upiTransactionId?: string;
    upiApp?: string;
    items: {
      productId: string;
      variantId: string;
      quantity: number;
      cutType: any;
      skinType?: any;
      specialInstructions?: string;
    }[];
  }): Promise<Order> {
    // Validate delivery locality if orderType is DELIVERY
    if (payload.orderType === 'DELIVERY') {
      if (!payload.deliveryAddress?.localityId) {
        throw new Error('Please select one of our supported delivery localities (Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, Mathampalayam).');
      }
      const supported = SUPPORTED_LOCALITIES.find(l => l.id === payload.deliveryAddress?.localityId && l.isAvailable);
      if (!supported) {
        throw new Error('Delivery is currently available only in Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, and Mathampalayam. Please choose Store Pickup.');
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    let itemTotal = 0;
    const orderItemsRecord = payload.items.map((item, idx) => {
      const product = INITIAL_PRODUCTS.find(p => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) throw new Error(`Variant not found: ${item.variantId}`);
      if (!variant.isAvailable) throw new Error(`Product ${product.nameEn} (${variant.weightLabelEn}) is out of stock`);

      const subtotal = variant.price * item.quantity;
      itemTotal += subtotal;

      return {
        id: `order-item-${idx + 1}-${Date.now()}`,
        productId: product.id,
        variantId: variant.id,
        productNameEn: product.nameEn,
        productNameTa: product.nameTa,
        imageUrl: product.imageUrl,
        weightGrams: variant.weightGrams,
        weightLabelEn: variant.weightLabelEn,
        weightLabelTa: variant.weightLabelTa,
        unitPrice: variant.price,
        quantity: item.quantity,
        subtotal,
        cutType: item.cutType,
        skinType: item.skinType,
        specialInstructions: item.specialInstructions,
      };
    });

    const isDelivery = payload.orderType === 'DELIVERY';
    const deliveryFee = isDelivery ? DEFAULT_SHOP_SETTINGS.deliveryFee : 0;
    const packagingFee = 0;
    const finalTotal = itemTotal + deliveryFee + packagingFee;

    const orderNumber = `RK-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const order: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      orderType: payload.orderType,
      status: 'PENDING',
      deliveryAddress: isDelivery ? payload.deliveryAddress : undefined,
      items: orderItemsRecord,
      itemTotal,
      deliveryFee,
      packagingFee,
      discount: 0,
      finalTotal,
      paymentMethod: payload.paymentMethod,
      // Never mark an order as paid merely because submitted. Payment remains unpaid until shop confirms.
      paymentStatus: 'PENDING',
      upiTransactionId: payload.upiTransactionId,
      upiApp: payload.upiApp,
      estimatedTime: isDelivery ? '30–40 mins' : '15–20 mins',
      createdAt: nowIso,
      updatedAt: nowIso,
      statusTimeline: [
        {
          status: 'PENDING',
          timestamp: nowIso,
          note: 'Order submitted to shop counter for verification',
        },
      ],
    };

    const existingOrders = getStoredOrders();
    saveStoredOrders([order, ...existingOrders]);
    safeStorage.setString(StorageKeys.ACTIVE_ORDER_ID, order.id);

    return order;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const orders = getStoredOrders();
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;

    return order;
  },

  async getCustomerOrders(customerIdOrPhone: string): Promise<Order[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${customerIdOrPhone}/orders`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const orders = getStoredOrders();
    return orders.filter(
      o => o.customerId === customerIdOrPhone || o.customerPhone === customerIdOrPhone
    );
  },

  async cancelOrder(orderId: string, reason: string = 'Customer requested cancellation'): Promise<{ success: boolean; order: Order }> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const orders = getStoredOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status === 'PREPARING' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'COMPLETED') {
      throw new Error('Order is already being prepared or out for delivery and cannot be cancelled directly.');
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason;
    order.updatedAt = new Date().toISOString();
    order.statusTimeline.push({
      status: 'CANCELLED',
      timestamp: order.updatedAt,
      note: reason,
    });

    saveStoredOrders(orders.map(o => (o.id === order.id ? order : o)));
    return { success: true, order };
  },

  /**
   * Validates saved cart items against current product catalogue.
   * Purges discontinued products (like removed Country Chicken, Marinated 65).
   */
  validateCartItems(items: any[]): { validItems: any[]; removedNames: string[] } {
    const validItems: any[] = [];
    const removedNames: string[] = [];

    for (const item of items) {
      const product = INITIAL_PRODUCTS.find(p => p.id === item.productId);
      if (!product) {
        removedNames.push(item.productNameEn || 'Discontinued item');
        continue;
      }
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        removedNames.push(`${product.nameEn} (${item.weightLabelEn || 'variant'})`);
        continue;
      }
      // Re-verify current price and details from live product
      validItems.push({
        ...item,
        productNameEn: product.nameEn,
        productNameTa: product.nameTa,
        imageUrl: product.imageUrl,
        unitPrice: variant.price,
      });
    }

    return { validItems, removedNames };
  },

  /**
   * Helper to check if a variant is the best value in a product
   */
  isBestValueVariant(product: Product, variant: { weightGrams: number; price: number }): boolean {
    return isBestValueVariant(variant, product.variants);
  },
};
