import { fixCursorOnFocus } from "../utils/cursor-fix.js";

export default class QuestAbilitySheet extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = {
    classes: ["quest", "sheet", "item", "ability", "themed", "theme-light"],
    position: { width: 500, height: 600 },
    window: { resizable: true },
    actions: {
      toggleRoll: this._onToggleRoll,
      addTier: this._onAddTier,
      removeTier: this._onRemoveTier
    },
    form: {
      handler: QuestAbilitySheet._onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: {
      template: "systems/quest/templates/item/ability-sheet.hbs",
      scrollable: [""]
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;    
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this._initAutoResize();
    fixCursorOnFocus(this.element);
  }
  

  /**
   * Make textareas grow with their content instead of exposing a manual
   * resize handle.
   */
  _initAutoResize() {
    if (CSS.supports("field-sizing", "content")) return;
      const container = this.element;
      const resizeOne = el => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      };
      const resizeAll = () => {
        for (const el of container.querySelectorAll("textarea.auto-resize")) resizeOne(el);
      };

      for (const el of container.querySelectorAll("textarea.auto-resize")) {
        resizeOne(el);
        el.addEventListener("input", () => resizeOne(el));
      }

      document.fonts?.ready.then(() => resizeAll());

      this._autoResizeObserver?.disconnect();
      let lastWidth = container.getBoundingClientRect().width;
      this._autoResizeObserver = new ResizeObserver(entries => {
        const width = entries[0].contentRect.width;
        if (width === lastWidth) return;
        lastWidth = width;
        requestAnimationFrame(resizeAll);
      });
      this._autoResizeObserver.observe(container);
    }

  async _onClose(options) {
    this._autoResizeObserver?.disconnect();
    await super._onClose(options);
  }

  static async _onToggleRoll(event, target) {
    const turningOn = !this.item.system.hasRoll;
    const updateData = { "system.hasRoll": turningOn };

    if (turningOn && this.item.system.rollTiers.length === 0) {
      updateData["system.rollTiers"] = [
        { min: 20, max: 20, text: "" },
        { min: 11, max: 19, text: "" },
        { min: 6, max: 10, text: "" },
        { min: 2, max: 5, text: "" },
        { min: 1, max: 1, text: "" }
      ];
    }

    await this.item.update(updateData);
  }
  
  static async _onSubmitForm(event, form, formData) {
    const data = formData.object;
    if (!data.name) {
      data.name = this.item.name;
    }

    await this.item.update(data);
  }

  static async _onAddTier(event, target) {
    const tiers = this.item.system.rollTiers.slice();
    tiers.push({ min: 1, max: 1, text: "" });
    await this.item.update({ "system.rollTiers": tiers });
  }

  static async _onRemoveTier(event, target) {
    const index = Number(target.dataset.index);
    const tiers = this.item.system.rollTiers.slice();
    tiers.splice(index, 1);
    await this.item.update({ "system.rollTiers": tiers });
  }
  }