Hooks.on("renderCombatTracker", (app, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  const combat = app.viewed;
  if (!combat) return;

  const tracker = root.querySelector(".combat-tracker");
  if (!tracker) return;

  const rows = Array.from(tracker.querySelectorAll("li.combatant"));
  if (!rows.length) return;

  const charGroup = document.createElement("div");
  charGroup.className = "quest-tracker-group";
  charGroup.dataset.group = "character";
  charGroup.innerHTML = `<h4 class="quest-tracker-group-label">Characters</h4><ol class="quest-tracker-sublist"></ol>`;

  const npcGroup = document.createElement("div");
  npcGroup.className = "quest-tracker-group";
  npcGroup.dataset.group = "npc";
  npcGroup.innerHTML = `<h4 class="quest-tracker-group-label">NPCs</h4><ol class="quest-tracker-sublist"></ol>`;

  const charList = charGroup.querySelector("ol");
  const npcList = npcGroup.querySelector("ol");

  for (const row of rows) {
    const combatant = combat.combatants.get(row.dataset.combatantId);
    if (!combatant) continue;

    // Remove the ping button — not needed
    row.querySelector('[data-action="pingCombatant"]')?.remove();

    // Grey out a combatant who's taken their turn
    if (combatant.getFlag("quest", "turnTaken")) {
      row.classList.add("quest-turn-taken");
    }

    row.addEventListener("click", async (event) => {
      if (event.target.closest("button, input, a")) return;
      await combatant.setFlag("quest", "turnTaken", true);
    });

    row.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.target.closest("button, input, a")) return;
      await combatant.setFlag("quest", "turnTaken", false);
    });

    // Inject HP / AP / Armor tracking
    const actor = combatant.actor;
    if (actor) {
      const resourceBlock = document.createElement("div");
      resourceBlock.className = "quest-resource-block";

    const hp = actor.system.hp;
      if (hp) {
        resourceBlock.innerHTML += `
          <label class="quest-resource" data-resource="hp">
            <span class="quest-resource-label">HP</span>
            <input type="text" inputmode="numeric" pattern="\\d*" class="quest-resource-input" value="${hp.value}" data-field="system.hp.value">
            <span class="quest-resource-max">/ ${hp.max}</span>
          </label>
        `;
      }

      if (actor.type === "character" && typeof actor.system.ap === "number") {
        resourceBlock.innerHTML += `
          <label class="quest-resource" data-resource="ap">
            <span class="quest-resource-label">AP</span>
            <input type="text" inputmode="numeric" pattern="\\d*" class="quest-resource-input" value="${actor.system.ap}" data-field="system.ap">
          </label>
        `;
      }

      if (typeof actor.system.armor === "number") {
        resourceBlock.innerHTML += `
          <label class="quest-resource" data-resource="armor">
            <span class="quest-resource-label">Armor</span>
            <input type="text" inputmode="numeric" pattern="\\d*" class="quest-resource-input" value="${actor.system.armor}" data-field="system.armor">
          </label>
        `;
      }

      const sizeInput = (input) => {
        input.style.width = `${Math.max(2, input.value.length) + 1}ch`;
      };

      resourceBlock.querySelectorAll(".quest-resource-input").forEach(input => {
        sizeInput(input);
        input.addEventListener("click", (event) => event.stopPropagation());
        input.addEventListener("input", () => sizeInput(input));
        input.addEventListener("change", async (event) => {
          const field = event.target.dataset.field;
          const value = Number(event.target.value);
          if (Number.isNaN(value)) return;
          await actor.update({ [field]: value });
        });
      });

      const nameDiv = row.querySelector(".token-name");
      nameDiv?.appendChild(resourceBlock);
    }

    const group = combatant.getFlag("quest", "group")
      ?? (combatant.actor?.type === "npc" ? "npc" : "character");

    row.setAttribute("draggable", "true");
    row.addEventListener("dragstart", (event) => {
      if (event.target.closest("button, input")) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", JSON.stringify({
        questCombatantId: combatant.id
      }));
    });

    (group === "npc" ? npcList : charList).appendChild(row);
  }

  for (const [groupEl, groupKey] of [[charGroup, "character"], [npcGroup, "npc"]]) {
    groupEl.addEventListener("dragover", (event) => event.preventDefault());
    groupEl.addEventListener("drop", async (event) => {
      event.preventDefault();
      let data;
      try {
        data = JSON.parse(event.dataTransfer.getData("text/plain"));
      } catch (e) {
        return;
      }
      if (!data?.questCombatantId) return;
      const dropped = combat.combatants.get(data.questCombatantId);
      if (!dropped) return;
      await dropped.setFlag("quest", "group", groupKey);
    });
  }

  tracker.innerHTML = "";
  tracker.appendChild(charGroup);
  tracker.appendChild(npcGroup);
});