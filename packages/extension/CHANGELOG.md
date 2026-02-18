# Change Log

All notable changes to the "tailwind-prism" extension will be documented in this file.

## 0.5.1 - Bug Fixes & Improvements

- Fixed Tailwind highlighting inside comments. Classes are now skipped in `//`, `#`, `/* */`, `{/* */}`, and `<!-- -->` blocks.
- Fixed broken highlighting for complex arbitrary variants like `[&_svg:not([class*='size-'])]:size-3`.
- Reworked class token parsing to be bracket-aware, so nested `[]`, pseudo selectors, attribute selectors, and colons inside brackets are handled correctly.
- Improved `cn`, `clsx`, and `classnames` call parsing with balanced-parentheses scanning to avoid line-wide highlight failures.
- Kept normal class detection behavior unchanged while improving tokenizer reliability and performance.

## 0.5.0

- Add Cursor support
- Enable extension on first run

---

## 0.0.41

- Fix extension enable/disable flicker
- Improve install compatibility with VS Code forks (Windsurf, Cursor)
- Cursor support is rolling out soon

---

## 0.0.1

- Initial public release