import { rollTieredD20 } from "../rolls/quest-roll.js";
import { renderAbilityDescription } from "../utils/text-render.js";
import { fixCursorOnFocus } from "../utils/cursor-fix.js";
import { initInputAutosize } from "../utils/input-autosize.js";
import { renderItemDescription } from "../utils/text-render.js";

export default class QuestNpcSheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["quest", "sheet", "actor", "npc", "themed", "theme-light"],
    position: {
      width: 600,
      height: 700
    },
    window: { resizable: true },
    form: {
      submitOnChange: true
    },
    actions: {
      selectTab: this._onSelectTab,
      roll: this._onRoll,
      editImage: this._onEditImage,
      createAbility: this._onCreateAbility,
      removeAbility: this._onRemoveAbility,
      toggleAbility: this._onToggleAbility,
      rollAbility: this._onRollAbility,
      editItem: this._onEditItem,
      expandAll: this._onExpandAll,
      collapseAll: this._onCollapseAll,
      expandAllItems: this._onExpandAllItems,
      collapseAllItems: this._onCollapseAllItems,
      createItemInSlot: this._onCreateItemInSlot,
      addContainer: this._onAddContainer,
      removeContainer: this._onRemoveContainer,
      toggleItem: this._onToggleItem,
      removeItem: this._onRemoveItem,
      rollItem: this._onRollItem,
    },

    dragDrop: [
      { dragSelector: ".ability-item", dropSelector: ".description-tab" },
      { dragSelector: ".item-slot", dropSelector: ".inventory-tab" }
    ]

  };

  static PARTS = {
    header: {
      template: "systems/quest/templates/actor/npc-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._initAbilityChatTrigger();
    this._initContainerRename();
    this._initContainerSlotsEdit();
    fixCursorOnFocus(this.element);
    initInputAutosize(this.element);
  }

  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
  }

  _initContainerRename() {
    const inputs = this.element.querySelectorAll(".container-name-input");
    for (const input of inputs) {
      input.addEventListener("change", async () => {
        const containerId = input.dataset.containerId;
        const containers = this.actor.system.containers.map(c =>
          c.id === containerId ? { ...c, name: input.value } : c
        );
        await this.actor.update({ "system.containers": containers });
      });
    }
  }

  _initContainerSlotsEdit() {
    const inputs = this.element.querySelectorAll(".container-slots-input");
    for (const input of inputs) {
      input.addEventListener("change", async () => {
        const containerId = input.dataset.containerId;
        const newSlots = Math.max(0, Number(input.value) || 0);
        const containers = this.actor.system.containers.map(c =>
          c.id === containerId ? { ...c, slots: newSlots } : c
        );
        await this.actor.update({ "system.containers": containers });
      });
    }
  }

  _initAbilityChatTrigger() {
    const details = this.element.querySelectorAll(".ability-detail");
    for (const detail of details) {
      detail.addEventListener("dblclick", (event) => {
        if (event.target.closest(".ap-badge")) return;
        if (event.target.closest(".ability-roll")) return;

        const li = detail.closest(".ability-item");
        if (!li) return;
        const itemId = li.dataset.itemId;
        this._postAbilityToChat(itemId);
      });
    }
  }

  async _postAbilityToChat(itemId) {
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const tierList = item.system.hasRoll
      ? item.system.rollTiers.map(t => ({
          label: t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`,
          text: t.text
        }))
      : [];

    const content = await foundry.applications.handlebars.renderTemplate("systems/quest/templates/chat/ability-card.hbs", {
      name: item.name,
      renderedDescription: renderAbilityDescription(item.system.description, { includeApBadge: false }),
      tierList
    });

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }

  _expandedAbilities = new Set();
  _expandedItems = new Set();

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    context.actor = this.actor;
    context.tabs = this._getTabs();
    context.isDefaultImage = this.actor.img === this.actor.constructor.DEFAULT_ICON;
    context.editable = this.isEditable;

    context.enrichedNotes = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.notes || "",
      {
        async: true,
        secrets: this.actor.isOwner,
        relativeTo: this.actor
      }
    );

    context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
      this.actor.system.description || "",
      {
        async: true,
        secrets: this.actor.isOwner,
        relativeTo: this.actor
      }
    );

    context.abilities = this.actor.items
      .filter(i => i.type === "ability")
      .map(item => ({
        id: item.id,
        name: item.name,
        system: item.system,
        expanded: this._expandedAbilities.has(item.id),
        renderedDescription: renderAbilityDescription(item.system.description, { includeApBadge: false }),
        tierList: item.system.hasRoll
          ? item.system.rollTiers.map(t => ({
              label: t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`,
              text: t.text
            }))
          : []
      }));

    const gearItems = this.actor.items.filter(i => i.type === "item");

    const buildSlots = (containerId, slotCount) => {
      const slots = [];
      for (let i = 0; i < slotCount; i++) {
        const found = gearItems.find(
          it => (it.getFlag("quest", "containerId") ?? "main") === containerId &&
                it.getFlag("quest", "slotIndex") === i
        );
        if (found) {
          slots.push({
            filled: true,
            id: found.id,
            name: found.name,
            system: found.system,
            expanded: this._expandedItems.has(found.id),
            renderedDescription: renderItemDescription(found.system.description, { includeApBadge: false }),
            slotNumber: i + 1,
            tierList: found.system.hasRoll
              ? found.system.rollTiers.map(t => ({
                  label: t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`,
                  text: t.text
                }))
              : []
          });
        } else {
          slots.push({ filled: false, slotIndex: i, containerId, slotNumber: i + 1 });
        }
      }
      return slots;
    };

    context.mainInventory = {
      slotCount: this.actor.system.inventorySlots,
      slots: buildSlots("main", this.actor.system.inventorySlots)
    };

    context.containers = this.actor.system.containers.map(c => ({
      id: c.id,
      name: c.name,
      slotCount: c.slots,
      slots: buildSlots(c.id, c.slots)
    }));

    return context;
  }

  _getTabs() {
    const tabs = {
      description: { id: "description", label: "Description" },
      inventory: { id: "inventory", label: "Inventory" },
      notes: { id: "notes", label: "Notes" }
    };

    for (const tab of Object.values(tabs)) {
      const activeTab = game.user.getFlag("quest", "activeTabs")?.[this.actor.id] ?? "description";
      tab.active = activeTab === tab.id;
      tab.cssClass = tab.active ? "active" : "";
    }

    return tabs;
  }

  static async _onEditImage(event, target) {
    const currentImage = this.actor.img || "";

    const filePicker = new FilePicker({
      type: "image",
      current: currentImage,
      callback: async (selectedPath) => {
        await this.actor.update({ img: selectedPath });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });

    filePicker.render(true);
  }

  static async _onSelectTab(event, target) {
    const tab = target.dataset.tab;
    const activeTabs = foundry.utils.deepClone(game.user.getFlag("quest", "activeTabs") ?? {});
    activeTabs[this.actor.id] = tab;
    await game.user.setFlag("quest", "activeTabs", activeTabs);
    this.render();
  }

  static async _onRoll(event, target) {
    await rollTieredD20(this.actor);
  }

  static async _onCreateAbility(event, target) {
    await this.actor.createEmbeddedDocuments("Item", [
      { name: "New Ability", type: "ability" }
    ]);
  }

  static _onExpandAll(event, target) {
    for (const item of this.actor.items) {
      if (item.type === "ability") {
        this._expandedAbilities.add(item.id);
      }
    }
    this.render();
  }

  static _onCollapseAll(event, target) {
    this._expandedAbilities.clear();
    this.render();
  }

  static _onExpandAllItems(event, target) {
    for (const item of this.actor.items) {
      if (item.type === "item") {
        this._expandedItems.add(item.id);
      }
    }
    this.render();
  }

  static _onCollapseAllItems(event, target) {
    this._expandedItems.clear();
    this.render();
  }

  static async _onRemoveAbility(event, target) {
    event.stopPropagation();
    const itemId = target.dataset.itemId;
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  static _onToggleAbility(event, target) {
    const itemId = target.dataset.itemId;
    if (this._expandedAbilities.has(itemId)) {
      this._expandedAbilities.delete(itemId);
    } else {
      this._expandedAbilities.add(itemId);
    }
    this.render();
  }

  static _onEditItem(event, target) {
    event.stopPropagation();
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) item.sheet.render(true);
  }

  static async _onRollAbility(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const roll = new Roll("1d20");
    await roll.evaluate();
    const total = roll.total;

    const matchedTier = item.system.rollTiers.find(t => total >= t.min && total <= t.max);
    const label = matchedTier
      ? (matchedTier.min === matchedTier.max ? `${matchedTier.min}` : `${matchedTier.min}–${matchedTier.max}`)
      : "No Match";
    const text = matchedTier ? matchedTier.text : "";

    const content = await foundry.applications.handlebars.renderTemplate("systems/quest/templates/chat/roll-card.hbs", {
      total,
      tier: { label, text }
    });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }

  static async _onCreateItemInSlot(event, target) {
    const containerId = target.dataset.containerId;
    const slotCount = containerId === "main"
      ? this.actor.system.inventorySlots
      : this.actor.system.containers.find(c => c.id === containerId)?.slots ?? 0;

    const gearItems = this.actor.items.filter(i => i.type === "item");
    const occupied = new Set(
      gearItems
        .filter(it => (it.getFlag("quest", "containerId") ?? "main") === containerId)
        .map(it => it.getFlag("quest", "slotIndex"))
    );

    let freeIndex = -1;
    for (let i = 0; i < slotCount; i++) {
      if (!occupied.has(i)) {
        freeIndex = i;
        break;
      }
    }

    if (freeIndex === -1) {
      ui.notifications.warn("No empty slots available.");
      return;
    }

    const created = await this.actor.createEmbeddedDocuments("Item", [
      { name: "New Item", type: "item" }
    ]);
    await created[0].setFlag("quest", "containerId", containerId);
    await created[0].setFlag("quest", "slotIndex", freeIndex);
  }

  static async _onAddContainer(event, target) {
    const containers = this.actor.system.containers.slice();
    containers.push({
      id: foundry.utils.randomID(),
      name: "New Container",
      slots: 6
    });
    await this.actor.update({ "system.containers": containers });
  }

  static async _onRemoveContainer(event, target) {
    const containerId = target.dataset.containerId;

    const toDelete = this.actor.items
      .filter(i => i.type === "item" && i.getFlag("quest", "containerId") === containerId)
      .map(i => i.id);

    if (toDelete.length > 0) {
      await this.actor.deleteEmbeddedDocuments("Item", toDelete);
    }

    const containers = this.actor.system.containers.filter(c => c.id !== containerId);
    await this.actor.update({ "system.containers": containers });
  }

  static _onToggleItem(event, target) {
    const itemId = target.dataset.itemId;
    if (this._expandedItems.has(itemId)) {
      this._expandedItems.delete(itemId);
    } else {
      this._expandedItems.add(itemId);
    }
    this.render();
  }

  static async _onRemoveItem(event, target) {
    event.stopPropagation();
    const itemId = target.dataset.itemId;
    await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  static async _onRollItem(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const roll = new Roll("1d20");
    await roll.evaluate();
    const total = roll.total;

    const matchedTier = item.system.rollTiers.find(t => total >= t.min && total <= t.max);
    const label = matchedTier
      ? (matchedTier.min === matchedTier.max ? `${matchedTier.min}` : `${matchedTier.min}–${matchedTier.max}`)
      : "No Match";
    const text = matchedTier ? matchedTier.text : "";

    const content = await foundry.applications.handlebars.renderTemplate("systems/quest/templates/chat/roll-card.hbs", {
      total,
      tier: { label, text }
    });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type !== "Item") return;

    const item = await Item.implementation.fromDropData(data);
    if (!item) return;

    if (item.type === "ability") {
      const sourceUuid = item.uuid;
      const alreadyExists = this.actor.items.some(
        i => i.type === "ability" && i.getFlag("quest", "sourceUuid") === sourceUuid
      );
      if (alreadyExists) {
        ui.notifications.warn("This ability is already on the sheet.");
        return;
      }

      const itemData = item.toObject();
      foundry.utils.setProperty(itemData, "flags.quest.sourceUuid", sourceUuid);
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
      return;
    }

    if (item.type === "item") {
      const containerEl = event.target.closest("[data-container-id]");
      const containerId = containerEl ? containerEl.dataset.containerId : "main";

      const slotCount = containerId === "main"
        ? this.actor.system.inventorySlots
        : this.actor.system.containers.find(c => c.id === containerId)?.slots ?? 0;

      const gearItems = this.actor.items.filter(i => i.type === "item");
      const occupied = new Set(
        gearItems
          .filter(it => (it.getFlag("quest", "containerId") ?? "main") === containerId)
          .map(it => it.getFlag("quest", "slotIndex"))
      );

      let freeIndex = -1;
      for (let i = 0; i < slotCount; i++) {
        if (!occupied.has(i)) {
          freeIndex = i;
          break;
        }
      }

      if (freeIndex === -1) {
        ui.notifications.warn("No empty slots available in this container.");
        return;
      }

      const itemData = item.toObject();
      foundry.utils.setProperty(itemData, "flags.quest.containerId", containerId);
      foundry.utils.setProperty(itemData, "flags.quest.slotIndex", freeIndex);
      await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }
}