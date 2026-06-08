const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const CREATE_VC_ID = '1513338365129527306';
const PVC_CATEGORY_ID = '1513338284112347247';

const owners = new Map();

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {

    // Create PVC
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

    // Auto delete empty PVC
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

require('dotenv').config();

client.login(process.env.TOKEN);