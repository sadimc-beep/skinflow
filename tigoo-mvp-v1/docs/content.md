# Content Engineering: Tigoo MVP

## 1. Content Entities & Schema Definitions

The content is structured hierarchically: `Course` -> `Unit` -> `Lesson` -> `Exercise`.

### Core Schemas

#### Unit
Grouping of lessons under a theme.
```json
{
  "id": "string (UNIT_001)",
  "title": "string (e.g., 'Jungle Safari')",
  "description": "string",
  "order": "integer",
  "theme": "string (color/asset_theme_id)",
  "cover_image_url": "string",
  "lessons": ["LESSON_001", "LESSON_002"] // Array of Lesson IDs
}
```

#### Lesson
A single learning session (approx. 5-10 mins).
```json
{
  "id": "string (LESSON_001)",
  "unit_id": "string (UNIT_001)",
  "title": "string",
  "order": "integer",
  "type": "enum ('CORE', 'PRACTICE', 'STORY')",
  "exercise_ids": ["EX_001", "EX_002", "EX_003"],
  "rewards": {
    "stars": "integer",
    "sticker_id": "string (optional)"
  },
  "out_of_scope": ["OCR", "Handwriting Recognition", "AI Scoring"] // Explicit exclusion
}

```

#### Exercise (Base)
A discrete interactive task.
```json
{
  "id": "string (EX_001)",
  "lesson_id": "string (LESSON_001)",
  "type": "enum (LISTEN_CHOOSE, PICTURE_WORD_MATCH, BUILD_WORD, FILL_BLANK, REORDER_WORDS, DICTATION_CHOOSE, TRACE, FREEHAND_SANDBOX, READ_ALONG)",
  "instruction_text": "string (Audio instruction URL optional)",
  "instruction_audio_url": "string (optional)",
  "data": "object (Polymorphic, see Section 2)"
}
```

---

## 2. Exercise JSON Templates (Per Type)

### Type: `LISTEN_CHOOSE`
User hears a sound/word and selects the correct image/text.
```json
{
  "audio_url": "path/to/audio.mp3",
  "options": [
    { "id": "opt_1", "text": "Lion", "image_url": "path/lion.png" },
    { "id": "opt_2", "text": "Bear", "image_url": "path/bear.png" }
  ],
  "correct_option_id": "opt_1"
}
```

### Type: `PICTURE_WORD_MATCH`
Drag and drop or tap pairs.
```json
{
  "pairs": [
    { "id": "p1", "image_url": "path/apple.png", "text": "Apple" },
    { "id": "p2", "image_url": "path/banana.png", "text": "Banana" }
  ],
  "distractors": [] // Optional extra non-matching items
}
```

### Type: `BUILD_WORD`
Assemble a word from letters.
```json
{
  "target_word": "CAT",
  "image_url": "path/cat.png",
  "scrambled_letters": ["A", "T", "C"], // Or random distractors added
  "audio_url": "path/cat_speak.mp3"
}
```

### Type: `FILL_BLANK`
Complete the sentence.
```json
{
  "sentence_template": " The ___ is red.",
  "correct_word": "apple",
  "options": ["apple", "sky", "grass"],
  "image_context_url": "path/red_apple.png"
}
```

### Type: `REORDER_WORDS`
Arrange words to form a sentence.
```json
{
  "scrambled_parts": ["is", "This", "a", "cat"],
  "correct_order": ["This", "is", "a", "cat"]
}
```

### Type: `DICTATION_CHOOSE`
Listen to a word and choose the correct spelling/word.
```json
{
  "audio_url": "path/dictation_dog.mp3",
  "options": ["Dog", "Bog", "Log"],
  "correct_option": "Dog"
}
```

### Type: `TRACE`
Stroke order constrained writing. 
**Constraint**: Deterministic path-following only. No handwriting recognition or shape classification.
```json
{
  "template_id": "trace_letter_A",
  "canvas_bg_url": "path/trace_bg_A.png",
  "strokes": [
    {
      "id": "s1",
      "path_points": [[0,100], [50,0]], // Simplified coord system
      "order": 1,
      "direction_hint_url": "path/arrow_up.png"
    },
    {
      "id": "s2",
      "path_points": [[50,0], [100,100]],
      "order": 2
    }
  ],
  "tolerance": 0.5, // Sensitivity for path deviation check
  "strict_mode": true // Enforces stroke order
}
```

### Type: `FREEHAND_SANDBOX`
Open drawing area (no validation).
```json
{
  "background_url": "path/coloring_page.png",
  "tools_allowed": ["brush", "eraser", "color_picker"]
}
```

### Type: `READ_ALONG`
Karaoke style reading.
```json
{
  "text_content": "The cat sat on the mat.",
  "audio_url": "path/story_audio.mp3",
  "timestamps": [
    { "word": "The", "start": 0.0, "end": 0.5 },
    { "word": "cat", "start": 0.5, "end": 1.0 }
  ]
}
```

---

## 3. Minimal Seed Dataset (Example)

### Unit 1: "Jungle Safari"
*   **ID**: `UNIT_THEME_JUNGLE`
*   **Cover**: `assets/units/jungle_cover.png`

### Lesson 1: "Meet the Big Cats"
*   **ID**: `LESSON_JUNGLE_01`
*   **Unit**: `UNIT_THEME_JUNGLE`

#### Exercise 1: Identify the Lion (LISTEN_CHOOSE)
`EX_JUNGLE_01_01`
```json
{
  "type": "LISTEN_CHOOSE",
  "instruction_text": "Listen and tap the Lion.",
  "instruction_audio_url": "assets/audio/instr_tap_lion.mp3",
  "data": {
    "audio_url": "assets/audio/word_lion.mp3",
    "correct_option_id": "opt_lion",
    "options": [
      { "id": "opt_lion", "image_url": "assets/img/lion.png", "text": "Lion" },
      { "id": "opt_monkey", "image_url": "assets/img/monkey.png", "text": "Monkey" }
    ]
  }
}
```

#### Exercise 2: Match Picture to Word (PICTURE_WORD_MATCH)
`EX_JUNGLE_01_02`
```json
{
  "type": "PICTURE_WORD_MATCH",
  "instruction_text": "Match the animal to its name.",
  "data": {
    "pairs": [
      { "id": "p1", "image_url": "assets/img/tiger.png", "text": "Tiger" },
      { "id": "p2", "image_url": "assets/img/bear.png", "text": "Bear" }
    ]
  }
}
```

#### Exercise 3: Trace Letter L (TRACE)
`EX_JUNGLE_01_03`
```json
{
  "type": "TRACE",
  "instruction_text": "Let's write lines for Lion!",
  "data": {
    "template_id": "shape_L",
    "strokes": [
      { "order": 1, "start": [10, 10], "end": [10, 90] }, // Down
      { "order": 2, "start": [10, 90], "end": [50, 90] }  // Across
    ]
  }
}
```

---

## 4. Content Authoring Rules (for Scaling to 300 lessons)
1.  **Immutability**: Once an Exercise ID is published and user progress is attached to it, it should not change type or logic to avoid breaking progress stats.
2.  **Asset Naming**: `category_item_variant.ext` (e.g., `animals_lion_cartoon.png`, `audio_word_lion.mp3`).
3.  **Localization Ready**: All display text must be separated from logic (referenced via string keys if possible, though strict JSON is defined here for MVP).
4.  **Granularity**: 1 Lesson = 3-5 Exercises max to keep attention span (Age 4-8).
5.  **Validation**: All trace paths must be normalized to a 100x100 or 1000x1000 coordinate system.

---

## 5. Implementation Tasks for Orchestrator

### Phase 1: Data Layer
1.  [ ] Create TypeScript interfaces matching these JSON schemas (`Unit`, `Lesson`, `Exercise`, `ExerciseTypes`).
2.  [ ] Setup local JSON file loader or Firestore seeder script using this seed data.
3.  [ ] Create an `AssetRegistry` mapping logical IDs to `require()` paths (for local assets) or URLs (remote).

### Phase 2: Content Rendering logic
4.  [ ] Implement a `LessonEngine` that takes a `LessonID`, fetches exercises, and manages the queue.
5.  [ ] Create specific React Native components for each Exercise Type (`ListenChooseComponent`, `TraceComponent`, etc.).
6.  [ ] Implement the `RewardSystem` logic (trigger on Lesson complete).

### Phase 3: Tools
7.  [ ] (Optional) Create a simple validator script to ensure referenced assets exist in the project for all JSON entries.
