---
name: Sabi
description: Your FUTA guide. A dark, offline-first campus guide: the FUTA gate at night, crimson-outlined cards, one gold accent and one handwritten line per screen, with every fact tied to who said so.
colors:
  bg: "#0a0309"
  card: "#1b0714"
  tabbar: "#240414"
  outline: "#8c1c3c"
  gold: "#fcc13c"
  maroon: "#7a142c"
  green: "#08c276"
  red: "#fc344c"
  indigo: "#4a36d8"
  amber: "#ff9f43"
  text: "#fff9f6"
  muted: "#c3b2b9"
typography:
  display:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.08
  title:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Poppins, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  hand:
    fontFamily: "Yellowtail, cursive"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.05
rounded:
  sm: "10px"
  md: "16px"
  card: "22px"
  sheet: "28px"
  pill: "999px"
components:
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    border: "1.5px solid {colors.outline}"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "#1a0a05"
    rounded: "{rounded.pill}"
    height: "56px"
  tabbar:
    backgroundColor: "{colors.tabbar}"
    rounded: "{rounded.pill}"
    active: "{colors.gold}"
---

# Sabi design system

Exact values are in [TOKENS.md](TOKENS.md) and [tokens.css](tokens.css); the pieces are in [COMPONENTS.md](COMPONENTS.md); each screen is in [SCREENS.md](SCREENS.md). This file says how they are used. The system comes from the approved mockups: where this differs from them it is in the fix list in the [README](README.md).

## Overview

Sabi is a dark app: the FUTA gate at night, a near-black maroon page, cards with a crimson outline, **one gold accent** and **one handwritten line per screen**. Every screen starts with a hero (a photo from the optional photo pack, or a drawn scene when there is no photo) and ends with the same footer and a floating five-tab bar. The voice is a senior student who knows every shortcut, in light Pidgin; **the facts stay exact** ([COPY.md](COPY.md)).

Mode: operate. A student is doing a task; the expression lives in the hero, the handwriting and the photos, and the controls stay standard.

## Colour

- **Page and cards.** `bg #0a0309`, `card #1b0714`, with a crimson outline `#8c1c3c` (1.5px). One card per screen may be **gold-outlined**: the one that matters (the next class, the first notice).
- **Gold `#fcc13c`** is the one accent: the current tab, the primary button, the handwritten line, "current" things (the next class, a filter that is on).
- **Maroon `#7a142c`** is the Welcome start button and a switch that is on. It is not a second primary.
- **Status and scope.** Green: Verified and done. Red: errors and delete. Amber: may be outdated. Scopes: University gold, SUG red, School green, Department indigo. Meaning never rests on colour alone: each carries a word and an icon.
- **Photos** get the night treatment (darkened) and always sit under a scrim where text lands (72% or more, measured). Text over a photo is checked against the worst pixel.

## Typography

Poppins for everything (400, 600, 700), as in the mockups; Yellowtail for the handwritten line only (and **one per screen**, the hero kicker). Sizes are in rem and scale with the user's text size to 200%. Smallest text is 14px, except the five tab labels (12px, a label). Numbers use tabular figures.

## Layout

A 560px column on a phone-shaped page, 16px gutters. Hero first (tall on Home and Welcome, standard on the main tabs, plain with a Back bar on detail and admin screens), then cards, then the footer, then the tab bar. Cards in grids: two columns on a phone, more as width allows; nothing scrolls sideways except the Home photo rail and the filter chips.

## Depth and shape

Pills for controls, chips and the tab bar; 22px cards; 28px sheets; 16px fields. Shadows are soft and offset; the only glow is the countdown badge's gold ring. The tab bar floats (a pill), and so does the profile sheet from the bottom. No card inside a card.

## Motion

Calm and meaningful: a ring fills, a day's cards fade in, the page crossfades. One entrance per screen, once per session. The map's "you are here" pulse and the loading skeleton run only while on screen. **Reduced motion** removes all movement and keeps the state; **Lite mode** also removes blur, photos and decoration.

## Components

See [COMPONENTS.md](COMPONENTS.md): Hero, Tab bar, Profile sheet, Footer, Card, Notice card, Place and school cards, Class card, Buttons, Fields, Search, Filter chips, Segmented control, Switch, Countdown badge, Progress ring, Seals, Chips, Avatar, Map, States, Logo, Scenes.

## Do's and don'ts

### Do
- Put the scrim under every line of text that sits on a photo.
- Show where a fact came from: a source on every notice and a seal on every record.
- Say "Verified" only for a record an admin verified.
- Keep every target 44px or more, every focus ring visible, and every state designed: loading, empty, error, offline.

### Don't
- No faces: lecturers get initials, the drawn students are original characters.
- No invented facts: names that are not on a sign or in OpenStreetMap say "(sample)".
- No more than one handwritten line on a screen; no gradient on text; no emoji as icons; no card in a card.
- No satellite imagery, no routing, no walking times.
- No photo on first load, none in Lite mode, nothing over 60 KB.
