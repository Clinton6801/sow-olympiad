# Design System — Seat of Wisdom Math Olympiad

## Color Tokens

| Name | Hex | Use |
|------|-----|-----|
| Ink Navy | #14213D | Headers, dark surfaces, admin/host areas |
| Graph Paper | #F5F7FB | Main background |
| Marigold | #F4A73B | Achievement accents, certificates, Grand Maths Master League tier |
| Coral Flare | #FF6B5B | Energy accents, Sprint Round, live/active indicators |
| Leaf Green | #4CAF7D | Correct answers, success states, Little Maths Sprout tier |

### Section Tier Colors

| Section | Hex | Icon |
|---------|-----|------|
| Little Maths Sprout | #4CAF7D | Seedling |
| Rising Maths Explorers | #3FA79A | Compass |
| Clever Calculators | #3E8FC4 | Calculator |
| Elite Problem Solvers | #6C4EE3 | Puzzle |
| Algebra Warriors | #C2478C | Sword |
| Grand Maths Master League | #F4A73B | Trophy |

## Typography

| Role | Font | Use |
|------|------|-----|
| Display | Space Grotesk (geometric sans) | Headlines, scores as design elements |
| Body | Inter (humanist sans) | All body copy |
| Mono | IBM Plex Mono | Timers, live scores, room codes |

## Background Patterns (5 Math-Themed)

### 1. Graph Paper
- Fine repeating grid lines (light gray on white)
- Used: Grid Round screens, general admin areas

### 2. Dot Grid
- Evenly spaced dots (light gray on white)
- Used: Section picker/dashboard chrome, practice selector

### 3. Coordinate Plane
- Axes with tick marks, plotted curve
- Used: Algebra Warriors, Grand Maths Master League sections

### 4. Number Line
- Horizontal line with tick marks, marked point
- Used: Speed Sprint round header

### 5. Geometric Shapes
- Scattered outlined circles, triangles, squares (light gray on white)
- Used: Little Maths Sprout through Clever Calculators sections

**Hero Animation:**
Homepage hero cycles through all 5 patterns continuously, crossfading every 4.5 seconds, always in sequential order. If user has `prefers-reduced-motion` enabled, pause on first pattern (Graph Paper).

## Component Specifications

### Logo Lockup
- **Monogram:** Circular badge
  - Fill: Navy (#14213D)
  - Ring border: Marigold (#F4A73B)
  - Inner text: "SW" in Marigold, bold, geometric sans
  - Size: ~60px diameter
- **Wordmark:** Two-line text next to monogram
  - Line 1: "Seat of Wisdom" (Display, semibold)
  - Line 2: "Math Olympiad" (Display, regular)
  - Color: Navy (#14213D)
- **Implementation:** Easily swappable component; design as image slot for future school logo replacement

### Header
- Fixed or sticky at top
- Left: Logo lockup
- Right: "Join room" + "Admin" nav actions (buttons or links)
- Background: White or Graph Paper (#F5F7FB)
- Mobile: Stacked or hamburger menu if needed

### Hero Section
- **Background:** Cycles through 5 patterns (see Background Patterns)
- **Height:** ~50–60vh on desktop, ~40vh on mobile
- **Headline:** "From your first sprout to a legend of numbers." (Display, large, Ink Navy)
- **Subheading:** One-line tagline (Body, regular, Ink Navy or softer gray)
- **Level-up Path:** Winding line connecting 6 nodes (section-colored), animated in on page load
  - Each node clickable → jumps to section card
  - Nodes: Seedling → Compass → Calculator → Puzzle → Sword → Trophy
  - Animation: Draws in from left to right (or similar smooth reveal)
  - Respect prefers-reduced-motion: animate from opacity 0 to 1 over 1s, or just appear instantly
- **CTAs:** Two buttons
  - "Start practicing" (primary, leads to `/practice`)
  - "Enter competition room" (secondary, leads to `/join`)

### Section Card
- **Layout:** 6-card grid (2 cols on mobile, 3 cols on tablet, 6 cols on desktop)
- **Content per card:**
  - Top accent bar (tier color, ~4px height)
  - Icon (48px, tier color, centered)
  - Section name (Display, semibold, Ink Navy)
  - Grade range (Body, small, gray)
- **Interaction:** Clickable → navigate to `/practice?section=[id]`
- **Hover state:** Subtle scale (1.02–1.05) or shadow lift
- **Focus state:** Visible focus ring (e.g. 2px outline in Marigold)
- **Grand Maths Master League card:** Slightly larger (visual emphasis as culmination)

### Round Type Selector
- **Context:** Practice Mode, after section is selected
- **Layout:** 3-card grid (1 col on mobile, 3 cols on desktop)
- **Cards:**
  1. **Grid Round**
     - Icon: Grid pattern
     - Title: "Grid round"
     - Description: "Race to claim cells on a shared grid"
     - Color accent: Deep Violet (#6C4EE3)
  2. **Tiered Difficulty**
     - Icon: Ascending bars
     - Title: "Tiered round"
     - Description: "Easy, medium, hard questions with increasing points"
     - Color accent: Marigold (#F4A73B)
  3. **Speed Sprint**
     - Icon: Lightning bolt or speedometer
     - Title: "Speed sprint"
     - Description: "Answer as many as you can in 3 minutes"
     - Color accent: Coral Flare (#FF6B5B)
- **Interaction:** Clickable → navigate to round with section context
- **Hover state:** Scale + shadow
- **Focus state:** Visible focus ring

### Question Card / Round UI
- **Background:** Section-specific pattern (see Background Patterns usage)
- **Question display:** Body copy, Ink Navy
- **Answer options (MCQ):**
  - 4 buttons, labeled A/B/C/D
  - Unselected: white bg, Ink Navy text, subtle border
  - Hover: light fill (section tier color at low opacity)
  - Selected (before submit): section tier color fill, white text
  - After submit (correct): Leaf Green (#4CAF7D) fill, white text, checkmark icon
  - After submit (incorrect): Coral Flare (#FF6B5B) fill, white text, X icon
- **Numeric input:**
  - Single input field, monospace font
  - Same feedback colors after submit
- **Navigation:** "Next" button (disabled until answer submitted)
- **Timer (if applicable):** Monospace font, Ink Navy, top-right
- **Question counter:** "X of Y" (Body, small)

### Grid Round Specific
- **Background:** Graph Paper pattern
- **Grid layout:** 5×5 cells in CSS Grid
- **Cell states:**
  - Empty (unclaimed): light gray border, transparent fill
  - Claimed by current student: section tier color fill, white text/badge showing student name
  - Claimed by other student: lighter shade of that student's section color, read-only
- **Claim animation:** Cell expands slightly (scale 1 → 1.1) and color fills in ~200ms (ease-out)
- **Tap/click to answer:** Cell opens a modal or overlay with the question + MCQ/numeric input

### Live Leaderboard
- **Background:** Dot Grid pattern or white
- **Layout:** Vertical list or table (top 3 highlighted separately)
- **Top 3 styling:**
  - Rank 1 (gold): Gold text + gold icon (🏆), Monospace score
  - Rank 2 (silver): Silver text + silver icon (🥈), Monospace score
  - Rank 3 (bronze): Bronze text + bronze icon (🥉), Monospace score
  - Remaining ranks: Ink Navy text, regular font weight, Monospace score
- **Scores animate:** Counting up from previous score over ~1s (ease-out), not jump
- **Mobile:** Scrollable if long list
- **Update frequency:** Real-time via Supabase Realtime subscription

### Certificate (PNG Image)
- **Canvas size:** 1200×800px (landscape, typical for printing)
- **Background:** White with subtle geometric pattern (optional, light gray)
- **Border:** 16px solid Navy (#14213D) on all sides
- **Seal area:** Top-right corner, circular gold badge (~100px diameter) with "SW" monogram
- **Content (centered):**
  - "Certificate of Achievement" (Display, 36px, Ink Navy)
  - "This certifies that" (Body, 18px, Ink Navy)
  - **Recipient name** (Display, 28px bold, Ink Navy)
  - "has successfully completed" (Body, 16px)
  - **Round type** (e.g. "Grid Round") (Body, 16px)
  - "in the" (Body, 16px)
  - **Section name** (Body, 16px bold, section tier color)
  - "Score: **X/Y**" (Mono, 20px, Ink Navy)
  - "Date: **DD Mon YYYY**" (Mono, 16px, Ink Navy)
- **Bottom:** Subtle footer line (1px Marigold) ~20px from bottom
- **Font rendering:** Anti-aliased, readable at 72 DPI (print quality)

## Responsive Breakpoints

- **Mobile:** 320px–480px (smallest phones → small phones)
- **Tablet:** 481px–768px
- **Desktop:** 769px+

## Motion & Accessibility

### Motion Guidelines
- **Hero reveal:** One orchestrated animation on page load (level-up path draws in, patterns cycle start)
- **Micro-interactions:** Hover (scale, shadow lift), press (slight scale-down + color shift), focus (focus ring)
- **Avoid:** Scattered animations, parallax, auto-playing video, infinite loops
- **Respect `prefers-reduced-motion`:** Replace all animations with instant transitions (0s duration) or reduced opacity changes

### Focus States
- **All interactive elements:** Visible 2–3px focus ring (use Marigold or Ink Navy depending on background)
- **Keyboard navigation:** Tab order logical, skip-to-main-content link (optional but recommended)
- **Touch targets:** Minimum 44×44px

### Copy Guidelines
- **Tone:** Friendly, encouraging, clear
- **Case:** Sentence case everywhere (no ALL CAPS titles)
- **Punctuation:** No exclamation marks in system copy (buttons, status messages)
- **Example:** "Start practicing" not "START PRACTICING!" or "Start Practicing"

## Tailwind CSS Custom Config

```javascript
module.exports = {
  theme: {
    colors: {
      'ink-navy': '#14213D',
      'graph-paper': '#F5F7FB',
      'marigold': '#F4A73B',
      'coral-flare': '#FF6B5B',
      'leaf-green': '#4CAF7D',
      'deep-violet': '#6C4EE3',
      // Section tier colors
      'sprout-green': '#4CAF7D',
      'explorer-teal': '#3FA79A',
      'calculator-blue': '#3E8FC4',
      'problem-violet': '#6C4EE3',
      'algebra-magenta': '#C2478C',
      'master-gold': '#F4A73B',
    },
    fontFamily: {
      'display': ['Space Grotesk', 'sans-serif'],
      'body': ['Inter', 'sans-serif'],
      'mono': ['IBM Plex Mono', 'monospace'],
    },
  },
};
```

## Future Polish

- Custom SVG icons for each section (seedling, compass, calculator, etc.)
- Subtle sound effects (optional, respect `prefers-reduced-motion`)
- Dark mode support (optional)
