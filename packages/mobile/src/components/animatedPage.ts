import { createAnimation, type AnimationBuilder } from '@ionic/react';

type AnimationOpts = {
  enteringEl?: HTMLElement;
  leavingEl?: HTMLElement;
};

export const animatedPage: AnimationBuilder = (_baseEl, opts: AnimationOpts) => {
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;

  if (!enteringEl) return createAnimation();

  // Prendo SOLO il contenuto visivo, non ion-page
  const content = (enteringEl.querySelector('#page-content') as HTMLElement | null) || enteringEl;

  // Reset iniziale (così non resta nascosto)
  content.style.opacity = '1';
  content.style.transform = 'scale(1) translateY(0)';
  content.style.filter = 'blur(0px)';

  const enteringAnimation = createAnimation()
    .addElement(content)
    .duration(400)
    .easing('cubic-bezier(0.36,0.66,0.04,1)')
    .beforeStyles({ display: 'block' })   // <--- importante: assicura visibilità
    .fromTo('opacity', 0, 1)
    .fromTo('transform', 'scale(0.9) translateY(10px)', 'scale(1) translateY(0px)')
    .fromTo('filter', 'blur(6px)', 'blur(0px)');

  let leavingAnimation;
  if (leavingEl) {
    const leavingContent = leavingEl.querySelector('#page-content') || leavingEl;
    leavingAnimation = createAnimation()
      .addElement(leavingContent)
      .duration(300)
      .easing('cubic-bezier(0.36,0.66,0.04,1)')
      .fromTo('opacity', 1, 0.4)
      .fromTo('transform', 'scale(1)', 'scale(0.95)')
      .fromTo('filter', 'blur(0px)', 'blur(4px)')
      .afterClearStyles(['opacity', 'transform', 'filter']); // <--- reset sicuro
  }

  return leavingAnimation
    ? createAnimation().addAnimation([enteringAnimation, leavingAnimation])
    : enteringAnimation;
};
