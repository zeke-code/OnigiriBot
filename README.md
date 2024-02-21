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

OnigiriBot is designed to be a lightweight, versatile, and user-friendly Discord bot, ideal for both tech-savvy users and those less familiar with technology. My goal for OnigiriBot is to evolve it into a platform that not only simplifies interactions within Discord but also extends its usability through a web UI. This upcoming feature aims to provide an intuitive and accessible interface, making customization and management of the bot easy for all users. Currently, OnigiriBot is on a developmental journey, with a roadmap that outlines its evolving features and capabilities. Check out the roadmap below.

## Roadmap

- [x] **0.5: Basic commands, music player**
  - ✅ The foundation of the bot with essential music playing capabilities.
- [x] **0.6: Introduction of new fun commands, and a better music player**
  - ✅ Added cat, whisper, nsfw commands, and an improved music player with multiple functionalities.
- [ ] **0.7: Introduction of moderation commands and database integration**
  - ❌ Planned moderation tools to manage community interactions and the integration of a database.
- [ ] **0.8: Introduction of customizable messages, shoutouts, and communication features**
  - ❌ Future update to include personalized messages and community engagement features.
- [ ] **0.9: Refactoring code, improvements to existing features, simpler installation process**
  - ❌ Improving code quality and user experience in a future release.
- [ ] **1.0: Bot sharding, web UI**
  - ❌ Major milestone that will introduce robust backend improvements and a web UI.
- [ ] **1.1: ...**
  - Further updates and features to be announced.


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
   - Click on “New Application”, give it a name (like OnigiriBot), and create your application. (If you don't have a profile picture to use, feel free to download the one at the top of this document)

2. **Get Your Bot Token**:
   - Under the “Client Secret” section, you’ll find your bot’s token (press copy). Keep this token confidential.
   - Save this token somewhere safe (a .txt file is enough), as you'll need it for your bot's configuration.

## Step 2: Cloning the repository and installing dependencies

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

Create a `config` folder at the root of the OnigiriBot directory (open the OnigiriBot directory and create a new folder named **config**).
Create a `.env` file and place it in the **config** folder of the OnigiriBot directory.
Open the `.env` with any kind of text editor and add the following line to the `.env` file, replacing `YOUR_BOT_TOKEN` with the token you obtained from the Discord Developer Portal:

`DISCORD_TOKEN=YOUR_BOT_TOKEN`

Save the file and we're almost good to go!


## Step 4: Running OnigiriBot

Run your bot by opening a cmd inside the root directory, and use the following command:
```sh
node index.js
```

If everything is set up correctly, OnigiriBot should now be running. On the console, you should see something like this:
```console
$ node index.js
Ready! Logged in as OnigiriBot#3212
```

## Adding OnigiriBot to Your Server

To add OnigiriBot to your server, create an invite link:
- Go back to the Discord Developer Portal, navigate to the “OAuth2” tab.
- Under “Scopes”, select “bot”.
- Under “Bot Permissions”, select the permissions you want to give the bot (Administrator is fine at the moment).
- Use the generated URL to invite OnigiriBot to your server by visiting the URL.

## Conclusion

If you encounter any issues, feel free to open an issue on the GitHub repository.

**A small note for developers who'd like to contribute to the project**: feel free to create any pull requests if you'd like to add something to the bot!




