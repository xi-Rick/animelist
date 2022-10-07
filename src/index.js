const config = require("../config");
const discord = require("discord.js");
const client = new discord.Client();
import commands from "./commands";

Object.entries(commands).forEach((value) => {
  const shortHand = (commands[value[0].charAt(0) + ""] = {});
  shortHand.apply = (contents, channel) => value[1].apply(contents, channel);
});

if (!config.maxLength) config.maxLength = 300;

const pattern = createPattern();

client.on("ready", () => console.log(`Logged in as ${client.user.tag}`));
client.on("error", console.error);
client.on("message", (message) => {
  if (message.author.bot) return;

  const match = message.content.match(pattern);
  if (!match) return;

  const command = commands[match[1]];
  if (!command) return;

  command
    .apply(match[2], message.channel)
    .catch((error) => message.channel.send(error.message));
});
client.on("message", (message) => {
  if (message.content === "h{}") {
    const embed = new discord.MessageEmbed()
      .setColor("#ffffff")
      .setAuthor("Help Guide", "https://i.imgur.com/lRLJgEz.png")
      .setDescription(
        "Commands are made in a way to be used in a sentence or by themselves altogether. As of now you can use commands for Anime, Manga, Users and Characters on Anilist. Content flagged as Adult will not repsond."
      )
      .addField("\u200b", "\u200b")
      .addField(
        "<:black:1028008749392199781> a{Anime Name}",
        "You should watch a{Bakuman}! Its really good.",
        true
      )
      .addField(
        "<:black:1028008749392199781> m{Manga Name}",
        "Man, m{Kimetsu no Yaiba} was such a good manga.",
        true
      )
      .addField(
        "<:black:1028008749392199781> u{User Name}",
        "Check out my boy u{Rickk}'s profile. What a weeb.",
        true
      )
      .addField(
        "<:black:1028008749392199781> c{Character Name}",
        "You dont know c{Rin Tohsaka}? You need to watch Fate.",
        true
      )
      .addField(
        "<:black:1028008749392199781> h{}",
        "Brings up this wonderful help guide.",
        true
      )
      .addField("\u200b", "\u200b")
      .addField(
        "<a:love:741628964899913840> Have fun and enjoy",
        "\u200b",
        true
      );
    message.channel.send(embed);
  }
});

client.login(config.token);

function createPattern() {
  const keys = Object.keys(commands).join("|");
  return new RegExp("(" + keys + "){(.+?)}");
}
