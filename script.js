"use strict";

// The original project object now has numeric starting values. Energy adds a
// reason to use the new Nap button; firstHello tracks the one-time greeting.
var pet_info = {
  name: "Dogey",
  weight: 12,
  happiness: 70,
  energy: 75,
  firstHello: false,
  moments: 0
};

// Like the starter, wait until the document is ready before connecting buttons.
$(function () {
  // Keep the save key stable so renaming the game preserves existing progress.
  const STORAGE_KEY = "pocket-pal-miso-v1";
  const NAP_LENGTH = 6000;
  const petStage = document.querySelector(".pet-image-container");
  const petButton = document.querySelector(".pet-art-button");
  const napLabel = document.getElementById("nap-label");
  const napDescription = document.getElementById("nap-description");
  const reactionCard = document.querySelector(".reaction-card");

  let napTimer = null;
  let napEndsAt = 0;
  let reactionTimer = null;
  let animationTimer = null;
  let firstHelloArmed = false;
  let soundEnabled = false;
  let audioContext = null;
  let storageAvailable = true;
  let moments = [];

  // Arrays let the pet respond with a little variety instead of one fixed line.
  const comments = {
    treat: ["A snack? For me? This is the best day!", "Crunch, crunch. I saved you a crumb. Maybe.", "You really understand my snack schedule."],
    play: ["Again! Again! I almost caught my own tail!", "Ball acquired. Dignity lost. Worth it.", "You, me, and a case of the zoomies!"],
    exercise: ["Whew! Those were some very big steps for little legs.", "I walked all that way. Surely there's a snack nearby?", "Workout complete. My tiny legs would like a break."],
    pet: ["Boop! You found my favorite human.", "I like our little life together.", "I'm very busy being a good dog. But I have time for you."]
  };

  restoreProgress();
  checkAndUpdatePetInfoInHtml();
  renderMoments();
  updateSoundButton();
  updateStorageNote();

  // The three starter handlers are kept and the new handlers follow the same pattern.
  $(".treat-button").click(clickedTreatButton);
  $(".play-button").click(clickedPlayButton);
  $(".exercise-button").click(clickedExerciseButton);
  $(".nap-button").click(clickedNapButton);
  $(".reset-button").click(clickedResetButton);
  $(".sound-button").click(clickedSoundButton);
  $(".pet-art-button").click(clickedPetButton);
  armFirstHello();

  // UNIQUE METHOD 1: .hasClass()
  // https://api.jquery.com/hasClass/
  // Nap adds the CSS class "is-sleeping" to the pet's container. hasClass()
  // returns a Boolean telling us whether that class is currently present.
  // Action handlers use this check to protect nap time and show a pet comment
  // rather than changing stats while Dogey is asleep. It also controls mood text.
  function petIsSleeping() {
    return $(".pet-image-container").hasClass("is-sleeping");
  }

  // UNIQUE METHOD 2: .one()
  // https://api.jquery.com/one/
  // Attach a click handler that jQuery automatically removes after its first
  // execution on this button. The first greeting gives +10 happiness, once.
  // A native button supplies mouse, touch, Enter, and Space activation as clicks.
  // Saving firstHello prevents a reload from awarding the bonus again. The
  // firstHelloArmed flag also prevents duplicate pending handlers after a reset.
  function armFirstHello() {
    if (pet_info.firstHello || firstHelloArmed) return;
    firstHelloArmed = true;
    $(".pet-art-button").one("click", function () {
      firstHelloArmed = false;
      pet_info.firstHello = true;
      pet_info.happiness += 10;
      finishAction(
        petIsSleeping() ? "Even in my dreams, I know it's you. First hello: +10 happiness!" : "Oh! My very own human! First hello: +10 happiness!",
        "Our first hello · +10 happiness",
        "hello"
      );
    });
  }

  function canInteract(energyNeeded) {
    if (petIsSleeping()) {
      showPetMessage("Shh... I'm dreaming of snacks. Let me finish my nap, or click Wake up.");
      return false;
    }
    if (pet_info.energy < energyNeeded) {
      showPetMessage("My tiny legs need a rest! A full nap will give me 30 more energy.");
      return false;
    }
    return true;
  }

  function clickedTreatButton() {
    if (!canInteract(0)) return;
    pet_info.happiness += 8;
    pet_info.weight += 1;
    pet_info.energy += 3;
    finishAction(randomComment("treat"), "Treat time · a very good snack", "treat");
  }

  function clickedPlayButton() {
    if (!canInteract(12)) return;
    pet_info.happiness += 12;
    pet_info.weight -= 1;
    pet_info.energy -= 12;
    finishAction(randomComment("play"), "Playtime · a fresh case of zoomies", "play");
  }

  function clickedExerciseButton() {
    if (!canInteract(18)) return;
    pet_info.happiness -= 8;
    pet_info.weight -= 2;
    pet_info.energy -= 18;
    finishAction(randomComment("exercise"), "A little exercise · big effort", "exercise");
  }

  // New action: a completed 6-second nap restores energy and happiness. The
  // same button can end the nap early; early waking does not award recovery.
  function clickedNapButton() {
    if (petIsSleeping()) {
      endNap(false);
      return;
    }
    petStage.classList.add("is-sleeping");
    napEndsAt = Date.now() + NAP_LENGTH;
    napLabel.textContent = "Wake up";
    napDescription.textContent = "Wake early · no recovery bonus";
    recordMoment("Nap time · dreaming of snacks");
    showPetMessage("Just six seconds of snoozing. I promise I won't snore. Much.");
    checkAndUpdatePetInfoInHtml();
    saveProgress();
    playSound("sleep");
    napTimer = window.setInterval(updateNapCountdown, 200);
    updateNapCountdown();
  }

  function updateNapCountdown() {
    const remaining = Math.max(0, Math.ceil((napEndsAt - Date.now()) / 1000));
    document.getElementById("mood-label").textContent = "Napping · " + remaining + "s";
    if (remaining === 0) endNap(true);
  }

  function endNap(completed) {
    window.clearInterval(napTimer);
    napTimer = null;
    petStage.classList.remove("is-sleeping");
    napLabel.textContent = "Nap";
    napDescription.innerHTML = "+5 happy · +30 energy<br>A 6-second snooze";
    if (completed) {
      pet_info.energy += 30;
      pet_info.happiness += 5;
      finishAction("That was a top-tier nap. +30 energy and +5 happiness. Let's do something!", "A good nap · recharged and ready", "hello");
    } else {
      finishAction("I'm up! We can nap later. I woke early, so there's no recovery bonus yet.", "An early wake-up · back to our day", "hello");
    }
  }

  function clickedPetButton() {
    // On the first click, .one() handles both the message and the bonus.
    if (!pet_info.firstHello) return;
    showPetMessage(petIsSleeping() ? "A sleepy little boop. I'll be ready to play after my nap." : randomComment("pet"));
    if (!petIsSleeping()) animatePet("hello");
    playSound("hello");
  }

  function finishAction(message, moment, animation) {
    checkAndUpdatePetInfoInHtml();
    showPetMessage(message);
    recordMoment(moment);
    saveProgress();
    if (!petIsSleeping()) animatePet(animation);
    playSound(animation);
  }

  function checkAndUpdatePetInfoInHtml() {
    checkWeightAndHappinessBeforeUpdating();
    updatePetInfoInHtml();
  }

  function checkWeightAndHappinessBeforeUpdating() {
    // Invalid saved data cannot turn a stat into NaN. The original below-zero
    // bug is fixed here, in one place, before any values reach the page.
    ["weight", "happiness", "energy"].forEach(function (key) {
      if (!Number.isFinite(pet_info[key])) pet_info[key] = 0;
      pet_info[key] = Math.round(pet_info[key]);
    });
    if (pet_info.weight < 0) pet_info.weight = 0;
    if (pet_info.happiness < 0) pet_info.happiness = 0;
    if (pet_info.energy < 0) pet_info.energy = 0;
    if (pet_info.happiness > 100) pet_info.happiness = 100;
    if (pet_info.energy > 100) pet_info.energy = 100;
  }

  function updatePetInfoInHtml() {
    $(".name").text(pet_info.name);
    $(".weight").text(pet_info.weight);
    $(".happiness").text(pet_info.happiness);
    $(".energy").text(pet_info.energy);
    $(".moment-count").text(pet_info.moments);
    document.getElementById("happiness-meter").value = pet_info.happiness;
    document.getElementById("energy-meter").value = pet_info.energy;
    document.getElementById("happiness-meter").textContent = pet_info.happiness + "%";
    document.getElementById("energy-meter").textContent = pet_info.energy + "%";
    document.getElementById("bonus-label").textContent = pet_info.firstHello ? "BEST FRIEND STATUS" : "FIRST HELLO +10";
    document.querySelector(".bonus-badge").classList.toggle("is-claimed", pet_info.firstHello);
    petButton.setAttribute("aria-label", pet_info.firstHello ? "Pet Dogey" : "Pet Dogey. Your first hello gives 10 happiness points.");
    document.getElementById("pet-hint").textContent = pet_info.firstHello ? "Always happy to see you. Click for a little boop." : "Psst... click Dogey to say hello.";

    let mood = "Feeling good";
    if (pet_info.happiness >= 85) mood = "One happy pup";
    if (pet_info.happiness < 35) mood = "Needs some love";
    if (pet_info.energy < 18) mood = "Ready for a nap";
    if (petIsSleeping()) mood = "Nap time";
    document.getElementById("mood-label").textContent = mood;
  }

  function randomComment(action) {
    const choices = comments[action];
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function showPetMessage(message) {
    // This visible live region supplies the required feedback, without alerts
    // or console messages. Text insertion also treats all comments as text.
    $(".pet-message").text(message);
    reactionCard.classList.remove("is-fresh");
    void reactionCard.offsetWidth;
    reactionCard.classList.add("is-fresh");
    window.clearTimeout(reactionTimer);
    reactionTimer = window.setTimeout(function () { reactionCard.classList.remove("is-fresh"); }, 750);
  }

  function animatePet(action) {
    petStage.dataset.action = "";
    void petStage.offsetWidth;
    petStage.dataset.action = action;
    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(function () { petStage.dataset.action = ""; }, 900);
  }

  function recordMoment(message, countMoment = true) {
    if (countMoment) pet_info.moments += 1;
    moments.unshift({ message: message, time: Date.now() });
    moments = moments.slice(0, 3);
    $(".moment-count").text(pet_info.moments);
    renderMoments();
  }

  function renderMoments() {
    const list = document.querySelector(".activity-list");
    list.replaceChildren();
    if (moments.length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-moment";
      empty.textContent = "Your story starts here. Try a treat or a first hello.";
      list.appendChild(empty);
      return;
    }
    moments.forEach(function (moment) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const time = document.createElement("time");
      const date = new Date(moment.time);
      label.textContent = moment.message;
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      item.append(label, time);
      list.appendChild(item);
    });
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pet: pet_info, moments: moments, sound: soundEnabled }));
      storageAvailable = true;
    } catch (error) {
      // Storage can be unavailable in private browsing; the game still works.
      storageAvailable = false;
    }
    updateStorageNote();
  }

  function restoreProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved || !saved.pet || typeof saved.pet !== "object") return;
      ["weight", "happiness", "energy"].forEach(function (key) {
        if (Number.isFinite(saved.pet[key])) pet_info[key] = saved.pet[key];
      });
      pet_info.firstHello = saved.pet.firstHello === true;
      pet_info.moments = Number.isSafeInteger(saved.pet.moments) ? Math.max(0, saved.pet.moments) : 0;
      soundEnabled = saved.sound === true;
      if (Array.isArray(saved.moments)) {
        moments = saved.moments.filter(function (moment) {
          return moment && typeof moment.message === "string" && Number.isFinite(moment.time) && moment.time > 0 && moment.time < 8640000000000000;
        }).slice(0, 3).map(function (moment) {
          return { message: moment.message.slice(0, 120), time: moment.time };
        });
      }
    } catch (error) {
      // Corrupt JSON and blocked storage both fall back to a playable new game.
      storageAvailable = false;
    }
  }

  function updateStorageNote() {
    document.getElementById("save-note").textContent = storageAvailable ? "Progress saved on this browser" : "Progress stays in this tab";
  }

  function clickedResetButton() {
    window.clearInterval(napTimer);
    window.clearTimeout(animationTimer);
    napTimer = null;
    petStage.classList.remove("is-sleeping");
    petStage.dataset.action = "";
    napLabel.textContent = "Nap";
    napDescription.innerHTML = "+5 happy · +30 energy<br>A 6-second snooze";
    pet_info = { name: "Dogey", weight: 12, happiness: 70, energy: 75, firstHello: false, moments: 0 };
    moments = [];
    checkAndUpdatePetInfoInHtml();
    recordMoment("A fresh start with Dogey", false);
    showPetMessage("A fresh start, same best friend. Shall we say hello again?");
    armFirstHello();
    saveProgress();
  }

  function clickedSoundButton() {
    soundEnabled = !soundEnabled;
    updateSoundButton();
    showPetMessage(soundEnabled ? "A little soundtrack for our little adventures. Sound is on!" : "A quiet kind of happy. Sound is off.");
    if (soundEnabled) playSound("hello");
    saveProgress();
  }

  function updateSoundButton() {
    document.querySelector(".sound-button").setAttribute("aria-pressed", String(soundEnabled));
    document.getElementById("sound-label").textContent = soundEnabled ? "Sound on" : "Sound off";
  }

  // Optional sounds are synthesized locally and start only after a user gesture.
  function playSound(action) {
    if (!soundEnabled) return;
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) return;
      if (!audioContext) audioContext = new AudioEngine();
      audioContext.resume().catch(function () {});
      const notes = action === "sleep" ? [330, 262] : [523.25, 659.25, 783.99];
      notes.forEach(function (frequency, index) {
        const oscillator = audioContext.createOscillator();
        const volume = audioContext.createGain();
        const start = audioContext.currentTime + index * 0.085;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0, start);
        volume.gain.linearRampToValueAtTime(0.035, start + 0.015);
        volume.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        oscillator.connect(volume);
        volume.connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.17);
        oscillator.onended = function () { oscillator.disconnect(); volume.disconnect(); };
      });
    } catch (error) {
      // A browser without usable audio can still run every game action.
    }
  }
});
