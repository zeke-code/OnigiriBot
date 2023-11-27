<p align="center">
   <img src="https://github.com/zeke-code/OnigiriBot/assets/116798879/1c868e6c-dcb2-43e2-a3f7-01428f187fc9" width="600" height="600">
</p>

<h1 align="center">OnigiriBot - A Lightweight, Simple, Versatile Discord Bot</h1>

<p align="center">
  <a href="#overview">Overview</a> • 
  <a href="#prerequisites">Prerequisites</a> • 
   <a href="#installation">Installaion</a>
</p>

# Overview

OnigiriBot is a lightweight, versatile, easy to use and customizable Discord bot. It will aim to become a user-friendly bot, so that everyone can customize it and use it to their liking, even if they are not really tech savvy. At the moment, the roadmap for the bot looks like this:

**0.5: Basic commands, music player**: ✅

**0.6: Introduction of new fun commands, and a better music player**: ❌

**0.7: Introduction of moderation commands and features**: ❌

**0.8: Introduction of customizable messages, shoutouts, and communication features:** ❌

**0.9: Refactoring code, improvements to existing features, simpler installation process: ❌**

**1.0: Database integration, Bot sharding**: ❌

**1.1: ...**

# Prerequisites

Before you begin, ensure that you meet the following prerequisites:
- **Node.js**: OnigiriBot requires Node.js to run. You can download it from [Node.js Official Website](https://nodejs.org/). It's recommended to use the **LTS** version. Just open the installer you downloaded and follow the installation guide.
- **FFMPEG**: This is required for handling media streams, it's a **must** if your bot will play music or handle audio. You can download FFMPEG from the [FFMPEG Official Website](https://ffmpeg.org/download.html).
- **A Discord Account**: To create a bot and get the necessary tokens, you'll need a Discord account. Sign up [here](https://discord.com/register) if you don't have one.

# Installation

Follow this procedure to install the bot and run it locally on your machine.



## Step 1: Registering the bot on Discord and retrieving bot's token

1. **Create Your Bot**:
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Click on “New Application”, give it a name (like OnigiriBot), and create your application.

2. **Get Your Bot Token**:
   - Under the “Client Secret” section, you’ll find your bot’s token (press copy). Keep this token confidential.
   - Save this token somewhere safe (a .txt file for the moment will do), as you'll need it for your bot's configuration.

## Step 2: Cloning the epository and installing dependencies

Clone the OnigiriBot repository to your local machine using through the cmd:
```sh
git clone https://github.com/zeke-code/OnigiriBot.git
```
You can also directly download the ZIP file.

Navigate into the folder by typing cmd into the path's bar (for MacOS right click the name of the folder at the bottom of the windows and click "Create Terminal at Folder").

Here, type:
```sh
npm install
```
this will install the dependencies needed for the project.


## Step 3: Configuration

Create a `.env` file in the **config** folder of the OnigiriBot directory.
Add the following line to the `.env` file, replacing `YOUR_BOT_TOKEN` with the token you obtained from the Discord Developer Portal:

`DISCORD_TOKEN=YOUR_BOT_TOKEN`

Save the file and we're almost good to go!


## Step 4: Running OnigiriBot

Run your bot by opening a cmd inside the root directory, and use the following command:
```sh
node index.js
```

If everything is set up correctly, OnigiriBot should now be running and accessible on your Discord server.

## Adding OnigiriBot to Your Server

To add OnigiriBot to your server, create an invite link:
- Go back to the Discord Developer Portal, navigate to the “OAuth2” tab.
- Under “Scopes”, select “bot”.
- Under “Bot Permissions”, select the permissions you want to give the bot (Administrator is fine at the moment).
- Use the generated URL to invite OnigiriBot to your server by visiting the URL.

## Conclusion

If you encounter any issues, feel free to open an issue on the GitHub repository.

**A small note for developers who'd like to contribute to the project**: feel free to create any pull requests if you'd like to add something to the bot!




