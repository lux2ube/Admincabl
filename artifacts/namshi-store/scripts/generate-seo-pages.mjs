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
  const related = page.related.map(([href, label]) => `<a href="${rootPrefix}${href}">${escapeHtml(label)}</a>`).join('');
  const products = page.products.map((name, index) => `
        <article class="seo-product">
          <span class="seo-product-number">0${index + 1}</span>
          <h3>${escapeHtml(name)}</h3>
          <p>منتج متوفر ضمن كتالوج CABL، راجع المواصفات والتوافق قبل إتمام الطلب.</p>
        </article>`).join('');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: page.title,
    description: page.description,
    inLanguage: 'ar-YE',
    isPartOf: { '@type': 'WebSite', name: 'CABL', url: `${rootPrefix}` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: page.products.map((name, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
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
    <link rel="canonical" href="./" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
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
  <body>
    <header class="seo-header">
      <a class="seo-logo" href="${rootPrefix}"><img src="${rootPrefix}cabl-logo.svg" alt="CABL متجر شواحن في اليمن" /></a>
      <nav aria-label="التنقل">
        <a href="${rootPrefix}chargers/">الشواحن</a>
        <a href="${rootPrefix}fast-chargers/">الشواحن السريعة</a>
        <a href="${rootPrefix}type-c-chargers/">Type-C</a>
        <a href="${rootPrefix}delivery/yemen/">التوصيل</a>
      </nav>
      <a class="seo-cta" href="${rootPrefix}#discover">تصفح المنتجات</a>
    </header>
    <main>
      <section class="seo-hero">
        <div>
          <span class="seo-eyebrow">${escapeHtml(page.eyebrow)}</span>
          <h1>${page.h1}</h1>
          <p>${escapeHtml(page.intro)}</p>
          <a class="seo-button" href="${rootPrefix}#discover">تصفح كتالوج CABL</a>
        </div>
        <img src="${imagePath}" alt="${escapeHtml(page.title)}" width="800" height="700" />
      </section>
      <section class="seo-content">
        <span class="seo-eyebrow">منتجات مختارة</span>
        <h2>خيارات ${escapeHtml(page.eyebrow.toLowerCase())} داخل اليمن</h2>
        <div class="seo-product-grid">${products}
        </div>
      </section>
      <section class="seo-content seo-guide">
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
    <footer class="seo-footer">
      <a href="${rootPrefix}">CABL</a>
      <span>شواحن ومنتجات شحن أصلية مع توصيل داخل اليمن.</span>
      <a href="https://wa.me/967771106977" rel="noopener noreferrer">تواصل عبر WhatsApp</a>
    </footer>
  </body>
</html>`;
}

for (const page of [...pages, ...powerPages]) {
  const outputDir = path.join(publicDir, page.slug);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), renderPage(page));
}