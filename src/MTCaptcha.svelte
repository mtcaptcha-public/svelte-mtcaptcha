<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { dequeueRender, enqueueRender, ensureClientConfig } from './client-config';
  import { assignMTCaptchaProps, validateMTCaptchaProps } from './config';
  import { bindDispatchers, subscribe } from './listeners';
  import { ensureMTCaptchaScripts } from './scripts';
  import type {
    MTCaptchaChallengeType,
    MTCaptchaCustomAccessibilityText,
    MTCaptchaCustomFonts,
    MTCaptchaCustomLangText,
    MTCaptchaCustomStyle,
    MTCaptchaLowFrictionInvisible,
    MTCaptchaProps,
    MTCaptchaState,
    MTCaptchaTheme,
    MTCaptchaWidgetSize,
  } from './types';

  let {
    sitekey,
    id,
    className = '',
    enableTestMode,
    lang,
    customLangText,
    customAccessibilityText,
    customFonts,
    customStyle,
    theme,
    challengeType,
    action,
    widgetSize,
    miniFormWidth,
    miniFormHeight,
    loadAnimation,
    autoFadeOuterText,
    lowFrictionInvisible,
    autoFormValidate,
    jsloadedCallback,
    renderedCallback,
    verifiedCallback,
    verifyexpiredCallback,
    errorCallback,
  }: {
    sitekey: string;
    id?: string;
    className?: string;
    enableTestMode?: string;
    lang?: string;
    customLangText?: MTCaptchaCustomLangText;
    customAccessibilityText?: MTCaptchaCustomAccessibilityText;
    customFonts?: MTCaptchaCustomFonts;
    customStyle?: MTCaptchaCustomStyle;
    theme?: MTCaptchaTheme;
    challengeType?: MTCaptchaChallengeType;
    action?: string;
    widgetSize?: MTCaptchaWidgetSize;
    miniFormWidth?: number;
    miniFormHeight?: number;
    loadAnimation?: boolean;
    autoFadeOuterText?: boolean;
    lowFrictionInvisible?: MTCaptchaLowFrictionInvisible;
    autoFormValidate?: boolean;
    jsloadedCallback?: (state: MTCaptchaState) => void;
    renderedCallback?: (state: MTCaptchaState) => void;
    verifiedCallback?: (state: MTCaptchaState) => void;
    verifyexpiredCallback?: (state: MTCaptchaState) => void;
    errorCallback?: (state: MTCaptchaState) => void;
  } = $props();

  let uid = Math.random().toString(36).slice(2, 10);
  let domId = $derived(id || `mtcaptcha-${uid}`);
  let anchorClassName = $derived(className ? `mtcaptcha ${className}` : 'mtcaptcha');

  function currentProps(): MTCaptchaProps {
    return {
      sitekey,
      id,
      className,
      enableTestMode,
      lang,
      customLangText,
      customAccessibilityText,
      customFonts,
      customStyle,
      theme,
      challengeType,
      action,
      widgetSize,
      miniFormWidth,
      miniFormHeight,
      loadAnimation,
      autoFadeOuterText,
      lowFrictionInvisible,
      autoFormValidate,
      jsloadedCallback,
      renderedCallback,
      verifiedCallback,
      verifyexpiredCallback,
      errorCallback,
    };
  }

  let skipPropRender = true;
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  function scriptFailure(currentDomId: string): MTCaptchaState {
    return {
      element: typeof document === 'undefined' ? null : document.getElementById(currentDomId),
      domID: currentDomId,
      statusCode: 0,
      verifiedToken: null,
      isVerified: false,
      isVisible: false,
      statusDesc: 'Failed to load the MTCaptcha client script.',
    };
  }

  export function setEnableTestMode(testKey?: string) {
    window.mtcaptcha?.enableTestMode(testKey);
  }

  export function getConfiguration() {
    return window.mtcaptcha?.getConfiguration();
  }

  export function getStatus() {
    return window.mtcaptcha?.getStatus();
  }

  export function getVerifiedToken(): string | null {
    return window.mtcaptcha?.getVerifiedToken() ?? null;
  }

  export function renderUI() {
    window.mtcaptcha?.renderUI();
  }

  export function resetUI() {
    window.mtcaptcha?.resetUI();
  }

  export function remove() {
    window.mtcaptcha?.remove();
  }

  export function showMandatory() {
    window.mtcaptcha?.showMandatory();
  }

  $effect.pre(() => {
    const props = currentProps();
    const validationError = validateMTCaptchaProps(props);
    if (validationError) {
      throw new Error(validationError);
    }
    if (typeof window !== 'undefined') {
      const config = ensureClientConfig();
      assignMTCaptchaProps(config, props);
      bindDispatchers(config);
    }
  });

  onMount(() => {
    cancelled = false;
    const props = currentProps();
    if (validateMTCaptchaProps(props)) return;

    const config = ensureClientConfig();
    assignMTCaptchaProps(config, props);
    bindDispatchers(config);

    const mountedDomId = domId;
    unsubscribe = subscribe(mountedDomId, {
      jsloaded: (state) => currentProps().jsloadedCallback?.(state),
      rendered: (state) => currentProps().renderedCallback?.(state),
      verified: (state) => currentProps().verifiedCallback?.(state),
      verifyexpired: (state) => currentProps().verifyexpiredCallback?.(state),
      error: (state) => currentProps().errorCallback?.(state),
    });
    enqueueRender(mountedDomId);

    ensureMTCaptchaScripts().catch(() => {
      if (!cancelled) {
        currentProps().errorCallback?.(scriptFailure(mountedDomId));
      }
    });
  });

  $effect(() => {
    const props = currentProps();
    const validationError = validateMTCaptchaProps(props);
    if (validationError) return;

    const config = ensureClientConfig();
    assignMTCaptchaProps(config, props);

    // Track config fields that should trigger a re-render.
    void sitekey;
    void enableTestMode;
    void lang;
    void customLangText;
    void customAccessibilityText;
    void customFonts;
    void customStyle;
    void theme;
    void challengeType;
    void action;
    void widgetSize;
    void miniFormWidth;
    void miniFormHeight;
    void loadAnimation;
    void autoFadeOuterText;
    void lowFrictionInvisible;
    void autoFormValidate;
    void domId;

    if (skipPropRender) {
      skipPropRender = false;
      return;
    }

    try {
      window.mtcaptcha?.renderUI();
    } catch (error) {
      console.error('MTCaptcha failed to render the widget', error);
    }
  });

  onDestroy(() => {
    cancelled = true;
    unsubscribe?.();
    dequeueRender(domId);
    try {
      window.mtcaptcha?.remove();
    } catch (error) {
      console.error('MTCaptcha failed to remove the widget', error);
    }
  });
</script>

<div id={domId} class={anchorClassName}></div>
