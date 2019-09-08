const discord = require("discord.js");
const client = new discord.Client();
require("dotenv").config();

const config = require("./config.json");
const util = require("./utility");
const storageHeper = require("./storage/storageHelper");

let usersMakingAds = [];
let ads = {};

client.on("message", msg => {
  if (msg.author.bot) return;
  var cmd;
  if (usersMakingAds.includes(msg.author.id)) {
    if (msg.content == "=cancel") {
      usersMakingAds.splice(usersMakingAds.indexOf(msg.author.id), 1);
      delete ads[msg.author.id];
      msg.channel.send("ad canceled");
      return;
    }
    ads[msg.author.id].push(msg.content);
    switch (ads[msg.author.id].length) {
      case 1:
        msg.channel.send("please respond with the name of your server");
        break;
      case 2:
        msg.channel.send("please send an invite to your server");
        break;
      case 3:
        msg.channel.send("please state the theme or topic of your server");
        break;
      case 4:
        msg.channel.send("now please enter a small descripton of your server");
        break;
      case 5:
        msg.channel.send(
          "would you like to save your ad for future use? yes or no"
        );
        break;
      case 6:
        msg.channel.send(
          "congrats! you're done making your ad this is what it ad looks like, it has also been sent to our central advertising server"
        );
        let embed = util.advertisment(
          msg.author.tag,
          ads[msg.author.id][1],
          ads[msg.author.id][2],
          ads[msg.author.id][3].toLowerCase(),
          ads[msg.author.id][4]
        );
        if (ads[msg.author.id][5].toLowerCase() == "yes") {
          storageHeper.saveAd(
            msg.author.id,
            ads[msg.author.id][1],
            ads[msg.author.id][2],
            ads[msg.author.id][3].toLowerCase(),
            ads[msg.author.id][4]
          );
          msg.channel.send("ad saved say =ads to view your ads");
        }
        msg.channel.send(embed);
        client.channels.get(config.adsChannel).send(embed);
        delete ads[msg.author.id];
        usersMakingAds.splice(usersMakingAds.indexOf(msg.author.id), 1);
        msg.channel.send(
          `please join our central server ${config.centralServer}`
        );
      default:
        break;
    }
    return;
  }
  if (msg.mentions.users.has(client.user.id)) {
    msg.channel.send(
      `SAD bot's prefix is ${config.prefix} , say ${config.prefix}help to learn how to use the bot`
    );
  }

  if (msg.content.startsWith(config.prefix))
    cmd = msg.content.slice(config.prefix.length);

  if (cmd == "advertise") {
    ads[msg.author.id] = [];
    usersMakingAds.push(msg.author.id);
    msg.channel.send("say ok to continue or =cancel to cancel");
  }

  if (cmd == "help") {
    msg.channel.send(config.helpMessage);
  }

  if (cmd == "ads") {
    storageHeper.fetchAds(msg.author.id, function(ads) {
      if (ads == 0) {
        msg.channel.send("try again later, you might not have made any ads");
        return;
      }
      ads.forEach(async function(ad, i) {
        await msg.channel.send(
          util.advertisment(
            msg.author.tag,
            ad.name,
            ad.invite,
            ad.topic,
            ad.description
          )
        );
      });
    });
  }
  if (msg.content.startsWith("=sendad")) {
    let args = msg.content.split(" ");
    num = Number(args[1]);
    if (num != NaN) {
      storageHeper.fetchAds(msg.author.id, function(ads) {
        try {
          let embed = util.advertisment(
            msg.author.tag,
            ads[num - 1].name,
            ads[num - 1].invite,
            ads[num - 1].topic,
            ads[num - 1].description
          );
          msg.channel.send(embed);
          client.channels.get(config.adsChannel).send(embed);
        } catch (e) {
          msg.channel.send("you don't have that many ads");
        }
      });
    }
  }

  if (msg.content.startsWith("=search")) {
    var args = msg.content.split(" ");
    storageHeper.searchAds(
      args[1].toLowerCase(),
      args[2].toLowerCase(),
      function(ads) {
        if (ads == 0) {
          msg.channel.send(
            "we might not have any ads like that try again later"
          );
        } else {
          ads.forEach(async function(ad, i) {
            await msg.channel.send(
              util.advertisment(
                "author unknown",
                ad.name,
                ad.invite,
                ad.topic,
                ad.description
              )
            );
          });
        }
      }
    );
  }

  if (msg.content.startsWith("=delad")) {
    let args = msg.content.split(" ");
    let num = Number(args[1]);
    if (!isNaN(num)) {
      storageHeper.delad(msg.author.id, num - 1);
      msg.channel.send("ad deleted");
    } else {
      msg.channel.send("thats not even a number bro");
    }
  }

  if (msg.author.id == config.admin) {
    if (msg.content.startsWith("=banish")) {
      let args = msg.content.split(" ");
      storageHeper.banish(args[1]);
    }
  }
});

client.login(process.env.TOKEN);
