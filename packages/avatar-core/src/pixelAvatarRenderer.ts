import type { AvatarState } from "@personal-character-agent/shared";

const frames: Record<AvatarState, string[]> = {
  idle: [
    " /\\_/\\\\ ",
    "( o.o )",
    " > ^ < "
  ],
  listening: [
    " /\\_/\\\\ ",
    "( o.o )  ?",
    " > ^ < "
  ],
  thinking: [
    " /\\_/\\\\  ...",
    "( -.- )",
    " > ^ < "
  ],
  speaking: [
    " /\\_/\\\\ ",
    "( ^o^ )  ))",
    " > ^ < "
  ],
  happy: [
    " /\\_/\\\\ ",
    "( ^.^ )",
    " > * < "
  ],
  annoyed: [
    " /\\_/\\\\ ",
    "( >.< )",
    " > ^ < "
  ],
  sleepy: [
    " /\\_/\\\\  zZ",
    "( -.- )",
    " > ^ < "
  ],
  confused: [
    " /\\_/\\\\ ",
    "( ?.o )",
    " > ^ < "
  ],
  error: [
    " /\\_/\\\\ ",
    "( x.x )",
    " > ! < "
  ],
  hidden: [
    "        ",
    "( . . )",
    "  ---   "
  ],
  peeking: [
    " /\\_/\\\\ ",
    "( o . )",
    "  ---   "
  ],
  edge_sitting: [
    " /\\_/\\\\ ",
    "( u.u )",
    "_/   \\_"
  ]
};

export class PixelAvatarRenderer {
  render(state: AvatarState): string {
    return frames[state].join("\n");
  }

  renderWithCaption(state: AvatarState, caption: string): string {
    return `${this.render(state)}\n[${state}] ${caption}`;
  }
}
