import { useEffect } from 'react';

/**
 * مكون مساعد لتفعيل تأثيرات الأنيميشن عند ظهور العناصر أثناء التمرير
 */
const AnimationObserver = () => {
  useEffect(() => {
    // تفعيل تأثيرات الأنيميشن عند التمرير
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        // إضافة كلاس visible للعناصر الظاهرة
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    // إنشاء كائن Intersection Observer
    const observer = new IntersectionObserver(observerCallback, {
      root: null, // الصفحة كاملة
      rootMargin: '0px',
      threshold: 0.15 // يظهر التأثير عندما يصبح 15% من العنصر مرئي
    });

    // إضافة كلاس للعناصر التي نريد تتبعها
    document.querySelectorAll('.project-card, .tech-card, .feature-card, .contact-card, .contact-form, .project-description-box').forEach(element => {
      element.classList.add('animate-on-scroll');
      observer.observe(element);
    });

    // تنظيف عند فك تحميل المكون
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []); // يعمل مرة واحدة عند تحميل المكون

  return null; // هذا المكون لا يعرض أي UI، فقط يضيف السلوك
};

export default AnimationObserver;
