import { GuildMember, PermissionFlagsBits } from "discord.js";

export class PermissionService {
  hasPermission(member: GuildMember, permission: bigint | bigint[]): boolean {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      return true;
    }

    if (Array.isArray(permission)) {
      return permission.every((p) => member.permissions.has(p));
    }

    return member.permissions.has(permission);
  }

  isModerator(member: GuildMember): boolean {
    return this.hasPermission(member, [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageMessages,
    ]);
  }

  isAdmin(member: GuildMember): boolean {
    return member.permissions.has(PermissionFlagsBits.Administrator);
  }
}
