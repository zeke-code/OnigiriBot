<p align="center">
   <img src="https://github.com/zeke-code/OnigiriBot/assets/116798879/1c868e6c-dcb2-43e2-a3f7-01428f187fc9" width="400" height="400">
</p>

<h1 align="center">OnigiriBot - A Lightweight, Simple, Versatile Discord Bot</h1>

<p align="center">
  <a href="#overview">Overview</a> • 
  <a href="#prerequisites">Prerequisites</a> • 
   <a href="#installation">Installation</a> • 
   <a href="#roadmap">Roadmap</a>
</p>

# Overview

OnigiriBot is designed to be a lightweight, versatile, and user-friendly Discord bot, ideal for both tech-savvy users and those less familiar with technology. My goal for OnigiriBot is to extend its usability through a web UI. This upcoming feature aims to provide an intuitive and accessible interface, making customization and management of the bot easy for all users. Currently, OnigiriBot is on a developmental journey, with a roadmap that outlines its evolving features and capabilities. Check out the roadmap below.

## Roadmap

- [x] **0.5: Basic commands, music player**
  - ✅ The foundation of the bot with essential music playing capabilities.
- [x] **0.6: Introduction of new fun commands, and a better music player**
  - ✅ Added cat, whisper, nsfw commands, and an improved music player with multiple functionalities.
- [x] **0.7-alpha: Starting database integration, migrating codebase to TypeScript**
  - ✅ Started database integration, migrated codebase to TypeScript.
- [ ] **0.7-beta: Simpler installation process through bash scripts**
  - ❌ Release of bash scripts for both Windows and Unix systems to make installation faster.
- [ ] **0.7: Introduction of moderation commands and complete database integration**
  - ❌ Planned moderation tools to manage community interactions and full integration of a database (MongoDB).
- [ ] **0.8: Introduction of customizable messages, shoutouts, and communication features.**
  - ❌ Future update to include personalized messages and community engagement features.
- [ ] **0.9: Refactoring code, improvements to existing features**
  - ❌ Improving code quality and user experience in this release.
- [ ] **1.0: Bot sharding, web UI**
  - ❌ Major milestone that will introduce robust backend improvements and a web UI.
- [ ] **1.1: ...**
  - Further updates and features to be announced.

# Installation

There are 2 ways to install and run Onigiribot. You can use Docker or you can run Onigiribot locally without a container.

Follow the below procedure to install the bot locally with no containerization.

## Prerequisites

To install the bot locally without Docker, ensure that you meet the following prerequisites:

- **Node.js**: OnigiriBot requires Node.js to run. You can download it from [Node.js Official Website](https://nodejs.org/). It's recommended to use the **LTS** version. Just open the installer you downloaded and follow the installation guide.
- **FFMPEG**: This is required for handling media streams, it's a **must** if your bot will play music or handle audio. You can download FFMPEG from the [FFMPEG Official Website](https://ffmpeg.org/download.html).

## Step 1: Registering the bot on Discord and retrieving bot's token

1. **Create Your Bot**:

   - Go to the [Discord Developer Portal](https://discord.com/developers/applications).
   - Click on “New Application”, give it a name (like OnigiriBot), and create your application. (If you don't have a profile picture to use, feel free to download the one at the top of this document)

2. **Get Your Bot Token and Application ID**:

   - Under the "General Information" section, you'll find your application ID. Copy it and save it somewhere.
   - Under the “Bot” section, you’ll find your bot’s token.
   - Copy and save this token somewhere safe, as you'll need it for your bot's configuration.

3. **Enable Bot's Privileged Gateway Intents**:
   - Under the "Bot" section, enable all privileged gateway intents, as OnigiriBot requires them to run properly.

## Step 2: Cloning the repository and installing dependencies

Clone the OnigiriBot repository to your local machine using through a terminal (on Windows, search `cmd` or `Powershell` on the search bar):

```sh
git clone https://github.com/zeke-code/OnigiriBot.git
```

**You can also directly download the ZIP file.**

Navigate into the folder by typing cmd into the path's bar (for MacOS right click the name of the folder at the bottom of the windows and click "Create Terminal at Folder").

Here, type:

```sh
npm install
```

this will install the dependencies needed for the project.

## Step 3: Configuration

Create a `.env` file and place it in the root folder.
Open the `.env` file with any kind of text editor and add the following lines to the `.env` file, replacing `YOUR_BOT_TOKEN` and `YOUR_APPLICATION_ID` with the token and application ID you obtained from the Discord Developer Portal:

`DISCORD_TOKEN=YOUR_BOT_TOKEN`
<br>
`APPLICATION_ID=YOUR_APPLICATION_ID`

Save the file and we're almost good to go!

## Step 4: Running OnigiriBot

Open a terminal inside the root directory, and use the following command:

```sh
npm run start
```

If everything is set up correctly, OnigiriBot should now be running. On the console, you should see something like this:

```console
$ npm run start
info: Started refreshing 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:00"}
info: Successfully reloaded 15 application (/) commands. {"service":"OnigiriBot","timestamp":"2024-09-12 00:00:03"}
Ready! Logged in as OnigiriBot#3212
```

## Adding OnigiriBot to Your Server

To add OnigiriBot to your server, create an invite link:

- Go back to the Discord Developer Portal, navigate to the “OAuth2” tab.
- Under “Scopes”, select “bot”.
- Under “Bot Permissions”, select the permissions you want to give the bot.
- Use the generated URL to invite OnigiriBot to your server by accessing the URL on your browser.

## Conclusion

If you encounter any issues, feel free to open an issue on the GitHub repository.

**Disclaimer: The developer of this bot assumes no responsibility or liability for any actions taken by users of this bot. This bot is intended solely for instructive and demonstrative purposes. Users are responsible for ensuring that their use complies with all applicable laws and regulations.**
