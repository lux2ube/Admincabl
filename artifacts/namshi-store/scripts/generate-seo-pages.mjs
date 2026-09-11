import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '../public');

const pages = [
  {
    slug: 'chargers',
    title: 'شواحن جوالات أصلية للبيع في اليمن | CABL',
    description: 'اشترِ شاحن جوال أصلي وسريع في اليمن من Baseus وVention وAnker وUGREEN، مع شواحن USB-C وGaN وقدرات متعددة وتوصيل داخل اليمن.',
    h1: 'شواحن جوالات أصلية<br />وسريعة في اليمن',
    eyebrow: 'دليل الشراء',
    intro: 'كتالوج CABL للشواحن الجدارية الأصلية للاستخدام اليومي، المكتب، السفر، والهواتف والأجهزة المتوافقة مع USB-C.',
    keywords: 'شواحن, شاحن جوال, شاحن تلفون, شواحن تلفونات, شاحن سريع, شاحن أصلي, شاحن سامسونج, Samsung, شاحن آيفون, iPhone, شاحن تايب سي, Type-C, شاحن يو إس بي, USB, شاحن 20 واط, شاحن 25 واط, شاحن 30 واط, شاحن 45 واط, شاحن 65 واط, شاحن 100 واط, شاحن جان, GaN, شاحن بي دي, PD, شاحن سامسونج الأصلي, شاحن آيفون الأصلي, شواحن سريعة, شواحن أصلية, شراء شاحن, متجر شواحن, شواحن اليمن, CABL اليمن',
    products: ['شاحن UGREEN USB-C بقدرة 20W', 'شاحن Baseus بمنفذين 33W', 'شاحن Anker Nano II GaN بقدرة 65W'],
    image: '../images/vention-charger-70w.jpg',
    related: [['fast-chargers/', 'الشواحن السريعة'], ['type-c-chargers/', 'شواحن Type-C'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'fast-chargers',
    title: 'شواحن سريعة أصلية للبيع في اليمن | 20W إلى 100W',
    description: 'اكتشف شاحن سريع للآيفون وسامسونج والأجهزة المتوافقة بقدرات 20W و30W و33W و45W و65W و100W، مع خيارات PD وGaN وتوصيل داخل اليمن.',
    h1: 'شواحن سريعة<br />20W إلى 100W',
    eyebrow: 'شحن أسرع',
    intro: 'اختر القدرة المناسبة لجهازك من شواحن PD وGaN متعددة المنافذ. راجع قدرة الجهاز والكابل قبل الطلب للحصول على أفضل نتيجة.',
    keywords: 'شاحن سريع, شاحن سريع للجوال, Fast Charger Yemen, شواحن سريعة, شاحن 20 واط, شاحن 25 واط, شاحن 30 واط, شاحن 45 واط, شاحن 65 واط, شاحن 100 واط, شاحن سريع Type-C, شاحن سريع PD, شاحن GaN, شاحن جان, شاحن بي دي, PD, GaN, شراء شاحن',
    products: ['شاحن Baseus GaN بقدرة 100W', 'شاحن UGREEN Nexode GaN بقدرة 45W', 'شاحن Vention GaN بثلاثة منافذ 65W'],
    image: '../images/vention-charger-100w.jpg',
    related: [['chargers/20w/', 'شواحن 20W'], ['chargers/33w/', 'شواحن 33W'], ['chargers/65w/', 'شواحن 65W']],
  },
  {
    slug: 'type-c-chargers',
    title: 'شواحن Type-C وUSB-C سريعة في اليمن | CABL',
    description: 'اشترِ شاحن Type-C وUSB-C أصلي للآيفون وسامسونج وشاومي والأجهزة المتوافقة، مع خيارات PD وGaN وقدرات متعددة وتوصيل داخل اليمن.',
    h1: 'شواحن Type-C<br />وUSB-C في اليمن',
    eyebrow: 'USB-C · PD · GaN',
    intro: 'شواحن USB-C عملية للهواتف والأجهزة الحديثة. اختر شاحنًا بقدرة مناسبة، وتأكد من دعم جهازك للشحن السريع ومعيار PD أو PPS عند الحاجة.',
    keywords: 'شاحن تايب سي, شاحن Type-C, شاحن USB-C, شاحن يو إس بي, USB, رأس شاحن Type-C, شاحن USB-C PD, شاحن سريع USB-C, وصلة تايب سي, وصلة يو إس بي, Type-C to Type-C, شواحن ووصلات',
    products: ['شاحن UGREEN USB-C بقدرة 30W', 'شاحن Baseus 20W USB-C', 'شاحن Anker Nano بقدرة 20W USB-C'],
    image: '../images/vention-charger-65w.jpg',
    related: [['iphone-chargers/', 'شواحن الآيفون'], ['samsung-chargers/', 'شواحن سامسونج'], ['fast-chargers/', 'الشواحن السريعة']],
  },
  {
    slug: 'iphone-chargers',
    title: 'شاحن آيفون أصلي وسريع في اليمن | USB-C وLightning',
    description: 'شواحن آيفون وكابلات USB-C إلى Lightning من علامات أصلية، مع شواحن 20W و30W المتوافقة وتوصيل داخل اليمن.',
    h1: 'شواحن آيفون<br />وكابلات Lightning',
    eyebrow: 'للآيفون والأجهزة المتوافقة',
    intro: 'لشحن الآيفون بسرعة، اختر رأس شاحن USB-C متوافقًا مع قدرة جهازك واستخدم كابلًا مناسبًا مثل USB-C إلى Lightning للموديلات التي تحتاجه.',
    keywords: 'شاحن آيفون, شاحن آيفون أصلي, شاحن iPhone سريع, شاحن آيفون USB-C, شاحن آيفون 20W, شاحن آيفون مع كيبل',
    products: ['شاحن Baseus 20W USB-C', 'كابل Anker USB-C إلى Lightning', 'كابل UGREEN USB-C إلى Lightning'],
    image: '../images/vention-charger-30w-kit.jpg',
    related: [['type-c-chargers/', 'شواحن Type-C'], ['chargers/20w/', 'شواحن 20W'], ['delivery/yemen/', 'توصيل شاحن إلى مدينتك']],
  },
  {
    slug: 'samsung-chargers',
    title: 'شاحن سامسونج سريع Type-C في اليمن | CABL',
    description: 'اشترِ شاحن سامسونج سريع Type-C للهواتف المتوافقة بقدرات 20W و30W و33W و45W، مع مواصفات واضحة وتوصيل داخل اليمن.',
    h1: 'شواحن سامسونج<br />سريعة Type-C',
    eyebrow: 'لهواتف سامسونج المتوافقة',
    intro: 'تعمل هذه الفئة مع أجهزة سامسونج التي تدعم USB-C بحسب قدرة الجهاز ومعيار الشحن. تحقق من مواصفات هاتفك قبل اختيار 20W أو 30W أو قدرة أعلى.',
    keywords: 'شاحن سامسونج, شاحن سامسونج أصلي, شاحن سامسونج سريع, شاحن Type-C سامسونج, Samsung charger Yemen',
    products: ['شاحن UGREEN Nexode GaN بقدرة 45W', 'شاحن Anker Nano بقدرة 30W USB-C', 'شاحن Baseus بمنفذين 33W'],
    image: '../images/vention-charger-65w.jpg',
    related: [['type-c-chargers/', 'شواحن USB-C'], ['fast-chargers/', 'شواحن سريعة'], ['chargers/33w/', 'شواحن 33W']],
  },
  {
    slug: 'car-chargers',
    title: 'شاحن سيارة سريع للجوال في اليمن | USB-C وPD',
    description: 'شاحن سيارة سريع للآيفون وسامسونج والأجهزة المتوافقة من Baseus وAnker وUGREEN، مع USB-C وخيارات متعددة المنافذ وتوصيل داخل اليمن.',
    h1: 'شواحن سيارة<br />سريعة للجوال',
    eyebrow: 'للسفر والطريق',
    intro: 'حافظ على طاقة هاتفك أثناء التنقل مع شاحن سيارة USB-C أو متعدد المنافذ. افحص توافق منفذ سيارتك وقدرة الشحن قبل الطلب.',
    keywords: 'شاحن سيارة, شاحن سيارة للجوال, شاحن سيارة سريع, شاحن سيارة يو إس بي, شاحن سيارة تايب سي, شاحن سيارة Type-C, شاحن سيارة للآيفون, شاحن سيارة لسامسونج, شاحن سيارة PD, شاحن لاسلكي, شاحن وايرلس, Wireless',
    products: ['شاحن سيارة UGREEN بقدرة 50W', 'شاحن سيارة Baseus بمنفذين 30W', 'شاحن سيارة Anker بقدرة 30W أو 50W'],
    image: '../images/baseus-car.svg',
    related: [['wireless-chargers/', 'شواحن لاسلكية'], ['type-c-chargers/', 'شواحن Type-C'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'wireless-chargers',
    title: 'شاحن لاسلكي سريع للآيفون وسامسونج في اليمن',
    description: 'اكتشف شاحن لاسلكي وقاعدة شحن لاسلكية للهواتف المتوافقة، مع شاحن سيارة لاسلكي UGREEN وخيارات توصيل داخل اليمن.',
    h1: 'شواحن لاسلكية<br />للهواتف المتوافقة',
    eyebrow: 'شحن لاسلكي',
    intro: 'قبل شراء شاحن لاسلكي، تأكد من أن هاتفك يدعم الشحن اللاسلكي ومن قدرة القاعدة المناسبة. بعض المنتجات تجمع بين التثبيت في السيارة والشحن.',
    keywords: 'شاحن لاسلكي, شاحن وايرلس, Wireless, شاحن لاسلكي للآيفون, شاحن لاسلكي سامسونج, قاعدة شحن لاسلكية, شاحن لاسلكي سريع, شاحن ماج سيف, MagSafe, شاحن 3 في 1',
    products: ['شاحن سيارة UGREEN بقدرة 30W', 'حامل هاتف Baseus مغناطيسي للسيارة', 'شاحن سيارة Anker بقدرة 30W أو 50W'],
    image: '../images/vention-adapter-65w.jpg',
    related: [['car-chargers/', 'شواحن السيارات'], ['chargers/', 'شواحن الجوال'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'charging-cables',
    title: 'وصلات شحن وكابلات Type-C أصلية في اليمن | CABL',
    description: 'اشترِ وصلة شحن أصلية وسريعة: كابل Type-C إلى Type-C وUSB-C إلى Lightning وUSB-A إلى USB-C بقدرات 60W و100W وتوصيل داخل اليمن.',
    h1: 'وصلات شحن<br />وكابلات أصلية',
    eyebrow: 'وصلات · USB-C · Lightning',
    intro: 'تصفح كابلات الشحن الأصلية للآيفون وسامسونج والأجهزة الحديثة، واختر وصلة Type-C أو USB-C بقدرة مناسبة للاستخدام اليومي والشحن السريع.',
    keywords: 'وصلات شحن, وصلة شحن, وصلات تايب سي, وصلة تايب سي, Type-C, وصلة يو إس بي, USB, وصلة تايب سي إلى تايب سي, Type-C to Type-C, وصلة شحن سريع, وصلات شحن سريعة, وصلة 60 واط, وصلة 100 واط, وصلة 240 واط, شراء وصلة, وصلات أصلية, شواحن ووصلات اليمن',
    products: ['كابل UGREEN USB-C إلى USB-C بقدرة 100W', 'كابل Anker USB-C إلى Lightning', 'كابل Baseus USB-C إلى USB-C بقدرة 60W'],
    image: '../images/vention-cable-100w.jpg',
    related: [['type-c-chargers/', 'شواحن Type-C'], ['chargers/', 'شواحن الجوال'], ['brands/baseus/', 'وصلات Baseus']],
  },
  {
    slug: 'power-banks',
    title: 'خازن متنقل وباور بانك أصلي في اليمن | CABL',
    description: 'اشترِ خازن شحن متنقل Power Bank بسعة 10000 أو 20000 وبقدرة تصل إلى 30W من Baseus وAnker وUGREEN مع توصيل داخل اليمن.',
    h1: 'خازن متنقل<br />Power Bank',
    eyebrow: 'طاقة محمولة',
    intro: 'اختر باور بانك أصليًا بسعة تناسب يومك: خازن 10000 أو 20000، مع USB-C وشحن سريع وقدرات مناسبة للهواتف والأجهزة المتوافقة.',
    keywords: 'خازن, خازن شحن, خازن متنقل, Power Bank, خازن 10000, خازن 20000, خازن 30000, خازن 30 واط, شراء خازن, شواحن ووصلات, اكسسوارات جوال أصلية',
    products: ['باور بنك UGREEN بسعة 20,000mAh / 30W', 'باور بنك Anker بسعة 10,000mAh', 'باور بنك Baseus 20,000mAh / 30W'],
    image: '../images/vention-powerbank-20k.jpg',
    related: [['chargers/', 'شواحن الجوال'], ['charging-cables/', 'وصلات الشحن'], ['brands/ugreen/', 'منتجات UGREEN']],
  },
  {
    slug: 'phone-accessories',
    title: 'اكسسوارات جوال أصلية وشواحن ووصلات في اليمن | CABL',
    description: 'متجر اكسسوارات جوال وموبايل في اليمن: محاور USB-C وحوامل سيارة واكسسوارات آيفون وسامسونج من Baseus وAnker وUGREEN.',
    h1: 'اكسسوارات جوال<br />أصلية في اليمن',
    eyebrow: 'إكسسوارات الهاتف',
    intro: 'اكتشف اكسسوارات الجوال والموبايل التي تكمل الشحن والعمل والسفر، من محاور USB-C إلى حوامل السيارة ومنتجات العلامات الأصلية.',
    keywords: 'شواحن ووصلات, اكسسوارات جوال, اكسسوارات موبايل, اكسسوارات آيفون, اكسسوارات سامسونج, اكسسوارات جوال أصلية, متجر اكسسوارات جوال, متجر إلكترونيات, اكسسوارات جوال اليمن, متجر إلكترونيات اليمن, شراء وصلة',
    products: ['محور UGREEN USB-C ‏7 في 1', 'محور Anker USB-C ‏7 في 1', 'حامل هاتف Baseus مغناطيسي للسيارة'],
    image: '../images/baseus-hub.svg',
    related: [['charging-cables/', 'وصلات الشحن'], ['car-chargers/', 'شواحن السيارات'], ['chargers/', 'شواحن الجوال']],
  },
  {
    slug: 'delivery/yemen',
    title: 'توصيل شواحن جوالات داخل اليمن | صنعاء وعدن وباقي المدن',
    description: 'اطلب شاحن جوال أونلاين من CABL مع خيارات توصيل داخل اليمن. تعرّف على طريقة الطلب والتوصيل إلى صنعاء وعدن وتعز وإب والحديدة وحضرموت ومأرب.',
    h1: 'توصيل شواحن<br />داخل اليمن',
    eyebrow: 'خدمة التوصيل',
    intro: 'يوفر CABL شواحن وكابلات وباور بانك أصلية للطلب أونلاين، مع ظهور خيارات التوصيل المتاحة وتكلفتها أثناء إتمام الطلب.',
    keywords: 'توصيل شاحن داخل اليمن, شاحن جوال صنعاء, شاحن جوال عدن, شاحن جوال تعز, متجر شواحن يوصل للبيت',
    products: ['شواحن جوال أصلية', 'شواحن Type-C وPD', 'شواحن سيارة وباور بانك'],
    image: '../images/vention-powerbank-10k.jpg',
    related: [['chargers/', 'شواحن الجوال'], ['fast-chargers/', 'شواحن سريعة'], ['type-c-chargers/', 'شواحن Type-C']],
  },
  {
    slug: 'brands/baseus',
    canonicalSlug: 'baseus',
    title: 'شاحن Baseus أصلي في اليمن | CABL',
    description: 'تصفح شواحن Baseus الأصلية بقدرات 20W و33W و65W و100W، إضافة إلى كابلات USB-C وباور بانك مع توصيل داخل اليمن.',
    h1: 'منتجات Baseus<br />الأصلية في اليمن',
    eyebrow: 'علامة Baseus',
    intro: 'CABL هو الوكيل الحصري لعلامة Baseus في اليمن. تصفح حلول الشحن والطاقة والكابلات المناسبة للاستخدام اليومي والسفر.',
    keywords: 'بيسوس, Baseus, منتجات بيسوس, شواحن بيسوس, وصلات بيسوس, شاحن Baseus, شاحن Baseus سريع, شاحن Baseus GaN, Baseus Yemen, شاحن Baseus 20W, شواحن أصلية',
    products: ['شاحن Baseus GaN بقدرة 100W', 'شاحن Baseus GaN بقدرة 65W', 'شاحن Baseus بمنفذين 33W'],
    image: '../images/vention-charger-100w.jpg',
    related: [['chargers/', 'كل الشواحن'], ['fast-chargers/', 'الشواحن السريعة'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'brands/vention',
    canonicalSlug: 'vention',
    title: 'شاحن Vention أصلي وسريع في اليمن | CABL',
    description: 'اكتشف شواحن Vention GaN بقدرات 30W و65W و70W و100W، مع كابلات USB-C وباور بانك وخيارات توصيل داخل اليمن.',
    h1: 'منتجات Vention<br />للشحن والطاقة',
    eyebrow: 'علامة Vention',
    intro: 'منتجات Vention متوفرة ضمن كتالوج CABL للشحن السريع والكابلات والطاقة المحمولة، مع مواصفات واضحة قبل إتمام الطلب.',
    keywords: 'فينشن, Vention, منتجات فينشن, شواحن فينشن, وصلات فينشن, شاحن Vention, شاحن Vention سريع, شاحن Vention GaN, شاحن Vention Type-C, شواحن أصلية',
    products: ['شاحن GaN بثلاثة منافذ 100W', 'شاحن GaN بثلاثة منافذ 70W', 'طقم شحن GaN بقدرة 30W'],
    image: '../images/vention-charger-100w.jpg',
    related: [['chargers/65w/', 'شواحن 65W'], ['type-c-chargers/', 'شواحن Type-C'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'brands/anker',
    canonicalSlug: 'anker',
    title: 'شاحن Anker أصلي وسريع في اليمن | CABL',
    description: 'تصفح شواحن Anker Nano وNano II بقدرات 20W و30W و45W و65W، وكابلات USB-C وباور بانك مع توصيل داخل اليمن.',
    h1: 'منتجات Anker<br />للشحن السريع',
    eyebrow: 'علامة Anker',
    intro: 'يضم كتالوج CABL منتجات Anker للشحن والطاقة والكابلات، مع التركيز على أحجام عملية وقدرات مناسبة للهواتف والأجهزة المتوافقة.',
    keywords: 'انكر, Anker, منتجات انكر, شواحن انكر, وصلات انكر, شاحن Anker, شاحن Anker سريع, Anker Nano, شاحن Anker GaN, Anker Yemen, شواحن أصلية',
    products: ['شاحن Anker Nano II GaN بقدرة 65W', 'شاحن Anker Nano GaN بقدرة 45W', 'شاحن Anker Nano بقدرة 20W USB-C'],
    image: '../images/vention-charger-65w.jpg',
    related: [['fast-chargers/', 'الشواحن السريعة'], ['type-c-chargers/', 'شواحن Type-C'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'brands/ugreen',
    canonicalSlug: 'ugreen',
    title: 'شاحن UGREEN أصلي وسريع في اليمن | CABL',
    description: 'اشترِ شواحن UGREEN USB-C وNexode GaN بقدرات 20W و30W و45W و65W، مع كابلات وباور بانك وتوصيل داخل اليمن.',
    h1: 'منتجات UGREEN<br />للشحن والطاقة',
    eyebrow: 'علامة UGREEN',
    intro: 'تصفح منتجات UGREEN الأصلية للشحن السريع، USB-C، الكابلات، الشواحن السيارة، والباور بانك داخل كتالوج CABL.',
    keywords: 'يوقرين, UGREEN, منتجات يوقرين, شواحن يوقرين, وصلات يوقرين, شاحن UGREEN, شاحن UGREEN سريع, شاحن UGREEN GaN, شاحن UGREEN Type-C, UGREEN Yemen, شواحن أصلية',
    products: ['شاحن UGREEN GaN بقدرة 65W', 'شاحن UGREEN Nexode GaN بقدرة 45W', 'شاحن UGREEN USB-C بقدرة 20W'],
    image: '../images/vention-charger-70w.jpg',
    related: [['fast-chargers/', 'الشواحن السريعة'], ['chargers/', 'شواحن الجوال'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
];

const powerPages = [
  {
    slug: 'chargers/20w',
    title: 'شواحن 20W أصلية وسريعة في اليمن | CABL',
    description: 'تصفح شواحن 20W USB-C الأصلية للهواتف والأجهزة المتوافقة، مع خيارات Baseus وAnker وUGREEN وتوصيل داخل اليمن.',
    h1: 'شواحن 20W<br />USB-C في اليمن',
    eyebrow: 'قدرة 20W',
    intro: 'قدرة عملية للشحن اليومي والهواتف المتوافقة. افحص دعم جهازك للشحن السريع واستخدم كابلًا مناسبًا.',
    keywords: 'شاحن 20W, شاحن سريع 20 واط, شاحن آيفون 20W, شاحن USB-C 20W',
    products: ['شاحن Baseus 20W USB-C', 'شاحن Anker Nano بقدرة 20W USB-C', 'شاحن UGREEN USB-C بقدرة 20W'],
    image: '../images/vention-charger-30w.jpg',
    related: [['chargers/', 'كل الشواحن'], ['iphone-chargers/', 'شواحن الآيفون'], ['type-c-chargers/', 'شواحن Type-C']],
  },
  {
    slug: 'chargers/33w',
    title: 'شواحن 33W سريعة للبيع في اليمن | CABL',
    description: 'اشترِ شاحن 33W سريع بمنفذين من Baseus، مناسب للهواتف والأجهزة المتوافقة مع USB-C، مع توصيل داخل اليمن.',
    h1: 'شاحن 33W<br />سريع بمنفذين',
    eyebrow: 'قدرة 33W',
    intro: 'خيار عملي لمن يريد شحن أكثر من جهاز من شاحن واحد. راجع توزيع القدرة والتوافق مع هاتفك قبل الطلب.',
    keywords: 'شاحن 33W, شاحن سريع 33 واط, شاحن 33W في اليمن, شاحن USB-C 33W',
    products: ['شاحن Baseus بمنفذين 33W'],
    image: '../images/vention-charger-30w.jpg',
    related: [['fast-chargers/', 'الشواحن السريعة'], ['samsung-chargers/', 'شواحن سامسونج'], ['delivery/yemen/', 'التوصيل داخل اليمن']],
  },
  {
    slug: 'chargers/65w',
    title: 'شواحن 65W GaN سريعة في اليمن | CABL',
    description: 'اكتشف شواحن 65W GaN من Baseus وAnker وUGREEN وVention للهواتف والأجهزة المحمولة، مع USB-C وتوصيل داخل اليمن.',
    h1: 'شواحن 65W<br />GaN سريعة',
    eyebrow: 'قدرة 65W',
    intro: 'شاحن 65W مناسب لمن يحتاج قدرة أعلى في حجم عملي، مع خيارات GaN متعددة المنافذ للهواتف والأجهزة المتوافقة.',
    keywords: 'شاحن 65W, شاحن سريع 65 واط, شاحن GaN 65W, شاحن USB-C 65W',
    products: ['شاحن Baseus GaN بقدرة 65W', 'شاحن Anker Nano II GaN بقدرة 65W', 'شاحن UGREEN GaN بقدرة 65W'],
    image: '../images/vention-charger-65w.jpg',
    related: [['fast-chargers/', 'الشواحن السريعة'], ['brands/ugreen/', 'شواحن UGREEN'], ['brands/anker/', 'شواحن Anker']],
  },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPage(page) {
  const rootPrefix = '../'.repeat(page.slug.split('/').length);
  const imagePath = `${rootPrefix}images/${page.image.split('/').pop()}`;
  const canonicalPath = `/${page.canonicalSlug ?? page.slug}/`;
  const breadcrumbPath = page.canonicalSlug ?? page.slug;
  const breadcrumbItems = [
    { name: 'الرئيسية', url: '/' },
    ...breadcrumbPath.split('/').map((segment, index, segments) => ({
      name: page.breadcrumbNames?.[index] ?? segment.replaceAll('-', ' '),
      url: `/${segments.slice(0, index + 1).join('/')}/`,
    })),
  ];
  const related = page.related.map(([href, label]) => `<a href="${rootPrefix}${href}">${escapeHtml(label)}</a>`).join('');
  const isBrandPage = Boolean(brandLabels[page.slug] || page.slug.startsWith('brands/'));
  const pageTypeClass = isBrandPage ? 'seo-brand-page' : 'seo-category-page';
  const products = page.products.map((name, index) => `
        <article class="cv-product-card seo-product">
          <div class="cv-product-image"><img src="${imagePath}" alt="${escapeHtml(name)}" loading="lazy" /><span>${index < 3 ? 'اختيار CABL' : 'متوفر الآن'}</span></div>
          <div class="cv-product-copy"><small>CABL</small><h3>${escapeHtml(name)}</h3><p>راجع المواصفات والتوافق قبل إتمام الطلب.</p><strong>افتح المواصفات <span aria-hidden="true">←</span></strong></div>
        </article>`).join('');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    inLanguage: 'ar-YE',
    url: canonicalPath,
    isPartOf: { '@type': 'WebSite', name: 'CABL', url: '/' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: page.products.map((name, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
      })),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  };
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="keywords" content="${escapeHtml(page.keywords)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${canonicalPath}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonicalPath}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ar_YE" />
    <meta property="og:image" content="${rootPrefix}${page.image.replace('../', '')}" />
    <link rel="icon" type="image/svg+xml" href="${rootPrefix}favicon.svg" />
    <link rel="stylesheet" href="${rootPrefix}seo-pages.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  </head>
  <body class="${pageTypeClass}">
    <div class="seo-utility"><div><span>ضمان CABL مكتوب حسب المنتج</span><span>توصيل داخل اليمن</span><span>خدمة العملاء</span><span>English</span></div></div>
    <header class="seo-header">
      <a class="seo-logo" href="${rootPrefix}"><img src="${rootPrefix}cabl-logo.svg" alt="CABL متجر شواحن في اليمن" /><strong>CABL</strong></a>
      <nav aria-label="التنقل">
        <a href="${rootPrefix}baseus/">Baseus <span>⌄</span></a>
        <a href="${rootPrefix}anker/">Anker <span>⌄</span></a>
        <a href="${rootPrefix}ugreen/">UGREEN <span>⌄</span></a>
        <a href="${rootPrefix}power-banks/">باور بانك</a>
        <a href="${rootPrefix}chargers/">شواحن</a>
        <a href="${rootPrefix}blog/">المدونة</a>
      </nav>
      <div class="seo-header-actions"><a href="${rootPrefix}search" aria-label="البحث">⌕</a><a class="seo-cart" href="${rootPrefix}#discover" aria-label="السلة">▣</a></div>
    </header>
    <main>
      <section class="cabl-route-hero">
          <nav class="seo-breadcrumbs" aria-label="مسار التنقل">
            ${breadcrumbItems.map((item, index) => index === breadcrumbItems.length - 1
    ? `<span>${escapeHtml(item.name)}</span>`
    : `<a href="${item.url}">${escapeHtml(item.name)}</a>`).join('<span aria-hidden="true">/</span>')}
          </nav>
          <span class="seo-eyebrow">${escapeHtml(page.eyebrow)}</span>
          <h1>${page.h1}</h1>
          <p>${escapeHtml(page.intro)}</p>
          <a class="seo-button" href="#seo-product-grid">تصفح كتالوج CABL</a>
      </section>
      ${isBrandPage ? `
      <section class="seo-brand-categories">
        <div class="seo-brand-heading"><span>علامة ${escapeHtml(brandLabels[page.slug] ?? 'CABL')}</span><h2>منتجات مختارة من الكتالوج</h2><p>اختر القسم الأقرب لاستخدامك، ثم راجع الموديلات المتاحة والمواصفات قبل الشراء.</p></div>
        <div class="seo-brand-category-grid">
          <a href="${rootPrefix}${page.slug}/power-banks/"><strong>طاقة تكمل يومك</strong><span>باور بانك للسفر والاستخدام اليومي</span><b>تصفح الباور بانك ←</b></a>
          <a href="${rootPrefix}${page.slug}/chargers/"><strong>شحن أسرع وأأمن</strong><span>شواحن بقدرات ومنافذ واضحة</span><b>تصفح الشواحن ←</b></a>
          <a href="${rootPrefix}${page.slug}/cables/"><strong>الكابل الصح لجهازك</strong><span>USB-C وLightning للاستخدام اليومي</span><b>تصفح الكابلات ←</b></a>
          <a href="${rootPrefix}${page.slug}/car-accessories/"><strong>عربيتك أذكى</strong><span>حوامل وشواحن ثابتة على الطريق</span><b>تصفح إكسسوارات السيارة ←</b></a>
        </div>
      </section>` : `
      <section class="seo-category-filters" aria-label="فلترة المنتجات">
        <button type="button">تسوق انكر</button>
        <button type="button">تسوق جوي روم</button>
      </section>`}
      <section class="cabl-route-points" aria-label="نقاط مهمة">
        <div><span>✓</span><strong>مواصفات واضحة من كتالوج CABL</strong></div>
        <div><span>✓</span><strong>أسعار وتوفر قبل تأكيد الطلب</strong></div>
        <div><span>✓</span><strong>خيارات شحن ودفع داخل اليمن</strong></div>
      </section>
      <section class="seo-content cv-section cv-products">
        <div class="cv-section-heading"><div><span>من كتالوج CABL</span><h2>منتجات متاحة الآن</h2></div><p>الأسعار والمخزون والصور مأخوذة من بيانات المتجر الحالية.</p></div>
        <div class="cv-product-grid" id="seo-product-grid" data-cabl-route="${escapeHtml(page.canonicalSlug ?? page.slug)}">${products}
        </div>
      </section>
      <section class="cabl-route-content seo-content">
        <span class="seo-eyebrow">اختيار مناسب</span>
        <h2>ماذا تراجع قبل شراء الشاحن؟</h2>
        <div class="seo-copy">
          <p>تحقق من نوع المنفذ والقدرة بالواط ومعيار الشحن السريع والتوافق مع هاتفك. لا تعني القدرة الأعلى أنها مناسبة لكل جهاز؛ اتبع مواصفات الهاتف والكابل، واختر منتجًا أصليًا من علامة موثوقة.</p>
          <p>يعرض CABL معلومات المنتج وخيارات الشحن المتاحة أثناء إتمام الطلب. يمكنك طلب شاحن جوال أونلاين والتواصل مع فريق CABL للتأكد من التوصيل إلى مدينتك في اليمن.</p>
        </div>
      </section>
      <section class="seo-related">
        <h2>تصفح أيضًا</h2>
        <nav aria-label="صفحات ذات صلة">${related}</nav>
      </section>
    </main>
    <footer class="seo-footer" data-testid="footer-storefront">
      <div class="seo-footer-inner">
        <div class="seo-footer-grid">
          <div class="seo-footer-brand"><a href="${rootPrefix}"><strong>CABL</strong></a><p>منتجات الشحن والطاقة مع مواصفات واضحة وتوصيل داخل اليمن.</p><a href="${rootPrefix}contact/">تواصل مع خدمة العملاء</a></div>
          <div><h3>تسوق حسب الفئة</h3><a href="${rootPrefix}chargers/">الشواحن</a><a href="${rootPrefix}cables/">الكابلات</a><a href="${rootPrefix}power-banks/">الباور بانك</a><a href="${rootPrefix}wireless-chargers/">الشحن اللاسلكي</a></div>
          <div><h3>خدمة العملاء</h3><a href="${rootPrefix}about/">عن CABL</a><a href="${rootPrefix}shipping/">الشحن والتوصيل</a><a href="${rootPrefix}warranty/">الضمان</a><a href="${rootPrefix}faq/">الأسئلة الشائعة</a></div>
          <div><h3>مركز المواصفات</h3><a href="${rootPrefix}search">البحث في المنتجات</a><a href="${rootPrefix}guides/power-bank-buying-guide/">أدلة الشراء</a><a href="${rootPrefix}blog/">المدونة</a></div>
        </div>
        <div class="seo-footer-bottom"><span>© 2026 CABL. جميع الحقوق محفوظة.</span><span>سياسة الخصوصية · الشروط والأحكام</span></div>
      </div>
    </footer>
    <script>
      (() => {
        const grid = document.getElementById('seo-product-grid');
        const route = grid?.dataset.cablRoute ?? '';
        if (!grid || !route) return;
        const categoryAliases = {
          chargers: 'chargers',
          'fast-chargers': 'chargers',
          'type-c-chargers': 'chargers',
          'iphone-chargers': 'chargers',
          'samsung-chargers': 'chargers',
          'car-chargers': 'car-chargers',
          'car-accessories': 'car-accessories',
          'wireless-chargers': 'wireless-chargers',
          cables: 'charging-cables',
          'charging-cables': 'charging-cables',
          'power-banks': 'power-banks',
          'phone-accessories': 'phone-accessories',
          'hubs-adapters': 'phone-accessories',
        };
        const brands = new Set(['baseus', 'vention', 'anker', 'ugreen']);
        const routeParts = route.split('/');
        const brandSlug = brands.has(routeParts[0]) ? routeParts[0] : null;
        const categorySlug = categoryAliases[brandSlug ? routeParts[1] : routeParts[0]];
        const productCategoryPath = {
          chargers: 'chargers',
          'charging-cables': 'cables',
          cables: 'cables',
          'power-banks': 'power-banks',
          'wireless-chargers': 'wireless-chargers',
          'car-chargers': 'car-accessories',
          'car-accessories': 'car-accessories',
          'phone-accessories': 'hubs-adapters',
          'hubs-adapters': 'hubs-adapters',
        };
        const productPath = (product) => product.brandSlug && product.category?.slug
          ? '/' + product.brandSlug + '/' + (productCategoryPath[product.category.slug] ?? product.category.slug) + '/' + product.slug + '/'
          : '/product/' + product.slug + '/';
        const imagePath = (product) => product.images?.[0] ?? '';
        const createCard = (product, index) => {
          const article = document.createElement('article');
           article.className = 'cv-product-card seo-product';
           const imageWrap = document.createElement('div');
           imageWrap.className = 'cv-product-image';
          const link = document.createElement('a');
          link.href = productPath(product);
           const image = imagePath(product);
           if (image) {
             const thumbnail = document.createElement('img');
             thumbnail.src = image;
             thumbnail.alt = product.productName;
             thumbnail.loading = 'lazy';
             thumbnail.width = 320;
             thumbnail.height = 240;
             imageWrap.append(thumbnail);
           }
           const badge = document.createElement('span');
           badge.textContent = index < 3 ? 'اختيار CABL' : product.quantity > 0 ? 'متوفر الآن' : 'غير متوفر';
           imageWrap.append(badge);
           const copy = document.createElement('div');
           copy.className = 'cv-product-copy';
           const brand = document.createElement('small');
           brand.textContent = product.brand;
           const heading = document.createElement('h3');
          heading.textContent = product.productName;
          link.append(heading);
          const description = document.createElement('p');
          description.textContent = product.brand + ' · ' + (product.category?.name ?? 'منتجات CABL') + ' · ' + (product.quantity > 0 ? 'متوفر الآن' : 'غير متوفر');
           const action = document.createElement('strong');
           action.textContent = 'افتح المواصفات ←';
           copy.append(brand, link, description, action);
           article.append(imageWrap, copy);
          return article;
        };
        fetch('/api/store/catalog', { headers: { Accept: 'application/json' } })
          .then((response) => response.ok ? response.json() : null)
          .then((catalog) => {
            const products = Array.isArray(catalog?.products) ? catalog.products : [];
            const matches = products.filter((product) => (
              (!brandSlug || product.brandSlug === brandSlug)
              && (!categorySlug || product.category?.slug === categorySlug)
            ));
            if (matches.length > 0) {
              grid.replaceChildren(...matches.slice(0, 12).map(createCard));
            }
          })
          .catch(() => {});
      })();
    </script>
  </body>
</html>`;
}

const cleanRouteSlugs = [
  'cables', 'car-accessories', 'hubs-adapters',
  'chargers/fast-chargers', 'chargers/gan-chargers', 'chargers/type-c-chargers',
  'cables/usb-c', 'cables/100w-cables', 'power-banks/10000mah', 'power-banks/20000mah',
  'baseus', 'vention', 'anker', 'ugreen',
  'baseus/chargers', 'baseus/cables', 'baseus/power-banks',
  'baseus/wireless-chargers', 'baseus/car-accessories', 'baseus/hubs-adapters',
  'vention/chargers', 'vention/cables', 'vention/power-banks',
  'vention/wireless-chargers', 'vention/car-accessories', 'vention/hubs-adapters',
  'anker/chargers', 'anker/cables', 'anker/power-banks',
  'anker/wireless-chargers', 'anker/car-accessories', 'anker/hubs-adapters',
  'ugreen/chargers', 'ugreen/cables', 'ugreen/power-banks',
  'ugreen/wireless-chargers', 'ugreen/car-accessories', 'ugreen/hubs-adapters',
  'guides/charger-buying-guide', 'guides/cable-buying-guide', 'guides/power-bank-buying-guide', 'guides/usb-c-guide',
  'compare/baseus-vs-vention', 'compare/baseus-vs-ugreen', 'compare/anker-vs-ugreen',
  'blog', 'blog/chargers', 'blog/cables', 'blog/power-banks', 'blog/baseus', 'blog/vention',
  'yemen', 'sanaa', 'aden', 'taiz', 'ibb', 'hodeidah', 'hadramout', 'marib',
  'about', 'contact', 'warranty', 'shipping', 'returns', 'faq', 'authenticity',
];

const brandLabels = {
  baseus: 'Baseus',
  vention: 'Vention',
  anker: 'Anker',
  ugreen: 'UGREEN',
};

const categoryLabels = {
  chargers: 'الشواحن',
  cables: 'الكابلات',
  'power-banks': 'الباور بانك',
  'wireless-chargers': 'الشواحن اللاسلكية',
  'car-accessories': 'إكسسوارات السيارة',
  'hubs-adapters': 'المحاور والمحوّلات',
};

const explicitRouteMetadata = {
  'guides/charger-buying-guide': {
    title: 'دليل شراء الشاحن المناسب | CABL',
    description: 'دليل عملي لفهم القدرة والـUSB-C وPD وGaN قبل شراء شاحن جوال في اليمن.',
    h1: 'كيف تختار الشاحن المناسب؟',
    eyebrow: 'دليل CABL',
  },
  'guides/cable-buying-guide': {
    title: 'دليل شراء كابل الشحن | CABL',
    description: 'تعرف على الفرق بين USB-C وLightning وقدرات 60W و100W قبل شراء الكابل.',
    h1: 'كيف تختار كابل الشحن؟',
    eyebrow: 'دليل CABL',
  },
  'guides/power-bank-buying-guide': {
    title: 'دليل شراء الباور بانك | CABL',
    description: 'قارن السعة والمخارج والقدرة والحجم لاختيار خازن شحن عملي.',
    h1: 'كيف تختار الباور بانك؟',
    eyebrow: 'دليل CABL',
  },
  'guides/usb-c-guide': {
    title: 'دليل USB-C وType-C | CABL',
    description: 'افهم المنافذ والكابلات والقدرات المختلفة قبل اختيار منتج USB-C.',
    h1: 'دليل USB-C وType-C',
    eyebrow: 'دليل CABL',
  },
  'compare/baseus-vs-vention': {
    title: 'Baseus ضد Vention: أيهما تختار؟ | CABL',
    description: 'قارن المنتجات المتاحة من Baseus وVention حسب الفئة والسعر والمواصفات.',
    h1: 'Baseus ضد Vention',
    eyebrow: 'مقارنة CABL',
  },
  'compare/baseus-vs-ugreen': {
    title: 'Baseus ضد UGREEN: مقارنة المنتجات | CABL',
    description: 'مقارنة عملية بين منتجات Baseus وUGREEN المتوفرة في كتالوج CABL.',
    h1: 'Baseus ضد UGREEN',
    eyebrow: 'مقارنة CABL',
  },
  'compare/anker-vs-ugreen': {
    title: 'Anker ضد UGREEN: مقارنة الشحن | CABL',
    description: 'قارن حلول الشحن والطاقة من Anker وUGREEN قبل الشراء.',
    h1: 'Anker ضد UGREEN',
    eyebrow: 'مقارنة CABL',
  },
  blog: {
    title: 'مدونة الشحن والطاقة | CABL',
    description: 'أدلة ونصائح CABL لاختيار الشواحن والكابلات والباور بانك.',
    h1: 'مقالات الشحن والطاقة',
    eyebrow: 'مدونة CABL',
  },
  'blog/chargers': {
    title: 'مقالات الشواحن | CABL',
    description: 'نصائح لاختيار الشاحن المناسب وفهم PD وGaN والقدرة.',
    h1: 'مقالات الشواحن',
    eyebrow: 'مدونة CABL',
  },
  'blog/cables': {
    title: 'مقالات الكابلات | CABL',
    description: 'دليل CABL للكابلات وUSB-C وLightning والقدرات المختلفة.',
    h1: 'مقالات الكابلات',
    eyebrow: 'مدونة CABL',
  },
  'blog/power-banks': {
    title: 'مقالات الباور بانك | CABL',
    description: 'كل ما تحتاج معرفته عن السعة والقدرة والمخارج.',
    h1: 'مقالات الباور بانك',
    eyebrow: 'مدونة CABL',
  },
  'blog/baseus': {
    title: 'مقالات Baseus | CABL',
    description: 'أدلة ومراجعات اختيار منتجات Baseus.',
    h1: 'مقالات Baseus',
    eyebrow: 'مدونة CABL',
  },
  'blog/vention': {
    title: 'مقالات Vention | CABL',
    description: 'أدلة ومراجعات اختيار منتجات Vention.',
    h1: 'مقالات Vention',
    eyebrow: 'مدونة CABL',
  },
  yemen: { title: 'شراء شواحن وإكسسوارات في اليمن | CABL', description: 'تسوق منتجات الشحن والطاقة الأصلية مع خيارات توصيل داخل اليمن.', h1: 'CABL في اليمن', eyebrow: 'CABL في اليمن' },
  sanaa: { title: 'شواحن وتوصيل إلى صنعاء | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى صنعاء.', h1: 'CABL في صنعاء', eyebrow: 'توصيل CABL' },
  aden: { title: 'شواحن وتوصيل إلى عدن | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى عدن.', h1: 'CABL في عدن', eyebrow: 'توصيل CABL' },
  taiz: { title: 'شواحن وتوصيل إلى تعز | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى تعز.', h1: 'CABL في تعز', eyebrow: 'توصيل CABL' },
  ibb: { title: 'شواحن وتوصيل إلى إب | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى إب.', h1: 'CABL في إب', eyebrow: 'توصيل CABL' },
  hodeidah: { title: 'شواحن وتوصيل إلى الحديدة | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى الحديدة.', h1: 'CABL في الحديدة', eyebrow: 'توصيل CABL' },
  hadramout: { title: 'شواحن وتوصيل إلى حضرموت | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى حضرموت.', h1: 'CABL في حضرموت', eyebrow: 'توصيل CABL' },
  marib: { title: 'شواحن وتوصيل إلى مأرب | CABL', description: 'تصفح منتجات CABL وتعرف على خيارات التوصيل المتاحة إلى مأرب.', h1: 'CABL في مأرب', eyebrow: 'توصيل CABL' },
  about: { title: 'عن CABL | متجر الشحن والطاقة في اليمن', description: 'تعرف على CABL ومهمتنا في توفير منتجات شحن وطاقة أصلية وواضحة المواصفات.', h1: 'عن CABL', eyebrow: 'الثقة أولًا' },
  contact: { title: 'تواصل مع CABL | خدمة العملاء', description: 'تواصل مع فريق CABL قبل الشراء أو بعده عبر قنوات الدعم المتاحة.', h1: 'تواصل معنا', eyebrow: 'خدمة العملاء' },
  warranty: { title: 'الضمان | CABL', description: 'تعرف على معلومات الضمان الظاهرة في صفحات منتجات CABL.', h1: 'ضمان المنتجات', eyebrow: 'الثقة أولًا' },
  shipping: { title: 'الشحن والتوصيل | CABL', description: 'تعرف على خيارات الشحن ومدته وتكلفته قبل تأكيد طلبك.', h1: 'الشحن والتوصيل', eyebrow: 'الخدمة' },
  returns: { title: 'الاستبدال والاسترجاع | CABL', description: 'راجع سياسة الاستبدال والاسترجاع قبل إتمام الشراء من CABL.', h1: 'الاستبدال والاسترجاع', eyebrow: 'خدمة العملاء' },
  faq: { title: 'الأسئلة الشائعة | CABL', description: 'إجابات عن المنتجات والطلب والدفع والشحن في CABL.', h1: 'الأسئلة الشائعة', eyebrow: 'مساعدة CABL' },
  authenticity: { title: 'أصالة المنتجات | CABL', description: 'تعرف على طريقة مراجعة العلامة والمواصفات والضمان قبل شراء المنتج.', h1: 'أصالة المنتجات', eyebrow: 'الثقة أولًا' },
};

const legacyCanonicalSlugs = {
  'brands/baseus': 'baseus',
  'brands/vention': 'vention',
  'brands/anker': 'anker',
  'brands/ugreen': 'ugreen',
};

const cleanRoutePages = cleanRouteSlugs.map((slug) => {
  const segments = slug.split('/');
  const [first, second] = segments;
  const brand = brandLabels[first];
  const category = categoryLabels[second ?? first];
  const explicit = explicitRouteMetadata[slug];
  const label = brand && second
    ? `${brand} ${category ?? second.replaceAll('-', ' ')}`
    : brand
      ? `منتجات ${brand}`
      : category ?? slug.split('/').at(-1).replaceAll('-', ' ');
  const title = explicit?.title ?? `${label} | CABL`;
  const h1 = explicit?.h1 ?? label;
  const description = explicit?.description
    ?? (brand && second
      ? `تصفح منتجات ${brand} ضمن فئة ${category ?? second.replaceAll('-', ' ')} من كتالوج CABL.`
      : brand
        ? `تصفح منتجات ${brand} الأصلية المتاحة حاليًا في كتالوج CABL.`
        : `تصفح ${label} من كتالوج CABL، مع مواصفات واضحة وأسعار ومخزون وخيارات توصيل داخل اليمن.`);
  return {
    slug,
    title,
    canonicalSlug: legacyCanonicalSlugs[slug],
    description,
    h1,
    eyebrow: explicit?.eyebrow ?? (brand ? `علامة ${brand}` : 'CABL · دليل التسوق'),
    intro: `تعرّف على ${label} واختر المنتجات المناسبة من كتالوج CABL قبل إتمام الطلب.`,
    keywords: `${label}, CABL, شواحن, كابلات, باور بانك, اليمن`,
    products: ['منتجات أصلية من كتالوج CABL', 'خيارات شحن وطاقة متوفرة حاليًا', 'مواصفات واضحة قبل الشراء'],
    image: '../images/vention-charger-65w.jpg',
    breadcrumbNames: [brand ?? category ?? first, ...(second ? [category ?? second] : [])],
    related: [['chargers/', 'الشواحن'], ['cables/', 'الكابلات'], ['power-banks/', 'الباور بانك']],
  };
});

for (const page of [...pages, ...powerPages, ...cleanRoutePages]) {
  const outputDir = path.join(publicDir, page.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderPage(page));
}