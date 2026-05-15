# Fix Mobile Hover/Focus-Visible Button State Pollution

## Related Issues

- [#9](https://github.com/sosoyososo/ai-payrecord2/issues/9) 首页刷新按钮高亮残留
- [#10](https://github.com/sosoyososo/ai-payrecord2/issues/10) 编辑/删除按钮点击不稳定
- [#11](https://github.com/sosoyososo/ai-payrecord2/issues/11) 类目选择绿色高亮残留

## Root Cause

CSS `:hover` and `:focus-visible` pseudo-classes designed for desktop cause visual state pollution on mobile (Capacitor WebView):

- **`:hover`** — triggers on first tap and sticks ("sticky hover") until tapping elsewhere
- **`:focus-visible`** — triggers on quick tap or scroll-touch without generating a click event

## Solution (Approach C)

Two changes, <10 lines total:

### 1. Restrict `hover:` variant to hover-capable devices

`tailwind.config.js` — add variant plugin:

```js
function ({ addVariant }) {
  addVariant("hover", "@media (hover: hover) { &:hover }")
}
```

Desktop (mouse): hover styles work normally.
Mobile (touch): all `hover:` classes (like `hover:bg-accent`) are never applied.

Fixes: #9, #11

### 2. Suppress focus-visible ring on touch devices

`index.css` — add rule:

```css
@media (hover: none) and (pointer: coarse) {
  :focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }
}
```

Desktop (keyboard): focus-visible ring remains for accessibility.
Mobile (touch): no focus-visible ring, no accidental highlight.

Fixes: #10

### Why not Approach A (hover-only)?

#10 is a `:focus-visible` problem, not `:hover`. The `Button` component's `focus-visible:ring-2 focus-visible:ring-ring` is unaffected by hover media queries. Both issues need addressing.
