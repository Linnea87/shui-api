// ==================================================
// Guest usernames
// ==================================================

import { randomInt } from "node:crypto";

const WORDS = [
  "unicorn",
  "otter",
  "falcon",
  "panda",
  "koala",
  "tiger",
  "dolphin",
  "fox",
  "owl",
  "penguin",
  "lynx",
  "badger",
  "raven",
  "hedgehog",
  "moose",
  "seal",
];

// Random name like "unicorn123". Lowercase letters and digits only, so it can be filtered
// with ?username= exactly like a registered name.
export const generateGuestUsername = () =>
  `${WORDS[randomInt(WORDS.length)]}${randomInt(100, 1000)}`;
