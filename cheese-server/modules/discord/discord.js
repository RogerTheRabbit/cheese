import { DiscordRequest } from "./util.js";

export const sendMessage = async (message) => {
  return DiscordRequest(
    `/channels/${process.env.DISCORD_ADMIN_CHANNEL_ID}/messages`,
    {
      method: "POST",
      body: {
        tts: message.tts,
        embeds: [
          {
            title: message.title,
            description: message.description,
          },
        ],
      },
    },
  );
};

export default {
  sendMessage,
};
