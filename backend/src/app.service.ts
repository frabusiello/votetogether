import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // What the TV needs to tell players where to join:
  // - publicUrl: the PUBLIC_URL setting, when the server has a known address (a domain, or a NAS's
  //   fixed name or IP). Shown as is.
  // - lanAddress: this machine's local network IP, for when the TV is opened on the server itself
  //   via localhost. Not available inside Docker, where the container only sees its own internal
  //   network; set PUBLIC_URL there instead.
  getConfig() {
    return {
      publicUrl: process.env.PUBLIC_URL?.trim() || null,
      lanAddress: existsSync('/.dockerenv') ? null : findLanAddress(),
    };
  }
}

function findLanAddress(): string | null {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal)
        return address.address;
    }
  }
  return null;
}
