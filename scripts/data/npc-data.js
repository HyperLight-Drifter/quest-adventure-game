export default class QuestNpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      hp: new fields.SchemaField({
        value: new fields.NumberField({
          required: true,
          integer: true,
          initial: 10,
          min: 0
        }),
        max: new fields.NumberField({
          required: true,
          integer: true,
          initial: 10,
          min: 0
        })
      }),
      att: new fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        min: 0
      }),
      armor: new fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        min: 0
      }),
      npcType: new fields.StringField({
        required: true,
        initial: "commoner",
        choices: ["commoner", "minion", "boss"]
      }),
      inventorySlots: new fields.NumberField({ required: true, integer: true, initial: 12, min: 0 }),
      containers: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ required: true }),
          name: new fields.StringField({ required: true, initial: "New Container" }),
          slots: new fields.NumberField({ required: true, integer: true, initial: 6, min: 0 })
        }),
        { initial: [] }
      ),
      ideal: new fields.StringField({ blank: true, initial: "" }),
      flaw: new fields.StringField({ blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      notes: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
