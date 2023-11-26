const fs = require('fs');
const path = require('path');

function loadCommands(client, commandsPath) {
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandsFolderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(commandsFolderPath).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsFolderPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
}

module.exports = loadCommands;
