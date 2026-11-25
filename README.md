# svelte-mtcaptcha

Svelte MTCaptcha component for SvelteKit and Vite Svelte apps. [MTCaptcha](https://www.mtcaptcha.com/) protects forms against spam and automated abuse. Use it on login, registration, forgot password, comments, contact forms, and any custom form.

The component injects the MTCaptcha client scripts and renders the widget. Token checks stay on the server through `svelte-mtcaptcha/server`.

## Why MTCaptcha

- GDPR compliance
- Enterprise friendly
- Accessibility compliance
- Adaptive risk engine
- High availability around the world

Learn more at [mtcaptcha.com](https://www.mtcaptcha.com/). Integration details are in the [developer guide](https://docs.mtcaptcha.com/dev-guide-quickstart).

## Forms you can protect

- Login form protection
- Registration form protection
- Comments form protection
- Forgot password form protection
- Contact form protection
- Any custom form you want to secure

## Installation

Requires Svelte 5 or newer.

```bash
npm install svelte-mtcaptcha
```

```bash
yarn add svelte-mtcaptcha
```

Create a site key in the [MTCaptcha Admin Console](https://admin.mtcaptcha.com/) and allow your development host, including `localhost`.

## Basic usage

```svelte
<script lang="ts">
  import { MTCaptcha, type MTCaptchaState } from 'svelte-mtcaptcha';

  let token: string | null = $state(null);
  let captcha = $state<{ getVerifiedToken: () => string | null } | null>(null);

  function onVerified(state: MTCaptchaState) {
    token = state.verifiedToken;
  }
</script>

<form
  onsubmit={async (event) => {
    event.preventDefault();
    await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiedToken: captcha?.getVerifiedToken() ?? token }),
    });
  }}
>
  <MTCaptcha
    bind:this={captcha}
    sitekey="YOUR_SITE_KEY"
    action="login.submit"
    verifiedCallback={onVerified}
    verifyexpiredCallback={() => (token = null)}
    errorCallback={(state) => console.error(state.statusDesc)}
  />
  <button type="submit" disabled={!token}>Continue</button>
</form>
```

The component injects the MTCaptcha scripts once and renders a `div.mtcaptcha` anchor.

## Server verification

Keep `MTCAPTCHA_PRIVATE_KEY` on the server. Do not expose it to the browser.

```ts
import { verifyMTCaptchaToken } from 'svelte-mtcaptcha/server';

export async function POST({ request }) {
  const body = (await request.json()) as { verifiedToken?: string };
  const result = await verifyMTCaptchaToken({
    privateKey: process.env.MTCAPTCHA_PRIVATE_KEY ?? '',
    token: body.verifiedToken ?? '',
  });

  return Response.json(result, { status: result.success ? 200 : 403 });
}
```

| Option | Description |
| --- | --- |
| `privateKey` | Site private key. Required. |
| `token` | Verified token from the widget. Required. |
| `explicitAcl` | When `true`, calls `service2.mtcaptcha.com` for firewall rules that need fixed IPs. |
| `tokenExpireMiniSec` | Integer from 1 to 1200. Extends token lifetime only past the default. |
| `tokenDuplicateCallMaxCount` | Integer from 1 to 20. Allows more than one CheckToken call per token. |

Import `svelte-mtcaptcha/server` only from API routes or backend handlers. The helpers throw if they run in the browser.

## Props

The component sets `render` to `explicit` and renders the anchor when it mounts.

| Name | Config key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- | --- |
| `sitekey` | `sitekey` | `string` | Yes | — | Site key from the MTCaptcha Admin Console. |
| `id` | render queue id | `string` | No | generated | DOM id used for explicit render. |
| `className` | — | `string` | No | — | Extra class names on the anchor. The anchor always includes `mtcaptcha`. |
| `enableTestMode` | `enableTestMode` | `string` | No | — | Test key from the Admin Console, next to the private key. |
| `lang` | `lang` | `string` | No | — | Active language code, for example `en`, `fr`, or `ta`. |
| `customLangText` | `customLangText` | `MTCaptchaCustomLangText` | No | — | Label overrides keyed by language code. |
| `customAccessibilityText` | `customAccessibilityText` | `MTCaptchaCustomAccessibilityText` | No | — | Screen-reader labels keyed by language, then by `default` or a widget state. |
| `customFonts` | `customFonts` | `MTCaptchaCustomFonts` | No | — | Default font family and custom font files for the widget. |
| `customStyle` | `customStyle` | `MTCaptchaCustomStyle` | No | — | Color, font, and border overrides. |
| `theme` | `theme` | see below | No | `basic` | Preset widget theme. |
| `challengeType` | `challengeType` | `'imageonly' \| 'standard'` | No | `standard` | Use `imageonly` to force image challenges. |
| `action` | `action` | `string` | No | — | Action tag. Must match `^[a-zA-Z0-9\-_. ,]{1,30}$`. |
| `widgetSize` | `widgetSize` | `'mini' \| 'standard'` | No | `standard` | Widget size. |
| `miniFormWidth` | `miniFormWidth` | `number` | No | responsive | Mini widget width, from 265 to 600. |
| `miniFormHeight` | `miniFormHeight` | `number` | No | `45` | Mini widget height, from 42 to 55. |
| `loadAnimation` | `loadAnimation` | `boolean` | No | `true` | Set to `false` to disable the loading animation. |
| `autoFadeOuterText` | `autoFadeOuterText` | `boolean` | No | — | When `true`, outer text fades on its own. |
| `lowFrictionInvisible` | `lowFrictionInvisible` | `'force-visible' \| 'force-invisible'` | No | — | Visibility override when low-friction invisible mode is enabled. |
| `autoFormValidate` | `autoFormValidate` | `boolean` | No | — | Blocks HTML form submit until the captcha is complete. |
| `jsloadedCallback` | `jsloaded-callback` | `(state) => void` | No | — | The MTCaptcha script has loaded. |
| `renderedCallback` | `rendered-callback` | `(state) => void` | No | — | The widget was rendered. |
| `verifiedCallback` | `verified-callback` | `(state) => void` | No | — | The user is verified. `state.verifiedToken` is set. |
| `verifyexpiredCallback` | `verifyexpired-callback` | `(state) => void` | No | — | The last verified token expired. |
| `errorCallback` | `error-callback` | `(state) => void` | No | — | A widget, site key, or connection error occurred. |

`theme` accepts `basic`, `overcast`, `neowhite`, `goldbezel`, `blackmoon`, `darkruby`, `touchoforange`, `caribbean`, `woodyallen`, `chrome`, or `highcontrast`.

MTCaptcha keeps one configuration per page. Use one widget on a page.

## Component methods

Bind the component with `bind:this` to call:

| Method | Description |
| --- | --- |
| `setEnableTestMode(testKey?)` | Enables automated test mode with a test key. |
| `getConfiguration()` | Returns a copy of the captcha configuration. |
| `getStatus()` | Returns the current captcha state. |
| `getVerifiedToken()` | Returns the current verified token, or `null`. |
| `renderUI()` | Renders the widget again. |
| `resetUI()` | Resets the widget and its state. |
| `remove()` | Removes the widget. Call `renderUI()` to show it again. |
| `showMandatory()` | Shows the mandatory-field message for a custom form check. |

## Example

A login demo lives in [mtcaptcha-svelte-example](https://github.com/mtcaptcha-public/mtcaptcha-svelte-example), next to this repository.

```bash
cd ../mtcaptcha-svelte-example
npm install
```

Copy `.env.example` to `.env`, set `MTCAPTCHA_SITEKEY`, then `npm run dev`.

## Next.js / React / Vue

- Next.js: [`nextjs-mtcaptcha`](https://github.com/mtcaptcha-public/nextjs-mtcaptcha)
- React: [`react-mtcaptcha`](https://github.com/mtcaptcha-public/react-mtcaptcha)
- Vue: [`vue-mtcaptcha`](https://github.com/mtcaptcha-public/vue-mtcaptcha)

## License

MIT. See [LICENSE](https://github.com/mtcaptcha-public/svelte-mtcaptcha/blob/main/LICENSE).

## Support

Issues and feature requests: [GitHub issue tracker](https://github.com/mtcaptcha-public/svelte-mtcaptcha/issues).
