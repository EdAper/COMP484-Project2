# Shibu Pal — Dogey's GigaPet

A virtual pet game built from the course's Project 2 starter. Take care of Dogey, a Shiba Inu, by offering treats, playing, exercising, and taking naps.

## Open the project

1. Extract the ZIP. Open the **Project2** folder in VS Code.
2. Confirm that `index.html`, `style.css`, `script.js`, `images`, and `vendor` are together inside that folder.
3. Right-click `index.html` and choose **Open with Live Server**, or click **Go Live**.
4. Test the page in **Google Chrome**, as requested in the assignment. If Live Server opens a different browser, copy its local URL into Chrome.

You can also open `index.html` directly in Chrome. Live Server is recommended for consistent browser storage. No npm commands, build process, account, or internet connection are needed. Keep the `vendor` folder: it contains jQuery.

## How to play

Dogey starts at **12 pounds, 70 happiness, and 75 energy**.

| Action | Happiness | Weight | Energy | Details |
| --- | --- | --- | --- | --- |
| Treat | +8 | +1 lb | +3 | A snack and a short pet comment |
| Play | +12 | −1 lb | −12 | Requires at least 12 energy |
| Exercise | −8 | −2 lb | −18 | Requires at least 18 energy |
| Complete a nap | +5 | No change | +30 | Recovery arrives after 6 seconds |
| First hello | +10 | No change | No change | Click the pet image; bonus is available once per game |

Happiness and energy are limited to 0–100. Weight cannot fall below 0. Dogey's reactions appear on the page after button interactions. A sleeping pet asks to finish the nap before taking treats, playing, or exercising. **Wake up** cancels the nap without awarding recovery.

Clicking the pet after the first hello still gives a friendly response but adds no more bonus happiness. **Sound off / Sound on** toggles soft synthesized tones. **Start over** resets stats, history, and the first-hello bonus; it keeps the sound preference.

The controls work with a mouse, touch, or Tab followed by Enter/Space. The layout adapts to narrow screens, and animation follows the browser's reduced-motion setting.

## The two signed-up jQuery methods

### `.hasClass()`

Official documentation: <https://api.jquery.com/hasClass/>

`petIsSleeping()` checks whether the pet image container has the `is-sleeping` CSS class. The Nap button adds the class. The Treat, Play, and Exercise handlers call `canInteract()`, which uses this check to stop the action and display a sleeping-pet response. The same check helps select the mood label. This connects an actual visual state to game behavior.

### `.one()`

Official documentation: <https://api.jquery.com/one/>

`armFirstHello()` attaches a click handler to the pet image button. jQuery removes that handler after its first execution, so it gives the +10 greeting bonus once. The `firstHello` flag is saved with progress so reloading cannot give another bonus. The `firstHelloArmed` flag prevents duplicate pending handlers if Start over is pressed before the greeting is claimed. Resetting after a claimed bonus attaches a new one-time handler for the new game.

Both methods have explanatory comments next to their implementation in `script.js`. The starter's ready callback, `.click()` bindings, `.text()` updates, `pet_info` object, and core handler names remain recognizable. The local jQuery library is version **3.6.1**, replacing the starter's external 2.2.1 CDN dependency.

## Assignment requirements

| Requirement | Implementation |
| --- | --- |
| Object called `pet_info` with name, weight, and happiness | Top of `script.js`; numeric starting stats |
| Treat increases happiness and weight | `clickedTreatButton()` |
| Play increases happiness and reduces weight | `clickedPlayButton()` |
| Exercise reduces happiness and weight | `clickedExerciseButton()` |
| Values cannot go below zero | `checkWeightAndHappinessBeforeUpdating()` |
| An additional button and related behavior | Nap, energy stat, countdown, and recovery |
| Visible pet comment after button interactions | `showPetMessage()` updates the page's live status area |
| Two unique jQuery methods with explanatory comments | `.hasClass()` and `.one()` |
| Replace the provided pet image | Local `images/doge.png` |
| Readable HTML, CSS, and JavaScript with comments | Separate source files with section and behavior comments |
| Creative additions | Custom pet art, activity history, saved progress, optional sound, animations, responsive layout |

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, controls, stats, instructions, and reusable icons |
| `style.css` | Layout, colors, mobile styles, focus indicators, and animations |
| `script.js` | Pet state, action handlers, the two unique methods, storage, and sounds |
| `images/doge.png` | User-provided Doge image with transparency |
| `images/paw.png` | Local PNG paw favicon |
| `vendor/jquery.min.js` | Bundled jQuery 3.6.1 |
| `vendor/JQUERY-LICENSE.txt` | jQuery copyright and license notice |
| `ASSET_SOURCES.md` | Attribution and the image-generation prompt |

## Saved progress and limits

Stats, the first-hello flag, the sound preference, and the latest three moments save in this browser's local storage under `pocket-pal-miso-v1`. The internal save key stays the same after the rename so existing progress is preserved. Browsers, browser profiles, ports, and devices have separate storage. The game keeps working in the current tab if storage is blocked; its status label changes accordingly.

Naps run while the page is open. A reload wakes Dogey without completing a pending nap. There is no background stat decay, account system, multiplayer, or server. Sound depends on the browser's Web Audio support and is off by default.

The minified jQuery file is a third-party dependency. The editable project code is `index.html`, `style.css`, and `script.js`.

## Verification

JavaScript syntax checks, local asset and HTML structure checks, and 14 simulated interaction scenario groups passed. The interaction checks included 400 mixed button actions, stat boundaries, one-time greeting behavior, save/reload, reset during a nap, early waking, and unavailable storage.

The interaction tests executed the actual `script.js` in Node with a simulated DOM and jQuery event adapter. They do not replace testing the real jQuery library or rendering the page in Chrome. Automated Chromium rendering was blocked by the development environment, so final appearance, native keyboard activation, and audible sound still need a check in your browser.
