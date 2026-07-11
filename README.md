# Quest the Adventure Game

An unofficial Foundry Virtual Tabletop system for **Quest: The Adventure Game** by **The Adventure Guild**. You can visit the game's official website here: https://www.adventure.game/

AI usage: Claude AI was involved in creation of the system.

> **Disclaimer:** This is an unofficial, fan-made project. It is not affiliated with, endorsed by, or sponsored by The Adventure Guild. All Quest game content, rules text, and terminology belong to their respective owners. This work is based on the Quest Creators Resource. The Quest Creators Resource by The Adventure Guild, LLC is licensed under CC BY 4.0. For more information about Quest, please visit www.adventure.game. Additionally, please read Quest’s Community Guidelines to help create experiences that arepositive and fun.

## Features

### Character Sheets
- Tabbed layout: **Profile**, **Abilities**, **Inventory**, and **Notes**.
- Hit Point and Adventure Point trackers.
- An Armor tracker, intended for abilities like Invoker's Shield (damage reduction) or Wizard's Force Field (additional HP).
- A character profile with the book's form and blank text fields.
- Abilities can be dragged and dropped onto the sheet, where they're automatically sorted by learning path and order within that path. Each ability has a folded and unfolded view; the unfolded view can include an interactive AP cost that deducts points on click, returns that cost on right click, and an interactive "Roll the Die" button. Double-clicking an unfolded ability's description posts it to chat.
- The Inventory tab has a control for maximum slots, plus a button to add containers that grant additional slots (like a Dress of Many Pockets). Deleting a container also deletes any items stored inside it.
- Both Abilities and Inventory have buttons to expand or collapse all entries at once.
- A Notes tab with a rich text editor.

### NPC Sheets
- Similar to the Character sheet, tracking HP, Attack, and Armor.
- A Description tab used both for features and for any other important description (e.g. profiles from the Character Catalog).
- Features are created the same way as character abilities, so the NPC sheet can host either. Unlike on the Character sheet, abilities on an NPC sheet aren't grouped by learning path or order, and AP costs are hidden.

### Abilities
- Fields for name, learning path, learning path order, and description.
- Writing any number followed by "AP." (e.g. "2 AP.") turns it into an interactive button once the ability is placed on a character sheet and unfolded.
- A "Roll the Die" checkbox serves two purposes: it reveals fields for custom roll results, and it adds a roll button to the ability's unfolded view on the character or NPC sheet.

### Items
- Fields for name, rarity, and description.
- Writing any number followed by "AP." (e.g. "2 AP.") turns it into an interactive button once the item is placed on a character sheet and unfolded.
- Writing any number followed by "damage." (e.g. "2 damage.") turns it into a non-interactive damage icon, matching the one used in the core rulebook.
- Like abilities, items have a "Roll the Die" checkbox that reveals custom roll result fields and adds a roll button to their unfolded view.

### Combat Tracker
- combatants are divided between PCs and NPCs and can be freely dragged between those groups
- combatants have editable HP, AP and Armor within the tracker
- left click to grey out a character who had their turn, right click to undo
- next turn automatically ungrey all
- recommendation: turn off enable markers in core settings/combat tracker
