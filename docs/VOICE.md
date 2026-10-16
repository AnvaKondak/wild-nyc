# Voice: funny + cute

How Wild Neighbors talks, especially in story moments. Read with the principles in
`CLAUDE.md` (animals are someone, gentle never guilt).

## The feel

Affectionate and a little silly, like a friend pointing out the neighbors from the
stoop. The animals have personalities. We laugh *with* them, never at them.

> **The raccoon babies are coming down for dinner.** Mom goes first. The kits follow,
> one tiny paw at a time, and somebody always slips the last bit. (They're fine.
> Mostly embarrassed.)

> **A squirrel is hiding an acorn.** Dig, drop, pat-pat-pat, then a very suspicious
> look around. You saw nothing.

> **Shh, the gulls are finally asleep.** All tucked in together on the harbor, bobbing
> like bath toys. For once, nobody is yelling.

## Rules

- **Action first.** What they're doing right now, in the present tense.
- **Right now, at this time of day.** A moment answers "what are my neighbors doing right
  now?", so it's mid-action and tied to the clock: "first light", "in the middle of the
  day", "as the light goes", "tonight". Middle-of-the-day lines say "midday" or "today",
  never "lunch" or "afternoon" (that stretch runs from about 9 to 5; the label at the top
  of the card says "This morning" or "This afternoon" from the real clock). A version
  can be written for just some of a moment's times of day (`"periods": ["dusk"]`).
- **Facts are seasoning.** Half a sentence of why, at most ("so the rain soaks right
  underneath"). Full facts live on the species page. Ending on what's next is nice:
  "At first light they'll head home."
- **Words draw the picture.** The scene, the action, the expression and how many are
  shown come from the words (`src/lib/settingWords.ts`, `src/lib/mood.ts`): "two pigeons"
  draws a pair, "the sparrows" draws a few, "puffed up" draws snowflakes. Some words pull
  the scene: "circles" and "overhead" mean the sky, "piling" a pier, "paddling" water,
  "spinning" a web, "streetlights" the sidewalk, "curled up" asleep.
- **Titles** are short and punchy. **Bodies** are one to three sentences, up to about
  50 words. Detail is welcome when it makes the moment feel real and local.
- **One joke per line, at most.** A parenthetical aside is a good place for it.
- **Cute words sparingly** ("tiny", "little", "pat-pat-pat") so they keep their charm.
- **Never mocking, gross or scary.** No jokes about animals being dumb, dirty or pests.
- **True.** The fun sits on top of real behavior. If a fact is shaky, cut it.
- **"Who", not "that"**, for animals, and **"they", never "it"**: "their feathers", "until
  they give up", "That's a heron" (not "It's a heron"). "It" is fine for things: the rain, an acorn, a web.
- **No guilt, no numbers.** Kindness nudges are invitations, not chores.
- **`{place}`** becomes "near Liberty State Park" or "on your block". Use it where
  either reads naturally, at most once per moment.
- **Name the neighborhood's real spots** with `{green}`, `{water}`, `{landmark}` and
  `{street}` (Liberty State Park: "the salt marsh by the Interpretive Center", "the
  harbor", "the old train terminal", "Liberty Walk"). Unnamed spots get gentle generic
  stand-ins. Phrase it so it's true anywhere: "somewhere near {green}", "toward {water}",
  never a claim that an animal is definitely at an exact spot.
- **Sentimental is good.** Routines, families, coming home, belonging to the place.
- **Several variants per moment**, so the same scene doesn't read the same twice.
