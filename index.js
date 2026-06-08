require('dotenv').config();

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("HoR Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const CREATE_VC_ID = '1513338365129527306';
const PVC_CATEGORY_ID = '1513338284112347247';

const owners = new Map();

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// ================= PVC SYSTEM =================

client.on('voiceStateUpdate', async (oldState, newState) => {

    if (newState.channelId === CREATE_VC_ID) {

        const guild = newState.guild;

        const channel = await guild.channels.create({
            name: `${newState.member.user.username}'s VC`,
            type: ChannelType.GuildVoice,
            parent: PVC_CATEGORY_ID,
            permissionOverwrites: [
                {
                    id: guild.id,
                    allow: [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.ViewChannel
                    ]
                }
            ]
        });

        owners.set(channel.id, newState.member.id);

        await newState.setChannel(channel);
    }

    if (
        oldState.channel &&
        oldState.channel.parentId === PVC_CATEGORY_ID &&
        oldState.channel.id !== CREATE_VC_ID
    ) {
        if (oldState.channel.members.size === 0) {
            owners.delete(oldState.channel.id);
            await oldState.channel.delete().catch(() => {});
        }
    }
});

// ================= MOD COMMANDS =================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // HELP
    if (cmd === 'help') {
        return message.channel.send(`
**HoR Bot Commands**

!ban @user
!kick @user

!to @user 10m
!to @user 1h
!to @user 1d

!uto @user

!nick @user NewNickname

!help
        `);
    }

    // BAN
    if (cmd === 'ban') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply('Ban Members permission chahiye.');

        const member = message.mentions.members.first();

        if (!member)
            return message.reply('User mention karo.');

        await member.ban();

        return message.channel.send(`🔨 ${member.user.tag} banned.`);
    }

    // KICK
    if (cmd === 'kick') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return message.reply('Kick Members permission chahiye.');

        const member = message.mentions.members.first();

        if (!member)
            return message.reply('User mention karo.');

        await member.kick();

        return message.channel.send(`👢 ${member.user.tag} kicked.`);
    }

    // TIMEOUT
    if (cmd === 'to') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply('Moderate Members permission chahiye.');

        const member = message.mentions.members.first();

        if (!member)
            return message.reply('User mention karo.');

        const time = args[1];

        if (!time)
            return message.reply('Example: !to @user 10m');

        const value = parseInt(time);

        let ms = 0;

        if (time.endsWith('m')) {
            ms = value * 60 * 1000;
        } else if (time.endsWith('h')) {
            ms = value * 60 * 60 * 1000;
        } else if (time.endsWith('d')) {
            ms = value * 24 * 60 * 60 * 1000;
        }

        if (!ms)
            return message.reply('Use m, h ya d.');

        await member.timeout(ms);

        return message.channel.send(`⏳ ${member.user.tag} timeout ho gaya.`);
    }

    // UNTIMEOUT
    if (cmd === 'uto') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply('Moderate Members permission chahiye.');

        const member = message.mentions.members.first();

        if (!member)
            return message.reply('User mention karo.');

        await member.timeout(null);

        return message.channel.send(`✅ ${member.user.tag} timeout remove.`);
    }

    // NICKNAME
    if (cmd === 'nick') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageNicknames))
            return message.reply('Manage Nicknames permission chahiye.');

        const member = message.mentions.members.first();

        if (!member)
            return message.reply('User mention karo.');

        const nickname = args.slice(1).join(' ');

        if (!nickname)
            return message.reply('Nickname do.');

        await member.setNickname(nickname);

        return message.channel.send(`✏️ Nickname update ho gaya.`);
    }
});

client.login(process.env.TOKEN);