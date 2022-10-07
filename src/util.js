const fs = require("fs");
require.extensions[".graphql"] = (module, filename) => {
  module.exports = fs.readFileSync(filename, "utf8");
};
const TurndownService = require("turndown");
const turndownService = new TurndownService();
const config = require("../config");
const discord = require("discord.js");
const fetch = require("node-fetch");
const striptags = require("striptags");
const mediaQuery = require("./query/media_query.graphql");
const characterQuery = require("./query/character_query.graphql");

export function getSearch(text) {
  const number = parseInt(text);
  return number ? number : text;
}

export function sanitizeDescription(raw, media, character) {
  raw = striptags(raw)
    .replace(/([\n\r])+/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/img.*?\(.*?\)/g, "");

  if ((media, character)) raw = raw.substring(0, config.maxLength);
  return raw.trim();
}

const shorten = (str) => {
  const markdown = turndownService.turndown(str);
  if (markdown.length > 300) {
    return markdown.substring(0, 300).concat("......");
  } else {
    return markdown;
  }
};

const charShorten = (str) => {
  const markdown = turndownService.turndown(str);
  if (markdown.length > 400) {
    return markdown.substring(0, 400).concat("......");
  } else {
    return markdown;
  }
};

export function handleCharacter(type, contents, channel) {
  const variables = { type };
  const search = getSearch(contents);
  if (typeof search === "string") variables.search = search;
  else variables.id = search;

  return queryAL(characterQuery, variables)
    .then((res) => res.Character)
    .then((character) => {
      const embed = new discord.MessageEmbed();
      embed.setAuthor(
        character.name.full,
        "https://anilist.co/img/logo_al.png",
        character.url
      );
      embed.setThumbnail(character.image.large);
      embed.setDescription(charShorten(character.description));
      channel.send(embed);
    });
}

export function handleMedia(type, contents, channel) {
  const variables = { type };
  const search = getSearch(contents);
  if (typeof search === "string") variables.search = search;
  else variables.id = search;

  return queryAL(mediaQuery, variables)
    .then((res) => res.Media)
    .then((media) => {
      if (media.isAdult === true) return;
      const embed = new discord.MessageEmbed();
      if (media.title.english !== null)
        embed.setAuthor(
          media.title.english,
          "https://anilist.co/img/logo_al.png",
          media.url
        );
      else
        embed.setAuthor(
          media.title.romaji,
          "https://anilist.co/img/logo_al.png",
          media.url
        );
      embed.setDescription(shorten(sanitizeDescription(media.description)));
      embed.setThumbnail(media.image.extraLarge);
      embed.setColor(media.image.color || 4044018);
      embed.setFooter(getFooterText(media));

      channel.send(embed);
    });

  function getFooterText(media) {
    switch (type) {
      case "MANGA": {
        let ret = displayify(media.format);
        if (media.status === "NOT_YET_RELEASED")
          media.status = "Not Yet Released";

        if (media.format === "MANGA" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "MANGA" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "MANGA")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "NOVEL" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "NOVEL" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "NOVEL")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "ONE_SHOT" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "ONE_SHOT" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "ONE_SHOT")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        return ret;
      }
      case "ANIME": {
        let ret = displayify(media.format);
        if (media.status === "NOT_YET_RELEASED")
          media.status = "Not Yet Released";

        if (media.format === "TV" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "TV" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "TV")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "TV_SHORT" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "TV_SHORT" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "TV_SHORT")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "MOVIE" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "MOVIE" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "MOVIE")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "SPECIAL" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "SPECIAL" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "SPECIAL")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "OVA" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "OVA" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "OVA")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "ONA" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "ONA" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "ONA")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.format === "MUSIC" && media.status === "Not Yet Released")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${media.popularity} people like this • ${media.countryOfOrigin}`
          );
        else if (media.format === "MUSIC" && media.rankings[0])
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • #${
              media.rankings[0].rank + " " + media.rankings[0].context
            } • ${media.countryOfOrigin}`
          );
        else if (media.format === "MUSIC")
          ret = createOrAppend(
            ret,
            "•",
            `${media.status} • ${
              media.popularity + " " + "people like this"
            } • ${media.countryOfOrigin}`
          );

        if (media.airingSchedule && media.airingSchedule.nodes.length > 0) {
          const next = media.airingSchedule.nodes[0];
          ret = createOrAppend(
            ret,
            "•",
            `${formatTime(next.timeUntilAiring)} until episode ${next.episode}`
          );
        }
        return ret;
      }
      default:
        return "";
    }
  }
}

function displayify(enumVal) {
  const words = enumVal.split("_");
  for (let i = 0; i < words.length; i++)
    words[i] = words[i].substr(0, 1) + words[i].toLowerCase().substr(1);

  return words.join(" ");
}

export function parseTime(secs) {
  let seconds = parseInt(secs, 10);

  let weeks = Math.floor(seconds / (3600 * 24 * 7));
  seconds -= weeks * 3600 * 24 * 7;
  let days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  let hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  return { weeks, days, hours, minutes, seconds };
}

export function formatTime(secs, appendSeconds) {
  const time = parseTime(secs);

  let ret = "";
  if (time.weeks > 0) ret += time.weeks + "w";
  if (time.days > 0) ret += (ret.length === 0 ? "" : " ") + time.days + "d";
  if (time.hours > 0) ret += (ret.length === 0 ? "" : " ") + time.hours + "h";
  if (time.minutes > 0)
    ret += (ret.length === 0 ? "" : " ") + time.minutes + "m";

  if (appendSeconds && time.seconds > 0)
    ret += (ret.length === 0 ? "" : " ") + time.seconds + "s";

  return ret;
}

function createOrAppend(input, splitter, append) {
  return input.length > 0 ? `${input} • ${append}` : append;
}

const url = "https://graphql.anilist.co/";
const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
};
export function queryAL(query, variables) {
  return fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ query, variables }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.errors) throw res.errors[0].message;

      return res;
    })
    .then((res) => res.data);
}
