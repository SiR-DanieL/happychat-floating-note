# Happychat Floating Note 👻

A userscript for [Happychat](https://github.com/Automattic/happychat) HUD that creates persistent floating notes.

- Helps avoid sending private notes to a user.
- Can still use `/note` normally as you please.
- Manage long-running notes without the need for a separate text app window.
- Note data is automatically saved as you switch between chats.

## Installation

1. Add `happychat-floating-note.js` contents to a userscript manager such as [Tampermonkey](https://tampermonkey.net/). The CSS styles are embedded within the script itself.
2. There are some easily customizable `options` in the script such as the floating note background color and a note template string.

> ⚠️ Note: Take care to backup your custom options & other changes anytime you are updating to a newer script version.

## More Information

Please see this [private post](https://wehavetheanswers.wordpress.com/2019/04/04/happychat-floating-note/) for further information. Feel free to drop a comment on that post or open an issue here with any feedback or questions.

## Changelog

### Version 1.2.1

* Added `KEYBOARD_SHORTCUTS` option which is false by default. See [this issue](https://github.com/samiff/happychat-floating-note/issues/1#issuecomment-481107336) for more info on using this option.
* Added `MANAGE_FOCUS` option which is true by default. When opening a note, it is given focus. And when closing a note, focus is set to the chat input area.

### Version 1.1.1

* Added `USE_GRAMMARLY` option which is false by default. Ran into multiple issues with Grammarly, so enable Grammarly at your own risk for now.

### Version 1.0.1

* Fixed `Send` note button sending contents more than once.
* Removed note input `<textarea>` outline.
