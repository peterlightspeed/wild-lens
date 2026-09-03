import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

let initialized = false;

/* Mirrors initAOS() in js/main.js. AOS is initialized once, then
   `.refresh()` on every route change so newly-mounted [data-aos] elements
   on the new page are picked up (matches the static site re-scanning the
   DOM on each full page load). */
export function useAOS() {
  useEffect(() => {
    if (!initialized) {
      AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
      initialized = true;
    } else {
      AOS.refreshHard();
    }
  }, []);
}
