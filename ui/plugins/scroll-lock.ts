let locks = 0;
let scrollY = 0;
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyLeft = "";
let previousBodyRight = "";
let previousBodyWidth = "";
let previousBodyPaddingRight = "";
let previousHtmlOverflow = "";

function lockPageScroll() {
  if (locks === 0) {
    scrollY = window.scrollY;
    const { body, documentElement } = document;
    previousBodyPosition = body.style.position;
    previousBodyTop = body.style.top;
    previousBodyLeft = body.style.left;
    previousBodyRight = body.style.right;
    previousBodyWidth = body.style.width;
    previousBodyPaddingRight = body.style.paddingRight;
    previousHtmlOverflow = documentElement.style.overflow;

    const scrollbarGap = window.innerWidth - documentElement.clientWidth;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }
    documentElement.style.overflow = "hidden";
  }
  locks += 1;
}

function unlockPageScroll() {
  locks = Math.max(0, locks - 1);
  if (locks > 0) {
    return;
  }

  const { body, documentElement } = document;
  body.style.position = previousBodyPosition;
  body.style.top = previousBodyTop;
  body.style.left = previousBodyLeft;
  body.style.right = previousBodyRight;
  body.style.width = previousBodyWidth;
  body.style.paddingRight = previousBodyPaddingRight;
  documentElement.style.overflow = previousHtmlOverflow;
  window.scrollTo(0, scrollY);
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive("scroll-lock", {
    mounted() {
      lockPageScroll();
    },
    unmounted() {
      unlockPageScroll();
    },
  });
});
